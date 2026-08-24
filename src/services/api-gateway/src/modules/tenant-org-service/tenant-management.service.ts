import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { VerifiedTenantTarget } from '../../common/tenant-target'
import { IdentityTenantAccountStatsGrpcAdapter } from './adapters/identity-tenant-account-stats-grpc.adapter'
import { IdentityUserLookupGrpcAdapter } from './adapters/identity-user-lookup-grpc.adapter'
import { TenantOrgManagementGrpcAdapter } from './adapters/tenant-org-management-grpc.adapter'
import { TenantOrgQueryGrpcAdapter } from './adapters/tenant-org-query-grpc.adapter'

@Injectable()
// Builds the system-admin tenant management read/write model on top of tenant-org-service contracts.
export class TenantManagementService {
  constructor(
    private readonly tenantOrgQueryAdapter: TenantOrgQueryGrpcAdapter,
    private readonly tenantOrgManagementAdapter: TenantOrgManagementGrpcAdapter,
    private readonly identityUserLookupAdapter: IdentityUserLookupGrpcAdapter,
    private readonly identityTenantAccountStatsAdapter: IdentityTenantAccountStatsGrpcAdapter
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

    const tenantItems = (result.tenants ?? []).map((tenant) => ({
      id: tenant.id ?? '',
      code: tenant.code ?? '',
      employeeCodePrefix: tenant.employeeCodePrefix ?? '',
      name: tenant.name ?? '',
      status: normalizeTenantStatus(tenant),
      ...withOptionalWebsiteUrl(tenant.websiteUrl)
    }))
    const tenantIds = tenantItems.map((tenant) => tenant.id).filter(Boolean)
    const accountCounts =
      tenantIds.length > 0
        ? await this.identityTenantAccountStatsAdapter.countTenantAccounts(
            {
              scopeLevel: 'TENANT',
              status: 'ENABLED',
              tenantIds
            },
            source
          )
        : { counts: [] }
    const accountCountMap = new Map(
      (accountCounts.counts ?? []).map((count) => [count.tenantId ?? '', Number(count.total ?? 0)])
    )

    return {
      items: tenantItems.map((tenant) => ({
        ...tenant,
        userCount: accountCountMap.get(tenant.id) ?? 0
      })),
      page,
      pageSize,
      total: Number(result.total ?? 0)
    }
  }

  async getTenantById(tenantId: VerifiedTenantTarget, source: DownstreamRequestSource) {
    this.assertSystemScope(source)
    const result = await this.tenantOrgQueryAdapter.getTenantById(tenantId, source)
    const tenant = result.tenant

    if (!tenant?.id) {
      throw new NotFoundException('Tenant not found')
    }

    const rootOrgId = normalize(tenant.rootOrgId)
    const rootOrg =
      rootOrgId
        ? await this.tenantOrgQueryAdapter.getOrgUnitById(
            {
              tenantId,
              orgUnitId: rootOrgId
            },
            source
          )
        : undefined
    const accountCounts = await this.identityTenantAccountStatsAdapter.countTenantAccounts(
      {
        scopeLevel: 'TENANT',
        status: 'ENABLED',
        tenantIds: [tenant.id]
      },
      source
    )
    const userCount = Number(accountCounts.counts?.[0]?.total ?? 0)

    return {
      tenant: {
        id: tenant.id,
        code: tenant.code ?? '',
        employeeCodePrefix: tenant.employeeCodePrefix ?? '',
        name: tenant.name ?? '',
        rootOrgId,
        rootOrgName: normalize(rootOrg?.orgUnit?.name),
        status: normalizeTenantStatus(tenant),
        userCount,
        ...withOptionalWebsiteUrl(tenant.websiteUrl)
      }
    }
  }

