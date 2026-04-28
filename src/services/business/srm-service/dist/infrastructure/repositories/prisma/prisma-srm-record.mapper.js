"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaSrmRecordMapper = void 0;
const prisma_1 = require("../../../../prisma/generated/prisma");
const srm_records_1 = require("../../../domain/models/srm-records");
const supplierProfileInclude = {
    partyBinding: true
};
/** PrismaSrmRecordMapper translates Prisma SRM persistence rows into the frozen phase 1 record shapes. */
class PrismaSrmRecordMapper {
    /** supplierProfileIncludeValue exposes the canonical include graph for account repository round-trips. */
    static supplierProfileIncludeValue() {
        return supplierProfileInclude;
    }
    /** toSupplierProfile converts one persisted SRM account and optional primary binding into the domain record shape. */
    static toSupplierProfile(record) {
        return {
            id: record.id,
            supplierNo: record.supplierNo,
            tenantId: record.tenantId,
            displayName: record.displayName,
            status: this.toDomainSupplierStatus(record.status),
            supplierCategory: record.supplierCategory,
            tags: this.fromJson(record.tags),
            partyBinding: record.partyBinding
                ? {
                    supplierPartyBindingId: record.partyBinding.id,
                    supplierId: record.partyBinding.supplierId,
                    tenantId: record.partyBinding.tenantId,
                    tenantPartyId: record.partyBinding.tenantPartyId,
                    bindingStatus: srm_records_1.SupplierPartyBindingStatus.ACTIVE,
                    partyDisplayName: record.partyBinding.partyDisplayName
                }
                : null
        };
    }
    /** toSupplierContact converts one persisted SRM contact row into the domain relationship record shape. */
    static toSupplierContact(record) {
        return {
            supplierContactId: record.id,
            tenantId: record.tenantId,
            supplierId: record.supplierId,
            displayName: record.displayName,
            roleTitle: record.roleTitle,
            email: record.email,
            phone: record.phone,
            isPrimaryContact: record.isPrimaryContact,
            isActive: record.isActive
        };
    }
    /** toSupplierAddress converts one persisted SRM address row into the domain relationship record shape. */
    static toSupplierAddress(record) {
        return {
            supplierAddressId: record.id,
            tenantId: record.tenantId,
            supplierId: record.supplierId,
            label: record.label,
            countryCode: record.countryCode,
            region: record.region,
            locality: record.locality,
            addressLine1: record.addressLine1,
            addressLine2: record.addressLine2,
            postalCode: record.postalCode,
            isPrimaryAddress: record.isPrimaryAddress,
            isActive: record.isActive
        };
    }
    /** toSupplierOffering converts one persisted offering row into the current supplyability fact shape. */
    static toSupplierOffering(record) {
        return {
            supplierOfferingId: record.id,
            tenantId: record.tenantId,
            supplierId: record.supplierId,
            itemId: record.itemId,
            itemCode: record.itemCode,
            itemName: record.itemName,
            status: this.toDomainSupplierOfferingStatus(record.status)
        };
    }
    /** toPersistedSupplierStatus converts the SRM domain status enum into the Prisma enum value. */
    static toPersistedSupplierStatus(status) {
        return status === srm_records_1.SupplierStatus.INACTIVE ? prisma_1.SrmSupplierStatus.INACTIVE : prisma_1.SrmSupplierStatus.ACTIVE;
    }
    /** toPersistedBindingStatus converts the SRM binding status enum into the Prisma enum value. */
    static toPersistedBindingStatus(status) {
        return status === srm_records_1.SupplierPartyBindingStatus.ACTIVE
            ? prisma_1.SrmSupplierPartyBindingStatus.ACTIVE
            : prisma_1.SrmSupplierPartyBindingStatus.ACTIVE;
    }
    /** toPersistedSupplierOfferingStatus converts the offering fact status enum into the Prisma enum value. */
    static toPersistedSupplierOfferingStatus(status) {
        return status === srm_records_1.SupplierOfferingStatus.INACTIVE
            ? prisma_1.SrmSupplierOfferingStatus.INACTIVE
            : prisma_1.SrmSupplierOfferingStatus.ACTIVE;
    }
    /** toInputJson deep-clones one plain SRM payload into a Prisma JSON input payload. */
    static toInputJson(value) {
        return structuredClone(value);
    }
    /** fromJson casts one stored JSON payload back into the snapshot shape used by the SRM records. */
    static fromJson(value) {
        return structuredClone(value);
    }
    /** toDomainSupplierStatus maps the persisted SRM status enum into the domain status enum. */
    static toDomainSupplierStatus(status) {
        return status === prisma_1.SrmSupplierStatus.INACTIVE ? srm_records_1.SupplierStatus.INACTIVE : srm_records_1.SupplierStatus.ACTIVE;
    }
    /** toDomainSupplierOfferingStatus maps the persisted offering status into the minimal domain status set. */
    static toDomainSupplierOfferingStatus(status) {
        return status === prisma_1.SrmSupplierOfferingStatus.INACTIVE
            ? srm_records_1.SupplierOfferingStatus.INACTIVE
            : srm_records_1.SupplierOfferingStatus.ACTIVE;
    }
}
exports.PrismaSrmRecordMapper = PrismaSrmRecordMapper;
//# sourceMappingURL=prisma-srm-record.mapper.js.map