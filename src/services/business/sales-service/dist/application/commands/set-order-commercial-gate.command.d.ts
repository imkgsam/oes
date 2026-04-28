import { SalesCommercialGateName } from '../../domain/models/sales-records';
/** SetOrderCommercialGateCommand captures one explicit production, stocking, or shipping gate decision. */
export declare class SetOrderCommercialGateCommand {
    readonly input: {
        tenantId: string;
        salesOrderId: string;
        gateName: SalesCommercialGateName;
        allowed: boolean;
    };
    constructor(input: {
        tenantId: string;
        salesOrderId: string;
        gateName: SalesCommercialGateName;
        allowed: boolean;
    });
    get tenantId(): string;
    get salesOrderId(): string;
    get gateName(): SalesCommercialGateName;
    get allowed(): boolean;
}
