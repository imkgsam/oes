import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { BindSupplierToTenantPartyHandler } from '../application/commands/bind-supplier-to-tenant-party.handler'
import { ChangeSupplierStatusHandler } from '../application/commands/change-supplier-status.handler'
import { CreateSupplierProfileHandler } from '../application/commands/create-supplier-profile.handler'
import { UpdateSupplierProfileBasicsHandler } from '../application/commands/update-supplier-profile-basics.handler'
import { UpsertSupplierAddressHandler } from '../application/commands/upsert-supplier-address.handler'
import { UpsertSupplierContactHandler } from '../application/commands/upsert-supplier-contact.handler'
import { UpsertSupplierOfferingHandler } from '../application/commands/upsert-supplier-offering.handler'
import { SrmAuditService } from '../application/services/srm-audit.service'
import { SupplierManagementGrpcController } from '../interfaces/grpc/supplier-management.grpc.controller'
import { SrmTrustedExecutionModule } from './srm-trusted-execution.module'

/** SrmManagementModule wires the phase 1 SRM command handlers, audit service, and gRPC controller surface. */
@Module({
  imports: [CqrsModule, SrmTrustedExecutionModule],
  providers: [
    ValidatingCommandBus,
    SrmAuditService,
    CreateSupplierProfileHandler,
    UpdateSupplierProfileBasicsHandler,
    BindSupplierToTenantPartyHandler,
    UpsertSupplierContactHandler,
    UpsertSupplierAddressHandler,
    UpsertSupplierOfferingHandler,
    ChangeSupplierStatusHandler
  ],
  controllers: [SupplierManagementGrpcController]
})
export class SrmManagementModule {}
