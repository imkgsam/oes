/** ListCustomerContactsQuery requests one CRM account's business-contact list. */
export declare class ListCustomerContactsQuery {
    readonly tenantId: string;
    readonly customerAccountId: string;
    constructor(tenantId: string, customerAccountId: string);
}
