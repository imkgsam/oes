import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  SALES_FAILED_PRECONDITION,
  SALES_NOT_FOUND
} from '../../common/errors/sales.errors'
import { CustomerPriceAgreementVersionRecord } from '../../domain/models/pricing-records'
import { CustomerPriceAgreementRepository } from '../../domain/repositories/customer-price-agreement.repository'
import { assertRequiredString } from '../support/sales-assertions'
import { PublishCustomerPriceAgreementVersionCommand } from './publish-customer-price-agreement-version.command'

/** PublishCustomerPriceAgreementVersionHandler promotes the current draft into the sole active version for one agreement family. */
@Injectable()
@CommandHandler(PublishCustomerPriceAgreementVersionCommand)
export class PublishCustomerPriceAgreementVersionHandler
  implements ICommandHandler<PublishCustomerPriceAgreementVersionCommand, CustomerPriceAgreementVersionRecord>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_PRICE_AGREEMENT_REPOSITORY)
    private readonly repository: CustomerPriceAgreementRepository
  ) {}

  async execute(
    command: PublishCustomerPriceAgreementVersionCommand
  ): Promise<CustomerPriceAgreementVersionRecord> {
    assertRequiredString(command.input.tenantId, 'tenantId')
    assertRequiredString(command.input.customerPriceAgreementId, 'customerPriceAgreementId')

    const head = await this.repository.findHeadVersion(
      command.input.tenantId,
      command.input.customerPriceAgreementId
    )
    if (!head) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        customerPriceAgreementId: command.input.customerPriceAgreementId
      })
    }
    if (head.status !== 'DRAFT') {
      throw ExceptionFactory.application(SALES_FAILED_PRECONDITION, {
        customerPriceAgreementId: command.input.customerPriceAgreementId,
        reason: 'draft version is required before publish'
      })
    }

    const active = await this.repository.findActiveByCustomerCurrency({
      tenantId: head.tenantId,
      customerTenantPartyId: head.customerTenantPartyId,
      currencyCode: head.currencyCode
    })
    if (active) {
      await this.repository.saveVersion({
        ...active,
        id: active.id ?? randomUUID(),
        status: 'SUPERSEDED'
      })
    }

    return this.repository.saveVersion({
      ...head,
      publishedAt: new Date().toISOString(),
      status: 'ACTIVE'
    })
  }
}
