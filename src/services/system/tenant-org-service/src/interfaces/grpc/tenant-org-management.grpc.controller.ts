import { Controller, UseGuards, UseInterceptors } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import {
  AuthorizeBusinessRpc,
  DeclareSystemTenantTargetRpc,
  DeclareTenantTargetRpc,
  GrpcRequestContextInterceptor,
  requireAdmittedTenantTarget,
  TENANT_ORG_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
import {
  TENANT_ORG_GATEWAY_SPIFFE_ID,
  TenantOrgFoundationTrustedExecutionGuard
} from '../../modules/tenant-org-trusted-execution.module'
import { TenantOrgTenantTargetAdmissionGuard } from '../../modules/tenant-org-tenant-target-admission.guard'
import {
  ArchiveOrgUnitRequest,
  ArchiveOrgUnitResponse,
  ArchiveTenantRequest,
  ArchiveTenantResponse,
  CreateOrgUnitRequest,
  CreateOrgUnitResponse,
  CreateTenantRequest,
  CreateTenantResponse,
  GetTenantOnboardingRequest,
  GetTenantOnboardingResponse,
  MoveOrgUnitRequest,
  MoveOrgUnitResponse,
  ReactivateTenantRequest,
  ReactivateTenantResponse,
  RetryTenantOnboardingRequest,
  RetryTenantOnboardingResponse,
  StartTenantOnboardingRequest,
  StartTenantOnboardingResponse,
  SuspendTenantRequest,
  SuspendTenantResponse,
  TenantOrgManagementServiceController,
  TenantOrgManagementServiceControllerMethods,
  UpdateOrgUnitRequest,
  UpdateOrgUnitResponse,
  UpdateTenantProfileRequest,
  UpdateTenantProfileResponse
} from '@oes/common/generated/tenant_org_service'
import {
  TenantOnboardingResult,
  TenantOnboardingService,
  TenantOrgManagementService
} from '../../application/services'

/** TenantOrgManagementGrpcController exposes tenant/org management contracts over gRPC. */
@UseGuards(TenantOrgFoundationTrustedExecutionGuard)
@Controller()
@UseInterceptors(GrpcRequestContextInterceptor)
@TenantOrgManagementServiceControllerMethods()
export class TenantOrgManagementGrpcController implements TenantOrgManagementServiceController {
  constructor(
    private readonly tenantOrgManagementService: TenantOrgManagementService,
    private readonly tenantOnboardingService: TenantOnboardingService
  ) {}

  async createTenant(
    _request: CreateTenantRequest,
    _metadata?: Metadata
  ): Promise<CreateTenantResponse> {
    const result = await this.tenantOrgManagementService.createTenant({
      code: _request.code ?? '',
      employeeCodePrefix: _request.employeeCodePrefix ?? '',
      name: _request.name ?? '',
      rootOrgName: _request.rootOrgName ?? ''
    })
    return {
      tenant: mapTenant(result.tenant),
      rootOrgUnit: mapOrgUnit(result.rootOrgUnit)
    }
  }

  async startTenantOnboarding(
    request: StartTenantOnboardingRequest,
    _metadata?: Metadata
  ): Promise<StartTenantOnboardingResponse> {
    const onboarding = await this.tenantOnboardingService.start({
      idempotencyKey: request.idempotencyKey ?? '',
      tenant: {
        code: request.tenant?.code ?? '',
        employeeCodePrefix: request.tenant?.employeeCodePrefix ?? '',
        name: request.tenant?.name ?? ''
      },
      organizationTenantParty: {
        legalName: request.organizationTenantParty?.legalName ?? '',
        registeredCountry: request.organizationTenantParty?.registeredCountry || undefined,
        identifiers:
          request.organizationTenantParty?.identifiers?.map((identifier) => ({
            identifierType: identifier.identifierType ?? '',
            rawValue: identifier.rawValue || undefined,
            normalizedValue: identifier.normalizedValue ?? '',
            issuerCountryOrRegion: identifier.issuerCountryOrRegion || undefined
          })) ?? []
      },
      rootOrg: {
        name: request.rootOrg?.name ?? ''
      },
      firstAdmin: {
        displayName: request.firstAdmin?.displayName ?? '',
        email: request.firstAdmin?.email || undefined,
        existingUserId: request.firstAdmin?.existingUserId || undefined,
        phone: request.firstAdmin?.phone || undefined,
        provisioningMode:
          request.firstAdmin?.provisioningMode === 'EXISTING_USER'
            ? 'EXISTING_USER'
            : 'CREATE_NEW_USER',
        requirePasswordSetup: request.firstAdmin?.requirePasswordSetup ?? true
      }
    })
    return { onboarding: mapOnboarding(onboarding) }
  }

  async getTenantOnboarding(
    request: GetTenantOnboardingRequest,
    _metadata?: Metadata
  ): Promise<GetTenantOnboardingResponse> {
    return {
      onboarding: mapOnboarding(await this.tenantOnboardingService.get(request.onboardingId ?? ''))
    }
  }

  async retryTenantOnboarding(
    request: RetryTenantOnboardingRequest,
    _metadata?: Metadata
  ): Promise<RetryTenantOnboardingResponse> {
    return {
      onboarding: mapOnboarding(
        await this.tenantOnboardingService.retry(request.onboardingId ?? '')
      )
    }
  }

  async updateTenantProfile(
    _request: UpdateTenantProfileRequest,
    _metadata?: Metadata
  ): Promise<UpdateTenantProfileResponse> {
    const tenantId = requireAdmittedTenantTarget(_request).selector
    const tenant = await this.tenantOrgManagementService.updateTenantProfile({
      tenantId,
      name: _request.name || undefined,
      code: _request.code || undefined,
      employeeCodePrefix: _request.employeeCodePrefix || undefined,
      websiteUrl: _request.websiteUrl || undefined
    })
    return { tenant: mapTenant(tenant) }
  }

  async suspendTenant(
    _request: SuspendTenantRequest,
    _metadata?: Metadata
  ): Promise<SuspendTenantResponse> {
    const tenantId = requireAdmittedTenantTarget(_request).selector
    const tenant = await this.tenantOrgManagementService.suspendTenant({
      tenantId,
      reason: _request.reason || undefined
    })
    return { tenant: mapTenant(tenant) }
  }

  async reactivateTenant(
    _request: ReactivateTenantRequest,
    _metadata?: Metadata
  ): Promise<ReactivateTenantResponse> {
    const tenantId = requireAdmittedTenantTarget(_request).selector
    const tenant = await this.tenantOrgManagementService.reactivateTenant({
      tenantId
    })
    return { tenant: mapTenant(tenant) }
  }

  async archiveTenant(
    _request: ArchiveTenantRequest,
    _metadata?: Metadata
  ): Promise<ArchiveTenantResponse> {
    const tenantId = requireAdmittedTenantTarget(_request).selector
    const tenant = await this.tenantOrgManagementService.archiveTenant({
      tenantId,
      reason: _request.reason || undefined
    })
    return { tenant: mapTenant(tenant) }
  }

  async createOrgUnit(
    _request: CreateOrgUnitRequest,
    _metadata?: Metadata
  ): Promise<CreateOrgUnitResponse> {
    const tenantId = requireAdmittedTenantTarget(_request).selector
    const orgUnit = await this.tenantOrgManagementService.createOrgUnit({
      tenantId,
      parentOrgId: _request.parentOrgId ?? '',
      name: _request.name ?? '',
      type: _request.type ?? '',
      sortOrder: _request.sortOrder,
      organizationTenantPartyId: _request.organizationTenantPartyId?.trim() || undefined
    })
    return { orgUnit: mapOrgUnit(orgUnit) }
  }

  async updateOrgUnit(
    _request: UpdateOrgUnitRequest,
    _metadata?: Metadata
  ): Promise<UpdateOrgUnitResponse> {
    const tenantId = requireAdmittedTenantTarget(_request).selector
    const hasOrganizationTenantPartyId = Object.prototype.hasOwnProperty.call(
      _request,
      'organizationTenantPartyId'
    )
    const orgUnit = await this.tenantOrgManagementService.updateOrgUnit({
      tenantId,
      orgUnitId: _request.orgUnitId ?? '',
      name: _request.name || undefined,
      type: _request.type || undefined,
      sortOrder: _request.sortOrder,
      organizationTenantPartyId: hasOrganizationTenantPartyId
        ? _request.organizationTenantPartyId?.trim() || null
        : undefined
    })
    return { orgUnit: mapOrgUnit(orgUnit) }
  }

  async moveOrgUnit(
    _request: MoveOrgUnitRequest,
    _metadata?: Metadata
  ): Promise<MoveOrgUnitResponse> {
    const tenantId = requireAdmittedTenantTarget(_request).selector
    const orgUnit = await this.tenantOrgManagementService.moveOrgUnit({
      tenantId,
      orgUnitId: _request.orgUnitId ?? '',
      newParentOrgId: _request.newParentOrgId ?? ''
    })
    return { orgUnit: mapOrgUnit(orgUnit) }
  }

  async archiveOrgUnit(
    _request: ArchiveOrgUnitRequest,
    _metadata?: Metadata
  ): Promise<ArchiveOrgUnitResponse> {
    const tenantId = requireAdmittedTenantTarget(_request).selector
    const orgUnit = await this.tenantOrgManagementService.archiveOrgUnit({
      tenantId,
      orgUnitId: _request.orgUnitId ?? '',
      reason: _request.reason || undefined
    })
    return { orgUnit: mapOrgUnit(orgUnit) }
  }
}

/** mapTenant converts application tenant summaries to gRPC tenant summaries. */
function mapTenant(tenant: {
  id: string
  code: string
  employeeCodePrefix: string
  name: string
  status: string
  rootOrgId: string | null
  websiteUrl?: string | null
}) {
  return {
    id: tenant.id,
    code: tenant.code,
    employeeCodePrefix: tenant.employeeCodePrefix,
    name: tenant.name,
    status: String(tenant.status),
    rootOrgId: tenant.rootOrgId ?? '',
    websiteUrl: tenant.websiteUrl ?? ''
  }
}

/** mapOrgUnit converts application org summaries to gRPC org summaries. */
function mapOrgUnit(orgUnit: {
  id: string
  tenantId: string
  parentOrgId: string | null
  name: string
  type: string
  status: string
  path: string
  depth: number
  sortOrder: number
  organizationTenantPartyId: string | null
}) {
  return {
    id: orgUnit.id,
    tenantId: orgUnit.tenantId,
    parentOrgId: orgUnit.parentOrgId ?? '',
    name: orgUnit.name,
    type: String(orgUnit.type),
    status: String(orgUnit.status),
    path: orgUnit.path,
    depth: orgUnit.depth,
    sortOrder: orgUnit.sortOrder,
    organizationTenantPartyId: orgUnit.organizationTenantPartyId ?? ''
  }
}

/** mapOnboarding converts application onboarding Saga state to the gRPC response contract. */
function mapOnboarding(result: TenantOnboardingResult) {
  return {
    onboardingId: result.onboardingId,
    status: result.status,
    tenant: result.tenant ? mapTenant(result.tenant) : undefined,
    rootOrg: result.rootOrg ? mapOrgUnit(result.rootOrg) : undefined,
    organizationTenantParty: {
      tenantPartyId: result.organizationTenantParty?.tenantPartyId ?? ''
    },
    firstAdmin: {
      userId: result.firstAdmin?.userId ?? '',
      accountId: result.firstAdmin?.accountId ?? '',
      tenantPartyId: result.firstAdmin?.tenantPartyId ?? ''
    },
    firstAdminEmployee: {
      employeeId: result.firstAdminEmployee?.employeeId ?? '',
      employmentId: result.firstAdminEmployee?.employmentId ?? '',
      accessProcessId: result.firstAdminEmployee?.accessProcessId ?? ''
    },
    access: {
      roleCode: result.access?.roleCode ?? '',
      roleId: result.access?.roleId ?? '',
      grantId: result.access?.grantId ?? '',
      hrAdminRoleCode: result.access?.hrAdminRoleCode ?? '',
      hrAdminRoleId: result.access?.hrAdminRoleId ?? '',
      hrAdminGrantId: result.access?.hrAdminGrantId ?? '',
      accountBasicRoleCode: result.access?.accountBasicRoleCode ?? '',
      accountBasicRoleId: result.access?.accountBasicRoleId ?? ''
    },
    steps: result.steps.map((step) => ({
      key: String(step.key),
      status: String(step.status),
      message: step.message ?? '',
      attemptCount: step.attemptCount
    })),
    failure: result.failure
      ? {
          code: result.failure.code,
          message: result.failure.message,
          failedStep: result.failure.failedStep,
          retryable: result.failure.retryable
        }
      : undefined
  }
}

/** Applies one exact non-target TenantOrg BUSINESS Code declaration. */
function applyTenantOrgBusinessDeclaration(method: string, code: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(
    TenantOrgManagementGrpcController.prototype,
    method
  )
  if (!descriptor) throw new Error(`TenantOrg handler is missing: ${method}`)
  AuthorizeBusinessRpc({ all: [code] })(
    TenantOrgManagementGrpcController.prototype,
    method,
    descriptor
  )
}

/** Applies exact target admission, BUSINESS Code and guard metadata to one selector RPC. */
function applyTenantOrgTargetDeclaration(
  method: string,
  code: string,
  kind: 'SYSTEM_TARGET' | 'TENANT_SYSTEM_DENY'
): void {
  const descriptor = Object.getOwnPropertyDescriptor(
    TenantOrgManagementGrpcController.prototype,
    method
  )
  if (!descriptor) throw new Error(`TenantOrg handler is missing: ${method}`)
  if (kind === 'SYSTEM_TARGET') {
    DeclareSystemTenantTargetRpc({
      selectorField: 'tenantId',
      gatewayWorkloadIdentity: TENANT_ORG_GATEWAY_SPIFFE_ID,
      permissionCode: code
    })(TenantOrgManagementGrpcController.prototype, method, descriptor)
  } else {
    AuthorizeBusinessRpc({ all: [code] })(
      TenantOrgManagementGrpcController.prototype,
      method,
      descriptor
    )
    DeclareTenantTargetRpc({ selectorField: 'tenantId' })(
      TenantOrgManagementGrpcController.prototype,
      method,
      descriptor
    )
  }
  UseGuards(TenantOrgTenantTargetAdmissionGuard)(
    TenantOrgManagementGrpcController.prototype,
    method,
    descriptor
  )
}

applyTenantOrgBusinessDeclaration('createTenant', 'tenant_org.tenant.create')
applyTenantOrgBusinessDeclaration('startTenantOnboarding', 'tenant_org.tenant.create')
applyTenantOrgBusinessDeclaration('retryTenantOnboarding', 'tenant_org.tenant.create')
applyTenantOrgBusinessDeclaration('getTenantOnboarding', 'tenant_org.tenant.get_by_id')
applyTenantOrgTargetDeclaration(
  'updateTenantProfile',
  'tenant_org.tenant.update_profile',
  'SYSTEM_TARGET'
)
applyTenantOrgTargetDeclaration('suspendTenant', 'tenant_org.tenant.update_status', 'SYSTEM_TARGET')
applyTenantOrgTargetDeclaration(
  'reactivateTenant',
  'tenant_org.tenant.update_status',
  'SYSTEM_TARGET'
)
applyTenantOrgTargetDeclaration('archiveTenant', 'tenant_org.tenant.update_status', 'SYSTEM_TARGET')
applyTenantOrgTargetDeclaration('createOrgUnit', 'tenant_org.org_unit.create', 'TENANT_SYSTEM_DENY')
applyTenantOrgTargetDeclaration('updateOrgUnit', 'tenant_org.org_unit.update', 'TENANT_SYSTEM_DENY')
applyTenantOrgTargetDeclaration('moveOrgUnit', 'tenant_org.org_unit.update', 'TENANT_SYSTEM_DENY')
applyTenantOrgTargetDeclaration(
  'archiveOrgUnit',
  'tenant_org.org_unit.archive',
  'TENANT_SYSTEM_DENY'
)
