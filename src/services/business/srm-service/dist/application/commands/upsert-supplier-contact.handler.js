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
exports.UpsertSupplierContactHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const srm_errors_1 = require("../../common/errors/srm.errors");
const srm_assertions_1 = require("../support/srm-assertions");
const upsert_supplier_contact_command_1 = require("./upsert-supplier-contact.command");
/** UpsertSupplierContactHandler persists SRM business-contact records without turning them into Party truth. */
let UpsertSupplierContactHandler = class UpsertSupplierContactHandler {
    constructor(accountRepository, contactRepository) {
        this.accountRepository = accountRepository;
        this.contactRepository = contactRepository;
    }
    async execute(command) {
        (0, srm_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, srm_assertions_1.assertRequiredString)(command.supplierId, 'supplierId');
        (0, srm_assertions_1.assertRequiredString)(command.displayName, 'displayName');
        const account = await this.accountRepository.findById(command.tenantId, command.supplierId);
        if (!account) {
            throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_NOT_FOUND, {
                resource: 'supplierProfile',
                supplierId: command.supplierId
            });
        }
        if (command.supplierContactId) {
            const existing = await this.contactRepository.findById(command.tenantId, command.supplierId, command.supplierContactId);
            if (!existing) {
                throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_NOT_FOUND, {
                    resource: 'supplierContact',
                    supplierContactId: command.supplierContactId
                });
            }
            existing.displayName = command.displayName.trim();
            existing.roleTitle = (0, srm_assertions_1.normalizeOptionalString)(command.roleTitle) ?? null;
            existing.email = (0, srm_assertions_1.normalizeOptionalString)(command.email) ?? null;
            existing.phone = (0, srm_assertions_1.normalizeOptionalString)(command.phone) ?? null;
            existing.isPrimaryContact = command.isPrimaryContact ?? existing.isPrimaryContact;
            existing.isActive = command.isActive ?? existing.isActive;
            return this.contactRepository.save(existing);
        }
        return this.contactRepository.save({
            supplierContactId: (0, node_crypto_1.randomUUID)(),
            tenantId: command.tenantId,
            supplierId: account.id,
            displayName: command.displayName.trim(),
            roleTitle: (0, srm_assertions_1.normalizeOptionalString)(command.roleTitle) ?? null,
            email: (0, srm_assertions_1.normalizeOptionalString)(command.email) ?? null,
            phone: (0, srm_assertions_1.normalizeOptionalString)(command.phone) ?? null,
            isPrimaryContact: command.isPrimaryContact ?? false,
            isActive: command.isActive ?? true
        });
    }
};
exports.UpsertSupplierContactHandler = UpsertSupplierContactHandler;
exports.UpsertSupplierContactHandler = UpsertSupplierContactHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(upsert_supplier_contact_command_1.UpsertSupplierContactCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_PROFILE_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_CONTACT_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], UpsertSupplierContactHandler);
//# sourceMappingURL=upsert-supplier-contact.handler.js.map