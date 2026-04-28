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
exports.UpdateSupplierProfileBasicsHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const srm_errors_1 = require("../../common/errors/srm.errors");
const srm_assertions_1 = require("../support/srm-assertions");
const update_supplier_profile_basics_command_1 = require("./update-supplier-profile-basics.command");
/** UpdateSupplierProfileBasicsHandler updates phase 1 SRM supplier-profile basics without touching status or binding. */
let UpdateSupplierProfileBasicsHandler = class UpdateSupplierProfileBasicsHandler {
    constructor(accountRepository) {
        this.accountRepository = accountRepository;
    }
    async execute(command) {
        (0, srm_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, srm_assertions_1.assertRequiredString)(command.supplierId, 'supplierId');
        const existing = await this.accountRepository.findById(command.tenantId, command.supplierId);
        if (!existing) {
            throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_NOT_FOUND, {
                resource: 'supplierProfile',
                supplierId: command.supplierId
            });
        }
        const displayName = (0, srm_assertions_1.normalizeOptionalString)(command.displayName);
        if (displayName) {
            existing.displayName = displayName;
        }
        const supplierNo = (0, srm_assertions_1.normalizeOptionalString)(command.supplierNo);
        if (supplierNo) {
            existing.supplierNo = supplierNo;
        }
        if (command.supplierCategory !== undefined) {
            existing.supplierCategory = (0, srm_assertions_1.normalizeOptionalString)(command.supplierCategory) ?? null;
        }
        if (command.tags !== undefined) {
            existing.tags = (0, srm_assertions_1.normalizeTags)(command.tags);
        }
        return this.accountRepository.save(existing);
    }
};
exports.UpdateSupplierProfileBasicsHandler = UpdateSupplierProfileBasicsHandler;
exports.UpdateSupplierProfileBasicsHandler = UpdateSupplierProfileBasicsHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(update_supplier_profile_basics_command_1.UpdateSupplierProfileBasicsCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_PROFILE_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], UpdateSupplierProfileBasicsHandler);
//# sourceMappingURL=update-supplier-profile-basics.handler.js.map