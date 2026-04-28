import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  BindCustomerAccountToTenantPartyRequest,
  BindCustomerAccountToTenantPartyResponse,
  ChangeCustomerStatusRequest,
  ChangeCustomerStatusResponse,
  CreateCustomerAccountRequest,
  CreateCustomerAccountResponse,
  CustomerManagementServiceController,
  CustomerManagementServiceControllerMethods,
  CustomerStatus as ProtoCustomerStatus,
  UpdateCustomerAccountBasicsRequest,
  UpdateCustomerAccountBasicsResponse,
  UpsertCustomerAddressRequest,
  UpsertCustomerAddressResponse,
  UpsertCustomerContactRequest,
  UpsertCustomerContactResponse
} from '@oes/common/generated/crm_service'
import { BindCustomerAccountToTenantPartyCommand } from '../../application/commands/bind-customer-account-to-tenant-party.command'
import { ChangeCustomerStatusCommand } from '../../application/commands/change-customer-status.command'
import { CreateCustomerAccountCommand } from '../../application/commands/create-customer-account.command'
import { UpdateCustomerAccountBasicsCommand } from '../../application/commands/update-customer-account-basics.command'
import { UpsertCustomerAddressCommand } from '../../application/commands/upsert-customer-address.command'
import { UpsertCustomerContactCommand } from '../../application/commands/upsert-customer-contact.command'
import { CrmAuditService } from '../../application/services/crm-audit.service'
import { normalizeOptionalString } from '../../application/support/crm-assertions'
import { CustomerStatus } from '../../domain/models/crm-records'
import { CustomerGrpcPresenter } from './customer-grpc.presenter'
import { CustomerRpcContextValidator } from './customer-rpc-context.validator'

