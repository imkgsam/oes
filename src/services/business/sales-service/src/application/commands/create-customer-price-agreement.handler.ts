import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_ALREADY_EXISTS } from '../../common/errors/sales.errors'
import { CustomerPriceAgreementVersionRecord } from '../../domain/models/pricing-records'
import { CustomerPriceAgreementRepository } from '../../domain/repositories/customer-price-agreement.repository'
import {
  assertSupportedCurrency,
  buildAgreementLineRecords
} from '../support/pricing-support'
import { assertRequiredString } from '../support/sales-assertions'
import { CreateCustomerPriceAgreementCommand } from './create-customer-price-agreement.command'

/** CreateCustomerPriceAgreementHandler establishes a new customer+currency agreement family with draft version 1. */
@Injectable()
@CommandHandler(CreateCustomerPriceAgreementCommand)
export class CreateCustomerPriceAgreementHandler
  implements ICommandHandler<CreateCustomerPriceAgreementCommand, CustomerPriceAgreementVersionRecord>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_PRICE_AGREEMENT_REPOSITORY)
    private readonly repository: CustomerPriceAgreementRepository
  ) {}

  async execute(
    command: CreateCustomerPriceAgreementCommand
  ): Promise<CustomerPriceAgreementVersionRecord> {
    assertRequiredString(command.input.tenantId, 'tenantId')
    assertRequiredString(command.input.customerTenantPartyId, 'customerTenantPartyId')
    const currencyCode = assertSupportedCurrency(command.input.currencyCode, 'currencyCode')

    const existing = await this.repository.findHeadByCustomerCurrency({
      tenantId: command.input.tenantId,
      customerTenantPartyId: command.input.customerTenantPartyId,
      currencyCode
    })
    if (existing) {
      throw ExceptionFactory.domain(SALES_ALREADY_EXISTS, {
        customerPriceAgreementId: existing.customerPriceAgreementId
      })
    }

    const customerPriceAgreementId = randomUUID()
    const record: CustomerPriceAgreementVersionRecord = {
      id: randomUUID(),
      customerPriceAgreementId,
      tenantId: command.input.tenantId,
      customerTenantPartyId: command.input.customerTenantPartyId,
      currencyCode,
      versionNo: 1,
      status: 'DRAFT',
      publishedAt: null,
      lines: buildAgreementLineRecords({
        customerPriceAgreementId,
        currencyCode,
        versionNo: 1,
        lines: command.input.initialLines ?? []
      })
    }

    return this.repository.saveVersion(record)
  }
}
