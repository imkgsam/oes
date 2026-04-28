import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { CRM_NOT_FOUND } from '../../common/errors/crm.errors'
import { CustomerContactRecord } from '../../domain/models/crm-records'
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository'
import { CustomerContactRepository } from '../../domain/repositories/customer-contact.repository'
import { assertRequiredString } from '../support/crm-assertions'
import { ListCustomerContactsQuery } from './list-customer-contacts.query'

export interface ListCustomerContactsResult {
  contacts: CustomerContactRecord[]
}

/** ListCustomerContactsHandler returns CRM business-contact records for one existing customer account. */
@Injectable()
@QueryHandler(ListCustomerContactsQuery)
export class ListCustomerContactsHandler
  implements IQueryHandler<ListCustomerContactsQuery, ListCustomerContactsResult>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CustomerAccountRepository,
    @Inject(TOKENS.CUSTOMER_CONTACT_REPOSITORY)
    private readonly contactRepository: CustomerContactRepository
  ) {}

  async execute(query: ListCustomerContactsQuery): Promise<ListCustomerContactsResult> {
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
      contacts: await this.contactRepository.listByCustomerAccountId(query.tenantId, query.customerAccountId)
    }
  }
}
