import { ValidatingCommandBus } from '@oes/common/cqrs';
import { ChangeItemStatusRequest, ChangeItemStatusResponse, CreateItemRequest, CreateItemResponse, ItemMasterManagementServiceController, SetItemCapabilitiesRequest, SetItemCapabilitiesResponse, SetItemCompositionRequest, SetItemCompositionResponse, UpdateItemBasicsRequest, UpdateItemBasicsResponse, UpsertSupplierItemMappingRequest, UpsertSupplierItemMappingResponse } from '@oes/common/generated/item_master_service';
import { ItemMasterAuditService } from '../../application/services/item-master-audit.service';
/** ItemMasterManagementGrpcController exposes the phase 1 command gRPC contract with local audit recording. */
export declare class ItemMasterManagementGrpcController implements ItemMasterManagementServiceController {
    private readonly commandBus;
    private readonly auditService;
    constructor(commandBus: ValidatingCommandBus, auditService: ItemMasterAuditService);
    createItem(request: CreateItemRequest): Promise<CreateItemResponse>;
    updateItemBasics(request: UpdateItemBasicsRequest): Promise<UpdateItemBasicsResponse>;
    setItemCapabilities(request: SetItemCapabilitiesRequest): Promise<SetItemCapabilitiesResponse>;
    setItemComposition(request: SetItemCompositionRequest): Promise<SetItemCompositionResponse>;
    upsertSupplierItemMapping(request: UpsertSupplierItemMappingRequest): Promise<UpsertSupplierItemMappingResponse>;
    changeItemStatus(request: ChangeItemStatusRequest): Promise<ChangeItemStatusResponse>;
}
