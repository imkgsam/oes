import { ICommandHandler } from '@nestjs/cqrs';
import { QuoteRecord } from '../../domain/models/sales-records';
import { QuoteRepository } from '../../domain/repositories/quote.repository';
import { UpdateQuoteDraftCommand } from './update-quote-draft.command';
/** UpdateQuoteDraftHandler replaces the current mutable quote draft without generating any published version. */
export declare class UpdateQuoteDraftHandler implements ICommandHandler<UpdateQuoteDraftCommand, QuoteRecord> {
    private readonly quoteRepository;
    constructor(quoteRepository: QuoteRepository);
    execute(command: UpdateQuoteDraftCommand): Promise<QuoteRecord>;
}
