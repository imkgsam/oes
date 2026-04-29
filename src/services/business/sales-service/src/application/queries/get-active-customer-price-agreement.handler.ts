import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_NOT_FOUND } from '../../common/errors/sales.errors'
import { CustomerPriceAgreementVersionRecord } from '../../domain/models/pricing-records'
import { CustomerPriceAgreementRepository } from '../../domain/repositories/customer-price-agreement.repository'
import { GetActiveCustomerPriceAgreementQuery } from './get-active-customer-price-agreement.query'

/** GetActiveCustomerPriceAgreementHandler serves the active-version point lookup for one customer and currency. */
@Injectable()
@QueryHandler(GetActiveCustomerPriceAgreementQuery)
export class GetActiveCustomerPriceAgreementHandler
  implements IQueryHandler<GetActiveCustomerPriceAgreementQuery, CustomerPriceAgreementVersionRecord>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_PRICE_AGREEMENT_REPOSITORY)
    private readonly repository: CustomerPriceAgreementRepository
  ) {}

  async execute(query: GetActiveCustomerPriceAgreementQuery): Promise<CustomerPriceAgreementVersionRecord> {
    const record = await this.repository.findActiveByCustomerCurrency(query.input)
    if (!record) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        customerTenantPartyId: query.input.customerTenantPartyId,
        currencyCode: query.input.currencyCode
      })
    }

    return record
  }
}
