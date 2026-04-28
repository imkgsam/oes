import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { CRM_NOT_FOUND } from '../../common/errors/crm.errors'
import { CustomerAddressRecord } from '../../domain/models/crm-records'
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository'
import { CustomerAddressRepository } from '../../domain/repositories/customer-address.repository'
import { assertRequiredString } from '../support/crm-assertions'
import { ListCustomerAddressesQuery } from './list-customer-addresses.query'

export interface ListCustomerAddressesResult {
  addresses: CustomerAddressRecord[]
}

/** ListCustomerAddressesHandler returns CRM business-address records for one existing customer account. */
@Injectable()
@QueryHandler(ListCustomerAddressesQuery)
export class ListCustomerAddressesHandler
  implements IQueryHandler<ListCustomerAddressesQuery, ListCustomerAddressesResult>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CustomerAccountRepository,
    @Inject(TOKENS.CUSTOMER_ADDRESS_REPOSITORY)
    private readonly addressRepository: CustomerAddressRepository
  ) {}

  async execute(query: ListCustomerAddressesQuery): Promise<ListCustomerAddressesResult> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.customerAccountId, 'customerAccountId')

    const account = await this.accountRepository.findById(query.tenantId, query.customerAccountId)
    if (!account) {
      throw ExceptionFactory.application(CRM_NOT_FOUND, {
        resource: 'customerAccount',
        customerAccountId: query.customerAccountId
      })
    }

    return {
      addresses: await this.addressRepository.listByCustomerAccountId(query.tenantId, query.customerAccountId)
    }
  }
}
