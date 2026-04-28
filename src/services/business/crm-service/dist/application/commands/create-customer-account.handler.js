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
exports.CreateCustomerAccountHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const crm_records_1 = require("../../domain/models/crm-records");
const crm_assertions_1 = require("../support/crm-assertions");
const create_customer_account_command_1 = require("./create-customer-account.command");
/** CreateCustomerAccountHandler creates one CRM customer-account shell without creating or mutating Party truth. */
let CreateCustomerAccountHandler = class CreateCustomerAccountHandler {
    constructor(accountRepository) {
        this.accountRepository = accountRepository;
    }
    async execute(command) {
        (0, crm_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, crm_assertions_1.assertRequiredString)(command.displayName, 'displayName');
        const account = {
            id: (0, node_crypto_1.randomUUID)(),
            customerAccountNo: await this.accountRepository.nextCustomerAccountNo(command.tenantId),
            tenantId: command.tenantId,
            displayName: command.displayName.trim(),
            status: crm_records_1.CustomerStatus.ACTIVE_CUSTOMER,
            customerCategory: (0, crm_assertions_1.normalizeOptionalString)(command.customerCategory) ?? null,
            tags: (0, crm_assertions_1.normalizeTags)(command.tags),
            primaryBinding: null
        };
        return this.accountRepository.save(account);
    }
};
exports.CreateCustomerAccountHandler = CreateCustomerAccountHandler;
exports.CreateCustomerAccountHandler = CreateCustomerAccountHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(create_customer_account_command_1.CreateCustomerAccountCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], CreateCustomerAccountHandler);
//# sourceMappingURL=create-customer-account.handler.js.map