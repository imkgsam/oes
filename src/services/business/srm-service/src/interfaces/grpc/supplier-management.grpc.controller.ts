import { Controller, UseFilters } from '@nestjs/common'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
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
import { SupplierRpcContextValidator } from './supplier-rpc-context.validator'

/** SupplierManagementGrpcController exposes the SRM phase 1 command contract with local audit envelope recording. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@SupplierManagementServiceControllerMethods()
export class SupplierManagementGrpcController implements SupplierManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly auditService: SrmAuditService,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  async createSupplierProfile(request: CreateSupplierProfileRequest): Promise<CreateSupplierProfileResponse> {
    const context = SupplierRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
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
            tenantId: request.tenantId ?? '',
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
    const context = SupplierRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
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
            tenantId: request.tenantId ?? '',
            supplierId: request.supplierId ?? '',
            displayName: normalizeOptionalString(request.displayName),
            supplierNo: normalizeOptionalString(request.supplierNo),
            supplierCategory:
              request.supplierCategory !== undefined
                ? normalizeOptionalString(request.supplierCategory) ?? ''
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
    const context = SupplierRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
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
            tenantId: request.tenantId ?? '',
            supplierId: request.supplierId ?? '',
            tenantPartyId: request.tenantPartyId ?? ''
          })
        )

        return SupplierGrpcPresenter.toBindSupplierToTenantPartyResponse(profile)
      }
    )
  }

  async upsertSupplierContact(request: UpsertSupplierContactRequest): Promise<UpsertSupplierContactResponse> {
    const context = SupplierRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
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
            tenantId: request.tenantId ?? '',
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

  async upsertSupplierAddress(request: UpsertSupplierAddressRequest): Promise<UpsertSupplierAddressResponse> {
    const context = SupplierRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
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
            tenantId: request.tenantId ?? '',
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

  async upsertSupplierOffering(request: UpsertSupplierOfferingRequest): Promise<UpsertSupplierOfferingResponse> {
    const context = SupplierRpcContextValidator.assertManagementContext(request)
    return this.requestContextStore.run(buildDownstreamRequestContext(context), () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
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
              tenantId: request.tenantId ?? '',
              supplierOfferingId: normalizeOptionalString(request.supplierOfferingId),
              supplierId: request.supplierId ?? '',
              itemId: request.itemId ?? '',
              targetStatus: toDomainSupplierOfferingStatus(request.targetStatus)
            })
          )

          return SupplierGrpcPresenter.toUpsertSupplierOfferingResponse(offering)
        }
      )
    )
  }

  async changeSupplierStatus(request: ChangeSupplierStatusRequest): Promise<ChangeSupplierStatusResponse> {
    const context = SupplierRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
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
            tenantId: request.tenantId ?? '',
            supplierId: request.supplierId ?? '',
            targetStatus: toDomainSupplierStatus(request.targetStatus)
          })
        )

        return SupplierGrpcPresenter.toChangeSupplierStatusResponse(profile)
      }
    )
  }
}

/** toDomainSupplierStatus maps the generated SRM status enum into the frozen domain status set. */
function toDomainSupplierStatus(value?: ProtoSupplierStatus): SupplierStatus {
  if (value === ProtoSupplierStatus.SUPPLIER_STATUS_INACTIVE) {
    return SupplierStatus.INACTIVE
  }
  return SupplierStatus.ACTIVE
}

/** toDomainSupplierOfferingStatus maps the generated offering enum into the frozen domain status set. */
function toDomainSupplierOfferingStatus(value?: ProtoSupplierOfferingStatus): SupplierOfferingStatus {
  if (value === ProtoSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_INACTIVE) {
    return SupplierOfferingStatus.INACTIVE
  }
  return SupplierOfferingStatus.ACTIVE
}

/** buildDownstreamRequestContext bridges the validated SRM RPC payload context into downstream guarded gRPC calls. */
function buildDownstreamRequestContext(context: {
  tenantId: string
  operatorContext: {
    operatorId: string
    operatorType: string
    orgId?: string | null
  }
  traceContext: {
    requestId: string
    traceId: string
  }
}) {
  const issuedAt = new Date()
  return {
    internalServiceName: SERVICE_NAMES.SRM,
    requestId: context.traceContext.requestId,
    traceId: context.traceContext.traceId,
    operatorContext: {
      operator_id: context.operatorContext.operatorId,
      operator_type: context.operatorContext.operatorType,
      tenant_id: context.tenantId,
      org_id: context.operatorContext.orgId ?? undefined,
      issued_at: issuedAt.toISOString(),
      expires_at: new Date(issuedAt.getTime() + 5 * 60 * 1000).toISOString(),
      issuer: SERVICE_NAMES.SRM,
      signature: 'srm-runtime-context'
    }
  }
}
