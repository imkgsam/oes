/** UpsertCustomerContactCommand carries one create-or-update CRM business-contact payload. */
export declare class UpsertCustomerContactCommand {
    readonly payload: {
        tenantId: string;
        customerAccountId: string;
        customerContactId?: string;
        displayName: string;
        roleTitle?: string;
        email?: string;
        phone?: string;
        isPrimaryContact?: boolean;
        isActive?: boolean;
    };
    constructor(payload: {
        tenantId: string;
        customerAccountId: string;
        customerContactId?: string;
        displayName: string;
        roleTitle?: string;
        email?: string;
        phone?: string;
        isPrimaryContact?: boolean;
        isActive?: boolean;
    });
    get tenantId(): string;
    get customerAccountId(): string;
    get customerContactId(): string | undefined;
    get displayName(): string;
    get roleTitle(): string | undefined;
    get email(): string | undefined;
    get phone(): string | undefined;
    get isPrimaryContact(): boolean | undefined;
    get isActive(): boolean | undefined;
}
