import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { AddOrReplaceReceiptLinesHandler } from '../application/commands/add-or-replace-receipt-lines.handler'
import { CancelReceiptDraftHandler } from '../application/commands/cancel-receipt-draft.handler'
import { CreateReceiptDraftHandler } from '../application/commands/create-receipt-draft.handler'
import { PostReceiptHandler } from '../application/commands/post-receipt.handler'
import { WmsAuditService } from '../application/services/wms-audit.service'
import { WmsManagementGrpcController } from '../interfaces/grpc/wms-management.grpc.controller'
import { WmsTrustedExecutionModule } from './wms-trusted-execution.module'

/** WmsManagementModule wires the phase 1 WMS command handlers, audit service, and gRPC controller surface. */
@Module({
  imports: [CqrsModule, WmsTrustedExecutionModule],
  providers: [
    ValidatingCommandBus,
    WmsAuditService,
    CreateReceiptDraftHandler,
    AddOrReplaceReceiptLinesHandler,
    PostReceiptHandler,
    CancelReceiptDraftHandler
  ],
  controllers: [WmsManagementGrpcController]
})
export class WmsManagementModule {}
