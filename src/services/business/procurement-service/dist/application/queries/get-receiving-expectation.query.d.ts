/** GetReceivingExpectationQuery carries the tenant-scoped expectation lookup key. */
export declare class GetReceivingExpectationQuery {
    readonly tenantId: string;
    readonly receivingExpectationId: string;
    constructor(tenantId: string, receivingExpectationId: string);
}
