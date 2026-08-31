import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import {
  ORG_UNIT_REPOSITORY,
  OrgUnitRepository,
  TENANT_REPOSITORY,
  TenantRepository
} from '../../domain/repositories'
import { OrgUnitStatus, TenantStatus } from '../../domain/value-objects'

/** TenantOrgQueryService provides read-only tenant, org tree, hierarchy, and org reference lookups. */
@Injectable()
export class TenantOrgQueryService {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
    @Inject(ORG_UNIT_REPOSITORY)
    private readonly orgUnitRepository: OrgUnitRepository
  ) {}

  async getTenantById(tenantId: string) {
    return this.tenantRepository.findById(requireNonBlank(tenantId, 'tenantId'))
  }

  /** Resolves the minimum TenantOrg-owned company and optional department projection. */
  async resolvePublicBusinessCardOrganization(input: {
    tenantId: string
    orgUnitId?: string | null
  }) {
    const tenantId = requireNonBlank(input.tenantId, 'tenantId')
    const tenant = await this.tenantRepository.findById(tenantId)
    if (
      !tenant ||
      tenant.id !== tenantId ||
      tenant.status !== TenantStatus.ACTIVE ||
      !tenant.name.trim()
    ) {
      return { available: false as const, reasonCode: 'TENANT_UNAVAILABLE' }
    }
    const orgUnitId = input.orgUnitId?.trim() || null
    const orgUnit = orgUnitId ? await this.orgUnitRepository.findById(tenantId, orgUnitId) : null
    if (
      orgUnitId &&
      (!orgUnit ||
        orgUnit.id !== orgUnitId ||
        orgUnit.tenantId !== tenantId ||
        orgUnit.status !== OrgUnitStatus.ACTIVE ||
        !orgUnit.name.trim())
    ) {
      return { available: false as const, reasonCode: 'ORG_UNIT_UNAVAILABLE' }
    }
    return {
      available: true as const,
      tenantId,
      companyDisplayName: tenant.name.trim(),
      websiteUrl: tenant.websiteUrl?.trim() || null,
      orgUnitId: orgUnit?.id ?? null,
      orgUnitDisplayName: orgUnit?.name.trim() || null,
      reasonCode: ''
    }
  }

  async listTenants(input: {
    keyword?: string
    status?: string
    page?: number
    pageSize?: number
  }) {
    return this.tenantRepository.list(input)
  }

  async getOrgTreeByTenantId(tenantId: string) {
    return this.orgUnitRepository.listTreeByTenant(requireNonBlank(tenantId, 'tenantId'))
  }

  async getOrgUnitById(tenantId: string, orgUnitId: string) {
    return this.orgUnitRepository.findById(
      requireNonBlank(tenantId, 'tenantId'),
      requireNonBlank(orgUnitId, 'orgUnitId')
    )
  }

  async validateOrgReference(input: {
    tenantId: string
    orgUnitId: string
    expectedOrgType?: string
  }) {
    const tenantId = requireNonBlank(input.tenantId, 'tenantId')
    const orgUnitId = requireNonBlank(input.orgUnitId, 'orgUnitId')
    const orgUnit = await this.orgUnitRepository.findById(tenantId, orgUnitId)

    if (!orgUnit) {
      return {
        valid: false,
        rejectionReason: 'ORG_UNIT_NOT_FOUND',
        orgUnitSummary: null
      }
    }

    if (orgUnit.status !== OrgUnitStatus.ACTIVE) {
      return {
        valid: false,
        rejectionReason: 'ORG_UNIT_ARCHIVED',
        orgUnitSummary: orgUnit
      }
    }

    if (input.expectedOrgType && orgUnit.type !== input.expectedOrgType) {
      return {
        valid: false,
        rejectionReason: 'ORG_TYPE_MISMATCH',
        orgUnitSummary: orgUnit
      }
    }

    return {
      valid: true,
      rejectionReason: '',
      orgUnitSummary: orgUnit
    }
  }

  async getOrgReferenceSummary(tenantId: string, orgUnitId: string) {
    const orgUnit = await this.getOrgUnitById(tenantId, orgUnitId)
    return orgUnit?.status === OrgUnitStatus.ACTIVE ? orgUnit : null
  }

  async listAncestorOrgUnits(tenantId: string, orgUnitId: string) {
    return this.orgUnitRepository.listAncestors(
      requireNonBlank(tenantId, 'tenantId'),
      requireNonBlank(orgUnitId, 'orgUnitId')
    )
  }

  async listDescendantOrgUnits(tenantId: string, orgUnitId: string, maxDepth?: number) {
    return this.orgUnitRepository.listDescendants(
      requireNonBlank(tenantId, 'tenantId'),
      requireNonBlank(orgUnitId, 'orgUnitId'),
      maxDepth && maxDepth > 0 ? maxDepth : undefined
    )
  }
}

/** requireNonBlank normalizes required string inputs before application-layer use. */
function requireNonBlank(value: string, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required`)
  }
  return normalized
}
