import { OpportunityRefSummary, QuoteLineInput } from '../../domain/models/sales-records';
/** CreateQuoteCommand captures one tenant-scoped quote draft creation intent. */
export declare class CreateQuoteCommand {
    readonly input: {
        tenantId: string;
        customerTenantPartyId: string;
        opportunityRef?: OpportunityRefSummary | null;
        draftLines: QuoteLineInput[];
    };
    constructor(input: {
        tenantId: string;
        customerTenantPartyId: string;
        opportunityRef?: OpportunityRefSummary | null;
        draftLines: QuoteLineInput[];
    });
    get tenantId(): string;
    get customerTenantPartyId(): string;
    get opportunityRef(): OpportunityRefSummary | null | undefined;
    get draftLines(): QuoteLineInput[];
}
