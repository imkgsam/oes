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
exports.UpdateCustomerAccountBasicsHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const crm_errors_1 = require("../../common/errors/crm.errors");
const crm_assertions_1 = require("../support/crm-assertions");
const update_customer_account_basics_command_1 = require("./update-customer-account-basics.command");
/** UpdateCustomerAccountBasicsHandler updates phase 1 CRM account-shell basics without touching status or binding. */
let UpdateCustomerAccountBasicsHandler = class UpdateCustomerAccountBasicsHandler {
    constructor(accountRepository) {
        this.accountRepository = accountRepository;
    }
    async execute(command) {
        (0, crm_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, crm_assertions_1.assertRequiredString)(command.customerAccountId, 'customerAccountId');
        const existing = await this.accountRepository.findById(command.tenantId, command.customerAccountId);
        if (!existing) {
            throw exceptions_1.ExceptionFactory.application(crm_errors_1.CRM_NOT_FOUND, {
                resource: 'customerAccount',
                customerAccountId: command.customerAccountId
            });
        }
        const displayName = (0, crm_assertions_1.normalizeOptionalString)(command.displayName);
        if (displayName) {
            existing.displayName = displayName;
        }
        if (command.customerCategory !== undefined) {
            existing.customerCategory = (0, crm_assertions_1.normalizeOptionalString)(command.customerCategory) ?? null;
        }
        if (command.tags !== undefined) {
            existing.tags = (0, crm_assertions_1.normalizeTags)(command.tags);
        }
        return this.accountRepository.save(existing);
    }
};
exports.UpdateCustomerAccountBasicsHandler = UpdateCustomerAccountBasicsHandler;
exports.UpdateCustomerAccountBasicsHandler = UpdateCustomerAccountBasicsHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(update_customer_account_basics_command_1.UpdateCustomerAccountBasicsCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], UpdateCustomerAccountBasicsHandler);
//# sourceMappingURL=update-customer-account-basics.handler.js.map