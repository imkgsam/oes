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
exports.ChangeSupplierStatusHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const srm_errors_1 = require("../../common/errors/srm.errors");
const srm_records_1 = require("../../domain/models/srm-records");
const srm_assertions_1 = require("../support/srm-assertions");
const change_supplier_status_command_1 = require("./change-supplier-status.command");
/** ChangeSupplierStatusHandler updates only the SRM supplier status while keeping binding ownership unchanged. */
let ChangeSupplierStatusHandler = class ChangeSupplierStatusHandler {
    constructor(profileRepository, offeringRepository, tenantPartyLookup) {
        this.profileRepository = profileRepository;
        this.offeringRepository = offeringRepository;
        this.tenantPartyLookup = tenantPartyLookup;
    }
    async execute(command) {
        (0, srm_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, srm_assertions_1.assertRequiredString)(command.supplierId, 'supplierId');
        (0, srm_assertions_1.assertKnownSupplierStatus)(command.targetStatus);
        const profile = await this.profileRepository.findById(command.tenantId, command.supplierId);
        if (!profile) {
            throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_NOT_FOUND, {
                resource: 'supplierProfile',
                supplierId: command.supplierId
            });
        }
        if (profile.status === command.targetStatus) {
            return profile;
        }
        if (command.targetStatus === srm_records_1.SupplierStatus.ACTIVE) {
            if (!profile.partyBinding?.tenantPartyId) {
                throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_FAILED_PRECONDITION, {
                    reason: 'active supplier requires tenantParty binding',
                    supplierId: profile.id
                });
            }
            const tenantParty = await this.tenantPartyLookup.getTenantPartyById(command.tenantId, profile.partyBinding.tenantPartyId);
            if (!tenantParty || tenantParty.status.trim().toUpperCase() !== 'ACTIVE') {
                throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_FAILED_PRECONDITION, {
                    reason: 'active supplier requires active tenantParty binding',
                    supplierId: profile.id,
                    tenantPartyId: profile.partyBinding.tenantPartyId
                });
            }
        }
        if (command.targetStatus === srm_records_1.SupplierStatus.INACTIVE) {
            const hasActiveOfferings = await this.offeringRepository.hasActiveBySupplierId(command.tenantId, profile.id);
            if (hasActiveOfferings) {
                throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_FAILED_PRECONDITION, {
                    reason: 'inactive supplier cannot keep active offerings',
                    supplierId: profile.id
                });
            }
        }
        profile.status = command.targetStatus;
        return this.profileRepository.save(profile);
    }
};
exports.ChangeSupplierStatusHandler = ChangeSupplierStatusHandler;
exports.ChangeSupplierStatusHandler = ChangeSupplierStatusHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(change_supplier_status_command_1.ChangeSupplierStatusCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_PROFILE_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_OFFERING_REPOSITORY)),
    __param(2, (0, common_1.Inject)(tokens_1.TOKENS.TENANT_PARTY_LOOKUP_PORT)),
    __metadata("design:paramtypes", [Object, Object, Object])
], ChangeSupplierStatusHandler);
//# sourceMappingURL=change-supplier-status.handler.js.map