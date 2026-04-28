import { SupplierOfferingStatus } from '../../domain/models/srm-records';
/** ListSupplierOfferingsBySupplierQuery captures one supplier-scoped offering directory read. */
export declare class ListSupplierOfferingsBySupplierQuery {
    readonly input: {
        tenantId: string;
        supplierId: string;
        status?: SupplierOfferingStatus;
        page?: number;
        pageSize?: number;
    };
    constructor(input: {
        tenantId: string;
        supplierId: string;
        status?: SupplierOfferingStatus;
        page?: number;
        pageSize?: number;
    });
}
