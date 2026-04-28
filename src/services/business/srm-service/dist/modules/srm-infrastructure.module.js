"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SrmInfrastructureModule = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("@oes/common/constants");
const transport_1 = require("@oes/common/transport");
const tokens_1 = require("../common/constants/tokens");
const item_master_query_grpc_adapter_1 = require("../infrastructure/adapters/item-master-query-grpc.adapter");
const party_query_grpc_adapter_1 = require("../infrastructure/adapters/party-query-grpc.adapter");
const prisma_srm_audit_repository_1 = require("../infrastructure/audit/prisma-srm-audit.repository");
const prisma_module_1 = require("../infrastructure/prisma/prisma.module");
const prisma_supplier_offering_repository_1 = require("../infrastructure/repositories/prisma/prisma-supplier-offering.repository");
const prisma_supplier_profile_repository_1 = require("../infrastructure/repositories/prisma/prisma-supplier-profile.repository");
const prisma_supplier_address_repository_1 = require("../infrastructure/repositories/prisma/prisma-supplier-address.repository");
const prisma_supplier_contact_repository_1 = require("../infrastructure/repositories/prisma/prisma-supplier-contact.repository");
const prisma_srm_transaction_runner_1 = require("../infrastructure/transactions/prisma-srm-transaction-runner");
/** SrmInfrastructureModule wires the Prisma-backed persistence graph and downstream party lookup adapter. */
let SrmInfrastructureModule = class SrmInfrastructureModule {
};
exports.SrmInfrastructureModule = SrmInfrastructureModule;
exports.SrmInfrastructureModule = SrmInfrastructureModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, transport_1.GrpcTransportModule.forFeature([constants_1.SERVICE_NAMES.PARTY, constants_1.SERVICE_NAMES.ITEM_MASTER])],
        providers: [
            prisma_supplier_profile_repository_1.PrismaSupplierProfileRepository,
            prisma_supplier_contact_repository_1.PrismaSupplierContactRepository,
            prisma_supplier_address_repository_1.PrismaSupplierAddressRepository,
            prisma_supplier_offering_repository_1.PrismaSupplierOfferingRepository,
            prisma_srm_audit_repository_1.PrismaSrmAuditRepository,
            prisma_srm_transaction_runner_1.PrismaSrmTransactionRunner,
            party_query_grpc_adapter_1.PartyQueryGrpcAdapter,
            item_master_query_grpc_adapter_1.ItemMasterQueryGrpcAdapter,
            {
                provide: tokens_1.TOKENS.SUPPLIER_PROFILE_REPOSITORY,
                useExisting: prisma_supplier_profile_repository_1.PrismaSupplierProfileRepository
            },
            {
                provide: tokens_1.TOKENS.SUPPLIER_CONTACT_REPOSITORY,
                useExisting: prisma_supplier_contact_repository_1.PrismaSupplierContactRepository
            },
            {
                provide: tokens_1.TOKENS.SUPPLIER_ADDRESS_REPOSITORY,
                useExisting: prisma_supplier_address_repository_1.PrismaSupplierAddressRepository
            },
            {
                provide: tokens_1.TOKENS.SUPPLIER_OFFERING_REPOSITORY,
                useExisting: prisma_supplier_offering_repository_1.PrismaSupplierOfferingRepository
            },
            {
                provide: tokens_1.TOKENS.SRM_AUDIT_WRITER,
                useExisting: prisma_srm_audit_repository_1.PrismaSrmAuditRepository
            },
            {
                provide: tokens_1.TOKENS.SRM_TRANSACTION_RUNNER,
                useExisting: prisma_srm_transaction_runner_1.PrismaSrmTransactionRunner
            },
            {
                provide: tokens_1.TOKENS.TENANT_PARTY_LOOKUP_PORT,
                useExisting: party_query_grpc_adapter_1.PartyQueryGrpcAdapter
            },
            {
                provide: tokens_1.TOKENS.ITEM_LOOKUP_PORT,
                useExisting: item_master_query_grpc_adapter_1.ItemMasterQueryGrpcAdapter
            }
        ],
        exports: [
            prisma_module_1.PrismaModule,
            prisma_supplier_profile_repository_1.PrismaSupplierProfileRepository,
            prisma_supplier_contact_repository_1.PrismaSupplierContactRepository,
            prisma_supplier_address_repository_1.PrismaSupplierAddressRepository,
            prisma_supplier_offering_repository_1.PrismaSupplierOfferingRepository,
            prisma_srm_audit_repository_1.PrismaSrmAuditRepository,
            prisma_srm_transaction_runner_1.PrismaSrmTransactionRunner,
            party_query_grpc_adapter_1.PartyQueryGrpcAdapter,
            item_master_query_grpc_adapter_1.ItemMasterQueryGrpcAdapter,
            tokens_1.TOKENS.SUPPLIER_PROFILE_REPOSITORY,
            tokens_1.TOKENS.SUPPLIER_CONTACT_REPOSITORY,
            tokens_1.TOKENS.SUPPLIER_ADDRESS_REPOSITORY,
            tokens_1.TOKENS.SUPPLIER_OFFERING_REPOSITORY,
            tokens_1.TOKENS.SRM_AUDIT_WRITER,
            tokens_1.TOKENS.SRM_TRANSACTION_RUNNER,
            tokens_1.TOKENS.TENANT_PARTY_LOOKUP_PORT,
            tokens_1.TOKENS.ITEM_LOOKUP_PORT
        ]
    })
], SrmInfrastructureModule);
//# sourceMappingURL=srm-infrastructure.module.js.map