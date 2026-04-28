import { GrpcRequestContextStore } from '@oes/common/authorization';
import { ValidatingCommandBus } from '@oes/common/cqrs';
import { ApplyPurchaseOrderChangeRequest, ApplyPurchaseOrderChangeResponse, CancelPurchaseOrderRequest, CancelPurchaseOrderResponse, CancelPurchaseRequestRequest, CancelPurchaseRequestResponse, ConfirmSupplierAcknowledgementRequest, ConfirmSupplierAcknowledgementResponse, ConvertPurchaseRequestToPurchaseOrderRequest, ConvertPurchaseRequestToPurchaseOrderResponse, CreatePurchaseOrderDraftRequest, CreatePurchaseOrderDraftResponse, CreatePurchaseRequestRequest, CreatePurchaseRequestResponse, CreateReceivingExpectationRequest, CreateReceivingExpectationResponse, PurchaseOrderManagementServiceController, PurchaseRequestManagementServiceController, ReceivingExpectationManagementServiceController, RecordReceivingDiscrepancyResolutionRequest, RecordReceivingDiscrepancyResolutionResponse, SubmitPurchaseRequestRequest, SubmitPurchaseRequestResponse, UpdatePurchaseOrderDraftRequest, UpdatePurchaseOrderDraftResponse, UpdatePurchaseRequestDraftRequest, UpdatePurchaseRequestDraftResponse, IssuePurchaseOrderRequest, IssuePurchaseOrderResponse, DecidePurchaseRequestRequest, DecidePurchaseRequestResponse } from '@oes/common/generated/procurement_service';
import { ProcurementAuditService } from '../../application/services/procurement-audit.service';
/** ProcurementManagementGrpcController exposes the phase 1 procurement command contract with local audit envelope recording. */
export declare class ProcurementManagementGrpcController implements PurchaseRequestManagementServiceController, PurchaseOrderManagementServiceController, ReceivingExpectationManagementServiceController {
    private readonly commandBus;
    private readonly auditService;
    private readonly requestContextStore;
    constructor(commandBus: ValidatingCommandBus, auditService: ProcurementAuditService, requestContextStore: GrpcRequestContextStore);
    createPurchaseRequest(request: CreatePurchaseRequestRequest): Promise<CreatePurchaseRequestResponse>;
    updatePurchaseRequestDraft(request: UpdatePurchaseRequestDraftRequest): Promise<UpdatePurchaseRequestDraftResponse>;
    submitPurchaseRequest(request: SubmitPurchaseRequestRequest): Promise<SubmitPurchaseRequestResponse>;
    decidePurchaseRequest(request: DecidePurchaseRequestRequest): Promise<DecidePurchaseRequestResponse>;
    cancelPurchaseRequest(request: CancelPurchaseRequestRequest): Promise<CancelPurchaseRequestResponse>;
    convertPurchaseRequestToPurchaseOrder(request: ConvertPurchaseRequestToPurchaseOrderRequest): Promise<ConvertPurchaseRequestToPurchaseOrderResponse>;
    createPurchaseOrderDraft(request: CreatePurchaseOrderDraftRequest): Promise<CreatePurchaseOrderDraftResponse>;
    updatePurchaseOrderDraft(request: UpdatePurchaseOrderDraftRequest): Promise<UpdatePurchaseOrderDraftResponse>;
    issuePurchaseOrder(request: IssuePurchaseOrderRequest): Promise<IssuePurchaseOrderResponse>;
    confirmSupplierAcknowledgement(request: ConfirmSupplierAcknowledgementRequest): Promise<ConfirmSupplierAcknowledgementResponse>;
    applyPurchaseOrderChange(request: ApplyPurchaseOrderChangeRequest): Promise<ApplyPurchaseOrderChangeResponse>;
    cancelPurchaseOrder(request: CancelPurchaseOrderRequest): Promise<CancelPurchaseOrderResponse>;
    createReceivingExpectation(request: CreateReceivingExpectationRequest): Promise<CreateReceivingExpectationResponse>;
    recordReceivingDiscrepancyResolution(request: RecordReceivingDiscrepancyResolutionRequest): Promise<RecordReceivingDiscrepancyResolutionResponse>;
    private toPurchaseOrderLineInput;
    private runWithContext;
}
