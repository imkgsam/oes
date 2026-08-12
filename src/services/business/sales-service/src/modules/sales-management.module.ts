import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { ConvertQuoteVersionToOrderHandler } from '../application/commands/convert-quote-version-to-order.handler'
import { CreateQuoteHandler } from '../application/commands/create-quote.handler'
import { PublishQuoteHandler } from '../application/commands/publish-quote.handler'
import { SetOrderCommercialGateHandler } from '../application/commands/set-order-commercial-gate.handler'
import { SubmitFulfillmentHandoffHandler } from '../application/commands/submit-fulfillment-handoff.handler'
import { UpdateQuoteDraftHandler } from '../application/commands/update-quote-draft.handler'
import { SalesAuditService } from '../application/services/sales-audit.service'
import { SalesManagementGrpcController } from '../interfaces/grpc/sales-management.grpc.controller'
import { SalesTrustedExecutionModule } from './sales-trusted-execution.module'

/** SalesManagementModule wires the phase 1 sales command handlers, audit service, and gRPC management controller. */
@Module({
  imports: [CqrsModule, SalesTrustedExecutionModule],
  providers: [
    ValidatingCommandBus,
    SalesAuditService,
    CreateQuoteHandler,
    UpdateQuoteDraftHandler,
    PublishQuoteHandler,
    ConvertQuoteVersionToOrderHandler,
    SetOrderCommercialGateHandler,
    SubmitFulfillmentHandoffHandler
  ],
  controllers: [SalesManagementGrpcController]
})
export class SalesManagementModule {}