  async createTenant(
    input: { code: string; employeeCodePrefix: string; name: string; rootOrgName?: string },
    source: DownstreamRequestSource
  ) {
    this.assertSystemScope(source)
    return this.tenantOrgManagementAdapter.createTenant(
      {
        code: requireNonBlank(input.code, 'code'),
        employeeCodePrefix: normalizeEmployeeCodePrefix(input.employeeCodePrefix),
        name: requireNonBlank(input.name, 'name'),
        rootOrgName: normalize(input.rootOrgName)
      },
      source
    )
  }

  async searchFirstAdminExistingUsers(
    query: { countryOrRegion?: string; keyword?: string },
    source: DownstreamRequestSource
  ) {
    this.assertSystemScope(source)
    const keyword = requireNonBlank(query.keyword ?? '', 'keyword')
    if (keyword.includes('@')) {
      if (!isCompleteEmailLookupKeyword(keyword)) {
        return { items: [] }
      }
      const result = await this.identityUserLookupAdapter.getUserByEmail(keyword.toLowerCase(), source)
      const user = result.user

      if (!user?.id) {
        return { items: [] }
      }

      return toFirstAdminUserCandidateResult(user)
    }

    const phoneCandidates = buildPhoneLookupCandidates(keyword, query.countryOrRegion)
    for (const phone of phoneCandidates) {
      const result = await this.identityUserLookupAdapter.getUserByPhone(phone, source)
      if (result.user?.id) {
        return toFirstAdminUserCandidateResult(result.user)
      }
    }
    return { items: [] }
  }

  async startTenantOnboarding(input: {
    idempotencyKey: string
    tenant: { code: string; employeeCodePrefix: string; name: string }
    organizationTenantParty: {
      legalName: string
      registeredCountry?: string
      identifiers?: Array<{
        identifierType: string
        rawValue?: string
        normalizedValue?: string
        issuerCountryOrRegion?: string
      }>
    }
    rootOrg: { name: string }
    firstAdmin: {
      displayName: string
      email?: string
      existingUserId?: string
      phone?: string
      provisioningMode?: string
      requirePasswordSetup?: boolean
    }
  }, source: DownstreamRequestSource) {
    this.assertSystemScope(source)
    const firstAdminProvisioningMode =
      input.firstAdmin.provisioningMode === 'EXISTING_USER' ? 'EXISTING_USER' : 'CREATE_NEW_USER'
    const existingUserId =
      firstAdminProvisioningMode === 'EXISTING_USER'
        ? requireNonBlank(input.firstAdmin.existingUserId ?? '', 'firstAdmin.existingUserId')
        : undefined
    const result = await this.tenantOrgManagementAdapter.startTenantOnboarding(
      {
        idempotencyKey: requireNonBlank(input.idempotencyKey, 'idempotencyKey'),
        tenant: {
          code: requireNonBlank(input.tenant.code, 'tenant.code'),
          employeeCodePrefix: normalizeEmployeeCodePrefix(input.tenant.employeeCodePrefix),
          name: requireNonBlank(input.tenant.name, 'tenant.name')
        },
        organizationTenantParty: {
          legalName: requireNonBlank(input.organizationTenantParty.legalName, 'organizationTenantParty.legalName'),
          registeredCountry: normalize(input.organizationTenantParty.registeredCountry),
          identifiers: normalizeOrganizationIdentifiers(
            input.organizationTenantParty.identifiers,
            input.organizationTenantParty.registeredCountry
          )
        },
        rootOrg: {
          name: requireNonBlank(input.rootOrg.name, 'rootOrg.name')
        },
        firstAdmin: {
          displayName: requireNonBlank(input.firstAdmin.displayName, 'firstAdmin.displayName'),
          email: firstAdminProvisioningMode === 'EXISTING_USER' ? undefined : normalize(input.firstAdmin.email),
          existingUserId,
          phone: firstAdminProvisioningMode === 'EXISTING_USER' ? undefined : normalize(input.firstAdmin.phone),
          provisioningMode: firstAdminProvisioningMode,
          requirePasswordSetup:
            firstAdminProvisioningMode === 'EXISTING_USER'
              ? false
              : input.firstAdmin.requirePasswordSetup ?? true
        }
      },
      source
    )
    assertTenantOnboardingAccepted(result.onboarding)
    return result
  }

