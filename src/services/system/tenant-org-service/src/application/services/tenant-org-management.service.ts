import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  ORGANIZATION_PARTY_READER,
  OrganizationPartyReader
} from '../ports/organization-party-reader.port'
import {
  ORG_UNIT_REPOSITORY,
  OrgUnitRepository,
  TENANT_REPOSITORY,
  TenantRepository
} from '../../domain/repositories'
import { OrgUnitType, TenantStatus } from '../../domain/value-objects'

/** TenantOrgManagementService coordinates tenant lifecycle and org tree write use cases. */
@Injectable()
export class TenantOrgManagementService {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
    @Inject(ORG_UNIT_REPOSITORY)
    private readonly orgUnitRepository: OrgUnitRepository,
    @Inject(ORGANIZATION_PARTY_READER)
    private readonly organizationPartyReader: OrganizationPartyReader
  ) {}

  async createTenant(input: { code: string; name: string; rootOrgName?: string }) {
    const code = requireNonBlank(input.code, 'code')
    const name = requireNonBlank(input.name, 'name')
    const rootOrgName = input.rootOrgName?.trim() || name
    return this.tenantRepository.createWithRootOrg({ code, name, rootOrgName })
  }

  async updateTenantProfile(input: { tenantId: string; name?: string; code?: string }) {
    return this.tenantRepository.updateProfile({
      tenantId: requireNonBlank(input.tenantId, 'tenantId'),
      name: input.name?.trim() || undefined,
      code: input.code?.trim() || undefined
    })
  }

  async suspendTenant(input: { tenantId: string; reason?: string }) {
    return this.tenantRepository.setStatus({
      tenantId: requireNonBlank(input.tenantId, 'tenantId'),
      status: TenantStatus.SUSPENDED
    })
  }

  async reactivateTenant(input: { tenantId: string }) {
    return this.tenantRepository.setStatus({
      tenantId: requireNonBlank(input.tenantId, 'tenantId'),
      status: TenantStatus.ACTIVE
    })
  }

  async archiveTenant(input: { tenantId: string; reason?: string }) {
    return this.tenantRepository.setStatus({
      tenantId: requireNonBlank(input.tenantId, 'tenantId'),
      status: TenantStatus.ARCHIVED
    })
  }

  async createOrgUnit(input: {
    tenantId: string
    parentOrgId: string
    name: string
    type: string
    sortOrder?: number
    organizationPartyId?: string
  }) {
    const tenant = await this.tenantRepository.findById(requireNonBlank(input.tenantId, 'tenantId'))
    if (!tenant) {
      throw new NotFoundException(`Tenant ${input.tenantId} not found`)
    }
    if (tenant.status !== TenantStatus.ACTIVE) {
      throw new BadRequestException(`Tenant ${input.tenantId} is not active`)
    }

    const type = requireNonBlank(input.type, 'type')
    const organizationPartyId = input.organizationPartyId?.trim() || undefined
    await this.assertOrganizationPartyAssociation(type, organizationPartyId)

    return this.orgUnitRepository.create({
      tenantId: tenant.id,
      parentOrgId: requireNonBlank(input.parentOrgId, 'parentOrgId'),
      name: requireNonBlank(input.name, 'name'),
      type,
      sortOrder: input.sortOrder ?? 0,
      organizationPartyId
    })
  }

  async updateOrgUnit(input: {
    tenantId: string
    orgUnitId: string
    name?: string
    type?: string
    sortOrder?: number
    organizationPartyId?: string | null
  }) {
    const tenantId = requireNonBlank(input.tenantId, 'tenantId')
    const orgUnitId = requireNonBlank(input.orgUnitId, 'orgUnitId')
    const existing = await this.orgUnitRepository.findById(tenantId, orgUnitId)
    if (!existing) {
      throw new NotFoundException(`Org unit ${input.orgUnitId} not found`)
    }

    const nextType = input.type?.trim() || existing.type
    const nextOrganizationPartyId =
      input.organizationPartyId === undefined
        ? existing.organizationPartyId
        : input.organizationPartyId === null
          ? null
          : input.organizationPartyId.trim() || null

    await this.assertOrganizationPartyAssociation(nextType, nextOrganizationPartyId)

    return this.orgUnitRepository.update({
      tenantId,
      orgUnitId,
      name: input.name?.trim() || undefined,
      type: input.type?.trim() || undefined,
      sortOrder: input.sortOrder,
      organizationPartyId:
        input.organizationPartyId === null ? null : input.organizationPartyId?.trim() || undefined
    })
  }

  async moveOrgUnit(input: { tenantId: string; orgUnitId: string; newParentOrgId: string }) {
    return this.orgUnitRepository.move({
      tenantId: requireNonBlank(input.tenantId, 'tenantId'),
      orgUnitId: requireNonBlank(input.orgUnitId, 'orgUnitId'),
      newParentOrgId: requireNonBlank(input.newParentOrgId, 'newParentOrgId')
    })
  }

  async archiveOrgUnit(input: { tenantId: string; orgUnitId: string; reason?: string }) {
    return this.orgUnitRepository.archive({
      tenantId: requireNonBlank(input.tenantId, 'tenantId'),
      orgUnitId: requireNonBlank(input.orgUnitId, 'orgUnitId')
    })
  }

  /** assertOrganizationPartyAssociation enforces the frozen org-type and canonical-party rules for organizationPartyId writes. */
  private async assertOrganizationPartyAssociation(
    orgUnitType: string,
    organizationPartyId?: string | null
  ) {
    if (!organizationPartyId) {
      return
    }

    if (!isOrganizationPartyAllowedOrgType(orgUnitType)) {
      throw new BadRequestException(
        `organizationPartyId is only allowed for ${OrgUnitType.ROOT} or ${OrgUnitType.BRANCH} org units`
      )
    }

    const party = await this.organizationPartyReader.getOrganizationPartyById(organizationPartyId)
    if (!party) {
      throw new BadRequestException(`Organization party ${organizationPartyId} not found`)
    }
    if (party.type !== 'ORGANIZATION') {
      throw new BadRequestException(
        `Organization party ${organizationPartyId} must reference an ORGANIZATION party`
      )
    }
    if (party.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Organization party ${organizationPartyId} must be ACTIVE to be referenced`
      )
    }
  }
}

/** requireNonBlank normalizes required string inputs before management writes. */
function requireNonBlank(value: string, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required`)
  }
  return normalized
}

/** isOrganizationPartyAllowedOrgType keeps organization-party binding limited to legal-organization-like org nodes. */
function isOrganizationPartyAllowedOrgType(orgUnitType: string): boolean {
  return orgUnitType === OrgUnitType.ROOT || orgUnitType === OrgUnitType.BRANCH
}
