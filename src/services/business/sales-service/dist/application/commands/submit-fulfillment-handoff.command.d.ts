/** SubmitFulfillmentHandoffCommand captures one sales-side handoff submission to the future fulfillment boundary. */
export declare class SubmitFulfillmentHandoffCommand {
    readonly input: {
        tenantId: string;
        salesOrderId: string;
    };
    constructor(input: {
        tenantId: string;
        salesOrderId: string;
    });
    get tenantId(): string;
    get salesOrderId(): string;
}
