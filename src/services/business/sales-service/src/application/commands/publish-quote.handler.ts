import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  SALES_FAILED_PRECONDITION,
  SALES_NOT_FOUND
} from '../../common/errors/sales.errors'
import {
  QuoteRecord,
  QuoteVersionRecord,
  SalesQuoteStatus
} from '../../domain/models/sales-records'
import { QuoteRepository } from '../../domain/repositories/quote.repository'
import { QuoteVersionRepository } from '../../domain/repositories/quote-version.repository'
import { assertRequiredString } from '../support/sales-assertions'
import { PublishQuoteCommand } from './publish-quote.command'

export interface PublishQuoteResult {
  id: string
  quote: QuoteRecord
  quoteVersion: QuoteVersionRecord
}

/** PublishQuoteHandler freezes the current draft into an immutable quote version and updates the quote summary. */
@Injectable()
@CommandHandler(PublishQuoteCommand)
export class PublishQuoteHandler implements ICommandHandler<PublishQuoteCommand, PublishQuoteResult> {
  constructor(
    @Inject(TOKENS.QUOTE_REPOSITORY)
    private readonly quoteRepository: QuoteRepository,
    @Inject(TOKENS.QUOTE_VERSION_REPOSITORY)
    private readonly quoteVersionRepository: QuoteVersionRepository
  ) {}

  async execute(command: PublishQuoteCommand): Promise<PublishQuoteResult> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.quoteId, 'quoteId')

    const quote = await this.quoteRepository.findById(command.tenantId, command.quoteId)
    if (!quote) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        quoteId: command.quoteId
      })
    }

    if (quote.lines.length === 0) {
      throw ExceptionFactory.application(SALES_FAILED_PRECONDITION, {
        reason: 'quote draft must contain at least one line before publish'
      })
    }

    const quoteVersion: QuoteVersionRecord = {
      id: randomUUID(),
      quoteId: quote.id,
      quoteNo: quote.quoteNo,
      versionNo: await this.quoteVersionRepository.nextVersionNo(command.tenantId, quote.id),
      tenantId: quote.tenantId,
      customerTenantPartyId: quote.customerTenantPartyId,
      publishedAt: new Date().toISOString(),
      lines: structuredClone(quote.lines)
    }

    const savedVersion = await this.quoteVersionRepository.save(quoteVersion)
    const updatedQuote = await this.quoteRepository.save({
      ...quote,
      status: SalesQuoteStatus.PUBLISHED,
      latestPublishedVersionId: savedVersion.id
    })

    return {
      id: savedVersion.id,
      quote: updatedQuote,
      quoteVersion: savedVersion
    }
  }
}
