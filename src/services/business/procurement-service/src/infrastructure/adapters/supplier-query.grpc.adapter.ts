import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  GetSupplierRequest,
  ListSupplierOfferingsBySupplierRequest,
  SupplierOfferingStatus,
  SupplierStatus,
  SupplierQueryServiceClient,
  SUPPLIER_QUERY_SERVICE_NAME
} from '@oes/common/generated/srm_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import {
  SupplierOfferingReferenceLookupResult,
  SupplierReferenceLookupPort,
  SupplierReferenceLookupResult
} from '../../application/ports/supplier-reference-lookup.port'

/** SupplierQueryGrpcAdapter validates supplier activity and standard-item offerability through srm-service query truth. */
@Injectable()
export class SupplierQueryGrpcAdapter implements SupplierReferenceLookupPort, OnModuleInit {
  private supplierQueryService!: SupplierQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.SRM)
    private readonly supplierClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit(): void {
    this.supplierQueryService = this.supplierClient.getService<SupplierQueryServiceClient>(
      SUPPLIER_QUERY_SERVICE_NAME
    )
  }

  async getSupplierById(tenantId: string, supplierId: string): Promise<SupplierReferenceLookupResult | null> {
    const response = await safeGrpcCall(
      this.supplierQueryService.getSupplier(this.buildGetSupplierRequest(tenantId, supplierId), this.buildMetadata()),
      {
        caller: SERVICE_NAMES.PROCUREMENT,
        method: 'SupplierQueryService.getSupplier'
      }
    )

    const supplier = response.supplier
    if (!supplier?.supplierId?.trim()) {
      return null
    }

    return {
      supplierId: supplier.supplierId,
      supplierDisplayName: supplier.displayName ?? '',
      status: normalizeSupplierStatus(supplier.status)
    }
  }

  async getActiveSupplierOffering(
    tenantId: string,
    supplierId: string,
    itemId: string
  ): Promise<SupplierOfferingReferenceLookupResult | null> {
    const response = await safeGrpcCall(
      this.supplierQueryService.listSupplierOfferingsBySupplier(
        this.buildListOfferingsRequest(tenantId, supplierId),
        this.buildMetadata()
      ),
      {
        caller: SERVICE_NAMES.PROCUREMENT,
        method: 'SupplierQueryService.listSupplierOfferingsBySupplier'
      }
    )

    const offering = (response.offerings ?? []).find(
      (candidate) => candidate.itemId === itemId && candidate.supplierOfferingId?.trim()
    )
    if (!offering?.supplierOfferingId?.trim()) {
      return null
    }

    return {
      supplierOfferingId: offering.supplierOfferingId,
      supplierId: offering.supplierId ?? supplierId,
      itemId: offering.itemId ?? itemId,
      status: normalizeSupplierOfferingStatus(offering.status)
    }
  }

  /** buildMetadata forwards trace/request context while keeping supplier lookups on the internal-service boundary. */
  private buildMetadata() {
    const current = this.requestContextStore.getContext()
    if (current?.operatorContext) {
      return this.metadataFactory.createOperatorScopedMetadata({
        callerServiceName: SERVICE_NAMES.PROCUREMENT,
        operatorContext: {
          operatorId: current.operatorContext.operator_id,
          operatorType: current.operatorContext.operator_type,
          tenantId: current.operatorContext.tenant_id,
          orgId: current.operatorContext.org_id,
          operatorRoles: current.operatorContext.operator_roles
        },
        requestId: current.requestId,
        traceId: current.traceId
      })
    }

    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: SERVICE_NAMES.PROCUREMENT,
      requestId: current?.requestId,
      traceId: current?.traceId
    })
  }

  /** buildGetSupplierRequest mirrors the srm-service explicit query context contract for downstream lookups. */
  private buildGetSupplierRequest(tenantId: string, supplierId: string): GetSupplierRequest {
    const current = this.requestContextStore.getContext()
    return {
      tenantId,
      supplierId,
      operatorContext: {
        operatorId: current?.operatorContext?.operator_id ?? 'procurement-system',
        operatorType: current?.operatorContext?.operator_type ?? 'SYSTEM',
        orgId: current?.operatorContext?.org_id ?? ''
      },
      traceContext: {
        traceId: current?.traceId ?? 'procurement-trace',
        requestId: current?.requestId ?? 'procurement-request'
      }
    }
  }

  /** buildListOfferingsRequest mirrors the srm-service explicit query context contract for downstream offerability checks. */
  private buildListOfferingsRequest(
    tenantId: string,
    supplierId: string
  ): ListSupplierOfferingsBySupplierRequest {
    const current = this.requestContextStore.getContext()
    return {
      tenantId,
      supplierId,
      status: SupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE,
      page: 1,
      pageSize: 200,
      operatorContext: {
        operatorId: current?.operatorContext?.operator_id ?? 'procurement-system',
        operatorType: current?.operatorContext?.operator_type ?? 'SYSTEM',
        orgId: current?.operatorContext?.org_id ?? ''
      },
      traceContext: {
        traceId: current?.traceId ?? 'procurement-trace',
        requestId: current?.requestId ?? 'procurement-request'
      }
    }
  }
}

/** normalizeSupplierStatus converts generated SRM enum numbers or labels into procurement's plain ACTIVE/INACTIVE strings. */
function normalizeSupplierStatus(value?: SupplierStatus | string): string {
  const raw =
    typeof value === 'number'
      ? (SupplierStatus[value] ?? '')
      : `${value ?? ''}`

  return raw.replace('SUPPLIER_STATUS_', '')
}

/** normalizeSupplierOfferingStatus converts generated offering enum numbers or labels into procurement's plain ACTIVE/INACTIVE strings. */
function normalizeSupplierOfferingStatus(value?: SupplierOfferingStatus | string): string {
  const raw =
    typeof value === 'number'
      ? (SupplierOfferingStatus[value] ?? '')
      : `${value ?? ''}`

  return raw.replace('SUPPLIER_OFFERING_STATUS_', '')
}
