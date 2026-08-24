import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  ArchiveOrgUnitResponse,
  ArchiveTenantResponse,
  CreateOrgUnitResponse,
  CreateTenantResponse,
  GetTenantOnboardingResponse,
  MoveOrgUnitResponse,
  ReactivateTenantResponse,
  RetryTenantOnboardingResponse,
  StartTenantOnboardingResponse,
  SuspendTenantResponse,
  TENANT_ORG_MANAGEMENT_SERVICE_NAME,
  TenantOrgManagementServiceClient,
  UpdateOrgUnitResponse,
  UpdateTenantProfileResponse
} from '@oes/common/generated/tenant_org_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { VerifiedTenantTarget } from '../../../common/tenant-target'
import {
  TENANTORG_TARGET_AUDIENCE,
  TrustedTenantOrgGrpcClient
} from '../../../infrastructure/grpc/trusted-tenant-org.grpc.client'
import { GatewayFoundationTrustedGrpcExecutionProducer } from '../../../infrastructure/grpc/trusted-auth.grpc.client'

const CALLER = 'api-gateway'

export interface TenantManagementMutationTenant {
  code?: string
  employeeCodePrefix?: string
  id?: string
  name?: string
  rootOrgId?: string
  status?: string
  websiteUrl?: string
}

export interface TenantManagementMutationOrgUnit {
  depth?: number
  id?: string
  name?: string
  organizationTenantPartyId?: string
  parentOrgId?: string
  path?: string
  sortOrder?: number
  status?: string
  tenantId?: string
  type?: string
}

export interface TenantOnboardingGatewayResult {
  onboardingId?: string
  status?: string
  tenant?: TenantManagementMutationTenant
  rootOrg?: TenantManagementMutationOrgUnit
  organizationTenantParty?: { tenantPartyId?: string }
  firstAdmin?: { userId?: string; accountId?: string; tenantPartyId?: string }
  firstAdminEmployee?: { employeeId?: string; employmentId?: string; accessProcessId?: string }
  access?: {
    roleCode?: string
    roleId?: string
    grantId?: string
    hrAdminRoleCode?: string
    hrAdminRoleId?: string
    hrAdminGrantId?: string
    accountBasicRoleCode?: string
    accountBasicRoleId?: string
  }
  steps?: Array<{ key?: string; status?: string; message?: string; attemptCount?: number }>
  failure?: { code?: string; message?: string; failedStep?: string; retryable?: boolean }
}

@Injectable()
// Proxies tenant lifecycle mutations from the gateway system-admin entry into tenant-org-service.
export class TenantOrgManagementGrpcAdapter implements OnModuleInit {
  private svc!: TenantOrgManagementServiceClient

  constructor(
    private readonly client: TrustedTenantOrgGrpcClient,
    private readonly trusted: GatewayFoundationTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client
      .getClient()
      .getService<TenantOrgManagementServiceClient>(TENANT_ORG_MANAGEMENT_SERVICE_NAME)
  }

