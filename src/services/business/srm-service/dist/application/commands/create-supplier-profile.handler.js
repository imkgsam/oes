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
exports.CreateSupplierProfileHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const srm_records_1 = require("../../domain/models/srm-records");
const srm_assertions_1 = require("../support/srm-assertions");
const create_supplier_profile_command_1 = require("./create-supplier-profile.command");
/** CreateSupplierProfileHandler creates one SRM supplier-profile shell without creating or mutating Party truth. */
let CreateSupplierProfileHandler = class CreateSupplierProfileHandler {
    constructor(profileRepository) {
        this.profileRepository = profileRepository;
    }
    async execute(command) {
        (0, srm_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, srm_assertions_1.assertRequiredString)(command.displayName, 'displayName');
        const profile = {
            id: (0, node_crypto_1.randomUUID)(),
            supplierNo: (0, srm_assertions_1.normalizeOptionalString)(command.supplierNo) ??
                (await this.profileRepository.nextSupplierProfileNo(command.tenantId)),
            tenantId: command.tenantId,
            displayName: command.displayName.trim(),
            status: srm_records_1.SupplierStatus.INACTIVE,
            supplierCategory: (0, srm_assertions_1.normalizeOptionalString)(command.supplierCategory) ?? null,
            tags: (0, srm_assertions_1.normalizeTags)(command.tags),
            partyBinding: null
        };
        return this.profileRepository.save(profile);
    }
};
exports.CreateSupplierProfileHandler = CreateSupplierProfileHandler;
exports.CreateSupplierProfileHandler = CreateSupplierProfileHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(create_supplier_profile_command_1.CreateSupplierProfileCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_PROFILE_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], CreateSupplierProfileHandler);
//# sourceMappingURL=create-supplier-profile.handler.js.map