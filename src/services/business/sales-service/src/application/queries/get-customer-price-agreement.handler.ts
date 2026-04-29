import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_NOT_FOUND } from '../../common/errors/sales.errors'
import { CustomerPriceAgreementVersionRecord } from '../../domain/models/pricing-records'
import { CustomerPriceAgreementRepository } from '../../domain/repositories/customer-price-agreement.repository'
import { GetCustomerPriceAgreementQuery } from './get-customer-price-agreement.query'

/** GetCustomerPriceAgreementHandler serves the current-head or explicit-version read for one agreement family. */
@Injectable()
@QueryHandler(GetCustomerPriceAgreementQuery)
export class GetCustomerPriceAgreementHandler
  implements IQueryHandler<GetCustomerPriceAgreementQuery, CustomerPriceAgreementVersionRecord>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_PRICE_AGREEMENT_REPOSITORY)
    private readonly repository: CustomerPriceAgreementRepository
  ) {}

  async execute(query: GetCustomerPriceAgreementQuery): Promise<CustomerPriceAgreementVersionRecord> {
    const record = query.input.versionNo
      ? await this.repository.findVersion(
          query.input.tenantId,
          query.input.customerPriceAgreementId,
          query.input.versionNo
        )
      : await this.repository.findHeadVersion(query.input.tenantId, query.input.customerPriceAgreementId)

    if (!record) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        customerPriceAgreementId: query.input.customerPriceAgreementId,
        versionNo: query.input.versionNo ?? null
      })
    }

    return record
  }
}