  async createTenant(
    input: { code: string; employeeCodePrefix: string; name: string; rootOrgName?: string },
    source: DownstreamRequestSource
  ): Promise<{
    rootOrgUnit?: { id?: string; name?: string }
    tenant?: TenantManagementMutationTenant
  }> {
    return this.call(
      'createTenant',
      this.svc.createTenant(
        input,
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.tenant.create'
        ])
      ),
      (response: CreateTenantResponse) => ({
        tenant: response.tenant ? mapTenant(response.tenant) : undefined,
        rootOrgUnit: response.rootOrgUnit
          ? {
              id: response.rootOrgUnit.id,
              name: response.rootOrgUnit.name
            }
          : undefined
      })
    )
  }

  async startTenantOnboarding(
    input: any,
    source: DownstreamRequestSource
  ): Promise<{ onboarding?: TenantOnboardingGatewayResult }> {
    return this.call(
      'startTenantOnboarding',
      this.svc.startTenantOnboarding(
        {
          idempotencyKey: input.idempotencyKey,
          tenant: input.tenant,
          organizationTenantParty: {
            legalName: input.organizationTenantParty.legalName,
            registeredCountry: input.organizationTenantParty.registeredCountry ?? '',
            identifiers: (input.organizationTenantParty.identifiers ?? []).map(
              (identifier: any) => ({
                identifierType: identifier.identifierType,
                rawValue: identifier.rawValue ?? '',
                normalizedValue: identifier.normalizedValue,
                issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? ''
              })
            )
          },
          rootOrg: input.rootOrg,
          firstAdmin: input.firstAdmin
        },
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.tenant.create'
        ])
      ),
      (response: StartTenantOnboardingResponse) => ({
        onboarding: mapTenantOnboardingGatewayResult(response.onboarding)
      })
    )
  }

  async getTenantOnboarding(
    onboardingId: string,
    source: DownstreamRequestSource
  ): Promise<{ onboarding?: TenantOnboardingGatewayResult }> {
    return this.call(
      'getTenantOnboarding',
      this.svc.getTenantOnboarding(
        { onboardingId },
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.tenant.get_by_id'
        ])
      ),
      (response: GetTenantOnboardingResponse) => ({
        onboarding: mapTenantOnboardingGatewayResult(response.onboarding)
      })
    )
  }

  async retryTenantOnboarding(
    input: { onboardingId: string; reason?: string },
    source: DownstreamRequestSource
  ): Promise<{ onboarding?: TenantOnboardingGatewayResult }> {
    return this.call(
      'retryTenantOnboarding',
      this.svc.retryTenantOnboarding(
        input,
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.tenant.create'
        ])
      ),
      (response: RetryTenantOnboardingResponse) => ({
        onboarding: mapTenantOnboardingGatewayResult(response.onboarding)
      })
    )
  }

  async updateTenantProfile(
    input: {
      code?: string
      employeeCodePrefix?: string
      name?: string
      tenantId: VerifiedTenantTarget
      websiteUrl?: string
    },
    source: DownstreamRequestSource
  ): Promise<{ tenant?: TenantManagementMutationTenant }> {
    return this.call(
      'updateTenantProfile',
      this.svc.updateTenantProfile(
        input,
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.tenant.update_profile'
        ])
      ),
      (response: UpdateTenantProfileResponse) => ({
        tenant: response.tenant ? mapTenant(response.tenant) : undefined
      })
    )
  }

  async suspendTenant(
    input: { reason?: string; tenantId: VerifiedTenantTarget },
    source: DownstreamRequestSource
  ): Promise<{ tenant?: TenantManagementMutationTenant }> {
    return this.call(
      'suspendTenant',
      this.svc.suspendTenant(
        input,
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.tenant.update_status'
        ])
      ),
      (response: SuspendTenantResponse) => ({
        tenant: response.tenant ? mapTenant(response.tenant) : undefined
      })
    )
  }

  async reactivateTenant(
    input: { tenantId: VerifiedTenantTarget },
    source: DownstreamRequestSource
  ): Promise<{ tenant?: TenantManagementMutationTenant }> {
    return this.call(
      'reactivateTenant',
      this.svc.reactivateTenant(
        input,
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.tenant.update_status'
        ])
      ),
      (response: ReactivateTenantResponse) => ({
        tenant: response.tenant ? mapTenant(response.tenant) : undefined
      })
    )
  }

  async archiveTenant(
    input: { reason?: string; tenantId: VerifiedTenantTarget },
    source: DownstreamRequestSource
  ): Promise<{ tenant?: TenantManagementMutationTenant }> {
    return this.call(
      'archiveTenant',
      this.svc.archiveTenant(
        input,
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.tenant.update_status'
        ])
      ),
      (response: ArchiveTenantResponse) => ({
        tenant: response.tenant ? mapTenant(response.tenant) : undefined
      })
    )
  }

  async createOrgUnit(
    input: {
      name: string
      organizationTenantPartyId?: string
      parentOrgId: string
      sortOrder?: number
      tenantId: string
      type: string
    },
    source: DownstreamRequestSource
  ): Promise<{ orgUnit?: TenantManagementMutationOrgUnit }> {
    return this.call(
      'createOrgUnit',
      this.svc.createOrgUnit(
        {
          ...input,
          organizationTenantPartyId: input.organizationTenantPartyId
        },
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.org_unit.create'
        ])
      ),
      (response: CreateOrgUnitResponse) => ({
        orgUnit: response.orgUnit ? mapOrgUnit(response.orgUnit) : undefined
      })
    )
  }

  async updateOrgUnit(
    input: {
      name?: string
      orgUnitId: string
      organizationTenantPartyId?: string | null
      sortOrder?: number
      tenantId: string
      type?: string
    },
    source: DownstreamRequestSource
  ): Promise<{ orgUnit?: TenantManagementMutationOrgUnit }> {
    return this.call(
      'updateOrgUnit',
      this.svc.updateOrgUnit(
        {
          ...input,
          organizationTenantPartyId: input.organizationTenantPartyId
        },
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.org_unit.update'
        ])
      ),
      (response: UpdateOrgUnitResponse) => ({
        orgUnit: response.orgUnit ? mapOrgUnit(response.orgUnit) : undefined
      })
    )
  }

  async moveOrgUnit(
    input: {
      newParentOrgId: string
      orgUnitId: string
      tenantId: string
    },
    source: DownstreamRequestSource
  ): Promise<{ orgUnit?: TenantManagementMutationOrgUnit }> {
    return this.call(
      'moveOrgUnit',
      this.svc.moveOrgUnit(
        input,
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.org_unit.update'
        ])
      ),
      (response: MoveOrgUnitResponse) => ({
        orgUnit: response.orgUnit ? mapOrgUnit(response.orgUnit) : undefined
      })
    )
  }

  async archiveOrgUnit(
    input: { orgUnitId: string; tenantId: string },
    source: DownstreamRequestSource
  ): Promise<{ orgUnit?: TenantManagementMutationOrgUnit }> {
    return this.call(
      'archiveOrgUnit',
      this.svc.archiveOrgUnit(
        input,
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.org_unit.archive'
        ])
      ),
      (response: ArchiveOrgUnitResponse) => ({
        orgUnit: response.orgUnit ? mapOrgUnit(response.orgUnit) : undefined
      })
    )
  }

  private call<TResponse, TResult>(
    method: string,
    call$: any,
    map: (response: TResponse) => TResult
  ): Promise<TResult> {
    return safeGrpcCall<TResponse>(call$, this.opts(method)).then(map)
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}

