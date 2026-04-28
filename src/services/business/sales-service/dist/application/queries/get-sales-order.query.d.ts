/** GetSalesOrderQuery captures one lookup of an established sales order. */
export declare class GetSalesOrderQuery {
    readonly tenantId: string;
    readonly salesOrderId: string;
    constructor(tenantId: string, salesOrderId: string);
}
