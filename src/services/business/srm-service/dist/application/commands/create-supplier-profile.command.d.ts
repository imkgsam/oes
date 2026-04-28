/** CreateSupplierProfileCommand carries the phase 1 SRM supplier-profile creation payload. */
export declare class CreateSupplierProfileCommand {
    readonly payload: {
        tenantId: string;
        displayName: string;
        supplierNo?: string;
        supplierCategory?: string;
        tags?: string[];
    };
    constructor(payload: {
        tenantId: string;
        displayName: string;
        supplierNo?: string;
        supplierCategory?: string;
        tags?: string[];
    });
    get tenantId(): string;
    get displayName(): string;
    get supplierNo(): string | undefined;
    get supplierCategory(): string | undefined;
    get tags(): string[] | undefined;
}
