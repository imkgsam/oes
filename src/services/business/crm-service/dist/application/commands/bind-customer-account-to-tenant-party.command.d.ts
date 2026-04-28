/** BindCustomerAccountToTenantPartyCommand carries the phase 1 CRM primary tenant-party binding request. */
export declare class BindCustomerAccountToTenantPartyCommand {
    readonly payload: {
        tenantId: string;
        customerAccountId: string;
        tenantPartyId: string;
    };
    constructor(payload: {
        tenantId: string;
        customerAccountId: string;
        tenantPartyId: string;
    });
    get tenantId(): string;
    get customerAccountId(): string;
    get tenantPartyId(): string;
}
