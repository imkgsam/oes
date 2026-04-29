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
exports.ItemMasterQueryGrpcController = void 0;
const common_1 = require("@nestjs/common");
const authorization_1 = require("@oes/common/authorization");
const cqrs_1 = require("@oes/common/cqrs");
const filters_1 = require("@oes/common/filters");
const item_master_service_1 = require("@oes/common/generated/item_master_service");
const item_master_grpc_presenter_1 = require("./item-master-grpc.presenter");
const item_master_rpc_context_guard_1 = require("./item-master-rpc-context.guard");
const get_item_query_1 = require("../../application/queries/get-item.query");
const batch_get_items_query_1 = require("../../application/queries/batch-get-items.query");
const search_items_query_1 = require("../../application/queries/search-items.query");
const list_item_categories_query_1 = require("../../application/queries/list-item-categories.query");
const get_item_composition_query_1 = require("../../application/queries/get-item-composition.query");
const list_supplier_item_mappings_by_item_query_1 = require("../../application/queries/list-supplier-item-mappings-by-item.query");
const resolve_supplier_item_mapping_query_1 = require("../../application/queries/resolve-supplier-item-mapping.query");
/** ItemMasterQueryGrpcController exposes the phase 1 read-only item-master gRPC contract. */
let ItemMasterQueryGrpcController = class ItemMasterQueryGrpcController {
    constructor(queryBus) {
        this.queryBus = queryBus;
    }
    async getItem(request) {
        const item = await this.queryBus.execute(new get_item_query_1.GetItemQuery(request.tenantId ?? '', request.itemId ?? ''));
        return item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toGetItemResponse(item);
    }
    async batchGetItems(request) {
        const result = await this.queryBus.execute(new batch_get_items_query_1.BatchGetItemsQuery(request.tenantId ?? '', request.itemIds ?? []));
        return {
            items: result.items.map((item) => item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toItemSummary(item)),
            missingItemIds: result.missingItemIds
        };
    }
    async searchItems(request) {
        const result = await this.queryBus.execute(new search_items_query_1.SearchItemsQuery({
            tenantId: request.tenantId ?? '',
            keyword: request.keyword ?? undefined,
            structureType: request.structureType ?? undefined,
            natureType: request.natureType ?? undefined,
            capabilityFilters: request.capabilityFilters
                ? {
                    sellable: request.capabilityFilters.sellable,
                    purchasable: request.capabilityFilters.purchasable,
                    stockable: request.capabilityFilters.stockable,
                    manufacturable: request.capabilityFilters.manufacturable
                }
                : undefined,
            status: request.status ?? undefined,
            categoryId: request.categoryId ?? undefined,
            includeDescendants: request.includeDescendants ?? undefined,
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        }));
        return {
            items: result.items.map((item) => item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toItemSummary(item)),
            total: result.total,
            page: result.page,
            pageSize: result.pageSize
        };
    }
    async listItemCategories(request) {
        const result = await this.queryBus.execute(new list_item_categories_query_1.ListItemCategoriesQuery({
            tenantId: request.tenantId ?? '',
            parentCategoryId: request.parentCategoryId ?? undefined
        }));
        return item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toListItemCategoriesResponse(result);
    }
    async getItemComposition(request) {
        const result = await this.queryBus.execute(new get_item_composition_query_1.GetItemCompositionQuery(request.tenantId ?? '', request.itemId ?? ''));
        return item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toGetItemCompositionResponse(result);
    }
    async listSupplierItemMappingsByItem(request) {
        const result = await this.queryBus.execute(new list_supplier_item_mappings_by_item_query_1.ListSupplierItemMappingsByItemQuery({
            tenantId: request.tenantId ?? '',
            itemId: request.itemId ?? '',
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        }));
        return item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toListSupplierItemMappingsByItemResponse(result);
    }
    async resolveSupplierItemMapping(request) {
        const result = await this.queryBus.execute(new resolve_supplier_item_mapping_query_1.ResolveSupplierItemMappingQuery({
            tenantId: request.tenantId ?? '',
            supplierId: request.supplierId ?? '',
            supplierItemCode: request.supplierItemCode ?? undefined,
            supplierItemName: request.supplierItemName ?? undefined
        }));
        return item_master_grpc_presenter_1.ItemMasterGrpcPresenter.toResolveSupplierItemMappingResponse(result);
    }
};
exports.ItemMasterQueryGrpcController = ItemMasterQueryGrpcController;
exports.ItemMasterQueryGrpcController = ItemMasterQueryGrpcController = __decorate([
    (0, common_1.UseFilters)(filters_1.GrpcExceptionFilter),
    (0, common_1.UseGuards)(item_master_rpc_context_guard_1.ItemMasterRpcContextGuard),
    (0, common_1.UseInterceptors)(authorization_1.GrpcRequestContextInterceptor),
    (0, common_1.Controller)(),
    (0, item_master_service_1.ItemMasterQueryServiceControllerMethods)(),
    __metadata("design:paramtypes", [cqrs_1.ValidatingQueryBus])
], ItemMasterQueryGrpcController);
//# sourceMappingURL=item-master-query.grpc.controller.js.map