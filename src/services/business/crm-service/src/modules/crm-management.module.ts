import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { ConvertLeadToProspectCustomerHandler } from '../application/commands/convert-lead-to-prospect-customer.handler'
import { CreateLeadHandler } from '../application/commands/create-lead.handler'
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
    CreateLeadHandler,
    ConvertLeadToProspectCustomerHandler
  ],
  controllers: [CustomerManagementGrpcController]
})
export class CrmManagementModule {}
