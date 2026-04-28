"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierGrpcPresenter = void 0;
const srm_service_1 = require("@oes/common/generated/srm_service");
const srm_records_1 = require("../../domain/models/srm-records");
/** SupplierGrpcPresenter maps SRM domain records into the frozen phase 1 gRPC response shapes. */
class SupplierGrpcPresenter {
    /** toSupplierProfile renders one SRM supplier profile shell with its optional active tenant-party binding summary. */
    static toSupplierProfile(profile) {
        return {
            supplierId: profile.id,
            supplierNo: profile.supplierNo,
            tenantId: profile.tenantId,
            displayName: profile.displayName,
            status: toProtoSupplierStatus(profile.status),
            supplierCategory: profile.supplierCategory ?? '',
            tags: profile.tags,
            partyBinding: profile.partyBinding
                ? {
                    tenantPartyId: profile.partyBinding.tenantPartyId,
                    bindingStatus: profile.partyBinding.bindingStatus === srm_records_1.SupplierPartyBindingStatus.ACTIVE
                        ? srm_service_1.SupplierPartyBindingStatus.SUPPLIER_PARTY_BINDING_STATUS_ACTIVE
                        : srm_service_1.SupplierPartyBindingStatus.SUPPLIER_PARTY_BINDING_STATUS_UNSPECIFIED,
                    partyDisplayName: profile.partyBinding.partyDisplayName ?? ''
                }
                : undefined
        };
    }
    /** toSupplierContact renders one SRM business-contact collaboration record. */
    static toSupplierContact(contact) {
        return {
            supplierContactId: contact.supplierContactId,
            supplierId: contact.supplierId,
            displayName: contact.displayName,
            roleTitle: contact.roleTitle ?? '',
            email: contact.email ?? '',
            phone: contact.phone ?? '',
            isPrimaryContact: contact.isPrimaryContact,
            isActive: contact.isActive
        };
    }
    /** toSupplierAddress renders one SRM business-address collaboration record. */
    static toSupplierAddress(address) {
        return {
            supplierAddressId: address.supplierAddressId,
            supplierId: address.supplierId,
            label: address.label,
            countryCode: address.countryCode,
            region: address.region ?? '',
            locality: address.locality ?? '',
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 ?? '',
            postalCode: address.postalCode ?? '',
            isPrimaryAddress: address.isPrimaryAddress,
            isActive: address.isActive
        };
    }
    /** toSupplierOffering renders one current supplierId + itemId supplyability fact. */
    static toSupplierOffering(offering) {
        return {
            supplierOfferingId: offering.supplierOfferingId,
            supplierId: offering.supplierId,
            itemId: offering.itemId,
            itemCode: offering.itemCode ?? '',
            itemName: offering.itemName ?? '',
            status: toProtoSupplierOfferingStatus(offering.status)
        };
    }
    static toCreateSupplierProfileResponse(profile) {
        return {
            supplier: this.toSupplierProfile(profile)
        };
    }
    static toGetSupplierResponse(profile) {
        return {
            supplier: this.toSupplierProfile(profile)
        };
    }
    static toSearchSuppliersResponse(result) {
        return {
            suppliers: result.suppliers.map((profile) => this.toSupplierProfile(profile)),
            total: result.total,
            page: result.page,
            pageSize: result.pageSize
        };
    }
    static toListSupplierContactsResponse(result) {
        return {
            contacts: result.contacts.map((contact) => this.toSupplierContact(contact))
        };
    }
    static toListSupplierAddressesResponse(result) {
        return {
            addresses: result.addresses.map((address) => this.toSupplierAddress(address))
        };
    }
    static toListSupplierOfferingsBySupplierResponse(result) {
        return {
            offerings: result.offerings.map((offering) => this.toSupplierOffering(offering)),
            total: result.total,
            page: result.page,
            pageSize: result.pageSize
        };
    }
    static toListSupplierOfferingsByItemResponse(result) {
        return {
            offerings: result.offerings.map((offering) => this.toSupplierOffering(offering)),
            total: result.total,
            page: result.page,
            pageSize: result.pageSize
        };
    }
    static toUpdateSupplierProfileBasicsResponse(profile) {
        return {
            supplier: this.toSupplierProfile(profile)
        };
    }
    static toBindSupplierToTenantPartyResponse(profile) {
        return {
            supplier: this.toSupplierProfile(profile)
        };
    }
    static toUpsertSupplierContactResponse(contact) {
        return {
            contact: this.toSupplierContact(contact)
        };
    }
    static toUpsertSupplierAddressResponse(address) {
        return {
            address: this.toSupplierAddress(address)
        };
    }
    static toUpsertSupplierOfferingResponse(offering) {
        return {
            offering: this.toSupplierOffering(offering)
        };
    }
    static toChangeSupplierStatusResponse(profile) {
        return {
            supplier: this.toSupplierProfile(profile)
        };
    }
}
exports.SupplierGrpcPresenter = SupplierGrpcPresenter;
/** toProtoSupplierStatus maps the SRM domain status into the generated contract enum. */
function toProtoSupplierStatus(status) {
    return status === srm_records_1.SupplierStatus.INACTIVE
        ? srm_service_1.SupplierStatus.SUPPLIER_STATUS_INACTIVE
        : srm_service_1.SupplierStatus.SUPPLIER_STATUS_ACTIVE;
}
/** toProtoSupplierOfferingStatus maps the offering fact status into the generated contract enum. */
function toProtoSupplierOfferingStatus(status) {
    return status === srm_records_1.SupplierOfferingStatus.INACTIVE
        ? srm_service_1.SupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_INACTIVE
        : srm_service_1.SupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE;
}
//# sourceMappingURL=supplier-grpc.presenter.js.map