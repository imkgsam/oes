import { ValidatingCommandBus } from '@oes/common/cqrs';
import { BindCustomerAccountToTenantPartyRequest, BindCustomerAccountToTenantPartyResponse, ChangeCustomerStatusRequest, ChangeCustomerStatusResponse, CreateCustomerAccountRequest, CreateCustomerAccountResponse, CustomerManagementServiceController, UpdateCustomerAccountBasicsRequest, UpdateCustomerAccountBasicsResponse, UpsertCustomerAddressRequest, UpsertCustomerAddressResponse, UpsertCustomerContactRequest, UpsertCustomerContactResponse } from '@oes/common/generated/crm_service';
import { CrmAuditService } from '../../application/services/crm-audit.service';
/** CustomerManagementGrpcController exposes the CRM phase 1 command contract with local audit envelope recording. */
export declare class CustomerManagementGrpcController implements CustomerManagementServiceController {
    private readonly commandBus;
    private readonly auditService;
    constructor(commandBus: ValidatingCommandBus, auditService: CrmAuditService);
    createCustomerAccount(request: CreateCustomerAccountRequest): Promise<CreateCustomerAccountResponse>;
    updateCustomerAccountBasics(request: UpdateCustomerAccountBasicsRequest): Promise<UpdateCustomerAccountBasicsResponse>;
    bindCustomerAccountToTenantParty(request: BindCustomerAccountToTenantPartyRequest): Promise<BindCustomerAccountToTenantPartyResponse>;
    upsertCustomerContact(request: UpsertCustomerContactRequest): Promise<UpsertCustomerContactResponse>;
    upsertCustomerAddress(request: UpsertCustomerAddressRequest): Promise<UpsertCustomerAddressResponse>;
    changeCustomerStatus(request: ChangeCustomerStatusRequest): Promise<ChangeCustomerStatusResponse>;
}
