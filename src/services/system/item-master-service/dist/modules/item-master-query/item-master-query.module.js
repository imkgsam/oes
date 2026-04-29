"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemMasterQueryModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const cqrs_2 = require("@oes/common/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const batch_get_items_handler_1 = require("../../application/queries/batch-get-items.handler");
const get_item_composition_handler_1 = require("../../application/queries/get-item-composition.handler");
const get_item_handler_1 = require("../../application/queries/get-item.handler");
const list_item_categories_handler_1 = require("../../application/queries/list-item-categories.handler");
const list_supplier_item_mappings_by_item_handler_1 = require("../../application/queries/list-supplier-item-mappings-by-item.handler");
const resolve_supplier_item_mapping_handler_1 = require("../../application/queries/resolve-supplier-item-mapping.handler");
const search_items_handler_1 = require("../../application/queries/search-items.handler");
const prisma_item_category_repository_1 = require("../../infrastructure/repositories/prisma/prisma-item-category.repository");
const prisma_item_composition_repository_1 = require("../../infrastructure/repositories/prisma/prisma-item-composition.repository");
const prisma_item_repository_1 = require("../../infrastructure/repositories/prisma/prisma-item.repository");
const prisma_supplier_item_mapping_repository_1 = require("../../infrastructure/repositories/prisma/prisma-supplier-item-mapping.repository");
const prisma_module_1 = require("../../infrastructure/prisma/prisma.module");
const item_master_query_grpc_controller_1 = require("../../interfaces/grpc/item-master-query.grpc.controller");
const item_master_rpc_context_guard_1 = require("../../interfaces/grpc/item-master-rpc-context.guard");
/** ItemMasterQueryModule wires the phase 1 query controllers, handlers, and Prisma repositories. */
let ItemMasterQueryModule = class ItemMasterQueryModule {
};
exports.ItemMasterQueryModule = ItemMasterQueryModule;
exports.ItemMasterQueryModule = ItemMasterQueryModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule, prisma_module_1.PrismaModule],
        providers: [
            {
                provide: tokens_1.TOKENS.ITEM_REPOSITORY,
                useClass: prisma_item_repository_1.PrismaItemRepository
            },
            {
                provide: tokens_1.TOKENS.ITEM_CATEGORY_REPOSITORY,
                useClass: prisma_item_category_repository_1.PrismaItemCategoryRepository
            },
            {
                provide: tokens_1.TOKENS.ITEM_COMPOSITION_REPOSITORY,
                useClass: prisma_item_composition_repository_1.PrismaItemCompositionRepository
            },
            {
                provide: tokens_1.TOKENS.SUPPLIER_ITEM_MAPPING_REPOSITORY,
                useClass: prisma_supplier_item_mapping_repository_1.PrismaSupplierItemMappingRepository
            },
            cqrs_2.ValidatingQueryBus,
            item_master_rpc_context_guard_1.ItemMasterRpcContextGuard,
            get_item_handler_1.GetItemHandler,
            batch_get_items_handler_1.BatchGetItemsHandler,
            search_items_handler_1.SearchItemsHandler,
            list_item_categories_handler_1.ListItemCategoriesHandler,
            get_item_composition_handler_1.GetItemCompositionHandler,
            list_supplier_item_mappings_by_item_handler_1.ListSupplierItemMappingsByItemHandler,
            resolve_supplier_item_mapping_handler_1.ResolveSupplierItemMappingHandler
        ],
        controllers: [item_master_query_grpc_controller_1.ItemMasterQueryGrpcController]
    })
], ItemMasterQueryModule);
//# sourceMappingURL=item-master-query.module.js.map