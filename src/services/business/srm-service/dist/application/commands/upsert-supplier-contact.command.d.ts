/** UpsertSupplierContactCommand carries one create-or-update SRM business-contact payload. */
export declare class UpsertSupplierContactCommand {
    readonly payload: {
        tenantId: string;
        supplierId: string;
        supplierContactId?: string;
        displayName: string;
        roleTitle?: string;
        email?: string;
        phone?: string;
        isPrimaryContact?: boolean;
        isActive?: boolean;
    };
    constructor(payload: {
        tenantId: string;
        supplierId: string;
        supplierContactId?: string;
        displayName: string;
        roleTitle?: string;
        email?: string;
        phone?: string;
        isPrimaryContact?: boolean;
        isActive?: boolean;
    });
    get tenantId(): string;
    get supplierId(): string;
    get supplierContactId(): string | undefined;
    get displayName(): string;
    get roleTitle(): string | undefined;
    get email(): string | undefined;
    get phone(): string | undefined;
    get isPrimaryContact(): boolean | undefined;
    get isActive(): boolean | undefined;
}
