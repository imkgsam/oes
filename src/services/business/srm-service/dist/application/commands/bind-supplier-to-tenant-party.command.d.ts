/** BindSupplierToTenantPartyCommand carries the phase 1 SRM primary tenant-party binding request. */
export declare class BindSupplierToTenantPartyCommand {
    readonly payload: {
        tenantId: string;
        supplierId: string;
        tenantPartyId: string;
    };
    constructor(payload: {
        tenantId: string;
        supplierId: string;
        tenantPartyId: string;
    });
    get tenantId(): string;
    get supplierId(): string;
    get tenantPartyId(): string;
}