function mapTenant(tenant: {
  code?: string
  employeeCodePrefix?: string
  id?: string
  name?: string
  rootOrgId?: string
  status?: string
  websiteUrl?: string
}): TenantManagementMutationTenant {
  return {
    id: tenant.id,
    code: tenant.code,
    employeeCodePrefix: tenant.employeeCodePrefix,
    name: tenant.name,
    status: tenant.status,
    rootOrgId: normalize(tenant.rootOrgId),
    ...withOptionalWebsiteUrl(tenant.websiteUrl)
  }
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function withOptionalWebsiteUrl(value?: string): { websiteUrl?: string } {
  const websiteUrl = normalize(value)
  return websiteUrl ? { websiteUrl } : {}
}

function mapOrgUnit(orgUnit: {
  depth?: number
  id?: string
  name?: string
  organizationTenantPartyId?: string
  parentOrgId?: string
  path?: string
  sortOrder?: number
  status?: string
  tenantId?: string
  type?: string
}): TenantManagementMutationOrgUnit {
  return {
    id: orgUnit.id,
    tenantId: orgUnit.tenantId,
    parentOrgId: normalize(orgUnit.parentOrgId),
    name: orgUnit.name,
    type: orgUnit.type,
    status: orgUnit.status,
    path: orgUnit.path,
    depth: orgUnit.depth,
    sortOrder: orgUnit.sortOrder,
    organizationTenantPartyId: normalize(orgUnit.organizationTenantPartyId)
  }
}

export function mapTenantOnboardingGatewayResult(
  onboarding?: any
): TenantOnboardingGatewayResult | undefined {
  if (!onboarding) return undefined
  return {
    onboardingId: onboarding.onboardingId,
    status: onboarding.status,
    tenant: onboarding.tenant ? mapTenant(onboarding.tenant) : undefined,
    rootOrg: onboarding.rootOrg ? mapOrgUnit(onboarding.rootOrg) : undefined,
    organizationTenantParty: {
      tenantPartyId: normalize(onboarding.organizationTenantParty?.tenantPartyId)
    },
    firstAdmin: {
      userId: normalize(onboarding.firstAdmin?.userId),
      accountId: normalize(onboarding.firstAdmin?.accountId),
      tenantPartyId: normalize(onboarding.firstAdmin?.tenantPartyId)
    },
    firstAdminEmployee: {
      employeeId: normalize(onboarding.firstAdminEmployee?.employeeId),
      employmentId: normalize(onboarding.firstAdminEmployee?.employmentId),
      accessProcessId: normalize(onboarding.firstAdminEmployee?.accessProcessId)
    },
    access: {
      roleCode: normalize(onboarding.access?.roleCode),
      roleId: normalize(onboarding.access?.roleId),
      grantId: normalize(onboarding.access?.grantId),
      hrAdminRoleCode: normalize(onboarding.access?.hrAdminRoleCode),
      hrAdminRoleId: normalize(onboarding.access?.hrAdminRoleId),
      hrAdminGrantId: normalize(onboarding.access?.hrAdminGrantId),
      accountBasicRoleCode: normalize(onboarding.access?.accountBasicRoleCode),
      accountBasicRoleId: normalize(onboarding.access?.accountBasicRoleId)
    },
    steps: onboarding.steps ?? [],
    failure: onboarding.failure?.code ? onboarding.failure : undefined
  }
}
