import { Controller, UseGuards, UseInterceptors } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import {
  RequirePermissions,
  AuthenticatedOperatorGuard,
  GrpcRequestContextInterceptor,
  InternalServiceGuard,
  PermissionGuard,
  RequireAuthenticatedOperator,
  TENANT_ORG_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
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
@Controller()
@RequireAuthenticatedOperator()
@UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
@UseInterceptors(GrpcRequestContextInterceptor)
@TenantOrgManagementServiceControllerMethods()
export class TenantOrgManagementGrpcController implements TenantOrgManagementServiceController {
  constructor(
    private readonly tenantOrgManagementService: TenantOrgManagementService,
    private readonly tenantOnboardingService: TenantOnboardingService
  ) {}

  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.CREATE_TENANT] })
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

  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.CREATE_TENANT] })
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
      organizationParty: {
        legalName: request.organizationParty?.legalName ?? '',
        registeredCountry: request.organizationParty?.registeredCountry || undefined,
        identifiers:
          request.organizationParty?.identifiers?.map((identifier) => ({
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

  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.VIEW_TENANT_DETAIL] })
  async getTenantOnboarding(
    request: GetTenantOnboardingRequest,
    _metadata?: Metadata
  ): Promise<GetTenantOnboardingResponse> {
    return {
      onboarding: mapOnboarding(await this.tenantOnboardingService.get(request.onboardingId ?? ''))
    }
  }

  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.CREATE_TENANT] })
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

  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_TENANT_PROFILE] })
  async updateTenantProfile(
    _request: UpdateTenantProfileRequest,
    _metadata?: Metadata
  ): Promise<UpdateTenantProfileResponse> {
    const tenant = await this.tenantOrgManagementService.updateTenantProfile({
      tenantId: _request.tenantId ?? '',
      name: _request.name || undefined,
      code: _request.code || undefined,
      employeeCodePrefix: _request.employeeCodePrefix || undefined
    })
    return { tenant: mapTenant(tenant) }
  }

  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_TENANT_STATUS] })
  async suspendTenant(
    _request: SuspendTenantRequest,
    _metadata?: Metadata
  ): Promise<SuspendTenantResponse> {
    const tenant = await this.tenantOrgManagementService.suspendTenant({
      tenantId: _request.tenantId ?? '',
      reason: _request.reason || undefined
    })
    return { tenant: mapTenant(tenant) }
  }

  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_TENANT_STATUS] })
  async reactivateTenant(
    _request: ReactivateTenantRequest,
    _metadata?: Metadata
  ): Promise<ReactivateTenantResponse> {
    const tenant = await this.tenantOrgManagementService.reactivateTenant({
      tenantId: _request.tenantId ?? ''
    })
    return { tenant: mapTenant(tenant) }
  }

  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_TENANT_STATUS] })
  async archiveTenant(
    _request: ArchiveTenantRequest,
    _metadata?: Metadata
  ): Promise<ArchiveTenantResponse> {
    const tenant = await this.tenantOrgManagementService.archiveTenant({
      tenantId: _request.tenantId ?? '',
      reason: _request.reason || undefined
    })
    return { tenant: mapTenant(tenant) }
  }

  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.CREATE_ORG_UNIT] })
  async createOrgUnit(
    _request: CreateOrgUnitRequest,
    _metadata?: Metadata
  ): Promise<CreateOrgUnitResponse> {
    const orgUnit = await this.tenantOrgManagementService.createOrgUnit({
      tenantId: _request.tenantId ?? '',
      parentOrgId: _request.parentOrgId ?? '',
      name: _request.name ?? '',
      type: _request.type ?? '',
      sortOrder: _request.sortOrder,
      organizationPartyId: _request.organizationPartyId?.trim() || undefined
    })
    return { orgUnit: mapOrgUnit(orgUnit) }
  }

  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_ORG_UNIT] })
  async updateOrgUnit(
    _request: UpdateOrgUnitRequest,
    _metadata?: Metadata
  ): Promise<UpdateOrgUnitResponse> {
    const hasOrganizationPartyId = Object.prototype.hasOwnProperty.call(
      _request,
      'organizationPartyId'
    )
    const orgUnit = await this.tenantOrgManagementService.updateOrgUnit({
      tenantId: _request.tenantId ?? '',
      orgUnitId: _request.orgUnitId ?? '',
      name: _request.name || undefined,
      type: _request.type || undefined,
      sortOrder: _request.sortOrder,
      organizationPartyId: hasOrganizationPartyId
        ? _request.organizationPartyId?.trim() || null
        : undefined
    })
    return { orgUnit: mapOrgUnit(orgUnit) }
  }

  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_ORG_UNIT] })
  async moveOrgUnit(
    _request: MoveOrgUnitRequest,
    _metadata?: Metadata
  ): Promise<MoveOrgUnitResponse> {
    const orgUnit = await this.tenantOrgManagementService.moveOrgUnit({
      tenantId: _request.tenantId ?? '',
      orgUnitId: _request.orgUnitId ?? '',
      newParentOrgId: _request.newParentOrgId ?? ''
    })
    return { orgUnit: mapOrgUnit(orgUnit) }
  }

  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.ARCHIVE_ORG_UNIT] })
  async archiveOrgUnit(
    _request: ArchiveOrgUnitRequest,
    _metadata?: Metadata
  ): Promise<ArchiveOrgUnitResponse> {
    const orgUnit = await this.tenantOrgManagementService.archiveOrgUnit({
      tenantId: _request.tenantId ?? '',
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
}) {
  return {
    id: tenant.id,
    code: tenant.code,
    employeeCodePrefix: tenant.employeeCodePrefix,
    name: tenant.name,
    status: String(tenant.status),
    rootOrgId: tenant.rootOrgId ?? ''
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
  organizationPartyId: string | null
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
    organizationPartyId: orgUnit.organizationPartyId ?? ''
  }
}

/** mapOnboarding converts application onboarding Saga state to the gRPC response contract. */
function mapOnboarding(result: TenantOnboardingResult) {
  return {
    onboardingId: result.onboardingId,
    status: result.status,
    tenant: result.tenant ? mapTenant(result.tenant) : undefined,
    rootOrg: result.rootOrg ? mapOrgUnit(result.rootOrg) : undefined,
    organizationParty: {
      partyId: result.organizationParty?.partyId ?? '',
      tenantPartyId: result.organizationParty?.tenantPartyId ?? ''
    },
    firstAdmin: {
      userId: result.firstAdmin?.userId ?? '',
      accountId: result.firstAdmin?.accountId ?? '',
      personPartyId: result.firstAdmin?.personPartyId ?? '',
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
