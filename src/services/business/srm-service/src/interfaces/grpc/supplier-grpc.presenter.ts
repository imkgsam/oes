import {
  BindSupplierToTenantPartyResponse,
  ChangeSupplierStatusResponse,
  CreateSupplierProfileResponse,
  GetSupplierResponse,
  ListSupplierAddressesResponse,
  ListSupplierContactsResponse,
  ListSupplierOfferingsByItemResponse,
  ListSupplierOfferingsBySupplierResponse,
  SearchSuppliersResponse,
  SupplierAddress,
  SupplierOffering,
  SupplierOfferingStatus as ProtoSupplierOfferingStatus,
  SupplierPartyBindingStatus as ProtoSupplierPartyBindingStatus,
  SupplierProfile,
  SupplierStatus as ProtoSupplierStatus,
  UpsertSupplierAddressResponse,
  UpsertSupplierContactResponse,
  UpsertSupplierOfferingResponse,
  UpdateSupplierProfileBasicsResponse
} from '@oes/common/generated/srm_service'
import {
  SupplierAddressRecord,
  SupplierContactRecord,
  SupplierOfferingRecord,
  SupplierOfferingStatus,
  SupplierPartyBindingStatus,
  SupplierProfileRecord,
  SupplierStatus
} from '../../domain/models/srm-records'
import { ListSupplierAddressesResult } from '../../application/queries/list-supplier-addresses.handler'
import { ListSupplierContactsResult } from '../../application/queries/list-supplier-contacts.handler'
import { ListSupplierOfferingsByItemResult } from '../../application/queries/list-supplier-offerings-by-item.handler'
import { ListSupplierOfferingsBySupplierResult } from '../../application/queries/list-supplier-offerings-by-supplier.handler'
import { SearchSuppliersResult } from '../../application/queries/search-suppliers.handler'

/** SupplierGrpcPresenter maps SRM domain records into the frozen phase 1 gRPC response shapes. */
export class SupplierGrpcPresenter {
  /** toSupplierProfile renders one SRM supplier profile shell with its optional active tenant-party binding summary. */
  static toSupplierProfile(profile: SupplierProfileRecord): SupplierProfile {
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
            bindingStatus:
              profile.partyBinding.bindingStatus === SupplierPartyBindingStatus.ACTIVE
                ? ProtoSupplierPartyBindingStatus.SUPPLIER_PARTY_BINDING_STATUS_ACTIVE
                : ProtoSupplierPartyBindingStatus.SUPPLIER_PARTY_BINDING_STATUS_UNSPECIFIED,
            partyDisplayName: profile.partyBinding.partyDisplayName ?? ''
          }
        : undefined
    }
  }

  /** toSupplierContact renders one SRM business-contact collaboration record. */
  static toSupplierContact(contact: SupplierContactRecord) {
    return {
      supplierContactId: contact.supplierContactId,
      supplierId: contact.supplierId,
      displayName: contact.displayName,
      roleTitle: contact.roleTitle ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      isPrimaryContact: contact.isPrimaryContact,
      isActive: contact.isActive
    }
  }

  /** toSupplierAddress renders one SRM business-address collaboration record. */
  static toSupplierAddress(address: SupplierAddressRecord): SupplierAddress {
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
    }
  }

  /** toSupplierOffering renders one current supplierId + itemId supplyability fact. */
  static toSupplierOffering(offering: SupplierOfferingRecord): SupplierOffering {
    return {
      supplierOfferingId: offering.supplierOfferingId,
      supplierId: offering.supplierId,
      itemId: offering.itemId,
      itemCode: offering.itemCode ?? '',
      itemName: offering.itemName ?? '',
      status: toProtoSupplierOfferingStatus(offering.status)
    }
  }

  static toCreateSupplierProfileResponse(profile: SupplierProfileRecord): CreateSupplierProfileResponse {
    return {
      supplier: this.toSupplierProfile(profile)
    }
  }

  static toGetSupplierResponse(profile: SupplierProfileRecord): GetSupplierResponse {
    return {
      supplier: this.toSupplierProfile(profile)
    }
  }

  static toSearchSuppliersResponse(result: SearchSuppliersResult): SearchSuppliersResponse {
    return {
      suppliers: result.suppliers.map((profile) => this.toSupplierProfile(profile)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  static toListSupplierContactsResponse(result: ListSupplierContactsResult): ListSupplierContactsResponse {
    return {
      contacts: result.contacts.map((contact) => this.toSupplierContact(contact))
    }
  }

  static toListSupplierAddressesResponse(result: ListSupplierAddressesResult): ListSupplierAddressesResponse {
    return {
      addresses: result.addresses.map((address) => this.toSupplierAddress(address))
    }
  }

  static toListSupplierOfferingsBySupplierResponse(
    result: ListSupplierOfferingsBySupplierResult
  ): ListSupplierOfferingsBySupplierResponse {
    return {
      offerings: result.offerings.map((offering) => this.toSupplierOffering(offering)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  static toListSupplierOfferingsByItemResponse(
    result: ListSupplierOfferingsByItemResult
  ): ListSupplierOfferingsByItemResponse {
    return {
      offerings: result.offerings.map((offering) => this.toSupplierOffering(offering)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  static toUpdateSupplierProfileBasicsResponse(profile: SupplierProfileRecord): UpdateSupplierProfileBasicsResponse {
    return {
      supplier: this.toSupplierProfile(profile)
    }
  }

  static toBindSupplierToTenantPartyResponse(profile: SupplierProfileRecord): BindSupplierToTenantPartyResponse {
    return {
      supplier: this.toSupplierProfile(profile)
    }
  }

  static toUpsertSupplierContactResponse(contact: SupplierContactRecord) {
    return {
      contact: this.toSupplierContact(contact)
    }
  }

  static toUpsertSupplierAddressResponse(address: SupplierAddressRecord): UpsertSupplierAddressResponse {
    return {
      address: this.toSupplierAddress(address)
    }
  }

  static toUpsertSupplierOfferingResponse(offering: SupplierOfferingRecord): UpsertSupplierOfferingResponse {
    return {
      offering: this.toSupplierOffering(offering)
    }
  }

  static toChangeSupplierStatusResponse(profile: SupplierProfileRecord): ChangeSupplierStatusResponse {
    return {
      supplier: this.toSupplierProfile(profile)
    }
  }
}

/** toProtoSupplierStatus maps the SRM domain status into the generated contract enum. */
function toProtoSupplierStatus(status: SupplierStatus): ProtoSupplierStatus {
  return status === SupplierStatus.INACTIVE
    ? ProtoSupplierStatus.SUPPLIER_STATUS_INACTIVE
    : ProtoSupplierStatus.SUPPLIER_STATUS_ACTIVE
}

/** toProtoSupplierOfferingStatus maps the offering fact status into the generated contract enum. */
function toProtoSupplierOfferingStatus(status: SupplierOfferingStatus): ProtoSupplierOfferingStatus {
  return status === SupplierOfferingStatus.INACTIVE
    ? ProtoSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_INACTIVE
    : ProtoSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE
}
