import { SupplierStatus } from '../../domain/models/srm-records';
/** SearchSuppliersQuery carries the paged SRM supplier-directory filters frozen for phase 1. */
export declare class SearchSuppliersQuery {
    readonly input: {
        tenantId: string;
        keyword?: string;
        status?: SupplierStatus;
        tenantPartyId?: string;
        page?: number;
        pageSize?: number;
    };
    constructor(input: {
        tenantId: string;
        keyword?: string;
        status?: SupplierStatus;
        tenantPartyId?: string;
        page?: number;
        pageSize?: number;
    });
}
