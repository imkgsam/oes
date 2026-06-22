import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { ClaimCrmAccountHandler } from '../application/commands/claim-crm-account.handler'
import { ConvertLeadToProspectCustomerHandler } from '../application/commands/convert-lead-to-prospect-customer.handler'
import { CreateDraftLeadHandler } from '../application/commands/create-draft-lead.handler'
import { CreateLeadHandler } from '../application/commands/create-lead.handler'
import { DeleteDraftLeadHandler } from '../application/commands/delete-draft-lead.handler'
import { ReleaseCrmAccountHandler } from '../application/commands/release-crm-account.handler'
import { SubmitDraftLeadHandler } from '../application/commands/submit-draft-lead.handler'
import { UpdateDraftLeadHandler } from '../application/commands/update-draft-lead.handler'
import { CheckLeadDuplicateHandler } from '../application/queries/check-lead-duplicate.handler'
import { CrmAuditService } from '../application/services/crm-audit.service'
import { CustomerManagementGrpcController } from '../interfaces/grpc/customer-management.grpc.controller'

/** CrmManagementModule wires the phase 1 CRM command handlers, audit service, and gRPC controller surface. */
@Module({
  imports: [CqrsModule],
  providers: [
    ValidatingCommandBus,
    CrmAuditService,
    CheckLeadDuplicateHandler,
    ClaimCrmAccountHandler,
    CreateDraftLeadHandler,
    CreateLeadHandler,
    ConvertLeadToProspectCustomerHandler,
    DeleteDraftLeadHandler,
    ReleaseCrmAccountHandler,
    SubmitDraftLeadHandler,
    UpdateDraftLeadHandler
  ],
  controllers: [CustomerManagementGrpcController]
})
export class CrmManagementModule {}
