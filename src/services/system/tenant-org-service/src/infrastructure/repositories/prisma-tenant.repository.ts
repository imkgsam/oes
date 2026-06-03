import { Injectable, NotFoundException } from '@nestjs/common'
import {
  CreateTenantWithRootInput,
  ListTenantsInput,
  TenantRepository,
  TenantSummary
} from '../../domain/repositories'
import { OrgUnitStatus, OrgUnitType, TenantStatus } from '../../domain/value-objects'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaTenantRepository persists tenant lifecycle state and creates root org units transactionally. */
@Injectable()
export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithRootOrg(_input: CreateTenantWithRootInput) {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          code: _input.code,
          employeeCodePrefix: _input.employeeCodePrefix,
          name: _input.name,
          status: TenantStatus.ACTIVE
        }
      })
      const rootOrg = await tx.orgUnit.create({
        data: {
          tenantId: tenant.id,
          parentOrgId: null,
          name: _input.rootOrgName,
          type: OrgUnitType.ROOT,
          status: OrgUnitStatus.ACTIVE,
          path: '/',
          depth: 0,
          sortOrder: 0
        }
      })
      const rootOrgWithPath = await tx.orgUnit.update({
        where: { id: rootOrg.id },
        data: { path: `/${rootOrg.id}` }
      })
      const tenantWithRoot = await tx.tenant.update({
        where: { id: tenant.id },
        data: { rootOrgId: rootOrg.id }
      })

      return {
        tenant: mapTenant(tenantWithRoot),
        rootOrgUnit: mapOrgUnit(rootOrgWithPath)
      }
    })
  }

  async findById(_id: string): Promise<TenantSummary | null> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: _id } })
    return tenant ? mapTenant(tenant) : null
  }

  async list(_input: ListTenantsInput): Promise<{ tenants: TenantSummary[]; total: number }> {
    const page = Math.max(_input.page ?? 1, 1)
    const pageSize = Math.min(Math.max(_input.pageSize ?? 50, 1), 200)
    const where = {
      status: (_input.status as never) || undefined,
      OR: _input.keyword
        ? [
            { code: { contains: _input.keyword, mode: 'insensitive' as const } },
            { name: { contains: _input.keyword, mode: 'insensitive' as const } }
          ]
        : undefined
    }
    const [tenants, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        orderBy: { code: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.tenant.count({ where })
    ])

    return {
      tenants: tenants.map(mapTenant),
      total
    }
  }

  async updateProfile(_input: {
    tenantId: string
    name?: string
    code?: string
    employeeCodePrefix?: string
  }): Promise<TenantSummary> {
    const tenant = await this.prisma.tenant.update({
      where: { id: _input.tenantId },
      data: {
        name: _input.name,
        code: _input.code,
        employeeCodePrefix: _input.employeeCodePrefix
      }
    })
    return mapTenant(tenant)
  }

  async setStatus(_input: { tenantId: string; status: TenantStatus }): Promise<TenantSummary> {
    const existing = await this.prisma.tenant.findUnique({ where: { id: _input.tenantId } })
    if (!existing) {
      throw new NotFoundException(`Tenant ${_input.tenantId} not found`)
    }
    const tenant = await this.prisma.tenant.update({
      where: { id: _input.tenantId },
      data: { status: _input.status }
    })
    return mapTenant(tenant)
  }
}

/** mapTenant converts a Prisma tenant row to the domain repository summary. */
function mapTenant(tenant: {
  id: string
  code: string
  employeeCodePrefix: string
  name: string
  status: string
  rootOrgId: string | null
}): TenantSummary {
  return {
    id: tenant.id,
    code: tenant.code,
    employeeCodePrefix: tenant.employeeCodePrefix,
    name: tenant.name,
    status: tenant.status as TenantStatus,
    rootOrgId: tenant.rootOrgId
  }
}

/** mapOrgUnit converts a Prisma org unit row to the domain repository summary. */
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
    parentOrgId: orgUnit.parentOrgId,
    name: orgUnit.name,
    type: orgUnit.type as OrgUnitType,
    status: orgUnit.status as OrgUnitStatus,
    path: orgUnit.path,
    depth: orgUnit.depth,
    sortOrder: orgUnit.sortOrder,
    organizationPartyId: orgUnit.organizationPartyId
  }
}
