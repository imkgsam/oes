import { PageResult, QuoteRecord, QuoteSearchInput } from '../../../domain/models/sales-records';
import { QuoteRepository } from '../../../domain/repositories/quote.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaQuoteRepository persists tenant-scoped mutable quote drafts in the sales-service database. */
export declare class PrismaQuoteRepository implements QuoteRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    nextQuoteNo(tenantId: string): Promise<string>;
    findById(tenantId: string, quoteId: string): Promise<QuoteRecord | null>;
    save(quote: QuoteRecord): Promise<QuoteRecord>;
    search(input: QuoteSearchInput): Promise<PageResult<QuoteRecord>>;
}
