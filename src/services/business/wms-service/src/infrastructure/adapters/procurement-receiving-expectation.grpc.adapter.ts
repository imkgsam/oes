import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  GrpcRequestContextStore,
  PROCUREMENT_INTERNAL_PERMISSION_CODES
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { ProcurementInternalQueryServiceClient } from '@oes/common/generated/procurement_service'
import { safeGrpcCall } from '@oes/common/transport'
import {
  ReceivingExpectationLookupPort,
  ReceivingExpectationLookupResult
} from '../../application/ports/receiving-expectation-lookup.port'
import { WmsProcurementInternalTrustedGrpcClient } from './procurement-internal-trusted-grpc.client'
import { WmsProcurementTrustedGrpcExecutionProducer } from './wms-procurement-trusted-grpc-execution.producer'

/** Resolves the exact Procurement receipt projection through WMS's verified-HUMAN OBO scope. */
@Injectable()
export class ProcurementReceivingExpectationGrpcAdapter
  implements ReceivingExpectationLookupPort, OnModuleInit
{
  private internalQueryService!: ProcurementInternalQueryServiceClient

  constructor(
    private readonly procurementClient: WmsProcurementInternalTrustedGrpcClient,
    private readonly producer: WmsProcurementTrustedGrpcExecutionProducer,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit(): void {
    this.internalQueryService = this.procurementClient.internalQuery()
  }

  async getReceivingExpectationById(
    tenantId: string,
    receivingExpectationId: string
  ): Promise<ReceivingExpectationLookupResult | null> {
    const response = await safeGrpcCall(
      this.internalQueryService.resolveReceivingExpectationForReceipt(
        { receivingExpectationId },
        await this.buildMetadata(tenantId)
      ),
      {
        caller: SERVICE_NAMES.WMS,
        method: 'ProcurementInternalQueryService.resolveReceivingExpectationForReceipt'
      }
    )
    if (!response.receivingExpectationId?.trim()) return null
    return {
      receivingExpectationId: response.receivingExpectationId,
      purchaseOrderId: response.purchaseOrderId ?? '',
      purchaseOrderLineId: response.purchaseOrderLineId ?? '',
      targetWarehouseId: response.targetWarehouseId ?? null,
      openQuantity: response.openQuantity ?? '',
      status: String(response.status ?? '')
    }
  }

  /** Uses only interceptor-established request and trace facts for the OBO hop. */
  private buildMetadata(tenantId: string) {
    const current = this.requestContextStore.getContext()
    return this.producer.createMetadata(
      PROCUREMENT_INTERNAL_PERMISSION_CODES.RESOLVE_RECEIVING_EXPECTATION_FOR_RECEIPT,
      tenantId,
      current?.requestId,
      current?.traceId
    )
  }
}
