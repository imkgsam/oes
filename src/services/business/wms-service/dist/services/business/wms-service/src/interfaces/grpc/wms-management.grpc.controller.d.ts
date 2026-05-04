import { GrpcRequestContextStore } from '@oes/common/authorization';
import { ValidatingCommandBus } from '@oes/common/cqrs';
import { AddOrReplaceReceiptLinesRequest, AddOrReplaceReceiptLinesResponse, CancelReceiptDraftRequest, CancelReceiptDraftResponse, CreateReceiptDraftRequest, CreateReceiptDraftResponse, PostReceiptRequest, PostReceiptResponse, ReceiptManagementServiceController } from '@oes/common/generated/wms_service';
import { WmsAuditService } from '../../application/services/wms-audit.service';
/** WmsManagementGrpcController exposes the phase 1 receipt command contract with local audit envelope recording. */
export declare class WmsManagementGrpcController implements ReceiptManagementServiceController {
    private readonly commandBus;
    private readonly auditService;
    private readonly requestContextStore;
    constructor(commandBus: ValidatingCommandBus, auditService: WmsAuditService, requestContextStore: GrpcRequestContextStore);
    createReceiptDraft(request: CreateReceiptDraftRequest): Promise<CreateReceiptDraftResponse>;
    addOrReplaceReceiptLines(request: AddOrReplaceReceiptLinesRequest): Promise<AddOrReplaceReceiptLinesResponse>;
    postReceipt(request: PostReceiptRequest): Promise<PostReceiptResponse>;
    cancelReceiptDraft(request: CancelReceiptDraftRequest): Promise<CancelReceiptDraftResponse>;
    private runWithContext;
}
