import { SupplierOfferingStatus } from '../../domain/models/srm-records';
/** ListSupplierOfferingsByItemQuery captures one item-scoped offering directory read. */
export declare class ListSupplierOfferingsByItemQuery {
    readonly input: {
        tenantId: string;
        itemId: string;
        status?: SupplierOfferingStatus;
        page?: number;
        pageSize?: number;
    };
    constructor(input: {
        tenantId: string;
        itemId: string;
        status?: SupplierOfferingStatus;
        page?: number;
        pageSize?: number;
    });
}
