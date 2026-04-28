import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { CreatePurchaseRequestHandler } from '../application/commands/create-purchase-request.handler'
import { UpdatePurchaseRequestDraftHandler } from '../application/commands/update-purchase-request-draft.handler'
import { SubmitPurchaseRequestHandler } from '../application/commands/submit-purchase-request.handler'
import { DecidePurchaseRequestHandler } from '../application/commands/decide-purchase-request.handler'
import { CancelPurchaseRequestHandler } from '../application/commands/cancel-purchase-request.handler'
import { ConvertPurchaseRequestToPurchaseOrderHandler } from '../application/commands/convert-purchase-request-to-purchase-order.handler'
import { CreatePurchaseOrderDraftHandler } from '../application/commands/create-purchase-order-draft.handler'
import { UpdatePurchaseOrderDraftHandler } from '../application/commands/update-purchase-order-draft.handler'
import { IssuePurchaseOrderHandler } from '../application/commands/issue-purchase-order.handler'
import { ConfirmSupplierAcknowledgementHandler } from '../application/commands/confirm-supplier-acknowledgement.handler'
import { ApplyPurchaseOrderChangeHandler } from '../application/commands/apply-purchase-order-change.handler'
import { CancelPurchaseOrderHandler } from '../application/commands/cancel-purchase-order.handler'
import { CreateReceivingExpectationHandler } from '../application/commands/create-receiving-expectation.handler'
import { RecordReceivingDiscrepancyResolutionHandler } from '../application/commands/record-receiving-discrepancy-resolution.handler'
import { ProcurementAuditService } from '../application/services/procurement-audit.service'
import { ProcurementManagementGrpcController } from '../interfaces/grpc/procurement-management.grpc.controller'

/** ProcurementManagementModule wires the phase 1 procurement command handlers, audit service, and gRPC controller surface. */
@Module({
  imports: [CqrsModule],
  providers: [
    ValidatingCommandBus,
    ProcurementAuditService,
    CreatePurchaseRequestHandler,
    UpdatePurchaseRequestDraftHandler,
    SubmitPurchaseRequestHandler,
    DecidePurchaseRequestHandler,
    CancelPurchaseRequestHandler,
    ConvertPurchaseRequestToPurchaseOrderHandler,
    CreatePurchaseOrderDraftHandler,
    UpdatePurchaseOrderDraftHandler,
    IssuePurchaseOrderHandler,
    ConfirmSupplierAcknowledgementHandler,
    ApplyPurchaseOrderChangeHandler,
    CancelPurchaseOrderHandler,
    CreateReceivingExpectationHandler,
    RecordReceivingDiscrepancyResolutionHandler
  ],
  controllers: [ProcurementManagementGrpcController]
})
export class ProcurementManagementModule {}
