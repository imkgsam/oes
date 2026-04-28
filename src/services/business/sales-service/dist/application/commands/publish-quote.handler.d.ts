import { ICommandHandler } from '@nestjs/cqrs';
import { QuoteRecord, QuoteVersionRecord } from '../../domain/models/sales-records';
import { QuoteRepository } from '../../domain/repositories/quote.repository';
import { QuoteVersionRepository } from '../../domain/repositories/quote-version.repository';
import { PublishQuoteCommand } from './publish-quote.command';
export interface PublishQuoteResult {
    id: string;
    quote: QuoteRecord;
    quoteVersion: QuoteVersionRecord;
}
/** PublishQuoteHandler freezes the current draft into an immutable quote version and updates the quote summary. */
export declare class PublishQuoteHandler implements ICommandHandler<PublishQuoteCommand, PublishQuoteResult> {
    private readonly quoteRepository;
    private readonly quoteVersionRepository;
    constructor(quoteRepository: QuoteRepository, quoteVersionRepository: QuoteVersionRepository);
    execute(command: PublishQuoteCommand): Promise<PublishQuoteResult>;
}
