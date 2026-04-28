import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GetCustomerAccountHandler } from '../application/queries/get-customer-account.handler'
import { ListCustomerAddressesHandler } from '../application/queries/list-customer-addresses.handler'
import { ListCustomerContactsHandler } from '../application/queries/list-customer-contacts.handler'
import { SearchCustomerAccountsHandler } from '../application/queries/search-customer-accounts.handler'
import { SearchSelectableCustomersHandler } from '../application/queries/search-selectable-customers.handler'
import { CustomerQueryGrpcController } from '../interfaces/grpc/customer-query.grpc.controller'

/** CrmQueryModule wires the phase 1 CRM query handlers and gRPC controller surface. */
@Module({
  imports: [CqrsModule],
  providers: [
    ValidatingQueryBus,
    GetCustomerAccountHandler,
    SearchSelectableCustomersHandler,
    SearchCustomerAccountsHandler,
    ListCustomerContactsHandler,
    ListCustomerAddressesHandler
  ],
  controllers: [CustomerQueryGrpcController]
})
export class CrmQueryModule {}
