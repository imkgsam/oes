import { Injectable, OnModuleInit } from '@nestjs/common'
import { GrpcRequestContextStore, SRM_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import { SrmInternalQueryServiceClient } from '@oes/common/generated/srm_service'
import { safeGrpcCall } from '@oes/common/transport'
import {
  SupplierOfferingReferenceLookupResult,
  SupplierReferenceLookupPort,
  SupplierReferenceLookupResult
} from '../../application/ports/supplier-reference-lookup.port'
import { ProcurementSrmTrustedGrpcExecutionProducer } from './procurement-srm-trusted-grpc-execution.producer'
import { ProcurementSrmInternalTrustedGrpcClient } from './srm-internal-trusted-grpc.client'

const CALLER = 'procurement-service'

/** Resolves only SRM's active supplier projections through Procurement HUMAN_OBO. */
@Injectable()
export class SupplierQueryGrpcAdapter implements SupplierReferenceLookupPort, OnModuleInit {
  private service!: SrmInternalQueryServiceClient

  constructor(
    private readonly client: ProcurementSrmInternalTrustedGrpcClient,
    private readonly producer: ProcurementSrmTrustedGrpcExecutionProducer,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit(): void {
    this.service = this.client.internalQuery()
  }

  async getSupplierById(
    tenantId: string,
    supplierId: string
  ): Promise<SupplierReferenceLookupResult | null> {
    const response = await safeGrpcCall(
      this.service.resolveActiveSupplier(
        { supplierId },
        await this.buildMetadata(SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER, tenantId)
      ),
      {
        caller: CALLER,
        method: 'SrmInternalQueryService.resolveActiveSupplier'
      }
    )
    if (!response.supplierId?.trim()) return null
    return {
      supplierId: response.supplierId,
      supplierDisplayName: response.displayName ?? '',
      status: `${response.status ?? ''}`
    }
  }

  async getActiveSupplierOffering(
    tenantId: string,
    supplierId: string,
    itemId: string
  ): Promise<SupplierOfferingReferenceLookupResult | null> {
    const response = await safeGrpcCall(
      this.service.resolveActiveSupplierOffering(
        { supplierId, itemId },
        await this.buildMetadata(
          SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER_OFFERING,
          tenantId
        )
      ),
      {
        caller: CALLER,
        method: 'SrmInternalQueryService.resolveActiveSupplierOffering'
      }
    )
    if (!response.supplierOfferingId?.trim()) return null
    return {
      supplierOfferingId: response.supplierOfferingId,
      supplierId: response.supplierId ?? '',
      itemId: response.itemId ?? '',
      status: `${response.status ?? ''}`
    }
  }

  /** Produces target-specific SRM metadata from the current verified Procurement request scope. */
  private buildMetadata(code: string, tenantId: string) {
    const current = this.requestContextStore.getContext()
    return this.producer.createMetadata(code, tenantId, current?.requestId, current?.traceId)
  }
}
