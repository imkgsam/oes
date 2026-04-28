/** UpdateCustomerAccountBasicsCommand carries the mutable CRM account-shell fields allowed in phase 1. */
export declare class UpdateCustomerAccountBasicsCommand {
    readonly payload: {
        tenantId: string;
        customerAccountId: string;
        displayName?: string;
        customerCategory?: string;
        tags?: string[];
    };
    constructor(payload: {
        tenantId: string;
        customerAccountId: string;
        displayName?: string;
        customerCategory?: string;
        tags?: string[];
    });
    get tenantId(): string;
    get customerAccountId(): string;
    get displayName(): string | undefined;
    get customerCategory(): string | undefined;
    get tags(): string[] | undefined;
}
