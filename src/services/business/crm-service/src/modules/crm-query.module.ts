import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { CheckLeadDuplicateHandler } from '../application/queries/check-lead-duplicate.handler'
import { GetCrmAccountHandler } from '../application/queries/get-crm-account.handler'
import { ListCrmAccountsHandler } from '../application/queries/list-crm-accounts.handler'
import { CustomerQueryGrpcController } from '../interfaces/grpc/customer-query.grpc.controller'

/** CrmQueryModule wires the phase 1 CRM query handlers and gRPC controller surface. */
@Module({
  imports: [CqrsModule],
  providers: [
    ValidatingQueryBus,
    CheckLeadDuplicateHandler,
    GetCrmAccountHandler,
    ListCrmAccountsHandler
  ],
  controllers: [CustomerQueryGrpcController]
})
export class CrmQueryModule {}
