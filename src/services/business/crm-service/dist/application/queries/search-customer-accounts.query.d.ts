import { CustomerStatus } from '../../domain/models/crm-records';
/** SearchCustomerAccountsQuery carries the paged CRM account-directory filters frozen for phase 1. */
export declare class SearchCustomerAccountsQuery {
    readonly input: {
        tenantId: string;
        keyword?: string;
        status?: CustomerStatus;
        primaryTenantPartyId?: string;
        page?: number;
        pageSize?: number;
    };
    constructor(input: {
        tenantId: string;
        keyword?: string;
        status?: CustomerStatus;
        primaryTenantPartyId?: string;
        page?: number;
        pageSize?: number;
    });
}
