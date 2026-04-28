"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmInfrastructureModule = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("@oes/common/constants");
const transport_1 = require("@oes/common/transport");
const tokens_1 = require("../common/constants/tokens");
const party_query_grpc_adapter_1 = require("../infrastructure/adapters/party-query-grpc.adapter");
const prisma_crm_audit_repository_1 = require("../infrastructure/audit/prisma-crm-audit.repository");
const prisma_module_1 = require("../infrastructure/prisma/prisma.module");
const prisma_customer_account_repository_1 = require("../infrastructure/repositories/prisma/prisma-customer-account.repository");
const prisma_customer_address_repository_1 = require("../infrastructure/repositories/prisma/prisma-customer-address.repository");
const prisma_customer_contact_repository_1 = require("../infrastructure/repositories/prisma/prisma-customer-contact.repository");
const prisma_crm_transaction_runner_1 = require("../infrastructure/transactions/prisma-crm-transaction-runner");
/** CrmInfrastructureModule wires the Prisma-backed persistence graph and downstream party lookup adapter. */
let CrmInfrastructureModule = class CrmInfrastructureModule {
};
exports.CrmInfrastructureModule = CrmInfrastructureModule;
exports.CrmInfrastructureModule = CrmInfrastructureModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, transport_1.GrpcTransportModule.forFeature([constants_1.SERVICE_NAMES.PARTY])],
        providers: [
            prisma_customer_account_repository_1.PrismaCustomerAccountRepository,
            prisma_customer_contact_repository_1.PrismaCustomerContactRepository,
            prisma_customer_address_repository_1.PrismaCustomerAddressRepository,
            prisma_crm_audit_repository_1.PrismaCrmAuditRepository,
            prisma_crm_transaction_runner_1.PrismaCrmTransactionRunner,
            party_query_grpc_adapter_1.PartyQueryGrpcAdapter,
            {
                provide: tokens_1.TOKENS.CUSTOMER_ACCOUNT_REPOSITORY,
                useExisting: prisma_customer_account_repository_1.PrismaCustomerAccountRepository
            },
            {
                provide: tokens_1.TOKENS.CUSTOMER_CONTACT_REPOSITORY,
                useExisting: prisma_customer_contact_repository_1.PrismaCustomerContactRepository
            },
            {
                provide: tokens_1.TOKENS.CUSTOMER_ADDRESS_REPOSITORY,
                useExisting: prisma_customer_address_repository_1.PrismaCustomerAddressRepository
            },
            {
                provide: tokens_1.TOKENS.CRM_AUDIT_WRITER,
                useExisting: prisma_crm_audit_repository_1.PrismaCrmAuditRepository
            },
            {
                provide: tokens_1.TOKENS.CRM_TRANSACTION_RUNNER,
                useExisting: prisma_crm_transaction_runner_1.PrismaCrmTransactionRunner
            },
            {
                provide: tokens_1.TOKENS.TENANT_PARTY_LOOKUP_PORT,
                useExisting: party_query_grpc_adapter_1.PartyQueryGrpcAdapter
            }
        ],
        exports: [
            prisma_module_1.PrismaModule,
            prisma_customer_account_repository_1.PrismaCustomerAccountRepository,
            prisma_customer_contact_repository_1.PrismaCustomerContactRepository,
            prisma_customer_address_repository_1.PrismaCustomerAddressRepository,
            prisma_crm_audit_repository_1.PrismaCrmAuditRepository,
            prisma_crm_transaction_runner_1.PrismaCrmTransactionRunner,
            party_query_grpc_adapter_1.PartyQueryGrpcAdapter,
            tokens_1.TOKENS.CUSTOMER_ACCOUNT_REPOSITORY,
            tokens_1.TOKENS.CUSTOMER_CONTACT_REPOSITORY,
            tokens_1.TOKENS.CUSTOMER_ADDRESS_REPOSITORY,
            tokens_1.TOKENS.CRM_AUDIT_WRITER,
            tokens_1.TOKENS.CRM_TRANSACTION_RUNNER,
            tokens_1.TOKENS.TENANT_PARTY_LOOKUP_PORT
        ]
    })
], CrmInfrastructureModule);
//# sourceMappingURL=crm-infrastructure.module.js.map