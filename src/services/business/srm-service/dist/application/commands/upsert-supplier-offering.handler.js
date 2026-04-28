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
exports.UpsertSupplierOfferingHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const srm_errors_1 = require("../../common/errors/srm.errors");
const srm_records_1 = require("../../domain/models/srm-records");
const srm_assertions_1 = require("../support/srm-assertions");
const upsert_supplier_offering_command_1 = require("./upsert-supplier-offering.command");
/** UpsertSupplierOfferingHandler keeps exactly one current supplierId + itemId supplyability fact per tenant. */
let UpsertSupplierOfferingHandler = class UpsertSupplierOfferingHandler {
    constructor(profileRepository, offeringRepository, itemLookup) {
        this.profileRepository = profileRepository;
        this.offeringRepository = offeringRepository;
        this.itemLookup = itemLookup;
    }
    async execute(command) {
        (0, srm_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, srm_assertions_1.assertRequiredString)(command.supplierId, 'supplierId');
        (0, srm_assertions_1.assertRequiredString)(command.itemId, 'itemId');
        (0, srm_assertions_1.assertKnownSupplierOfferingStatus)(command.targetStatus);
        const supplier = await this.profileRepository.findById(command.tenantId, command.supplierId);
        if (!supplier) {
            throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_NOT_FOUND, {
                resource: 'supplierProfile',
                supplierId: command.supplierId
            });
        }
        const item = await this.itemLookup.getItemById(command.tenantId, command.itemId);
        if (!item) {
            throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_NOT_FOUND, {
                resource: 'item',
                itemId: command.itemId
            });
        }
        if (command.targetStatus === srm_records_1.SupplierOfferingStatus.ACTIVE) {
            if (supplier.status !== srm_records_1.SupplierStatus.ACTIVE) {
                throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_FAILED_PRECONDITION, {
                    reason: 'active offering requires active supplier',
                    supplierId: supplier.id
                });
            }
            if (!item.purchasable) {
                throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_FAILED_PRECONDITION, {
                    reason: 'active offering requires purchasable item',
                    itemId: item.itemId
                });
            }
        }
        let existing = null;
        if (command.supplierOfferingId) {
            existing = await this.offeringRepository.findById(command.tenantId, command.supplierOfferingId);
            if (!existing) {
                throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_NOT_FOUND, {
                    resource: 'supplierOffering',
                    supplierOfferingId: command.supplierOfferingId
                });
            }
            if (existing.supplierId !== command.supplierId || existing.itemId !== command.itemId) {
                throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_FAILED_PRECONDITION, {
                    reason: 'supplier offering cannot be rebound to a different supplier or item',
                    supplierOfferingId: existing.supplierOfferingId
                });
            }
        }
        else {
            existing = await this.offeringRepository.findBySupplierAndItem(command.tenantId, command.supplierId, command.itemId);
        }
        const offering = existing ?? {
            supplierOfferingId: (0, node_crypto_1.randomUUID)(),
            tenantId: command.tenantId,
            supplierId: command.supplierId,
            itemId: command.itemId,
            itemCode: null,
            itemName: null,
            status: srm_records_1.SupplierOfferingStatus.INACTIVE
        };
        offering.itemCode = item.itemCode;
        offering.itemName = item.itemName;
        offering.status = command.targetStatus;
        return this.offeringRepository.save(offering);
    }
};
exports.UpsertSupplierOfferingHandler = UpsertSupplierOfferingHandler;
exports.UpsertSupplierOfferingHandler = UpsertSupplierOfferingHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(upsert_supplier_offering_command_1.UpsertSupplierOfferingCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_PROFILE_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_OFFERING_REPOSITORY)),
    __param(2, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_LOOKUP_PORT)),
    __metadata("design:paramtypes", [Object, Object, Object])
], UpsertSupplierOfferingHandler);
//# sourceMappingURL=upsert-supplier-offering.handler.js.map