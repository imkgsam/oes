import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { CRM_NOT_FOUND } from '../../common/errors/crm.errors'
import { CustomerAccountRecord } from '../../domain/models/crm-records'
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository'
import { assertRequiredString } from '../support/crm-assertions'
import { GetCustomerAccountQuery } from './get-customer-account.query'

/** GetCustomerAccountHandler loads one CRM customer-account shell and its active primary binding summary. */
@Injectable()
@QueryHandler(GetCustomerAccountQuery)
export class GetCustomerAccountHandler implements IQueryHandler<GetCustomerAccountQuery, CustomerAccountRecord> {
  constructor(
    @Inject(TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CustomerAccountRepository
  ) {}

  async execute(query: GetCustomerAccountQuery): Promise<CustomerAccountRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.customerAccountId, 'customerAccountId')

    const account = await this.accountRepository.findById(query.tenantId, query.customerAccountId)
    if (!account) {
      throw ExceptionFactory.application(CRM_NOT_FOUND, {
        resource: 'customerAccount',
        customerAccountId: query.customerAccountId
      })
    }

    return account
  }
}
