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
exports.BindSupplierToTenantPartyHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const srm_errors_1 = require("../../common/errors/srm.errors");
const srm_records_1 = require("../../domain/models/srm-records");
const srm_assertions_1 = require("../support/srm-assertions");
const bind_supplier_to_tenant_party_command_1 = require("./bind-supplier-to-tenant-party.command");
/** BindSupplierToTenantPartyHandler enforces the phase 1 single formal tenant-party binding invariant. */
let BindSupplierToTenantPartyHandler = class BindSupplierToTenantPartyHandler {
    constructor(profileRepository, tenantPartyLookup) {
        this.profileRepository = profileRepository;
        this.tenantPartyLookup = tenantPartyLookup;
    }
    async execute(command) {
        (0, srm_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, srm_assertions_1.assertRequiredString)(command.supplierId, 'supplierId');
        (0, srm_assertions_1.assertRequiredString)(command.tenantPartyId, 'tenantPartyId');
        const profile = await this.profileRepository.findById(command.tenantId, command.supplierId);
        if (!profile) {
            throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_NOT_FOUND, {
                resource: 'supplierProfile',
                supplierId: command.supplierId
            });
        }
        const tenantParty = await this.tenantPartyLookup.getTenantPartyById(command.tenantId, command.tenantPartyId);
        if (!tenantParty) {
            throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_NOT_FOUND, {
                resource: 'tenantParty',
                tenantPartyId: command.tenantPartyId
            });
        }
        if (profile.status === srm_records_1.SupplierStatus.ACTIVE && tenantParty.status.trim().toUpperCase() !== 'ACTIVE') {
            throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_FAILED_PRECONDITION, {
                reason: 'active supplier requires active tenantParty binding',
                tenantPartyId: command.tenantPartyId,
                tenantPartyStatus: tenantParty.status
            });
        }
        if (profile.partyBinding?.tenantPartyId === command.tenantPartyId) {
            return profile;
        }
        if (profile.partyBinding) {
            throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_FAILED_PRECONDITION, {
                reason: 'supplier profile already has a different formal binding',
                supplierId: profile.id
            });
        }
        const conflict = await this.profileRepository.findByTenantPartyId(command.tenantId, command.tenantPartyId);
        if (conflict && conflict.id !== profile.id) {
            throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_ALREADY_EXISTS, {
                reason: 'tenantParty is already bound to another supplier profile',
                tenantPartyId: command.tenantPartyId,
                supplierId: conflict.id
            });
        }
        profile.partyBinding = {
            supplierPartyBindingId: (0, node_crypto_1.randomUUID)(),
            supplierId: profile.id,
            tenantId: profile.tenantId,
            tenantPartyId: command.tenantPartyId,
            bindingStatus: srm_records_1.SupplierPartyBindingStatus.ACTIVE,
            partyDisplayName: tenantParty.partyDisplayName ?? null
        };
        return this.profileRepository.save(profile);
    }
};
exports.BindSupplierToTenantPartyHandler = BindSupplierToTenantPartyHandler;
exports.BindSupplierToTenantPartyHandler = BindSupplierToTenantPartyHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(bind_supplier_to_tenant_party_command_1.BindSupplierToTenantPartyCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_PROFILE_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.TENANT_PARTY_LOOKUP_PORT)),
    __metadata("design:paramtypes", [Object, Object])
], BindSupplierToTenantPartyHandler);
//# sourceMappingURL=bind-supplier-to-tenant-party.handler.js.map