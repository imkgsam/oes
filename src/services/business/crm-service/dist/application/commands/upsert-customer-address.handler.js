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
exports.UpsertCustomerAddressHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const crm_errors_1 = require("../../common/errors/crm.errors");
const crm_assertions_1 = require("../support/crm-assertions");
const upsert_customer_address_command_1 = require("./upsert-customer-address.command");
/** UpsertCustomerAddressHandler persists CRM business-address records without claiming Party address truth. */
let UpsertCustomerAddressHandler = class UpsertCustomerAddressHandler {
    constructor(accountRepository, addressRepository) {
        this.accountRepository = accountRepository;
        this.addressRepository = addressRepository;
    }
    async execute(command) {
        (0, crm_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, crm_assertions_1.assertRequiredString)(command.customerAccountId, 'customerAccountId');
        (0, crm_assertions_1.assertRequiredString)(command.label, 'label');
        (0, crm_assertions_1.assertRequiredString)(command.countryCode, 'countryCode');
        (0, crm_assertions_1.assertRequiredString)(command.addressLine1, 'addressLine1');
        const account = await this.accountRepository.findById(command.tenantId, command.customerAccountId);
        if (!account) {
            throw exceptions_1.ExceptionFactory.application(crm_errors_1.CRM_NOT_FOUND, {
                resource: 'customerAccount',
                customerAccountId: command.customerAccountId
            });
        }
        if (command.customerAddressId) {
            const existing = await this.addressRepository.findById(command.tenantId, command.customerAccountId, command.customerAddressId);
            if (!existing) {
                throw exceptions_1.ExceptionFactory.application(crm_errors_1.CRM_NOT_FOUND, {
                    resource: 'customerAddress',
                    customerAddressId: command.customerAddressId
                });
            }
            existing.label = command.label.trim();
            existing.countryCode = command.countryCode.trim();
            existing.region = (0, crm_assertions_1.normalizeOptionalString)(command.region) ?? null;
            existing.locality = (0, crm_assertions_1.normalizeOptionalString)(command.locality) ?? null;
            existing.addressLine1 = command.addressLine1.trim();
            existing.addressLine2 = (0, crm_assertions_1.normalizeOptionalString)(command.addressLine2) ?? null;
            existing.postalCode = (0, crm_assertions_1.normalizeOptionalString)(command.postalCode) ?? null;
            existing.isPrimaryAddress = command.isPrimaryAddress ?? existing.isPrimaryAddress;
            existing.isActive = command.isActive ?? existing.isActive;
            return this.addressRepository.save(existing);
        }
        return this.addressRepository.save({
            customerAddressId: (0, node_crypto_1.randomUUID)(),
            tenantId: command.tenantId,
            customerAccountId: account.id,
            label: command.label.trim(),
            countryCode: command.countryCode.trim(),
            region: (0, crm_assertions_1.normalizeOptionalString)(command.region) ?? null,
            locality: (0, crm_assertions_1.normalizeOptionalString)(command.locality) ?? null,
            addressLine1: command.addressLine1.trim(),
            addressLine2: (0, crm_assertions_1.normalizeOptionalString)(command.addressLine2) ?? null,
            postalCode: (0, crm_assertions_1.normalizeOptionalString)(command.postalCode) ?? null,
            isPrimaryAddress: command.isPrimaryAddress ?? false,
            isActive: command.isActive ?? true
        });
    }
};
exports.UpsertCustomerAddressHandler = UpsertCustomerAddressHandler;
exports.UpsertCustomerAddressHandler = UpsertCustomerAddressHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(upsert_customer_address_command_1.UpsertCustomerAddressCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.CUSTOMER_ADDRESS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], UpsertCustomerAddressHandler);
//# sourceMappingURL=upsert-customer-address.handler.js.map