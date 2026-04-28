import { ValidatingQueryBus } from '@oes/common/cqrs';
import { GetSupplierRequest, GetSupplierResponse, ListSupplierAddressesRequest, ListSupplierAddressesResponse, ListSupplierContactsRequest, ListSupplierContactsResponse, ListSupplierOfferingsByItemRequest, ListSupplierOfferingsByItemResponse, ListSupplierOfferingsBySupplierRequest, ListSupplierOfferingsBySupplierResponse, SearchSuppliersRequest, SearchSuppliersResponse, SupplierQueryServiceController } from '@oes/common/generated/srm_service';
/** SupplierQueryGrpcController exposes the phase 1 SRM read-only query contract. */
export declare class SupplierQueryGrpcController implements SupplierQueryServiceController {
    private readonly queryBus;
    constructor(queryBus: ValidatingQueryBus);
    getSupplier(request: GetSupplierRequest): Promise<GetSupplierResponse>;
    searchSuppliers(request: SearchSuppliersRequest): Promise<SearchSuppliersResponse>;
    listSupplierContacts(request: ListSupplierContactsRequest): Promise<ListSupplierContactsResponse>;
    listSupplierAddresses(request: ListSupplierAddressesRequest): Promise<ListSupplierAddressesResponse>;
    listSupplierOfferingsBySupplier(request: ListSupplierOfferingsBySupplierRequest): Promise<ListSupplierOfferingsBySupplierResponse>;
    listSupplierOfferingsByItem(request: ListSupplierOfferingsByItemRequest): Promise<ListSupplierOfferingsByItemResponse>;
}
