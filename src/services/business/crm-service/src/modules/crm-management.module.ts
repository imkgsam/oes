import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { BindCustomerAccountToTenantPartyHandler } from '../application/commands/bind-customer-account-to-tenant-party.handler'
import { ChangeCustomerStatusHandler } from '../application/commands/change-customer-status.handler'
import { CreateCustomerAccountHandler } from '../application/commands/create-customer-account.handler'
import { UpdateCustomerAccountBasicsHandler } from '../application/commands/update-customer-account-basics.handler'
import { UpsertCustomerAddressHandler } from '../application/commands/upsert-customer-address.handler'
import { UpsertCustomerContactHandler } from '../application/commands/upsert-customer-contact.handler'
import { CrmAuditService } from '../application/services/crm-audit.service'
import { CustomerManagementGrpcController } from '../interfaces/grpc/customer-management.grpc.controller'

/** CrmManagementModule wires the phase 1 CRM command handlers, audit service, and gRPC controller surface. */
@Module({
  imports: [CqrsModule],
  providers: [
    ValidatingCommandBus,
    CrmAuditService,
    CreateCustomerAccountHandler,
    UpdateCustomerAccountBasicsHandler,
    BindCustomerAccountToTenantPartyHandler,
    UpsertCustomerContactHandler,
    UpsertCustomerAddressHandler,
    ChangeCustomerStatusHandler
  ],
  controllers: [CustomerManagementGrpcController]
})
export class CrmManagementModule {}
