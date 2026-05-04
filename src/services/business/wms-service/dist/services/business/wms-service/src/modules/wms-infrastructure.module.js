"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WmsInfrastructureModule = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("@oes/common/constants");
const transport_1 = require("@oes/common/transport");
const tokens_1 = require("../common/constants/tokens");
const item_master_stockable_query_grpc_adapter_1 = require("../infrastructure/adapters/item-master-stockable-query.grpc.adapter");
const procurement_receiving_expectation_grpc_adapter_1 = require("../infrastructure/adapters/procurement-receiving-expectation.grpc.adapter");
const prisma_wms_audit_repository_1 = require("../infrastructure/audit/prisma-wms-audit.repository");
const prisma_module_1 = require("../infrastructure/prisma/prisma.module");
const prisma_inventory_repository_1 = require("../infrastructure/repositories/prisma/prisma-inventory.repository");
const prisma_receipt_repository_1 = require("../infrastructure/repositories/prisma/prisma-receipt.repository");
const prisma_warehouse_repository_1 = require("../infrastructure/repositories/prisma/prisma-warehouse.repository");
const prisma_wms_transaction_runner_1 = require("../infrastructure/transactions/prisma-wms-transaction-runner");
/** WmsInfrastructureModule wires the Prisma-backed persistence graph and downstream item and procurement lookup adapters. */
let WmsInfrastructureModule = class WmsInfrastructureModule {
};
exports.WmsInfrastructureModule = WmsInfrastructureModule;
exports.WmsInfrastructureModule = WmsInfrastructureModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, transport_1.GrpcTransportModule.forFeature([constants_1.SERVICE_NAMES.ITEM_MASTER, constants_1.SERVICE_NAMES.PROCUREMENT])],
        providers: [
            prisma_warehouse_repository_1.PrismaWarehouseRepository,
            prisma_receipt_repository_1.PrismaReceiptRepository,
            prisma_inventory_repository_1.PrismaInventoryRepository,
            prisma_wms_audit_repository_1.PrismaWmsAuditRepository,
            prisma_wms_transaction_runner_1.PrismaWmsTransactionRunner,
            item_master_stockable_query_grpc_adapter_1.ItemMasterStockableQueryGrpcAdapter,
            procurement_receiving_expectation_grpc_adapter_1.ProcurementReceivingExpectationGrpcAdapter,
            {
                provide: tokens_1.TOKENS.WAREHOUSE_REPOSITORY,
                useExisting: prisma_warehouse_repository_1.PrismaWarehouseRepository
            },
            {
                provide: tokens_1.TOKENS.RECEIPT_REPOSITORY,
                useExisting: prisma_receipt_repository_1.PrismaReceiptRepository
            },
            {
                provide: tokens_1.TOKENS.INVENTORY_REPOSITORY,
                useExisting: prisma_inventory_repository_1.PrismaInventoryRepository
            },
            {
                provide: tokens_1.TOKENS.WMS_AUDIT_WRITER,
                useExisting: prisma_wms_audit_repository_1.PrismaWmsAuditRepository
            },
            {
                provide: tokens_1.TOKENS.WMS_TRANSACTION_RUNNER,
                useExisting: prisma_wms_transaction_runner_1.PrismaWmsTransactionRunner
            },
            {
                provide: tokens_1.TOKENS.STOCKABLE_ITEM_LOOKUP_PORT,
                useExisting: item_master_stockable_query_grpc_adapter_1.ItemMasterStockableQueryGrpcAdapter
            },
            {
                provide: tokens_1.TOKENS.RECEIVING_EXPECTATION_LOOKUP_PORT,
                useExisting: procurement_receiving_expectation_grpc_adapter_1.ProcurementReceivingExpectationGrpcAdapter
            }
        ],
        exports: [
            prisma_module_1.PrismaModule,
            prisma_warehouse_repository_1.PrismaWarehouseRepository,
            prisma_receipt_repository_1.PrismaReceiptRepository,
            prisma_inventory_repository_1.PrismaInventoryRepository,
            prisma_wms_audit_repository_1.PrismaWmsAuditRepository,
            prisma_wms_transaction_runner_1.PrismaWmsTransactionRunner,
            item_master_stockable_query_grpc_adapter_1.ItemMasterStockableQueryGrpcAdapter,
            procurement_receiving_expectation_grpc_adapter_1.ProcurementReceivingExpectationGrpcAdapter,
            tokens_1.TOKENS.WAREHOUSE_REPOSITORY,
            tokens_1.TOKENS.RECEIPT_REPOSITORY,
            tokens_1.TOKENS.INVENTORY_REPOSITORY,
            tokens_1.TOKENS.WMS_AUDIT_WRITER,
            tokens_1.TOKENS.WMS_TRANSACTION_RUNNER,
            tokens_1.TOKENS.STOCKABLE_ITEM_LOOKUP_PORT,
            tokens_1.TOKENS.RECEIVING_EXPECTATION_LOOKUP_PORT
        ]
    })
], WmsInfrastructureModule);
//# sourceMappingURL=wms-infrastructure.module.js.map