import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AuthorizeBusinessRpc,
  GrpcRequestContextInterceptor,
  SRM_MANAGEMENT_PERMISSION_CODES,
  TrustedExecutionGuard
} from '@oes/common/authorization'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  BindSupplierToTenantPartyRequest,
  BindSupplierToTenantPartyResponse,
  ChangeSupplierStatusRequest,
  ChangeSupplierStatusResponse,
  CreateSupplierProfileRequest,
  CreateSupplierProfileResponse,
  SupplierManagementServiceController,
  SupplierManagementServiceControllerMethods,
  SupplierOfferingStatus as ProtoSupplierOfferingStatus,
  SupplierStatus as ProtoSupplierStatus,
  UpdateSupplierProfileBasicsRequest,
  UpdateSupplierProfileBasicsResponse,
  UpsertSupplierAddressRequest,
  UpsertSupplierAddressResponse,
  UpsertSupplierContactRequest,
  UpsertSupplierContactResponse,
  UpsertSupplierOfferingRequest,
  UpsertSupplierOfferingResponse
} from '@oes/common/generated/srm_service'
import { BindSupplierToTenantPartyCommand } from '../../application/commands/bind-supplier-to-tenant-party.command'
import { ChangeSupplierStatusCommand } from '../../application/commands/change-supplier-status.command'
import { CreateSupplierProfileCommand } from '../../application/commands/create-supplier-profile.command'
import { UpdateSupplierProfileBasicsCommand } from '../../application/commands/update-supplier-profile-basics.command'
import { UpsertSupplierAddressCommand } from '../../application/commands/upsert-supplier-address.command'
import { UpsertSupplierContactCommand } from '../../application/commands/upsert-supplier-contact.command'
import { UpsertSupplierOfferingCommand } from '../../application/commands/upsert-supplier-offering.command'
import { SrmAuditService } from '../../application/services/srm-audit.service'
import { normalizeOptionalString } from '../../application/support/srm-assertions'
import { SupplierOfferingStatus, SupplierStatus } from '../../domain/models/srm-records'
import { SupplierGrpcPresenter } from './supplier-grpc.presenter'
import { SupplierRpcContextValidator, trustedTenantId } from './supplier-rpc-context.validator'

