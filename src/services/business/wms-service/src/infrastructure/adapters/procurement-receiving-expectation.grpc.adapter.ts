import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  RECEIVING_EXPECTATION_QUERY_SERVICE_NAME,
  ReceivingExpectationQueryServiceClient
} from '@oes/common/generated/procurement_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import {
  ReceivingExpectationLookupPort,
  ReceivingExpectationLookupResult
} from '../../application/ports/receiving-expectation-lookup.port'

/** ProcurementReceivingExpectationGrpcAdapter validates referenced receiving expectations through procurement-service query truth. */
@Injectable()
export class ProcurementReceivingExpectationGrpcAdapter
  implements ReceivingExpectationLookupPort, OnModuleInit
{
  private receivingExpectationQueryService!: ReceivingExpectationQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PROCUREMENT)
    private readonly procurementClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit(): void {
    this.receivingExpectationQueryService =
      this.procurementClient.getService<ReceivingExpectationQueryServiceClient>(
        RECEIVING_EXPECTATION_QUERY_SERVICE_NAME
      )
  }

  async getReceivingExpectationById(
    tenantId: string,
    receivingExpectationId: string
  ): Promise<ReceivingExpectationLookupResult | null> {
    const response = await safeGrpcCall(
      this.receivingExpectationQueryService.getReceivingExpectation(
        {
          tenantId,
          receivingExpectationId
        },
        this.buildMetadata()
      ),
      {
        caller: SERVICE_NAMES.WMS,
        method: 'ReceivingExpectationQueryService.getReceivingExpectation'
      }
    )

    const expectation = response.receivingExpectation
    if (!expectation?.receivingExpectationId?.trim()) {
      return null
    }

    return {
      receivingExpectationId: expectation.receivingExpectationId,
      purchaseOrderId: expectation.purchaseOrderId ?? '',
      purchaseOrderLineId: expectation.purchaseOrderLineId ?? '',
      targetWarehouseId: expectation.targetWarehouseId ?? null,
      openQuantity: expectation.openQuantity ?? '0',
      status: `${expectation.status ?? ''}`
    }
  }

  /** buildMetadata forwards trace/request context while keeping procurement lookup on the internal-service boundary. */
  private buildMetadata() {
    const current = this.requestContextStore.getContext()
    if (current?.operatorContext) {
      return this.metadataFactory.createOperatorScopedMetadata({
        callerServiceName: SERVICE_NAMES.WMS,
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
      callerServiceName: SERVICE_NAMES.WMS,
      requestId: current?.requestId,
      traceId: current?.traceId
    })
  }
}
