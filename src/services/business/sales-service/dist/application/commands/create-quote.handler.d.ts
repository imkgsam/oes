import { ICommandHandler } from '@nestjs/cqrs';
import { QuoteRecord } from '../../domain/models/sales-records';
import { QuoteRepository } from '../../domain/repositories/quote.repository';
import { CreateQuoteCommand } from './create-quote.command';
/** CreateQuoteHandler creates a new quote draft carrier without creating any published version. */
export declare class CreateQuoteHandler implements ICommandHandler<CreateQuoteCommand, QuoteRecord> {
    private readonly quoteRepository;
    constructor(quoteRepository: QuoteRepository);
    execute(command: CreateQuoteCommand): Promise<QuoteRecord>;
}
