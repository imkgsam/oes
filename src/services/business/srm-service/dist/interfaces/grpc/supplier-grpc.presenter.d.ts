import { BindSupplierToTenantPartyResponse, ChangeSupplierStatusResponse, CreateSupplierProfileResponse, GetSupplierResponse, ListSupplierAddressesResponse, ListSupplierContactsResponse, ListSupplierOfferingsByItemResponse, ListSupplierOfferingsBySupplierResponse, SearchSuppliersResponse, SupplierAddress, SupplierOffering, SupplierProfile, UpsertSupplierAddressResponse, UpsertSupplierOfferingResponse, UpdateSupplierProfileBasicsResponse } from '@oes/common/generated/srm_service';
import { SupplierAddressRecord, SupplierContactRecord, SupplierOfferingRecord, SupplierProfileRecord } from '../../domain/models/srm-records';
import { ListSupplierAddressesResult } from '../../application/queries/list-supplier-addresses.handler';
import { ListSupplierContactsResult } from '../../application/queries/list-supplier-contacts.handler';
import { ListSupplierOfferingsByItemResult } from '../../application/queries/list-supplier-offerings-by-item.handler';
import { ListSupplierOfferingsBySupplierResult } from '../../application/queries/list-supplier-offerings-by-supplier.handler';
import { SearchSuppliersResult } from '../../application/queries/search-suppliers.handler';
/** SupplierGrpcPresenter maps SRM domain records into the frozen phase 1 gRPC response shapes. */
export declare class SupplierGrpcPresenter {
    /** toSupplierProfile renders one SRM supplier profile shell with its optional active tenant-party binding summary. */
    static toSupplierProfile(profile: SupplierProfileRecord): SupplierProfile;
    /** toSupplierContact renders one SRM business-contact collaboration record. */
    static toSupplierContact(contact: SupplierContactRecord): {
        supplierContactId: string;
        supplierId: string;
        displayName: string;
        roleTitle: string;
        email: string;
        phone: string;
        isPrimaryContact: boolean;
        isActive: boolean;
    };
    /** toSupplierAddress renders one SRM business-address collaboration record. */
    static toSupplierAddress(address: SupplierAddressRecord): SupplierAddress;
    /** toSupplierOffering renders one current supplierId + itemId supplyability fact. */
    static toSupplierOffering(offering: SupplierOfferingRecord): SupplierOffering;
    static toCreateSupplierProfileResponse(profile: SupplierProfileRecord): CreateSupplierProfileResponse;
    static toGetSupplierResponse(profile: SupplierProfileRecord): GetSupplierResponse;
    static toSearchSuppliersResponse(result: SearchSuppliersResult): SearchSuppliersResponse;
    static toListSupplierContactsResponse(result: ListSupplierContactsResult): ListSupplierContactsResponse;
    static toListSupplierAddressesResponse(result: ListSupplierAddressesResult): ListSupplierAddressesResponse;
    static toListSupplierOfferingsBySupplierResponse(result: ListSupplierOfferingsBySupplierResult): ListSupplierOfferingsBySupplierResponse;
    static toListSupplierOfferingsByItemResponse(result: ListSupplierOfferingsByItemResult): ListSupplierOfferingsByItemResponse;
    static toUpdateSupplierProfileBasicsResponse(profile: SupplierProfileRecord): UpdateSupplierProfileBasicsResponse;
    static toBindSupplierToTenantPartyResponse(profile: SupplierProfileRecord): BindSupplierToTenantPartyResponse;
    static toUpsertSupplierContactResponse(contact: SupplierContactRecord): {
        contact: {
            supplierContactId: string;
            supplierId: string;
            displayName: string;
            roleTitle: string;
            email: string;
            phone: string;
            isPrimaryContact: boolean;
            isActive: boolean;
        };
    };
    static toUpsertSupplierAddressResponse(address: SupplierAddressRecord): UpsertSupplierAddressResponse;
    static toUpsertSupplierOfferingResponse(offering: SupplierOfferingRecord): UpsertSupplierOfferingResponse;
    static toChangeSupplierStatusResponse(profile: SupplierProfileRecord): ChangeSupplierStatusResponse;
}
