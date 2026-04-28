import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_NOT_FOUND } from '../../common/errors/sales.errors'
import { QuoteRecord, SalesQuoteStatus } from '../../domain/models/sales-records'
import { QuoteRepository } from '../../domain/repositories/quote.repository'
import { assertRequiredString } from '../support/sales-assertions'
import { toQuoteLineRecords } from '../support/sales-line-builders'
import { UpdateQuoteDraftCommand } from './update-quote-draft.command'

/** UpdateQuoteDraftHandler replaces the current mutable quote draft without generating any published version. */
@Injectable()
@CommandHandler(UpdateQuoteDraftCommand)
export class UpdateQuoteDraftHandler implements ICommandHandler<UpdateQuoteDraftCommand, QuoteRecord> {
  constructor(
    @Inject(TOKENS.QUOTE_REPOSITORY)
    private readonly quoteRepository: QuoteRepository
  ) {}

  async execute(command: UpdateQuoteDraftCommand): Promise<QuoteRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.quoteId, 'quoteId')
    assertRequiredString(command.draftMutation.customerTenantPartyId, 'draftMutation.customerTenantPartyId')

    const existing = await this.quoteRepository.findById(command.tenantId, command.quoteId)
    if (!existing) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        quoteId: command.quoteId
      })
    }

    const updated: QuoteRecord = {
      ...existing,
      customerTenantPartyId: command.draftMutation.customerTenantPartyId,
      opportunityRef: command.draftMutation.opportunityRef ?? null,
      status: existing.latestPublishedVersionId ? SalesQuoteStatus.PUBLISHED : SalesQuoteStatus.DRAFT,
      lines: toQuoteLineRecords(command.draftMutation.lines ?? [])
    }

    return this.quoteRepository.save(updated)
  }
}
