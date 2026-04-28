import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { SalesQuoteStatus, QuoteRecord } from '../../domain/models/sales-records'
import { QuoteRepository } from '../../domain/repositories/quote.repository'
import { assertRequiredString } from '../support/sales-assertions'
import { toQuoteLineRecords } from '../support/sales-line-builders'
import { CreateQuoteCommand } from './create-quote.command'

/** CreateQuoteHandler creates a new quote draft carrier without creating any published version. */
@Injectable()
@CommandHandler(CreateQuoteCommand)
export class CreateQuoteHandler implements ICommandHandler<CreateQuoteCommand, QuoteRecord> {
  constructor(
    @Inject(TOKENS.QUOTE_REPOSITORY)
    private readonly quoteRepository: QuoteRepository
  ) {}

  async execute(command: CreateQuoteCommand): Promise<QuoteRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.customerTenantPartyId, 'customerTenantPartyId')

    const quote: QuoteRecord = {
      id: randomUUID(),
      quoteNo: await this.quoteRepository.nextQuoteNo(command.tenantId),
      tenantId: command.tenantId,
      customerTenantPartyId: command.customerTenantPartyId,
      opportunityRef: command.opportunityRef ?? null,
      status: SalesQuoteStatus.DRAFT,
      latestPublishedVersionId: null,
      lines: toQuoteLineRecords(command.draftLines ?? [])
    }

    return this.quoteRepository.save(quote)
  }
}
