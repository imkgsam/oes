"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaCrmRecordMapper = void 0;
const prisma_1 = require("../../../../prisma/generated/prisma");
const crm_records_1 = require("../../../domain/models/crm-records");
const customerAccountInclude = {
    primaryBinding: true
};
/** PrismaCrmRecordMapper translates Prisma CRM persistence rows into the frozen phase 1 record shapes. */
class PrismaCrmRecordMapper {
    /** customerAccountIncludeValue exposes the canonical include graph for account repository round-trips. */
    static customerAccountIncludeValue() {
        return customerAccountInclude;
    }
    /** toCustomerAccount converts one persisted CRM account and optional primary binding into the domain record shape. */
    static toCustomerAccount(record) {
        return {
            id: record.id,
            customerAccountNo: record.customerAccountNo,
            tenantId: record.tenantId,
            displayName: record.displayName,
            status: this.toDomainCustomerStatus(record.status),
            customerCategory: record.customerCategory,
            tags: this.fromJson(record.tags),
            primaryBinding: record.primaryBinding
                ? {
                    customerPartyBindingId: record.primaryBinding.id,
                    customerAccountId: record.primaryBinding.customerAccountId,
                    tenantId: record.primaryBinding.tenantId,
                    tenantPartyId: record.primaryBinding.tenantPartyId,
                    bindingStatus: record.primaryBinding.bindingStatus === prisma_1.CrmCustomerPartyBindingStatus.ACTIVE_PRIMARY
                        ? crm_records_1.CustomerPartyBindingStatus.ACTIVE_PRIMARY
                        : crm_records_1.CustomerPartyBindingStatus.ACTIVE_PRIMARY,
                    partyDisplayName: record.primaryBinding.partyDisplayName
                }
                : null
        };
    }
    /** toCustomerContact converts one persisted CRM contact row into the domain relationship record shape. */
    static toCustomerContact(record) {
        return {
            customerContactId: record.id,
            tenantId: record.tenantId,
            customerAccountId: record.customerAccountId,
            displayName: record.displayName,
            roleTitle: record.roleTitle,
            email: record.email,
            phone: record.phone,
            isPrimaryContact: record.isPrimaryContact,
            isActive: record.isActive
        };
    }
    /** toCustomerAddress converts one persisted CRM address row into the domain relationship record shape. */
    static toCustomerAddress(record) {
        return {
            customerAddressId: record.id,
            tenantId: record.tenantId,
            customerAccountId: record.customerAccountId,
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
    /** toPersistedCustomerStatus converts the CRM domain status enum into the Prisma enum value. */
    static toPersistedCustomerStatus(status) {
        if (status === crm_records_1.CustomerStatus.BLOCKED) {
            return prisma_1.CrmCustomerStatus.BLOCKED;
        }
        if (status === crm_records_1.CustomerStatus.ARCHIVED) {
            return prisma_1.CrmCustomerStatus.ARCHIVED;
        }
        return prisma_1.CrmCustomerStatus.ACTIVE_CUSTOMER;
    }
    /** toPersistedBindingStatus converts the CRM binding status enum into the Prisma enum value. */
    static toPersistedBindingStatus(status) {
        return status === crm_records_1.CustomerPartyBindingStatus.ACTIVE_PRIMARY
            ? prisma_1.CrmCustomerPartyBindingStatus.ACTIVE_PRIMARY
            : prisma_1.CrmCustomerPartyBindingStatus.ACTIVE_PRIMARY;
    }
    /** toInputJson deep-clones one plain CRM payload into a Prisma JSON input payload. */
    static toInputJson(value) {
        return structuredClone(value);
    }
    /** fromJson casts one stored JSON payload back into the snapshot shape used by the CRM records. */
    static fromJson(value) {
        return structuredClone(value);
    }
    /** toDomainCustomerStatus maps the persisted CRM status enum into the domain status enum. */
    static toDomainCustomerStatus(status) {
        if (status === prisma_1.CrmCustomerStatus.BLOCKED) {
            return crm_records_1.CustomerStatus.BLOCKED;
        }
        if (status === prisma_1.CrmCustomerStatus.ARCHIVED) {
            return crm_records_1.CustomerStatus.ARCHIVED;
        }
        return crm_records_1.CustomerStatus.ACTIVE_CUSTOMER;
    }
}
exports.PrismaCrmRecordMapper = PrismaCrmRecordMapper;
//# sourceMappingURL=prisma-crm-record.mapper.js.map