  async getTenantOnboarding(onboardingId: string, source: DownstreamRequestSource) {
    this.assertSystemScope(source)
    return this.tenantOrgManagementAdapter.getTenantOnboarding(requireNonBlank(onboardingId, 'onboardingId'), source)
  }

  async retryTenantOnboarding(onboardingId: string, input: { reason?: string }, source: DownstreamRequestSource) {
    this.assertSystemScope(source)
    const result = await this.tenantOrgManagementAdapter.retryTenantOnboarding(
      {
        onboardingId: requireNonBlank(onboardingId, 'onboardingId'),
        reason: normalize(input.reason)
      },
      source
    )
    assertTenantOnboardingAccepted(result.onboarding)
    return result
  }

  async updateTenantProfile(
    tenantId: VerifiedTenantTarget,
    input: { code?: string; employeeCodePrefix?: string; name?: string; websiteUrl?: string },
    source: DownstreamRequestSource
  ) {
    this.assertSystemScope(source)
    return this.tenantOrgManagementAdapter.updateTenantProfile(
      {
        tenantId,
        code: normalize(input.code),
        employeeCodePrefix: input.employeeCodePrefix === undefined ? undefined : normalizeEmployeeCodePrefix(input.employeeCodePrefix),
        name: normalize(input.name),
        ...withOptionalWebsiteUrl(input.websiteUrl)
      },
      source
    )
  }

