import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
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
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'

const CALLER = 'api-gateway'

export interface TenantManagementMutationTenant {
  code?: string
  id?: string
  name?: string
  rootOrgId?: string
  status?: string
}

export interface TenantManagementMutationOrgUnit {
  depth?: number
  id?: string
  name?: string
  organizationPartyId?: string
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
  organizationParty?: { partyId?: string; tenantPartyId?: string }
  firstAdmin?: { userId?: string; accountId?: string; personPartyId?: string; tenantPartyId?: string }
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
    @InjectGrpcClient(SERVICE_NAMES.TENANT_ORG)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<TenantOrgManagementServiceClient>(
      TENANT_ORG_MANAGEMENT_SERVICE_NAME
    )
  }

  createTenant(
    input: { code: string; name: string; rootOrgName?: string },
    source: DownstreamRequestSource
  ): Promise<{ rootOrgUnit?: { id?: string; name?: string }; tenant?: TenantManagementMutationTenant }> {
    return this.call(
      'createTenant',
      this.svc.createTenant(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
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

  startTenantOnboarding(input: any, source: DownstreamRequestSource): Promise<{ onboarding?: TenantOnboardingGatewayResult }> {
    return this.call(
      'startTenantOnboarding',
      this.svc.startTenantOnboarding(
        {
          idempotencyKey: input.idempotencyKey,
          tenant: input.tenant,
          organizationParty: {
            legalName: input.organizationParty.legalName,
            registeredCountry: input.organizationParty.registeredCountry ?? '',
            identifiers: (input.organizationParty.identifiers ?? []).map((identifier: any) => ({
              identifierType: identifier.identifierType,
              rawValue: identifier.rawValue ?? '',
              normalizedValue: identifier.normalizedValue,
              issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? ''
            }))
          },
          rootOrg: input.rootOrg,
          firstAdmin: input.firstAdmin
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: StartTenantOnboardingResponse) => ({ onboarding: mapTenantOnboardingGatewayResult(response.onboarding) })
    )
  }

  getTenantOnboarding(onboardingId: string, source: DownstreamRequestSource): Promise<{ onboarding?: TenantOnboardingGatewayResult }> {
    return this.call(
      'getTenantOnboarding',
      this.svc.getTenantOnboarding(
        { onboardingId },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: GetTenantOnboardingResponse) => ({ onboarding: mapTenantOnboardingGatewayResult(response.onboarding) })
    )
  }

  retryTenantOnboarding(
    input: { onboardingId: string; reason?: string },
    source: DownstreamRequestSource
  ): Promise<{ onboarding?: TenantOnboardingGatewayResult }> {
    return this.call(
      'retryTenantOnboarding',
      this.svc.retryTenantOnboarding(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: RetryTenantOnboardingResponse) => ({ onboarding: mapTenantOnboardingGatewayResult(response.onboarding) })
    )
  }

  updateTenantProfile(
    input: { code?: string; name?: string; tenantId: string },
    source: DownstreamRequestSource
  ): Promise<{ tenant?: TenantManagementMutationTenant }> {
    return this.call(
      'updateTenantProfile',
      this.svc.updateTenantProfile(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: UpdateTenantProfileResponse) => ({
        tenant: response.tenant ? mapTenant(response.tenant) : undefined
      })
    )
  }

  suspendTenant(
    input: { reason?: string; tenantId: string },
    source: DownstreamRequestSource
  ): Promise<{ tenant?: TenantManagementMutationTenant }> {
    return this.call(
      'suspendTenant',
      this.svc.suspendTenant(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: SuspendTenantResponse) => ({
        tenant: response.tenant ? mapTenant(response.tenant) : undefined
      })
    )
  }

  reactivateTenant(
    input: { tenantId: string },
    source: DownstreamRequestSource
  ): Promise<{ tenant?: TenantManagementMutationTenant }> {
    return this.call(
      'reactivateTenant',
      this.svc.reactivateTenant(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: ReactivateTenantResponse) => ({
        tenant: response.tenant ? mapTenant(response.tenant) : undefined
      })
    )
  }

  archiveTenant(
    input: { reason?: string; tenantId: string },
    source: DownstreamRequestSource
  ): Promise<{ tenant?: TenantManagementMutationTenant }> {
    return this.call(
      'archiveTenant',
      this.svc.archiveTenant(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: ArchiveTenantResponse) => ({
        tenant: response.tenant ? mapTenant(response.tenant) : undefined
      })
    )
  }

  createOrgUnit(
    input: {
      name: string
      organizationPartyId?: string
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
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: CreateOrgUnitResponse) => ({
        orgUnit: response.orgUnit ? mapOrgUnit(response.orgUnit) : undefined
      })
    )
  }

  updateOrgUnit(
    input: {
      name?: string
      orgUnitId: string
      organizationPartyId?: string | null
      sortOrder?: number
      tenantId: string
      type?: string
    },
    source: DownstreamRequestSource
  ): Promise<{ orgUnit?: TenantManagementMutationOrgUnit }> {
    return this.call(
      'updateOrgUnit',
      this.svc.updateOrgUnit(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: UpdateOrgUnitResponse) => ({
        orgUnit: response.orgUnit ? mapOrgUnit(response.orgUnit) : undefined
      })
    )
  }

  moveOrgUnit(
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
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: MoveOrgUnitResponse) => ({
        orgUnit: response.orgUnit ? mapOrgUnit(response.orgUnit) : undefined
      })
    )
  }

  archiveOrgUnit(
    input: { orgUnitId: string; tenantId: string },
    source: DownstreamRequestSource
  ): Promise<{ orgUnit?: TenantManagementMutationOrgUnit }> {
    return this.call(
      'archiveOrgUnit',
      this.svc.archiveOrgUnit(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
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
  id?: string
  name?: string
  rootOrgId?: string
  status?: string
}): TenantManagementMutationTenant {
  return {
    id: tenant.id,
    code: tenant.code,
    name: tenant.name,
    status: tenant.status,
    rootOrgId: normalize(tenant.rootOrgId)
  }
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function mapOrgUnit(orgUnit: {
  depth?: number
  id?: string
  name?: string
  organizationPartyId?: string
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
    organizationPartyId: normalize(orgUnit.organizationPartyId)
  }
}

export function mapTenantOnboardingGatewayResult(onboarding?: any): TenantOnboardingGatewayResult | undefined {
  if (!onboarding) return undefined
  return {
    onboardingId: onboarding.onboardingId,
    status: onboarding.status,
    tenant: onboarding.tenant ? mapTenant(onboarding.tenant) : undefined,
    rootOrg: onboarding.rootOrg ? mapOrgUnit(onboarding.rootOrg) : undefined,
    organizationParty: {
      partyId: normalize(onboarding.organizationParty?.partyId),
      tenantPartyId: normalize(onboarding.organizationParty?.tenantPartyId)
    },
    firstAdmin: {
      userId: normalize(onboarding.firstAdmin?.userId),
      accountId: normalize(onboarding.firstAdmin?.accountId),
      personPartyId: normalize(onboarding.firstAdmin?.personPartyId),
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
