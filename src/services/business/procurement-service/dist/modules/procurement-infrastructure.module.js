"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementInfrastructureModule = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("@oes/common/constants");
const transport_1 = require("@oes/common/transport");
const tokens_1 = require("../common/constants/tokens");
const item_master_query_grpc_adapter_1 = require("../infrastructure/adapters/item-master-query.grpc.adapter");
const supplier_query_grpc_adapter_1 = require("../infrastructure/adapters/supplier-query.grpc.adapter");
const prisma_procurement_audit_repository_1 = require("../infrastructure/audit/prisma-procurement-audit.repository");
const prisma_module_1 = require("../infrastructure/prisma/prisma.module");
const prisma_purchase_order_repository_1 = require("../infrastructure/repositories/prisma/prisma-purchase-order.repository");
const prisma_purchase_request_repository_1 = require("../infrastructure/repositories/prisma/prisma-purchase-request.repository");
const prisma_receiving_repository_1 = require("../infrastructure/repositories/prisma/prisma-receiving.repository");
const prisma_procurement_transaction_runner_1 = require("../infrastructure/transactions/prisma-procurement-transaction-runner");
/** ProcurementInfrastructureModule wires the Prisma-backed persistence graph and downstream item SRM lookup adapters. */
let ProcurementInfrastructureModule = class ProcurementInfrastructureModule {
};
exports.ProcurementInfrastructureModule = ProcurementInfrastructureModule;
exports.ProcurementInfrastructureModule = ProcurementInfrastructureModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, transport_1.GrpcTransportModule.forFeature([constants_1.SERVICE_NAMES.ITEM_MASTER, constants_1.SERVICE_NAMES.SRM])],
        providers: [
            prisma_purchase_request_repository_1.PrismaPurchaseRequestRepository,
            prisma_purchase_order_repository_1.PrismaPurchaseOrderRepository,
            prisma_receiving_repository_1.PrismaReceivingRepository,
            prisma_procurement_audit_repository_1.PrismaProcurementAuditRepository,
            prisma_procurement_transaction_runner_1.PrismaProcurementTransactionRunner,
            item_master_query_grpc_adapter_1.ItemMasterQueryGrpcAdapter,
            supplier_query_grpc_adapter_1.SupplierQueryGrpcAdapter,
            {
                provide: tokens_1.TOKENS.PURCHASE_REQUEST_REPOSITORY,
                useExisting: prisma_purchase_request_repository_1.PrismaPurchaseRequestRepository
            },
            {
                provide: tokens_1.TOKENS.PURCHASE_ORDER_REPOSITORY,
                useExisting: prisma_purchase_order_repository_1.PrismaPurchaseOrderRepository
            },
            {
                provide: tokens_1.TOKENS.RECEIVING_REPOSITORY,
                useExisting: prisma_receiving_repository_1.PrismaReceivingRepository
            },
            {
                provide: tokens_1.TOKENS.PROCUREMENT_AUDIT_WRITER,
                useExisting: prisma_procurement_audit_repository_1.PrismaProcurementAuditRepository
            },
            {
                provide: tokens_1.TOKENS.PROCUREMENT_TRANSACTION_RUNNER,
                useExisting: prisma_procurement_transaction_runner_1.PrismaProcurementTransactionRunner
            },
            {
                provide: tokens_1.TOKENS.ITEM_REFERENCE_LOOKUP_PORT,
                useExisting: item_master_query_grpc_adapter_1.ItemMasterQueryGrpcAdapter
            },
            {
                provide: tokens_1.TOKENS.SUPPLIER_REFERENCE_LOOKUP_PORT,
                useExisting: supplier_query_grpc_adapter_1.SupplierQueryGrpcAdapter
            }
        ],
        exports: [
            prisma_module_1.PrismaModule,
            prisma_purchase_request_repository_1.PrismaPurchaseRequestRepository,
            prisma_purchase_order_repository_1.PrismaPurchaseOrderRepository,
            prisma_receiving_repository_1.PrismaReceivingRepository,
            prisma_procurement_audit_repository_1.PrismaProcurementAuditRepository,
            prisma_procurement_transaction_runner_1.PrismaProcurementTransactionRunner,
            item_master_query_grpc_adapter_1.ItemMasterQueryGrpcAdapter,
            supplier_query_grpc_adapter_1.SupplierQueryGrpcAdapter,
            tokens_1.TOKENS.PURCHASE_REQUEST_REPOSITORY,
            tokens_1.TOKENS.PURCHASE_ORDER_REPOSITORY,
            tokens_1.TOKENS.RECEIVING_REPOSITORY,
            tokens_1.TOKENS.PROCUREMENT_AUDIT_WRITER,
            tokens_1.TOKENS.PROCUREMENT_TRANSACTION_RUNNER,
            tokens_1.TOKENS.ITEM_REFERENCE_LOOKUP_PORT,
            tokens_1.TOKENS.SUPPLIER_REFERENCE_LOOKUP_PORT
        ]
    })
], ProcurementInfrastructureModule);
//# sourceMappingURL=procurement-infrastructure.module.js.map