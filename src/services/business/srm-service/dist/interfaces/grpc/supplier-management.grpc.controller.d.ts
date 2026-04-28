import { GrpcRequestContextStore } from '@oes/common/authorization';
import { ValidatingCommandBus } from '@oes/common/cqrs';
import { BindSupplierToTenantPartyRequest, BindSupplierToTenantPartyResponse, ChangeSupplierStatusRequest, ChangeSupplierStatusResponse, CreateSupplierProfileRequest, CreateSupplierProfileResponse, SupplierManagementServiceController, UpdateSupplierProfileBasicsRequest, UpdateSupplierProfileBasicsResponse, UpsertSupplierAddressRequest, UpsertSupplierAddressResponse, UpsertSupplierContactRequest, UpsertSupplierContactResponse, UpsertSupplierOfferingRequest, UpsertSupplierOfferingResponse } from '@oes/common/generated/srm_service';
import { SrmAuditService } from '../../application/services/srm-audit.service';
/** SupplierManagementGrpcController exposes the SRM phase 1 command contract with local audit envelope recording. */
export declare class SupplierManagementGrpcController implements SupplierManagementServiceController {
    private readonly commandBus;
    private readonly auditService;
    private readonly requestContextStore;
    constructor(commandBus: ValidatingCommandBus, auditService: SrmAuditService, requestContextStore: GrpcRequestContextStore);
    createSupplierProfile(request: CreateSupplierProfileRequest): Promise<CreateSupplierProfileResponse>;
    updateSupplierProfileBasics(request: UpdateSupplierProfileBasicsRequest): Promise<UpdateSupplierProfileBasicsResponse>;
    bindSupplierToTenantParty(request: BindSupplierToTenantPartyRequest): Promise<BindSupplierToTenantPartyResponse>;
    upsertSupplierContact(request: UpsertSupplierContactRequest): Promise<UpsertSupplierContactResponse>;
    upsertSupplierAddress(request: UpsertSupplierAddressRequest): Promise<UpsertSupplierAddressResponse>;
    upsertSupplierOffering(request: UpsertSupplierOfferingRequest): Promise<UpsertSupplierOfferingResponse>;
    changeSupplierStatus(request: ChangeSupplierStatusRequest): Promise<ChangeSupplierStatusResponse>;
}
