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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BindCustomerAccountToTenantPartyHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const crm_errors_1 = require("../../common/errors/crm.errors");
const crm_records_1 = require("../../domain/models/crm-records");
const crm_assertions_1 = require("../support/crm-assertions");
const bind_customer_account_to_tenant_party_command_1 = require("./bind-customer-account-to-tenant-party.command");
/** BindCustomerAccountToTenantPartyHandler enforces the phase 1 single-active-primary-binding invariant. */
let BindCustomerAccountToTenantPartyHandler = class BindCustomerAccountToTenantPartyHandler {
    constructor(accountRepository, tenantPartyLookup) {
        this.accountRepository = accountRepository;
        this.tenantPartyLookup = tenantPartyLookup;
    }
    async execute(command) {
        (0, crm_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, crm_assertions_1.assertRequiredString)(command.customerAccountId, 'customerAccountId');
        (0, crm_assertions_1.assertRequiredString)(command.tenantPartyId, 'tenantPartyId');
        const account = await this.accountRepository.findById(command.tenantId, command.customerAccountId);
        if (!account) {
            throw exceptions_1.ExceptionFactory.application(crm_errors_1.CRM_NOT_FOUND, {
                resource: 'customerAccount',
                customerAccountId: command.customerAccountId
            });
        }
        const tenantParty = await this.tenantPartyLookup.getTenantPartyById(command.tenantId, command.tenantPartyId);
        if (!tenantParty) {
            throw exceptions_1.ExceptionFactory.application(crm_errors_1.CRM_NOT_FOUND, {
                resource: 'tenantParty',
                tenantPartyId: command.tenantPartyId
            });
        }
        if (tenantParty.status.trim().toUpperCase() !== 'ACTIVE') {
            throw exceptions_1.ExceptionFactory.application(crm_errors_1.CRM_FAILED_PRECONDITION, {
                reason: 'tenantParty is not bindable',
                tenantPartyId: command.tenantPartyId,
                tenantPartyStatus: tenantParty.status
            });
        }
        if (account.primaryBinding?.tenantPartyId === command.tenantPartyId) {
            return account;
        }
        if (account.primaryBinding) {
            throw exceptions_1.ExceptionFactory.application(crm_errors_1.CRM_FAILED_PRECONDITION, {
                reason: 'customer account already has a different active primary binding',
                customerAccountId: account.id
            });
        }
        const conflict = await this.accountRepository.findActiveByTenantPartyId(command.tenantId, command.tenantPartyId);
        if (conflict && conflict.id !== account.id) {
            throw exceptions_1.ExceptionFactory.application(crm_errors_1.CRM_ALREADY_EXISTS, {
                reason: 'tenantParty is already bound to another active customer account',
                tenantPartyId: command.tenantPartyId,
                customerAccountId: conflict.id
            });
        }
        account.primaryBinding = {
            customerPartyBindingId: (0, node_crypto_1.randomUUID)(),
            customerAccountId: account.id,
            tenantId: account.tenantId,
            tenantPartyId: command.tenantPartyId,
            bindingStatus: crm_records_1.CustomerPartyBindingStatus.ACTIVE_PRIMARY,
            partyDisplayName: tenantParty.partyDisplayName ?? null
        };
        return this.accountRepository.save(account);
    }
};
exports.BindCustomerAccountToTenantPartyHandler = BindCustomerAccountToTenantPartyHandler;
exports.BindCustomerAccountToTenantPartyHandler = BindCustomerAccountToTenantPartyHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(bind_customer_account_to_tenant_party_command_1.BindCustomerAccountToTenantPartyCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.TENANT_PARTY_LOOKUP_PORT)),
    __metadata("design:paramtypes", [Object, Object])
], BindCustomerAccountToTenantPartyHandler);
//# sourceMappingURL=bind-customer-account-to-tenant-party.handler.js.map