import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  AUTH_SESSION_REVOCATION_PORT,
  AuthSessionRevocationPort
} from '../ports/auth-session-revocation.port'
import {
  ORGANIZATION_PARTY_READER,
  OrganizationTenantPartyReader
} from '../ports/organization-party-reader.port'
import {
  ORG_UNIT_REPOSITORY,
  OrgUnitRepository,
  TENANT_REPOSITORY,
  TenantRepository
} from '../../domain/repositories'
import { OrgUnitType, TenantStatus, normalizeEmployeeCodePrefix } from '../../domain/value-objects'

/** TenantOrgManagementService coordinates tenant lifecycle and org tree write use cases. */
@Injectable()
export class TenantOrgManagementService {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
    @Inject(ORG_UNIT_REPOSITORY)
    private readonly orgUnitRepository: OrgUnitRepository,
    @Inject(ORGANIZATION_PARTY_READER)
    private readonly organizationTenantPartyReader: OrganizationTenantPartyReader,
    @Inject(AUTH_SESSION_REVOCATION_PORT)
    private readonly authSessionRevocationPort: AuthSessionRevocationPort
  ) {}

  async createTenant(input: { code: string; employeeCodePrefix: string; name: string; rootOrgName?: string }) {
    const code = requireNonBlank(input.code, 'code')
    const employeeCodePrefix = normalizeEmployeeCodePrefix(input.employeeCodePrefix)
    const name = requireNonBlank(input.name, 'name')
    const rootOrgName = input.rootOrgName?.trim() || name
    return this.tenantRepository.createWithRootOrg({ code, employeeCodePrefix, name, rootOrgName })
  }

  async updateTenantProfile(input: { tenantId: string; name?: string; code?: string; employeeCodePrefix?: string }) {
    return this.tenantRepository.updateProfile({
      tenantId: requireNonBlank(input.tenantId, 'tenantId'),
      name: input.name?.trim() || undefined,
      code: input.code?.trim() || undefined,
      employeeCodePrefix: input.employeeCodePrefix === undefined
        ? undefined
        : normalizeEmployeeCodePrefix(input.employeeCodePrefix)
    })
  }

  async suspendTenant(input: { tenantId: string; reason?: string }) {
    const tenant = await this.tenantRepository.setStatus({
      tenantId: requireNonBlank(input.tenantId, 'tenantId'),
      status: TenantStatus.SUSPENDED
    })
    await this.authSessionRevocationPort.revokeTenantSessions({
      tenantId: tenant.id,
      reason: 'TENANT_SUSPENDED'
    })
    return tenant
  }

  async reactivateTenant(input: { tenantId: string }) {
    return this.tenantRepository.setStatus({
      tenantId: requireNonBlank(input.tenantId, 'tenantId'),
      status: TenantStatus.ACTIVE
    })
  }

  async archiveTenant(input: { tenantId: string; reason?: string }) {
    const tenant = await this.tenantRepository.setStatus({
      tenantId: requireNonBlank(input.tenantId, 'tenantId'),
      status: TenantStatus.ARCHIVED
    })
    await this.authSessionRevocationPort.revokeTenantSessions({
      tenantId: tenant.id,
      reason: 'TENANT_ARCHIVED'
    })
    return tenant
  }

  async createOrgUnit(input: {
    tenantId: string
    parentOrgId: string
    name: string
    type: string
    sortOrder?: number
    organizationTenantPartyId?: string
  }) {
    const tenant = await this.tenantRepository.findById(requireNonBlank(input.tenantId, 'tenantId'))
    if (!tenant) {
      throw new NotFoundException(`Tenant ${input.tenantId} not found`)
    }
    if (tenant.status !== TenantStatus.ACTIVE) {
      throw new BadRequestException(`Tenant ${input.tenantId} is not active`)
    }

    const type = requireNonBlank(input.type, 'type')
    const organizationTenantPartyId = input.organizationTenantPartyId?.trim() || undefined
    await this.assertOrganizationTenantPartyAssociation(tenant.id, type, organizationTenantPartyId)

    return this.orgUnitRepository.create({
      tenantId: tenant.id,
      parentOrgId: requireNonBlank(input.parentOrgId, 'parentOrgId'),
      name: requireNonBlank(input.name, 'name'),
      type,
      sortOrder: input.sortOrder ?? 0,
      organizationTenantPartyId
    })
  }

  async updateOrgUnit(input: {
    tenantId: string
    orgUnitId: string
    name?: string
    type?: string
    sortOrder?: number
    organizationTenantPartyId?: string | null
  }) {
    const tenantId = requireNonBlank(input.tenantId, 'tenantId')
    const orgUnitId = requireNonBlank(input.orgUnitId, 'orgUnitId')
    const existing = await this.orgUnitRepository.findById(tenantId, orgUnitId)
    if (!existing) {
      throw new NotFoundException(`Org unit ${input.orgUnitId} not found`)
    }

    const nextType = input.type?.trim() || existing.type
    const nextOrganizationTenantPartyId =
      input.organizationTenantPartyId === undefined
        ? existing.organizationTenantPartyId
        : input.organizationTenantPartyId === null
          ? null
          : input.organizationTenantPartyId.trim() || null

    await this.assertOrganizationTenantPartyAssociation(tenantId, nextType, nextOrganizationTenantPartyId)

    return this.orgUnitRepository.update({
      tenantId,
      orgUnitId,
      name: input.name?.trim() || undefined,
      type: input.type?.trim() || undefined,
      sortOrder: input.sortOrder,
      organizationTenantPartyId:
        input.organizationTenantPartyId === null ? null : input.organizationTenantPartyId?.trim() || undefined
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

  /** assertOrganizationTenantPartyAssociation enforces tenant-local organization TenantParty rules for org bindings. */
  private async assertOrganizationTenantPartyAssociation(
    tenantId: string,
    orgUnitType: string,
    organizationTenantPartyId?: string | null
  ) {
    if (!organizationTenantPartyId) {
      return
    }

    if (!isOrganizationTenantPartyAllowedOrgType(orgUnitType)) {
      throw new BadRequestException(
        `organizationTenantPartyId is only allowed for ${OrgUnitType.ROOT} or ${OrgUnitType.BRANCH} org units`
      )
    }

    const party = await this.organizationTenantPartyReader.getOrganizationTenantPartyById({
      tenantId,
      tenantPartyId: organizationTenantPartyId
    })
    if (!party) {
      throw new BadRequestException(`Organization TenantParty ${organizationTenantPartyId} not found`)
    }
    if (party.type !== 'ORGANIZATION') {
      throw new BadRequestException(
        `Organization TenantParty ${organizationTenantPartyId} must reference an ORGANIZATION TenantParty`
      )
    }
    if (party.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Organization TenantParty ${organizationTenantPartyId} must be ACTIVE to be referenced`
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

/** isOrganizationTenantPartyAllowedOrgType keeps organization TenantParty binding limited to legal-organization-like org nodes. */
function isOrganizationTenantPartyAllowedOrgType(orgUnitType: string): boolean {
  return orgUnitType === OrgUnitType.ROOT || orgUnitType === OrgUnitType.BRANCH
}
