import { ValidatingCommandBus } from '@oes/common/cqrs';
import { ConvertQuoteVersionToOrderRequest, ConvertQuoteVersionToOrderResponse, CreateQuoteRequest, CreateQuoteResponse, PublishQuoteRequest, PublishQuoteResponse, SalesManagementServiceController, SetOrderCommercialGateRequest, SetOrderCommercialGateResponse, SubmitFulfillmentHandoffRequest, SubmitFulfillmentHandoffResponse, UpdateQuoteDraftRequest, UpdateQuoteDraftResponse } from '@oes/common/generated/sales_service';
import { SalesAuditService } from '../../application/services/sales-audit.service';
/** SalesManagementGrpcController exposes the phase 1 sales command contract with local audit envelope recording. */
export declare class SalesManagementGrpcController implements SalesManagementServiceController {
    private readonly commandBus;
    private readonly auditService;
    constructor(commandBus: ValidatingCommandBus, auditService: SalesAuditService);
    createQuote(request: CreateQuoteRequest): Promise<CreateQuoteResponse>;
    updateQuoteDraft(request: UpdateQuoteDraftRequest): Promise<UpdateQuoteDraftResponse>;
    publishQuote(request: PublishQuoteRequest): Promise<PublishQuoteResponse>;
    convertQuoteVersionToOrder(request: ConvertQuoteVersionToOrderRequest): Promise<ConvertQuoteVersionToOrderResponse>;
    setOrderCommercialGate(request: SetOrderCommercialGateRequest): Promise<SetOrderCommercialGateResponse>;
    submitFulfillmentHandoff(request: SubmitFulfillmentHandoffRequest): Promise<SubmitFulfillmentHandoffResponse>;
}
