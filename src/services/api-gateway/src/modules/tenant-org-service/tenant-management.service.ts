import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { TenantOrgManagementGrpcAdapter } from './adapters/tenant-org-management-grpc.adapter'
import { TenantOrgQueryGrpcAdapter } from './adapters/tenant-org-query-grpc.adapter'

@Injectable()
// Builds the system-admin tenant management read/write model on top of tenant-org-service contracts.
export class TenantManagementService {
  constructor(
    private readonly tenantOrgQueryAdapter: TenantOrgQueryGrpcAdapter,
    private readonly tenantOrgManagementAdapter: TenantOrgManagementGrpcAdapter
  ) {}

  async listTenants(
    query: { keyword?: string; page?: number; pageSize?: number; status?: string },
    source: DownstreamRequestSource
  ) {
    this.assertSystemScope(source)
    const page = Math.max(query.page ?? 1, 1)
    const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 100)
    const result = await this.tenantOrgQueryAdapter.listTenants(
      {
        keyword: normalize(query.keyword),
        page,
        pageSize,
        status: normalize(query.status)
      },
      source
    )

    return {
      items: (result.tenants ?? []).map((tenant) => ({
        id: tenant.id ?? '',
        code: tenant.code ?? '',
        name: tenant.name ?? '',
        rootOrgId: normalize(tenant.rootOrgId),
        status: normalizeTenantStatus(tenant)
      })),
      page,
      pageSize,
      total: Number(result.total ?? 0)
    }
  }

  async getTenantById(tenantId: string, source: DownstreamRequestSource) {
    this.assertSystemScope(source)
    const normalizedTenantId = requireNonBlank(tenantId, 'tenantId')
    const result = await this.tenantOrgQueryAdapter.getTenantById(normalizedTenantId, source)
    const tenant = result.tenant

    if (!tenant?.id) {
      throw new NotFoundException('Tenant not found')
    }

    const rootOrgId = normalize(tenant.rootOrgId)
    const rootOrg =
      rootOrgId
        ? await this.tenantOrgQueryAdapter.getOrgUnitById(
            {
              tenantId: normalizedTenantId,
              orgUnitId: rootOrgId
            },
            source
          )
        : undefined

    return {
      tenant: {
        id: tenant.id,
        code: tenant.code ?? '',
        name: tenant.name ?? '',
        rootOrgId,
        rootOrgName: normalize(rootOrg?.orgUnit?.name),
        status: normalizeTenantStatus(tenant)
      }
    }
  }

  async createTenant(
    input: { code: string; name: string; rootOrgName?: string },
    source: DownstreamRequestSource
  ) {
    this.assertSystemScope(source)
    return this.tenantOrgManagementAdapter.createTenant(
      {
        code: requireNonBlank(input.code, 'code'),
        name: requireNonBlank(input.name, 'name'),
        rootOrgName: normalize(input.rootOrgName)
      },
      source
    )
  }

  async startTenantOnboarding(input: {
    idempotencyKey: string
    tenant: { code: string; name: string }
    organizationParty: {
      legalName: string
      registeredCountry?: string
      identifiers?: Array<{
        identifierType: string
        rawValue?: string
        normalizedValue: string
        issuerCountryOrRegion?: string
      }>
    }
    rootOrg: { name: string }
    firstAdmin: { displayName: string; email?: string; phone?: string; requirePasswordSetup?: boolean }
  }, source: DownstreamRequestSource) {
    this.assertSystemScope(source)
    return this.tenantOrgManagementAdapter.startTenantOnboarding(
      {
        idempotencyKey: requireNonBlank(input.idempotencyKey, 'idempotencyKey'),
        tenant: {
          code: requireNonBlank(input.tenant.code, 'tenant.code'),
          name: requireNonBlank(input.tenant.name, 'tenant.name')
        },
        organizationParty: {
          legalName: requireNonBlank(input.organizationParty.legalName, 'organizationParty.legalName'),
          registeredCountry: normalize(input.organizationParty.registeredCountry),
          identifiers: input.organizationParty.identifiers ?? []
        },
        rootOrg: {
          name: requireNonBlank(input.rootOrg.name, 'rootOrg.name')
        },
        firstAdmin: {
          displayName: requireNonBlank(input.firstAdmin.displayName, 'firstAdmin.displayName'),
          email: normalize(input.firstAdmin.email),
          phone: normalize(input.firstAdmin.phone),
          requirePasswordSetup: input.firstAdmin.requirePasswordSetup ?? true
        }
      },
      source
    )
  }

  async getTenantOnboarding(onboardingId: string, source: DownstreamRequestSource) {
    this.assertSystemScope(source)
    return this.tenantOrgManagementAdapter.getTenantOnboarding(requireNonBlank(onboardingId, 'onboardingId'), source)
  }

  async retryTenantOnboarding(onboardingId: string, input: { reason?: string }, source: DownstreamRequestSource) {
    this.assertSystemScope(source)
    return this.tenantOrgManagementAdapter.retryTenantOnboarding(
      {
        onboardingId: requireNonBlank(onboardingId, 'onboardingId'),
        reason: normalize(input.reason)
      },
      source
    )
  }

  async updateTenantProfile(
    tenantId: string,
    input: { code?: string; name?: string },
    source: DownstreamRequestSource
  ) {
    this.assertSystemScope(source)
    return this.tenantOrgManagementAdapter.updateTenantProfile(
      {
        tenantId: requireNonBlank(tenantId, 'tenantId'),
        code: normalize(input.code),
        name: normalize(input.name)
      },
      source
    )
  }

  async updateTenantStatus(
    tenantId: string,
    input: { reason?: string; status: string },
    source: DownstreamRequestSource
  ) {
    this.assertSystemScope(source)
    const normalizedTenantId = requireNonBlank(tenantId, 'tenantId')
    const status = requireNonBlank(input.status, 'status').toUpperCase()
    const reason = normalize(input.reason)

    switch (status) {
      case 'ACTIVE': {
        return this.tenantOrgManagementAdapter.reactivateTenant(
          { tenantId: normalizedTenantId },
          source
        )
      }
      case 'ARCHIVED': {
        return this.tenantOrgManagementAdapter.archiveTenant(
          { tenantId: normalizedTenantId, reason },
          source
        )
      }
      case 'SUSPENDED': {
        return this.tenantOrgManagementAdapter.suspendTenant(
          { tenantId: normalizedTenantId, reason },
          source
        )
      }
      default: {
        throw new ForbiddenException(`Unsupported tenant status: ${status}`)
      }
    }
  }

  private assertSystemScope(source: DownstreamRequestSource) {
    if (source.user?.scopeLevel !== 'SYSTEM') {
      throw new ForbiddenException('Only system administrators can manage tenants')
    }
  }
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function requireNonBlank(value: string, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw new NotFoundException(`${fieldName} is required`)
  }
  return normalized
}

function normalizeTenantStatus(input: { isActive?: boolean; status?: string }): string {
  const explicitStatus = normalize(input.status)?.toUpperCase()
  if (explicitStatus) {
    return explicitStatus
  }
  return input.isActive === false ? 'SUSPENDED' : 'ACTIVE'
}
