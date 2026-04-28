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
exports.UpsertCustomerContactHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const crm_errors_1 = require("../../common/errors/crm.errors");
const crm_assertions_1 = require("../support/crm-assertions");
const upsert_customer_contact_command_1 = require("./upsert-customer-contact.command");
/** UpsertCustomerContactHandler persists CRM business-contact records without turning them into Party truth. */
let UpsertCustomerContactHandler = class UpsertCustomerContactHandler {
    constructor(accountRepository, contactRepository) {
        this.accountRepository = accountRepository;
        this.contactRepository = contactRepository;
    }
    async execute(command) {
        (0, crm_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, crm_assertions_1.assertRequiredString)(command.customerAccountId, 'customerAccountId');
        (0, crm_assertions_1.assertRequiredString)(command.displayName, 'displayName');
        const account = await this.accountRepository.findById(command.tenantId, command.customerAccountId);
        if (!account) {
            throw exceptions_1.ExceptionFactory.application(crm_errors_1.CRM_NOT_FOUND, {
                resource: 'customerAccount',
                customerAccountId: command.customerAccountId
            });
        }
        if (command.customerContactId) {
            const existing = await this.contactRepository.findById(command.tenantId, command.customerAccountId, command.customerContactId);
            if (!existing) {
                throw exceptions_1.ExceptionFactory.application(crm_errors_1.CRM_NOT_FOUND, {
                    resource: 'customerContact',
                    customerContactId: command.customerContactId
                });
            }
            existing.displayName = command.displayName.trim();
            existing.roleTitle = (0, crm_assertions_1.normalizeOptionalString)(command.roleTitle) ?? null;
            existing.email = (0, crm_assertions_1.normalizeOptionalString)(command.email) ?? null;
            existing.phone = (0, crm_assertions_1.normalizeOptionalString)(command.phone) ?? null;
            existing.isPrimaryContact = command.isPrimaryContact ?? existing.isPrimaryContact;
            existing.isActive = command.isActive ?? existing.isActive;
            return this.contactRepository.save(existing);
        }
        return this.contactRepository.save({
            customerContactId: (0, node_crypto_1.randomUUID)(),
            tenantId: command.tenantId,
            customerAccountId: account.id,
            displayName: command.displayName.trim(),
            roleTitle: (0, crm_assertions_1.normalizeOptionalString)(command.roleTitle) ?? null,
            email: (0, crm_assertions_1.normalizeOptionalString)(command.email) ?? null,
            phone: (0, crm_assertions_1.normalizeOptionalString)(command.phone) ?? null,
            isPrimaryContact: command.isPrimaryContact ?? false,
            isActive: command.isActive ?? true
        });
    }
};
exports.UpsertCustomerContactHandler = UpsertCustomerContactHandler;
exports.UpsertCustomerContactHandler = UpsertCustomerContactHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(upsert_customer_contact_command_1.UpsertCustomerContactCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.CUSTOMER_CONTACT_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], UpsertCustomerContactHandler);
//# sourceMappingURL=upsert-customer-contact.handler.js.map