  async updateTenantStatus(
    tenantId: VerifiedTenantTarget,
    input: { reason?: string; status: string },
    source: DownstreamRequestSource
  ) {
    this.assertSystemScope(source)
    const status = requireNonBlank(input.status, 'status').toUpperCase()
    const reason = normalize(input.reason)

    switch (status) {
      case 'ACTIVE': {
        return this.tenantOrgManagementAdapter.reactivateTenant(
          { tenantId },
          source
        )
      }
      case 'ARCHIVED': {
        return this.tenantOrgManagementAdapter.archiveTenant(
          { tenantId, reason },
          source
        )
      }
      case 'SUSPENDED': {
        return this.tenantOrgManagementAdapter.suspendTenant(
          { tenantId, reason },
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

function withOptionalWebsiteUrl(value?: string): { websiteUrl?: string } {
  const websiteUrl = normalize(value)
  return websiteUrl ? { websiteUrl } : {}
}

function normalizeEmployeeCodePrefix(value?: string): string {
  const normalized = value?.trim().toUpperCase()
  if (!normalized || !/^[0-9A-F]{3}$/.test(normalized)) {
    throw new BadRequestException('employeeCodePrefix must be a 3 digit hexadecimal value')
  }
  return normalized
}

function requireNonBlank(value: string, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw new NotFoundException(`${fieldName} is required`)
  }
  return normalized
}

// normalizeOrganizationIdentifiers validates tenant-scoped organization identifiers before forwarding to tenant-org-service.
function normalizeOrganizationIdentifiers(
  identifiers: Array<{
    identifierType: string
    rawValue?: string
    normalizedValue?: string
    issuerCountryOrRegion?: string
  }> | undefined,
  registeredCountry?: string
) {
  if (!identifiers?.length) {
    throw new BadRequestException('organizationTenantParty.identifiers is required')
  }

  return identifiers.map((identifier, index) => {
    const rawValue = normalize(identifier.rawValue) ?? normalize(identifier.normalizedValue)
    const normalizedValue = normalizeIdentifierValue(rawValue, `organizationTenantParty.identifiers[${index}].rawValue`)
    const issuerCountryOrRegion = requireNonBlank(
      normalize(identifier.issuerCountryOrRegion) ?? normalize(registeredCountry) ?? '',
      `organizationTenantParty.identifiers[${index}].issuerCountryOrRegion`
    )

    return {
      identifierType: requireNonBlank(identifier.identifierType, `organizationTenantParty.identifiers[${index}].identifierType`),
      issuerCountryOrRegion,
      normalizedValue,
      rawValue
    }
  })
}

// normalizeIdentifierValue creates the stable value used by party-service uniqueness checks.
function normalizeIdentifierValue(value: string | undefined, fieldName: string): string {
  const normalized = requireNonBlank(value ?? '', fieldName).toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required`)
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

// assertTenantOnboardingAccepted maps immediately failed Saga runs to HTTP errors while preserving retry handles.
function assertTenantOnboardingAccepted(onboarding?: {
  failure?: { code?: string; failedStep?: string; message?: string; retryable?: boolean }
  onboardingId?: string
  status?: string
}) {
  const status = normalize(onboarding?.status)
  if (!status?.startsWith('FAILED')) {
    return
  }

  const failure = onboarding?.failure
  const retryable = failure?.retryable !== false
  throw new HttpException(
    {
      code: failure?.code || 'TENANT_ONBOARDING_FAILED',
      message: failure?.message || 'Tenant onboarding failed',
      messageKey: 'tenant.onboarding.failed',
      details: {
        onboarding
      }
    },
    retryable ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.FAILED_DEPENDENCY
  )
}

function maskEmail(value?: string): string | undefined {
  const email = normalize(value)
  if (!email) return undefined
  const [name, domain] = email.split('@')
  if (!name || !domain) return email
  return `${name.slice(0, 2)}***@${domain}`
}

function maskPhone(value?: string): string | undefined {
  const phone = normalize(value)
  if (!phone) return undefined
  return phone.length > 6 ? `${phone.slice(0, 3)}***${phone.slice(-4)}` : phone
}

function isCompleteEmailLookupKeyword(keyword: string): boolean {
  return /^[^\s@]+@(?:[^\s@.]+\.)+[A-Za-z]{2,}$/.test(keyword.trim())
}

// buildPhoneLookupCandidates maps common phone input formats to canonical identity login phones.
function buildPhoneLookupCandidates(keyword: string, countryOrRegion?: string): string[] {
  const compact = keyword.trim().replace(/[\s().-]/g, '')
  const digits = compact.replace(/\D/g, '')
  if (!digits) return []

  const candidates: string[] = []
  const country = normalize(countryOrRegion)?.toUpperCase()
  if (compact.startsWith('+')) {
    const candidate = `+${digits}`
    if (isCanonicalLookupPhone(candidate)) candidates.push(candidate)
  } else if (compact.startsWith('00') && digits.length > 2) {
    const candidate = `+${digits.slice(2)}`
    if (isCanonicalLookupPhone(candidate)) candidates.push(candidate)
  } else {
    if ((country === 'US' || country === 'CA') && digits.length === 10) {
      candidates.push(`+1${digits}`)
    }
    if ((country === 'US' || country === 'CA') && digits.length === 11 && digits.startsWith('1')) {
      candidates.push(`+${digits}`)
    }
    if (country === 'CN' && digits.length === 11 && digits.startsWith('1')) {
      candidates.push(`+86${digits}`)
    }
    if (country === 'SG' && digits.length === 8) {
      candidates.push(`+65${digits}`)
    }
  }

  return [...new Set(candidates)]
}

function isCanonicalLookupPhone(phone: string): boolean {
  return /^\+[1-9]\d{5,19}$/.test(phone)
}

function toFirstAdminUserCandidateResult(user: {
  id?: string
  username?: string
  personalEmail?: string
  personalPhone?: string
  isActive?: boolean
}) {
  if (!user.id) return { items: [] }
  return {
    items: [
      {
        userId: user.id,
        displayName: normalize(user.username) ?? normalize(user.personalEmail) ?? normalize(user.personalPhone) ?? user.id,
        maskedEmail: maskEmail(user.personalEmail),
        maskedPhone: maskPhone(user.personalPhone),
        isActive: user.isActive !== false
      }
    ]
  }
}
