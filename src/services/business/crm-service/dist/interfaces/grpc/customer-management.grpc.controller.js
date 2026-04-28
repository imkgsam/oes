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
exports.CustomerManagementGrpcController = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@oes/common/cqrs");
const filters_1 = require("@oes/common/filters");
const crm_service_1 = require("@oes/common/generated/crm_service");
const bind_customer_account_to_tenant_party_command_1 = require("../../application/commands/bind-customer-account-to-tenant-party.command");
const change_customer_status_command_1 = require("../../application/commands/change-customer-status.command");
const create_customer_account_command_1 = require("../../application/commands/create-customer-account.command");
const update_customer_account_basics_command_1 = require("../../application/commands/update-customer-account-basics.command");
const upsert_customer_address_command_1 = require("../../application/commands/upsert-customer-address.command");
const upsert_customer_contact_command_1 = require("../../application/commands/upsert-customer-contact.command");
const crm_audit_service_1 = require("../../application/services/crm-audit.service");
const crm_assertions_1 = require("../../application/support/crm-assertions");
const crm_records_1 = require("../../domain/models/crm-records");
const customer_grpc_presenter_1 = require("./customer-grpc.presenter");
const customer_rpc_context_validator_1 = require("./customer-rpc-context.validator");
/** CustomerManagementGrpcController exposes the CRM phase 1 command contract with local audit envelope recording. */
let CustomerManagementGrpcController = class CustomerManagementGrpcController {
    constructor(commandBus, auditService) {
        this.commandBus = commandBus;
        this.auditService = auditService;
    }
    async createCustomerAccount(request) {
        const context = customer_rpc_context_validator_1.CustomerRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'CreateCustomerAccount',
            resourceType: 'customer_account',
            targetId: null,
            requestSummary: {
                displayName: request.displayName ?? '',
                tagCount: request.tags?.length ?? 0
            }
        }, async () => {
            const account = await this.commandBus.execute(new create_customer_account_command_1.CreateCustomerAccountCommand({
                tenantId: request.tenantId ?? '',
                displayName: request.displayName ?? '',
                customerCategory: (0, crm_assertions_1.normalizeOptionalString)(request.customerCategory),
                tags: request.tags ?? []
            }));
            return customer_grpc_presenter_1.CustomerGrpcPresenter.toCreateCustomerAccountResponse(account);
        });
    }
    async updateCustomerAccountBasics(request) {
        const context = customer_rpc_context_validator_1.CustomerRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'UpdateCustomerAccountBasics',
            resourceType: 'customer_account',
            targetId: request.customerAccountId ?? null,
            requestSummary: {
                customerAccountId: request.customerAccountId ?? ''
            }
        }, async () => {
            const account = await this.commandBus.execute(new update_customer_account_basics_command_1.UpdateCustomerAccountBasicsCommand({
                tenantId: request.tenantId ?? '',
                customerAccountId: request.customerAccountId ?? '',
                displayName: (0, crm_assertions_1.normalizeOptionalString)(request.displayName),
                customerCategory: request.customerCategory !== undefined
                    ? (0, crm_assertions_1.normalizeOptionalString)(request.customerCategory) ?? ''
                    : undefined,
                tags: request.tags
            }));
            return customer_grpc_presenter_1.CustomerGrpcPresenter.toUpdateCustomerAccountBasicsResponse(account);
        });
    }
    async bindCustomerAccountToTenantParty(request) {
        const context = customer_rpc_context_validator_1.CustomerRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'BindCustomerAccountToTenantParty',
            resourceType: 'customer_party_binding',
            targetId: request.customerAccountId ?? null,
            requestSummary: {
                customerAccountId: request.customerAccountId ?? '',
                tenantPartyId: request.tenantPartyId ?? ''
            }
        }, async () => {
            const account = await this.commandBus.execute(new bind_customer_account_to_tenant_party_command_1.BindCustomerAccountToTenantPartyCommand({
                tenantId: request.tenantId ?? '',
                customerAccountId: request.customerAccountId ?? '',
                tenantPartyId: request.tenantPartyId ?? ''
            }));
            return customer_grpc_presenter_1.CustomerGrpcPresenter.toBindCustomerAccountToTenantPartyResponse(account);
        });
    }
    async upsertCustomerContact(request) {
        const context = customer_rpc_context_validator_1.CustomerRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'UpsertCustomerContact',
            resourceType: 'customer_contact',
            targetId: request.customerContactId ?? request.customerAccountId ?? null,
            requestSummary: {
                customerAccountId: request.customerAccountId ?? '',
                customerContactId: request.customerContactId ?? ''
            }
        }, async () => {
            const contact = await this.commandBus.execute(new upsert_customer_contact_command_1.UpsertCustomerContactCommand({
                tenantId: request.tenantId ?? '',
                customerAccountId: request.customerAccountId ?? '',
                customerContactId: (0, crm_assertions_1.normalizeOptionalString)(request.customerContactId),
                displayName: request.displayName ?? '',
                roleTitle: (0, crm_assertions_1.normalizeOptionalString)(request.roleTitle),
                email: (0, crm_assertions_1.normalizeOptionalString)(request.email),
                phone: (0, crm_assertions_1.normalizeOptionalString)(request.phone),
                isPrimaryContact: request.isPrimaryContact,
                isActive: request.isActive
            }));
            return customer_grpc_presenter_1.CustomerGrpcPresenter.toUpsertCustomerContactResponse(contact);
        });
    }
    async upsertCustomerAddress(request) {
        const context = customer_rpc_context_validator_1.CustomerRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'UpsertCustomerAddress',
            resourceType: 'customer_address',
            targetId: request.customerAddressId ?? request.customerAccountId ?? null,
            requestSummary: {
                customerAccountId: request.customerAccountId ?? '',
                customerAddressId: request.customerAddressId ?? ''
            }
        }, async () => {
            const address = await this.commandBus.execute(new upsert_customer_address_command_1.UpsertCustomerAddressCommand({
                tenantId: request.tenantId ?? '',
                customerAccountId: request.customerAccountId ?? '',
                customerAddressId: (0, crm_assertions_1.normalizeOptionalString)(request.customerAddressId),
                label: request.label ?? '',
                countryCode: request.countryCode ?? '',
                region: (0, crm_assertions_1.normalizeOptionalString)(request.region),
                locality: (0, crm_assertions_1.normalizeOptionalString)(request.locality),
                addressLine1: request.addressLine1 ?? '',
                addressLine2: (0, crm_assertions_1.normalizeOptionalString)(request.addressLine2),
                postalCode: (0, crm_assertions_1.normalizeOptionalString)(request.postalCode),
                isPrimaryAddress: request.isPrimaryAddress,
                isActive: request.isActive
            }));
            return customer_grpc_presenter_1.CustomerGrpcPresenter.toUpsertCustomerAddressResponse(address);
        });
    }
    async changeCustomerStatus(request) {
        const context = customer_rpc_context_validator_1.CustomerRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'ChangeCustomerStatus',
            resourceType: 'customer_account',
            targetId: request.customerAccountId ?? null,
            requestSummary: {
                customerAccountId: request.customerAccountId ?? '',
                targetStatus: request.targetStatus ?? 0
            }
        }, async () => {
            const account = await this.commandBus.execute(new change_customer_status_command_1.ChangeCustomerStatusCommand({
                tenantId: request.tenantId ?? '',
                customerAccountId: request.customerAccountId ?? '',
                targetStatus: toDomainCustomerStatus(request.targetStatus)
            }));
            return customer_grpc_presenter_1.CustomerGrpcPresenter.toChangeCustomerStatusResponse(account);
        });
    }
};
exports.CustomerManagementGrpcController = CustomerManagementGrpcController;
exports.CustomerManagementGrpcController = CustomerManagementGrpcController = __decorate([
    (0, common_1.UseFilters)(filters_1.GrpcExceptionFilter),
    (0, common_1.Controller)(),
    (0, crm_service_1.CustomerManagementServiceControllerMethods)(),
    __metadata("design:paramtypes", [cqrs_1.ValidatingCommandBus,
        crm_audit_service_1.CrmAuditService])
], CustomerManagementGrpcController);
/** toDomainCustomerStatus maps the generated CRM status enum into the frozen domain status set. */
function toDomainCustomerStatus(value) {
    if (value === crm_service_1.CustomerStatus.CUSTOMER_STATUS_BLOCKED) {
        return crm_records_1.CustomerStatus.BLOCKED;
    }
    if (value === crm_service_1.CustomerStatus.CUSTOMER_STATUS_ARCHIVED) {
        return crm_records_1.CustomerStatus.ARCHIVED;
    }
    return crm_records_1.CustomerStatus.ACTIVE_CUSTOMER;
}
//# sourceMappingURL=customer-management.grpc.controller.js.map