/** CustomerManagementGrpcController exposes the CRM phase 1 command contract with local audit envelope recording. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@CustomerManagementServiceControllerMethods()
export class CustomerManagementGrpcController implements CustomerManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly auditService: CrmAuditService
  ) {}

  async createCustomerAccount(request: CreateCustomerAccountRequest): Promise<CreateCustomerAccountResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'CreateCustomerAccount',
        resourceType: 'customer_account',
        targetId: null,
        requestSummary: {
          displayName: request.displayName ?? '',
          tagCount: request.tags?.length ?? 0
        }
      },
      async () => {
        const account = await this.commandBus.execute(
          new CreateCustomerAccountCommand({
            tenantId: request.tenantId ?? '',
            displayName: request.displayName ?? '',
            customerCategory: normalizeOptionalString(request.customerCategory),
            tags: request.tags ?? []
          })
        )

        return CustomerGrpcPresenter.toCreateCustomerAccountResponse(account)
      }
    )
  }

  async updateCustomerAccountBasics(
    request: UpdateCustomerAccountBasicsRequest
  ): Promise<UpdateCustomerAccountBasicsResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'UpdateCustomerAccountBasics',
        resourceType: 'customer_account',
        targetId: request.customerAccountId ?? null,
        requestSummary: {
          customerAccountId: request.customerAccountId ?? ''
        }
      },
      async () => {
        const account = await this.commandBus.execute(
          new UpdateCustomerAccountBasicsCommand({
            tenantId: request.tenantId ?? '',
            customerAccountId: request.customerAccountId ?? '',
            displayName: normalizeOptionalString(request.displayName),
            customerCategory:
              request.customerCategory !== undefined
                ? normalizeOptionalString(request.customerCategory) ?? ''
                : undefined,
            tags: request.tags
          })
        )

        return CustomerGrpcPresenter.toUpdateCustomerAccountBasicsResponse(account)
      }
    )
  }

  async bindCustomerAccountToTenantParty(
    request: BindCustomerAccountToTenantPartyRequest
  ): Promise<BindCustomerAccountToTenantPartyResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'BindCustomerAccountToTenantParty',
        resourceType: 'customer_party_binding',
        targetId: request.customerAccountId ?? null,
        requestSummary: {
          customerAccountId: request.customerAccountId ?? '',
          tenantPartyId: request.tenantPartyId ?? ''
        }
      },
      async () => {
        const account = await this.commandBus.execute(
          new BindCustomerAccountToTenantPartyCommand({
            tenantId: request.tenantId ?? '',
            customerAccountId: request.customerAccountId ?? '',
            tenantPartyId: request.tenantPartyId ?? ''
          })
        )

        return CustomerGrpcPresenter.toBindCustomerAccountToTenantPartyResponse(account)
      }
    )
  }

  async upsertCustomerContact(request: UpsertCustomerContactRequest): Promise<UpsertCustomerContactResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'UpsertCustomerContact',
        resourceType: 'customer_contact',
        targetId: request.customerContactId ?? request.customerAccountId ?? null,
        requestSummary: {
          customerAccountId: request.customerAccountId ?? '',
          customerContactId: request.customerContactId ?? ''
        }
      },
      async () => {
        const contact = await this.commandBus.execute(
          new UpsertCustomerContactCommand({
            tenantId: request.tenantId ?? '',
            customerAccountId: request.customerAccountId ?? '',
            customerContactId: normalizeOptionalString(request.customerContactId),
            displayName: request.displayName ?? '',
            roleTitle: normalizeOptionalString(request.roleTitle),
            email: normalizeOptionalString(request.email),
            phone: normalizeOptionalString(request.phone),
            isPrimaryContact: request.isPrimaryContact,
            isActive: request.isActive
          })
        )

        return CustomerGrpcPresenter.toUpsertCustomerContactResponse(contact)
      }
    )
  }

  async upsertCustomerAddress(request: UpsertCustomerAddressRequest): Promise<UpsertCustomerAddressResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'UpsertCustomerAddress',
        resourceType: 'customer_address',
        targetId: request.customerAddressId ?? request.customerAccountId ?? null,
        requestSummary: {
          customerAccountId: request.customerAccountId ?? '',
          customerAddressId: request.customerAddressId ?? ''
        }
      },
      async () => {
        const address = await this.commandBus.execute(
          new UpsertCustomerAddressCommand({
            tenantId: request.tenantId ?? '',
            customerAccountId: request.customerAccountId ?? '',
            customerAddressId: normalizeOptionalString(request.customerAddressId),
            label: request.label ?? '',
            countryCode: request.countryCode ?? '',
            region: normalizeOptionalString(request.region),
            locality: normalizeOptionalString(request.locality),
            addressLine1: request.addressLine1 ?? '',
            addressLine2: normalizeOptionalString(request.addressLine2),
            postalCode: normalizeOptionalString(request.postalCode),
            isPrimaryAddress: request.isPrimaryAddress,
            isActive: request.isActive
          })
        )

        return CustomerGrpcPresenter.toUpsertCustomerAddressResponse(address)
      }
    )
  }

  async changeCustomerStatus(request: ChangeCustomerStatusRequest): Promise<ChangeCustomerStatusResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'ChangeCustomerStatus',
        resourceType: 'customer_account',
        targetId: request.customerAccountId ?? null,
        requestSummary: {
          customerAccountId: request.customerAccountId ?? '',
          targetStatus: request.targetStatus ?? 0
        }
      },
      async () => {
        const account = await this.commandBus.execute(
          new ChangeCustomerStatusCommand({
            tenantId: request.tenantId ?? '',
            customerAccountId: request.customerAccountId ?? '',
            targetStatus: toDomainCustomerStatus(request.targetStatus)
          })
        )

        return CustomerGrpcPresenter.toChangeCustomerStatusResponse(account)
      }
    )
  }
}

/** toDomainCustomerStatus maps the generated CRM status enum into the frozen domain status set. */
function toDomainCustomerStatus(value?: ProtoCustomerStatus): CustomerStatus {
  if (value === ProtoCustomerStatus.CUSTOMER_STATUS_BLOCKED) {
    return CustomerStatus.BLOCKED
  }
  if (value === ProtoCustomerStatus.CUSTOMER_STATUS_ARCHIVED) {
    return CustomerStatus.ARCHIVED
  }
  return CustomerStatus.ACTIVE_CUSTOMER
}
