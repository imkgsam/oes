/** UpsertSupplierAddressCommand carries one create-or-update SRM business-address payload. */
export declare class UpsertSupplierAddressCommand {
    readonly payload: {
        tenantId: string;
        supplierId: string;
        supplierAddressId?: string;
        label: string;
        countryCode: string;
        region?: string;
        locality?: string;
        addressLine1: string;
        addressLine2?: string;
        postalCode?: string;
        isPrimaryAddress?: boolean;
        isActive?: boolean;
    };
    constructor(payload: {
        tenantId: string;
        supplierId: string;
        supplierAddressId?: string;
        label: string;
        countryCode: string;
        region?: string;
        locality?: string;
        addressLine1: string;
        addressLine2?: string;
        postalCode?: string;
        isPrimaryAddress?: boolean;
        isActive?: boolean;
    });
    get tenantId(): string;
    get supplierId(): string;
    get supplierAddressId(): string | undefined;
    get label(): string;
    get countryCode(): string;
    get region(): string | undefined;
    get locality(): string | undefined;
    get addressLine1(): string;
    get addressLine2(): string | undefined;
    get postalCode(): string | undefined;
    get isPrimaryAddress(): boolean | undefined;
    get isActive(): boolean | undefined;
}
