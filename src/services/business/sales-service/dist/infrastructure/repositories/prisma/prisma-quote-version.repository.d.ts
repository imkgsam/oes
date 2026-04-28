import { PageResult, QuoteVersionListInput, QuoteVersionRecord } from '../../../domain/models/sales-records';
import { QuoteVersionRepository } from '../../../domain/repositories/quote-version.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaQuoteVersionRepository persists immutable published quote baselines and paged history reads. */
export declare class PrismaQuoteVersionRepository implements QuoteVersionRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    nextVersionNo(tenantId: string, quoteId: string): Promise<number>;
    findById(tenantId: string, quoteVersionId: string): Promise<QuoteVersionRecord | null>;
    save(quoteVersion: QuoteVersionRecord): Promise<QuoteVersionRecord>;
    listByQuoteId(input: QuoteVersionListInput): Promise<PageResult<QuoteVersionRecord>>;
}
