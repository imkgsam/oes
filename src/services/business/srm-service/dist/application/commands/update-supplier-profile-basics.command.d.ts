/** UpdateSupplierProfileBasicsCommand carries the mutable SRM supplier-profile fields allowed in phase 1. */
export declare class UpdateSupplierProfileBasicsCommand {
    readonly payload: {
        tenantId: string;
        supplierId: string;
        displayName?: string;
        supplierNo?: string;
        supplierCategory?: string;
        tags?: string[];
    };
    constructor(payload: {
        tenantId: string;
        supplierId: string;
        displayName?: string;
        supplierNo?: string;
        supplierCategory?: string;
        tags?: string[];
    });
    get tenantId(): string;
    get supplierId(): string;
    get displayName(): string | undefined;
    get supplierNo(): string | undefined;
    get supplierCategory(): string | undefined;
    get tags(): string[] | undefined;
}
