import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AuthorizeInternalCall,
  GrpcRequestContextInterceptor,
  PROCUREMENT_INTERNAL_PERMISSION_CODES
} from '@oes/common/authorization'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  ProcurementInternalQueryServiceController,
  ProcurementInternalQueryServiceControllerMethods,
  ReceivingExpectationStatus as ProtoReceivingExpectationStatus,
  ResolveReceivingExpectationForReceiptRequest,
  ResolveReceivingExpectationForReceiptResponse
} from '@oes/common/generated/procurement_service'
import { ResolveReceivingExpectationForReceiptQuery } from '../../application/queries/resolve-receiving-expectation-for-receipt.query'
import { ReceivingExpectationStatus } from '../../domain/models/procurement-records'
import { ProcurementTrustedInternalExecutionGuard } from '../../modules/procurement-trusted-execution.module'
import { ProcurementRpcContextValidator } from './procurement-rpc-context.validator'

/** Exposes only WMS's frozen tenant-visible receiving expectation projection. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(ProcurementTrustedInternalExecutionGuard, ProcurementRpcContextValidator)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@ProcurementInternalQueryServiceControllerMethods()
export class ProcurementInternalQueryGrpcController implements ProcurementInternalQueryServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async resolveReceivingExpectationForReceipt(
    request: ResolveReceivingExpectationForReceiptRequest
  ): Promise<ResolveReceivingExpectationForReceiptResponse> {
    const context = ProcurementRpcContextValidator.assertQueryContext(request)
    const expectation = await this.queryBus.execute(
      new ResolveReceivingExpectationForReceiptQuery(
        context.tenantId,
        request.receivingExpectationId ?? ''
      )
    )
    return {
      receivingExpectationId: expectation.receivingExpectationId,
      purchaseOrderId: expectation.purchaseOrderId,
      purchaseOrderLineId: expectation.purchaseOrderLineId,
      targetWarehouseId: expectation.targetWarehouseId ?? '',
      openQuantity: expectation.openQuantity,
      status: toProtoReceivingExpectationStatus(expectation.status)
    }
  }
}

AuthorizeInternalCall({
  all: [PROCUREMENT_INTERNAL_PERMISSION_CODES.RESOLVE_RECEIVING_EXPECTATION_FOR_RECEIPT]
})(
  ProcurementInternalQueryGrpcController.prototype,
  'resolveReceivingExpectationForReceipt',
  Object.getOwnPropertyDescriptor(
    ProcurementInternalQueryGrpcController.prototype,
    'resolveReceivingExpectationForReceipt'
  )
)

/** Maps Procurement's existing expectation status onto the minimal INTERNAL projection. */
function toProtoReceivingExpectationStatus(
  value: ReceivingExpectationStatus
): ProtoReceivingExpectationStatus {
  switch (value) {
    case ReceivingExpectationStatus.PARTIALLY_RECEIVED:
      return ProtoReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_PARTIALLY_RECEIVED
    case ReceivingExpectationStatus.COMPLETED:
      return ProtoReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_COMPLETED
    case ReceivingExpectationStatus.CANCELLED:
      return ProtoReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_CANCELLED
    default:
      return ProtoReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_OPEN
  }
}
