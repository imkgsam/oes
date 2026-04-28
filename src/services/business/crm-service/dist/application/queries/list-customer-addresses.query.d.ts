/** ListCustomerAddressesQuery requests one CRM account's business-address list. */
export declare class ListCustomerAddressesQuery {
    readonly tenantId: string;
    readonly customerAccountId: string;
    constructor(tenantId: string, customerAccountId: string);
}
