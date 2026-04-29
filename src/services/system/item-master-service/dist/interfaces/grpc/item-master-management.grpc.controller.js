"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemMasterManagementGrpcController = void 0;
const common_1 = require("@nestjs/common");
const authorization_1 = require("@oes/common/authorization");
const cqrs_1 = require("@oes/common/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const filters_1 = require("@oes/common/filters");
const item_master_service_1 = require("@oes/common/generated/item_master_service");
const item_master_errors_1 = require("../../common/errors/item-master.errors");
const create_item_command_1 = require("../../application/commands/create-item.command");
const update_item_basics_command_1 = require("../../application/commands/update-item-basics.command");
const set_item_capabilities_command_1 = require("../../application/commands/set-item-capabilities.command");
const set_item_composition_command_1 = require("../../application/commands/set-item-composition.command");
const upsert_supplier_item_mapping_command_1 = require("../../application/commands/upsert-supplier-item-mapping.command");
const change_item_status_command_1 = require("../../application/commands/change-item-status.command");
const create_item_category_command_1 = require("../../application/commands/create-item-category.command");
const update_item_category_basics_command_1 = require("../../application/commands/update-item-category-basics.command");
const change_item_category_status_command_1 = require("../../application/commands/change-item-category-status.command");
const set_item_primary_category_command_1 = require("../../application/commands/set-item-primary-category.command");
const item_master_audit_service_1 = require("../../application/services/item-master-audit.service");
const item_master_grpc_presenter_1 = require("./item-master-grpc.presenter");
const item_master_rpc_context_guard_1 = require("./item-master-rpc-context.guard");
const item_category_value_objects_1 = require("../../domain/value-objects/item-category.value-objects");
const item_value_objects_1 = require("../../domain/value-objects/item.value-objects");
/** ItemMasterManagementGrpcController exposes the phase 1 command gRPC contract with local audit recording. */
let ItemMasterManagementGrpcController = class ItemMasterManagementGrpcController {
    constructor(commandBus, auditService) {
        this.commandBus = commandBus;
        this.auditService = auditService;
    }
    async createItem(request) {
        return this.auditService.recordCommand({
            tenantId: request.tenantId ?? '',
            commandName: 'CreateItem',
            targetId: null,
            requestSummary: {
                itemCode: request.itemCode ?? '',
                itemName: request.itemName ?? '',
                structureType: request.structureType ?? 0,
                natureType: request.natureType ?? 0
            }
        }, async () => {
            const item = await this.commandBus.execute(new create_item_command_1.CreateItemCommand({
                tenantId: request.tenantId ?? '',
                itemCode: request.itemCode ?? '',
                itemName: request.itemName ?? '',
                structureType: toDomainStructureType(request.structureType),
                natureType: toDomainNatureType(request.natureType)
            }));
            return item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toCreateItemResponse(item);
        });
    }
    async updateItemBasics(request) {
        rejectUnexpectedClassificationMutation(request);
        return this.auditService.recordCommand({
            tenantId: request.tenantId ?? '',
            commandName: 'UpdateItemBasics',
            targetId: request.itemId ?? null,
            requestSummary: {
                itemId: request.itemId ?? '',
                itemCode: request.itemCode ?? '',
                itemName: request.itemName ?? ''
            }
        }, async () => {
            const item = await this.commandBus.execute(new update_item_basics_command_1.UpdateItemBasicsCommand({
                tenantId: request.tenantId ?? '',
                itemId: request.itemId ?? '',
                itemCode: request.itemCode ?? '',
                itemName: request.itemName ?? ''
            }));
            return item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toUpdateItemBasicsResponse(item);
        });
    }
    async setItemCapabilities(request) {
        return this.auditService.recordCommand({
            tenantId: request.tenantId ?? '',
            commandName: 'SetItemCapabilities',
            targetId: request.itemId ?? null,
            requestSummary: {
                itemId: request.itemId ?? '',
                capabilities: request.capabilities ?? {}
            }
        }, async () => {
            const item = await this.commandBus.execute(new set_item_capabilities_command_1.SetItemCapabilitiesCommand({
                tenantId: request.tenantId ?? '',
                itemId: request.itemId ?? '',
                capabilities: item_value_objects_1.ItemCapabilities.from(request.capabilities ?? {})
            }));
            return item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toSetItemCapabilitiesResponse(item);
        });
    }
    async setItemComposition(request) {
        return this.auditService.recordCommand({
            tenantId: request.tenantId ?? '',
            commandName: 'SetItemComposition',
            targetId: request.itemId ?? null,
            requestSummary: {
                itemId: request.itemId ?? '',
                componentItemIds: (request.components ?? []).map((component) => component.componentItemId ?? '')
            }
        }, async () => {
            const result = await this.commandBus.execute(new set_item_composition_command_1.SetItemCompositionCommand({
                tenantId: request.tenantId ?? '',
                itemId: request.itemId ?? '',
                componentItemIds: (request.components ?? []).map((component) => component.componentItemId ?? '')
            }));
            return item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toSetItemCompositionResponse(result);
        });
    }
    async upsertSupplierItemMapping(request) {
        return this.auditService.recordCommand({
            tenantId: request.tenantId ?? '',
            commandName: 'UpsertSupplierItemMapping',
            targetId: request.itemId ?? null,
            requestSummary: {
                supplierId: request.supplierId ?? '',
                supplierItemCode: request.supplierItemCode ?? '',
                supplierItemName: request.supplierItemName ?? '',
                itemId: request.itemId ?? ''
            }
        }, async () => {
            const mapping = await this.commandBus.execute(new upsert_supplier_item_mapping_command_1.UpsertSupplierItemMappingCommand({
                tenantId: request.tenantId ?? '',
                supplierId: request.supplierId ?? '',
                supplierItemCode: request.supplierItemCode ?? undefined,
                supplierItemName: request.supplierItemName ?? undefined,
                itemId: request.itemId ?? ''
            }));
            return item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toUpsertSupplierItemMappingResponse(mapping);
        });
    }
    async changeItemStatus(request) {
        return this.auditService.recordCommand({
            tenantId: request.tenantId ?? '',
            commandName: 'ChangeItemStatus',
            targetId: request.itemId ?? null,
            requestSummary: {
                itemId: request.itemId ?? '',
                targetStatus: request.targetStatus ?? 0
            }
        }, async () => {
            const item = await this.commandBus.execute(new change_item_status_command_1.ChangeItemStatusCommand({
                tenantId: request.tenantId ?? '',
                itemId: request.itemId ?? '',
                targetStatus: toDomainStatus(request.targetStatus)
            }));
            return item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toChangeItemStatusResponse(item);
        });
    }
    async createItemCategory(request) {
        return this.auditService.recordCommand({
            tenantId: request.tenantId ?? '',
            commandName: 'CreateItemCategory',
            targetId: null,
            requestSummary: {
                categoryCode: request.categoryCode ?? '',
                categoryName: request.categoryName ?? '',
                parentCategoryId: request.parentCategoryId ?? ''
            }
        }, async () => {
            const category = await this.commandBus.execute(new create_item_category_command_1.CreateItemCategoryCommand({
                tenantId: request.tenantId ?? '',
                categoryCode: request.categoryCode ?? '',
                categoryName: request.categoryName ?? '',
                parentCategoryId: normalizeOptionalId(request.parentCategoryId)
            }));
            return item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toCreateItemCategoryResponse(category);
        });
    }
    async updateItemCategoryBasics(request) {
        return this.auditService.recordCommand({
            tenantId: request.tenantId ?? '',
            commandName: 'UpdateItemCategoryBasics',
            targetId: request.categoryId ?? null,
            requestSummary: {
                categoryId: request.categoryId ?? '',
                categoryCode: request.categoryCode ?? '',
                categoryName: request.categoryName ?? ''
            }
        }, async () => {
            const category = await this.commandBus.execute(new update_item_category_basics_command_1.UpdateItemCategoryBasicsCommand({
                tenantId: request.tenantId ?? '',
                categoryId: request.categoryId ?? '',
                categoryCode: request.categoryCode ?? '',
                categoryName: request.categoryName ?? ''
            }));
            return item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toUpdateItemCategoryBasicsResponse(category);
        });
    }
    async changeItemCategoryStatus(request) {
        return this.auditService.recordCommand({
            tenantId: request.tenantId ?? '',
            commandName: 'ChangeItemCategoryStatus',
            targetId: request.categoryId ?? null,
            requestSummary: {
                categoryId: request.categoryId ?? '',
                targetStatus: request.targetStatus ?? 0
            }
        }, async () => {
            const category = await this.commandBus.execute(new change_item_category_status_command_1.ChangeItemCategoryStatusCommand({
                tenantId: request.tenantId ?? '',
                categoryId: request.categoryId ?? '',
                targetStatus: toDomainCategoryStatus(request.targetStatus)
            }));
            return item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toChangeItemCategoryStatusResponse(category);
        });
    }
    async setItemPrimaryCategory(request) {
        return this.auditService.recordCommand({
            tenantId: request.tenantId ?? '',
            commandName: 'SetItemPrimaryCategory',
            targetId: request.itemId ?? null,
            requestSummary: {
                itemId: request.itemId ?? '',
                categoryId: request.categoryId ?? ''
            }
        }, async () => {
            const item = await this.commandBus.execute(new set_item_primary_category_command_1.SetItemPrimaryCategoryCommand({
                tenantId: request.tenantId ?? '',
                itemId: request.itemId ?? '',
                categoryId: normalizeOptionalId(request.categoryId)
            }));
            return item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toSetItemPrimaryCategoryResponse(item);
        });
    }
};
exports.ItemMasterManagementGrpcController = ItemMasterManagementGrpcController;
exports.ItemMasterManagementGrpcController = ItemMasterManagementGrpcController = __decorate([
    (0, common_1.UseFilters)(filters_1.GrpcExceptionFilter),
    (0, common_1.UseGuards)(item_master_rpc_context_guard_1.ItemMasterRpcContextGuard),
    (0, common_1.UseInterceptors)(authorization_1.GrpcRequestContextInterceptor),
    (0, common_1.Controller)(),
    (0, item_master_service_1.ItemMasterManagementServiceControllerMethods)(),
    __metadata("design:paramtypes", [cqrs_1.ValidatingCommandBus,
        item_master_audit_service_1.ItemMasterAuditService])
], ItemMasterManagementGrpcController);
/** rejectUnexpectedClassificationMutation protects UpdateItemBasics from silent contract creep at the RPC boundary. */
function rejectUnexpectedClassificationMutation(request) {
    const candidate = request;
    if (candidate.structureType !== undefined || candidate.natureType !== undefined) {
        throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, {
            reason: 'UpdateItemBasics cannot mutate structure_type or nature_type'
        });
    }
}
/** toDomainStructureType maps generated creation enums into domain enums and rejects unspecified values. */
function toDomainStructureType(value) {
    if (value === 2) {
        return item_value_objects_1.ItemStructureType.BUNDLE;
    }
    if (value === 1) {
        return item_value_objects_1.ItemStructureType.SINGLE;
    }
    throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, {
        field: 'structureType'
    });
}
/** toDomainNatureType maps generated creation enums into domain enums and rejects unspecified values. */
function toDomainNatureType(value) {
    if (value === 2) {
        return item_value_objects_1.ItemNatureType.VIRTUAL;
    }
    if (value === 3) {
        return item_value_objects_1.ItemNatureType.SERVICE;
    }
    if (value === 1) {
        return item_value_objects_1.ItemNatureType.PHYSICAL;
    }
    throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, {
        field: 'natureType'
    });
}
/** toDomainStatus maps generated status enums into the minimal domain lifecycle enum and rejects unspecified values. */
function toDomainStatus(value) {
    if (value === 2) {
        return item_value_objects_1.ItemStatus.INACTIVE;
    }
    if (value === 1) {
        return item_value_objects_1.ItemStatus.ACTIVE;
    }
    throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, {
        field: 'targetStatus'
    });
}
/** toDomainCategoryStatus maps generated category status enums into the minimal domain lifecycle enum. */
function toDomainCategoryStatus(value) {
    if (value === item_master_service_1.ItemCategoryStatus.ITEM_CATEGORY_STATUS_INACTIVE) {
        return item_category_value_objects_1.ItemCategoryStatus.INACTIVE;
    }
    if (value === item_master_service_1.ItemCategoryStatus.ITEM_CATEGORY_STATUS_ACTIVE) {
        return item_category_value_objects_1.ItemCategoryStatus.ACTIVE;
    }
    throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, {
        field: 'targetStatus'
    });
}
/** normalizeOptionalId converts blank ids into absent phase 1 optional references. */
function normalizeOptionalId(value) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        return undefined;
    }
    return value.trim();
}
//# sourceMappingURL=item-master-management.grpc.controller.js.map