/** SupplierManagementGrpcController exposes the SRM phase 1 command contract with local audit envelope recording. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedExecutionGuard, SupplierRpcContextValidator)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@SupplierManagementServiceControllerMethods()
export class SupplierManagementGrpcController implements SupplierManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly auditService: SrmAuditService
  ) {}

  async createSupplierProfile(
    request: CreateSupplierProfileRequest
  ): Promise<CreateSupplierProfileResponse> {
    const tenantId = trustedTenantId(request)
    return this.auditService.recordCommand(
      {
        tenantId,
        commandName: 'CreateSupplierProfile',
        resourceType: 'supplier_profile',
        targetId: null,
        requestSummary: {
          displayName: request.displayName ?? '',
          supplierNo: request.supplierNo ?? ''
        }
      },
      async () => {
        const profile = await this.commandBus.execute(
          new CreateSupplierProfileCommand({
            tenantId,
            displayName: request.displayName ?? '',
            supplierNo: normalizeOptionalString(request.supplierNo),
            supplierCategory: normalizeOptionalString(request.supplierCategory),
            tags: request.tags ?? []
          })
        )

        return SupplierGrpcPresenter.toCreateSupplierProfileResponse(profile)
      }
    )
  }

  async updateSupplierProfileBasics(
    request: UpdateSupplierProfileBasicsRequest
  ): Promise<UpdateSupplierProfileBasicsResponse> {
    const tenantId = trustedTenantId(request)
    return this.auditService.recordCommand(
      {
        tenantId,
        commandName: 'UpdateSupplierProfileBasics',
        resourceType: 'supplier_profile',
        targetId: request.supplierId ?? null,
        requestSummary: {
          supplierId: request.supplierId ?? ''
        }
      },
      async () => {
        const profile = await this.commandBus.execute(
          new UpdateSupplierProfileBasicsCommand({
            tenantId,
            supplierId: request.supplierId ?? '',
            displayName: normalizeOptionalString(request.displayName),
            supplierNo: normalizeOptionalString(request.supplierNo),
            supplierCategory:
              request.supplierCategory !== undefined
                ? (normalizeOptionalString(request.supplierCategory) ?? '')
                : undefined,
            tags: request.tags
          })
        )

        return SupplierGrpcPresenter.toUpdateSupplierProfileBasicsResponse(profile)
      }
    )
  }

  async bindSupplierToTenantParty(
    request: BindSupplierToTenantPartyRequest
  ): Promise<BindSupplierToTenantPartyResponse> {
    const tenantId = trustedTenantId(request)
    return this.auditService.recordCommand(
      {
        tenantId,
        commandName: 'BindSupplierToTenantParty',
        resourceType: 'supplier_party_binding',
        targetId: request.supplierId ?? null,
        requestSummary: {
          supplierId: request.supplierId ?? '',
          tenantPartyId: request.tenantPartyId ?? ''
        }
      },
      async () => {
        const profile = await this.commandBus.execute(
          new BindSupplierToTenantPartyCommand({
            tenantId,
            supplierId: request.supplierId ?? '',
            tenantPartyId: request.tenantPartyId ?? ''
          })
        )

        return SupplierGrpcPresenter.toBindSupplierToTenantPartyResponse(profile)
      }
    )
  }

  async upsertSupplierContact(
    request: UpsertSupplierContactRequest
  ): Promise<UpsertSupplierContactResponse> {
    const tenantId = trustedTenantId(request)
    return this.auditService.recordCommand(
      {
        tenantId,
        commandName: 'UpsertSupplierContact',
        resourceType: 'supplier_contact',
        targetId: request.supplierContactId ?? request.supplierId ?? null,
        requestSummary: {
          supplierId: request.supplierId ?? '',
          supplierContactId: request.supplierContactId ?? ''
        }
      },
      async () => {
        const contact = await this.commandBus.execute(
          new UpsertSupplierContactCommand({
            tenantId,
            supplierId: request.supplierId ?? '',
            supplierContactId: normalizeOptionalString(request.supplierContactId),
            displayName: request.displayName ?? '',
            roleTitle: normalizeOptionalString(request.roleTitle),
            email: normalizeOptionalString(request.email),
            phone: normalizeOptionalString(request.phone),
            isPrimaryContact: request.isPrimaryContact,
            isActive: request.isActive
          })
        )

        return SupplierGrpcPresenter.toUpsertSupplierContactResponse(contact)
      }
    )
  }

  async upsertSupplierAddress(
    request: UpsertSupplierAddressRequest
  ): Promise<UpsertSupplierAddressResponse> {
    const tenantId = trustedTenantId(request)
    return this.auditService.recordCommand(
      {
        tenantId,
        commandName: 'UpsertSupplierAddress',
        resourceType: 'supplier_address',
        targetId: request.supplierAddressId ?? request.supplierId ?? null,
        requestSummary: {
          supplierId: request.supplierId ?? '',
          supplierAddressId: request.supplierAddressId ?? ''
        }
      },
      async () => {
        const address = await this.commandBus.execute(
          new UpsertSupplierAddressCommand({
            tenantId,
            supplierId: request.supplierId ?? '',
            supplierAddressId: normalizeOptionalString(request.supplierAddressId),
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

        return SupplierGrpcPresenter.toUpsertSupplierAddressResponse(address)
      }
    )
  }

  async upsertSupplierOffering(
    request: UpsertSupplierOfferingRequest
  ): Promise<UpsertSupplierOfferingResponse> {
    const tenantId = trustedTenantId(request)
    return this.auditService.recordCommand(
      {
        tenantId,
        commandName: 'UpsertSupplierOffering',
        resourceType: 'supplier_offering',
        targetId: request.supplierOfferingId ?? request.supplierId ?? null,
        requestSummary: {
          supplierId: request.supplierId ?? '',
          itemId: request.itemId ?? '',
          targetStatus: request.targetStatus ?? 0
        }
      },
      async () => {
        const offering = await this.commandBus.execute(
          new UpsertSupplierOfferingCommand({
            tenantId,
            supplierOfferingId: normalizeOptionalString(request.supplierOfferingId),
            supplierId: request.supplierId ?? '',
            itemId: request.itemId ?? '',
            targetStatus: toDomainSupplierOfferingStatus(request.targetStatus)
          })
        )

        return SupplierGrpcPresenter.toUpsertSupplierOfferingResponse(offering)
      }
    )
  }

  async changeSupplierStatus(
    request: ChangeSupplierStatusRequest
  ): Promise<ChangeSupplierStatusResponse> {
    const tenantId = trustedTenantId(request)
    return this.auditService.recordCommand(
      {
        tenantId,
        commandName: 'ChangeSupplierStatus',
        resourceType: 'supplier_profile',
        targetId: request.supplierId ?? null,
        requestSummary: {
          supplierId: request.supplierId ?? '',
          targetStatus: request.targetStatus ?? 0
        }
      },
      async () => {
        const profile = await this.commandBus.execute(
          new ChangeSupplierStatusCommand({
            tenantId,
            supplierId: request.supplierId ?? '',
            targetStatus: toDomainSupplierStatus(request.targetStatus)
          })
        )

        return SupplierGrpcPresenter.toChangeSupplierStatusResponse(profile)
      }
    )
  }
}

/** Registers the frozen SRM HUMAN/WEB command Code matrix outside domain behavior. */
for (const [method, code] of Object.entries({
  createSupplierProfile: SRM_MANAGEMENT_PERMISSION_CODES.CREATE_SUPPLIER_PROFILE,
  updateSupplierProfileBasics: SRM_MANAGEMENT_PERMISSION_CODES.UPDATE_SUPPLIER_PROFILE_BASICS,
  bindSupplierToTenantParty: SRM_MANAGEMENT_PERMISSION_CODES.BIND_SUPPLIER_TO_TENANT_PARTY,
  upsertSupplierContact: SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_CONTACT,
  upsertSupplierAddress: SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_ADDRESS,
  upsertSupplierOffering: SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_OFFERING,
  changeSupplierStatus: SRM_MANAGEMENT_PERMISSION_CODES.CHANGE_SUPPLIER_STATUS
})) {
  AuthorizeBusinessRpc({ all: [code] }, { principalType: 'HUMAN', sessionTerminals: ['WEB'] })(
    SupplierManagementGrpcController.prototype,
    method,
    Object.getOwnPropertyDescriptor(SupplierManagementGrpcController.prototype, method)
  )
}

/** toDomainSupplierStatus maps the generated SRM status enum into the frozen domain status set. */
function toDomainSupplierStatus(value?: ProtoSupplierStatus): SupplierStatus {
  if (value === ProtoSupplierStatus.SUPPLIER_STATUS_INACTIVE) {
    return SupplierStatus.INACTIVE
  }
  return SupplierStatus.ACTIVE
}

/** toDomainSupplierOfferingStatus maps the generated offering enum into the frozen domain status set. */
function toDomainSupplierOfferingStatus(
  value?: ProtoSupplierOfferingStatus
): SupplierOfferingStatus {
  if (value === ProtoSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_INACTIVE) {
    return SupplierOfferingStatus.INACTIVE
  }
  return SupplierOfferingStatus.ACTIVE
}
