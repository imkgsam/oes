import { QuoteDraftMutation } from '../../domain/models/sales-records';
/** UpdateQuoteDraftCommand captures one draft overwrite against the current mutable quote working state. */
export declare class UpdateQuoteDraftCommand {
    readonly input: {
        tenantId: string;
        quoteId: string;
        draftMutation: QuoteDraftMutation;
    };
    constructor(input: {
        tenantId: string;
        quoteId: string;
        draftMutation: QuoteDraftMutation;
    });
    get tenantId(): string;
    get quoteId(): string;
    get draftMutation(): QuoteDraftMutation;
}
