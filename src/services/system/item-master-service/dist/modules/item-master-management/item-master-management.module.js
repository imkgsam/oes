"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemMasterManagementModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const cqrs_2 = require("@oes/common/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const change_item_status_handler_1 = require("../../application/commands/change-item-status.handler");
const create_item_handler_1 = require("../../application/commands/create-item.handler");
const set_item_capabilities_handler_1 = require("../../application/commands/set-item-capabilities.handler");
const set_item_composition_handler_1 = require("../../application/commands/set-item-composition.handler");
const update_item_basics_handler_1 = require("../../application/commands/update-item-basics.handler");
const upsert_supplier_item_mapping_handler_1 = require("../../application/commands/upsert-supplier-item-mapping.handler");
const item_master_audit_service_1 = require("../../application/services/item-master-audit.service");
const prisma_item_composition_repository_1 = require("../../infrastructure/repositories/prisma/prisma-item-composition.repository");
const prisma_item_repository_1 = require("../../infrastructure/repositories/prisma/prisma-item.repository");
const prisma_item_master_audit_repository_1 = require("../../infrastructure/repositories/prisma/prisma-item-master-audit.repository");
const prisma_supplier_item_mapping_repository_1 = require("../../infrastructure/repositories/prisma/prisma-supplier-item-mapping.repository");
const prisma_module_1 = require("../../infrastructure/prisma/prisma.module");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const item_master_management_grpc_controller_1 = require("../../interfaces/grpc/item-master-management.grpc.controller");
const item_master_rpc_context_guard_1 = require("../../interfaces/grpc/item-master-rpc-context.guard");
/** ItemMasterManagementModule wires the phase 1 command controllers, handlers, Prisma repositories, and audit. */
let ItemMasterManagementModule = class ItemMasterManagementModule {
};
exports.ItemMasterManagementModule = ItemMasterManagementModule;
exports.ItemMasterManagementModule = ItemMasterManagementModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule, prisma_module_1.PrismaModule],
        providers: [
            {
                provide: tokens_1.TOKENS.ITEM_REPOSITORY,
                useClass: prisma_item_repository_1.PrismaItemRepository
            },
            {
                provide: tokens_1.TOKENS.ITEM_COMPOSITION_REPOSITORY,
                useClass: prisma_item_composition_repository_1.PrismaItemCompositionRepository
            },
            {
                provide: tokens_1.TOKENS.SUPPLIER_ITEM_MAPPING_REPOSITORY,
                useClass: prisma_supplier_item_mapping_repository_1.PrismaSupplierItemMappingRepository
            },
            {
                provide: tokens_1.TOKENS.ITEM_MASTER_AUDIT_WRITER,
                useClass: prisma_item_master_audit_repository_1.PrismaItemMasterAuditRepository
            },
            {
                provide: tokens_1.TOKENS.ITEM_MASTER_TRANSACTION_RUNNER,
                useExisting: prisma_service_1.PrismaService
            },
            cqrs_2.ValidatingCommandBus,
            item_master_rpc_context_guard_1.ItemMasterRpcContextGuard,
            item_master_audit_service_1.ItemMasterAuditService,
            create_item_handler_1.CreateItemHandler,
            update_item_basics_handler_1.UpdateItemBasicsHandler,
            set_item_capabilities_handler_1.SetItemCapabilitiesHandler,
            set_item_composition_handler_1.SetItemCompositionHandler,
            upsert_supplier_item_mapping_handler_1.UpsertSupplierItemMappingHandler,
            change_item_status_handler_1.ChangeItemStatusHandler
        ],
        controllers: [item_master_management_grpc_controller_1.ItemMasterManagementGrpcController]
    })
], ItemMasterManagementModule);
//# sourceMappingURL=item-master-management.module.js.map