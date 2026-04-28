/** CreateCustomerAccountCommand carries the phase 1 CRM account-shell creation payload. */
export declare class CreateCustomerAccountCommand {
    readonly payload: {
        tenantId: string;
        displayName: string;
        customerCategory?: string;
        tags?: string[];
    };
    constructor(payload: {
        tenantId: string;
        displayName: string;
        customerCategory?: string;
        tags?: string[];
    });
    get tenantId(): string;
    get displayName(): string;
    get customerCategory(): string | undefined;
    get tags(): string[] | undefined;
}
