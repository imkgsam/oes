import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_NOT_FOUND } from '../../common/errors/sales.errors'
import { PageResult } from '../../domain/models/sales-records'
import { CustomerPriceAgreementVersionRecord } from '../../domain/models/pricing-records'
import { CustomerPriceAgreementRepository } from '../../domain/repositories/customer-price-agreement.repository'
import { ListCustomerPriceAgreementVersionsQuery } from './list-customer-price-agreement-versions.query'

export type ListCustomerPriceAgreementVersionsResult = PageResult<CustomerPriceAgreementVersionRecord>

/** ListCustomerPriceAgreementVersionsHandler serves the paged version history read for one agreement family. */
@Injectable()
@QueryHandler(ListCustomerPriceAgreementVersionsQuery)
export class ListCustomerPriceAgreementVersionsHandler
  implements
    IQueryHandler<ListCustomerPriceAgreementVersionsQuery, ListCustomerPriceAgreementVersionsResult>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_PRICE_AGREEMENT_REPOSITORY)
    private readonly repository: CustomerPriceAgreementRepository
  ) {}

  async execute(
    query: ListCustomerPriceAgreementVersionsQuery
  ): Promise<ListCustomerPriceAgreementVersionsResult> {
    const head = await this.repository.findHeadVersion(
      query.input.tenantId,
      query.input.customerPriceAgreementId
    )
    if (!head) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        customerPriceAgreementId: query.input.customerPriceAgreementId
      })
    }

    return this.repository.listVersions(query.input)
  }
}
