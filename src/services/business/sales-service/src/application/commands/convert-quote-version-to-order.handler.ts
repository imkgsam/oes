import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  SALES_ALREADY_EXISTS,
  SALES_NOT_FOUND
} from '../../common/errors/sales.errors'
import {
  SalesOrderRecord,
  buildInitialCommercialGateSummary,
  buildInitialHandoffSummary
} from '../../domain/models/sales-records'
import { QuoteVersionRepository } from '../../domain/repositories/quote-version.repository'
import { SalesOrderRepository } from '../../domain/repositories/sales-order.repository'
import { assertRequiredString } from '../support/sales-assertions'
import { toSalesOrderLineRecords } from '../support/sales-line-builders'
import { ConvertQuoteVersionToOrderCommand } from './convert-quote-version-to-order.command'

/** ConvertQuoteVersionToOrderHandler establishes exactly one sales order from one published quote version. */
@Injectable()
@CommandHandler(ConvertQuoteVersionToOrderCommand)
export class ConvertQuoteVersionToOrderHandler
  implements ICommandHandler<ConvertQuoteVersionToOrderCommand, SalesOrderRecord>
{
  constructor(
    @Inject(TOKENS.QUOTE_VERSION_REPOSITORY)
    private readonly quoteVersionRepository: QuoteVersionRepository,
    @Inject(TOKENS.SALES_ORDER_REPOSITORY)
    private readonly salesOrderRepository: SalesOrderRepository
  ) {}

  async execute(command: ConvertQuoteVersionToOrderCommand): Promise<SalesOrderRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.quoteVersionId, 'quoteVersionId')

    const quoteVersion = await this.quoteVersionRepository.findById(command.tenantId, command.quoteVersionId)
    if (!quoteVersion) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        quoteVersionId: command.quoteVersionId
      })
    }

    const existingOrder = await this.salesOrderRepository.findByQuoteVersionId(
      command.tenantId,
      command.quoteVersionId
    )
    if (existingOrder) {
      throw ExceptionFactory.domain(SALES_ALREADY_EXISTS, {
        quoteVersionId: command.quoteVersionId
      })
    }

    const order: SalesOrderRecord = {
      id: randomUUID(),
      salesOrderNo: await this.salesOrderRepository.nextSalesOrderNo(command.tenantId),
      tenantId: quoteVersion.tenantId,
      customerTenantPartyId: quoteVersion.customerTenantPartyId,
      quoteId: quoteVersion.quoteId,
      quoteVersionId: quoteVersion.id,
      commercialGateSummary: buildInitialCommercialGateSummary(true),
      fulfillmentHandoffStatus: buildInitialHandoffSummary(),
      lines: toSalesOrderLineRecords(quoteVersion.lines)
    }

    return this.salesOrderRepository.save(order)
  }
}
