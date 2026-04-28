import { SupplierOfferingStatus } from '../../domain/models/srm-records';
/** UpsertSupplierOfferingCommand carries one create-or-update current supplyability fact for supplierId + itemId. */
export declare class UpsertSupplierOfferingCommand {
    readonly payload: {
        tenantId: string;
        supplierOfferingId?: string;
        supplierId: string;
        itemId: string;
        targetStatus: SupplierOfferingStatus;
    };
    constructor(payload: {
        tenantId: string;
        supplierOfferingId?: string;
        supplierId: string;
        itemId: string;
        targetStatus: SupplierOfferingStatus;
    });
    get tenantId(): string;
    get supplierOfferingId(): string | undefined;
    get supplierId(): string;
    get itemId(): string;
    get targetStatus(): SupplierOfferingStatus;
}
