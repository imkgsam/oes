import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  CustomerQueryServiceController,
  CustomerQueryServiceControllerMethods,
  CustomerStatus as ProtoCustomerStatus,
  GetCustomerAccountRequest,
  GetCustomerAccountResponse,
  ListCustomerAddressesRequest,
  ListCustomerAddressesResponse,
  ListCustomerContactsRequest,
  ListCustomerContactsResponse,
  SearchCustomerAccountsRequest,
  SearchCustomerAccountsResponse,
  SearchSelectableCustomersRequest,
  SearchSelectableCustomersResponse
} from '@oes/common/generated/crm_service'
import { GetCustomerAccountQuery } from '../../application/queries/get-customer-account.query'
import { ListCustomerAddressesQuery } from '../../application/queries/list-customer-addresses.query'
import { ListCustomerContactsQuery } from '../../application/queries/list-customer-contacts.query'
import { SearchCustomerAccountsQuery } from '../../application/queries/search-customer-accounts.query'
import { SearchSelectableCustomersQuery } from '../../application/queries/search-selectable-customers.query'
import { CustomerStatus } from '../../domain/models/crm-records'
import { CustomerGrpcPresenter } from './customer-grpc.presenter'
import { CustomerRpcContextValidator } from './customer-rpc-context.validator'

/** CustomerQueryGrpcController exposes the phase 1 CRM read-only query contract. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@CustomerQueryServiceControllerMethods()
export class CustomerQueryGrpcController implements CustomerQueryServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async searchSelectableCustomers(
    request: SearchSelectableCustomersRequest
  ): Promise<SearchSelectableCustomersResponse> {
    CustomerRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new SearchSelectableCustomersQuery({
        tenantId: request.tenantId ?? '',
        keyword: request.keyword ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return CustomerGrpcPresenter.toSearchSelectableCustomersResponse(result)
  }

  async getCustomerAccount(request: GetCustomerAccountRequest): Promise<GetCustomerAccountResponse> {
    CustomerRpcContextValidator.assertQueryContext(request)
    const account = await this.queryBus.execute(
      new GetCustomerAccountQuery(request.tenantId ?? '', request.customerAccountId ?? '')
    )

    return CustomerGrpcPresenter.toGetCustomerAccountResponse(account)
  }

  async searchCustomerAccounts(
    request: SearchCustomerAccountsRequest
  ): Promise<SearchCustomerAccountsResponse> {
    CustomerRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new SearchCustomerAccountsQuery({
        tenantId: request.tenantId ?? '',
        keyword: request.keyword ?? undefined,
        status: toDomainCustomerStatus(request.status),
        primaryTenantPartyId: request.primaryTenantPartyId ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return CustomerGrpcPresenter.toSearchCustomerAccountsResponse(result)
  }

  async listCustomerContacts(
    request: ListCustomerContactsRequest
  ): Promise<ListCustomerContactsResponse> {
    CustomerRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new ListCustomerContactsQuery(request.tenantId ?? '', request.customerAccountId ?? '')
    )

    return CustomerGrpcPresenter.toListCustomerContactsResponse(result)
  }

  async listCustomerAddresses(
    request: ListCustomerAddressesRequest
  ): Promise<ListCustomerAddressesResponse> {
    CustomerRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new ListCustomerAddressesQuery(request.tenantId ?? '', request.customerAccountId ?? '')
    )

    return CustomerGrpcPresenter.toListCustomerAddressesResponse(result)
  }
}

/** toDomainCustomerStatus maps the generated CRM enum filter into the minimal domain status filter. */
function toDomainCustomerStatus(value?: ProtoCustomerStatus): CustomerStatus | undefined {
  if (value === ProtoCustomerStatus.CUSTOMER_STATUS_BLOCKED) {
    return CustomerStatus.BLOCKED
  }
  if (value === ProtoCustomerStatus.CUSTOMER_STATUS_ARCHIVED) {
    return CustomerStatus.ARCHIVED
  }
  if (value === ProtoCustomerStatus.CUSTOMER_STATUS_ACTIVE_CUSTOMER) {
    return CustomerStatus.ACTIVE_CUSTOMER
  }
  return undefined
}
