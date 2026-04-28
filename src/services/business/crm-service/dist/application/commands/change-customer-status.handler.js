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
exports.ChangeCustomerStatusHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const crm_errors_1 = require("../../common/errors/crm.errors");
const crm_assertions_1 = require("../support/crm-assertions");
const change_customer_status_command_1 = require("./change-customer-status.command");
/** ChangeCustomerStatusHandler updates only the CRM customer status while keeping binding ownership unchanged. */
let ChangeCustomerStatusHandler = class ChangeCustomerStatusHandler {
    constructor(accountRepository) {
        this.accountRepository = accountRepository;
    }
    async execute(command) {
        (0, crm_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, crm_assertions_1.assertRequiredString)(command.customerAccountId, 'customerAccountId');
        (0, crm_assertions_1.assertKnownCustomerStatus)(command.targetStatus);
        const account = await this.accountRepository.findById(command.tenantId, command.customerAccountId);
        if (!account) {
            throw exceptions_1.ExceptionFactory.application(crm_errors_1.CRM_NOT_FOUND, {
                resource: 'customerAccount',
                customerAccountId: command.customerAccountId
            });
        }
        account.status = command.targetStatus;
        return this.accountRepository.save(account);
    }
};
exports.ChangeCustomerStatusHandler = ChangeCustomerStatusHandler;
exports.ChangeCustomerStatusHandler = ChangeCustomerStatusHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(change_customer_status_command_1.ChangeCustomerStatusCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], ChangeCustomerStatusHandler);
//# sourceMappingURL=change-customer-status.handler.js.map