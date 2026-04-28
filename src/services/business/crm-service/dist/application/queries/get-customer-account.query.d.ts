/** GetCustomerAccountQuery requests one tenant-scoped CRM customer-account read model by id. */
export declare class GetCustomerAccountQuery {
    readonly tenantId: string;
    readonly customerAccountId: string;
    constructor(tenantId: string, customerAccountId: string);
}
