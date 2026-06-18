import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import {
  CreateOrgUnitInput,
  OrgNode,
  OrgUnitRepository,
  OrgUnitSummary,
  UpdateOrgUnitInput
} from '../../domain/repositories'
import { OrgUnitStatus, OrgUnitType } from '../../domain/value-objects'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaOrgUnitRepository persists org units and maintains path/depth hierarchy facts. */
@Injectable()
export class PrismaOrgUnitRepository implements OrgUnitRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(_input: CreateOrgUnitInput): Promise<OrgUnitSummary> {
    const parent = await this.prisma.orgUnit.findFirst({
      where: {
        id: _input.parentOrgId,
        tenantId: _input.tenantId,
        status: OrgUnitStatus.ACTIVE
      }
    })
    if (!parent) {
      throw new NotFoundException(`Parent org unit ${_input.parentOrgId} not found`)
    }

    const created = await this.prisma.orgUnit.create({
      data: {
        tenantId: _input.tenantId,
        parentOrgId: parent.id,
        name: _input.name,
        type: _input.type as never,
        status: OrgUnitStatus.ACTIVE,
        path: '/',
        depth: parent.depth + 1,
        sortOrder: _input.sortOrder ?? 0,
        organizationTenantPartyId: _input.organizationTenantPartyId ?? null
      }
    })
    const orgUnit = await this.prisma.orgUnit.update({
      where: { id: created.id },
      data: { path: `${parent.path}/${created.id}` }
    })
    return mapOrgUnit(orgUnit)
  }

  async findById(_tenantId: string, _orgUnitId: string): Promise<OrgUnitSummary | null> {
    const orgUnit = await this.prisma.orgUnit.findFirst({
      where: {
        id: _orgUnitId,
        tenantId: _tenantId
      }
    })
    return orgUnit ? mapOrgUnit(orgUnit) : null
  }

  async listTreeByTenant(_tenantId: string): Promise<OrgNode[]> {
    const orgUnits = await this.prisma.orgUnit.findMany({
      where: {
        tenantId: _tenantId,
        status: OrgUnitStatus.ACTIVE
      },
      orderBy: [{ depth: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }]
    })
    return buildTree(orgUnits.map(mapOrgUnit))
  }

  async update(_input: UpdateOrgUnitInput): Promise<OrgUnitSummary> {
    const existing = await this.prisma.orgUnit.findFirst({
      where: {
        id: _input.orgUnitId,
        tenantId: _input.tenantId
      }
    })
    if (!existing) {
      throw new NotFoundException(`Org unit ${_input.orgUnitId} not found`)
    }
    if (existing.type === OrgUnitType.ROOT && _input.type && _input.type !== OrgUnitType.ROOT) {
      throw new BadRequestException('Root org unit type cannot be changed')
    }

    const orgUnit = await this.prisma.orgUnit.update({
      where: { id: existing.id },
      data: {
        name: _input.name,
        type: (_input.type as never) || undefined,
        sortOrder: _input.sortOrder,
        organizationTenantPartyId:
          _input.organizationTenantPartyId === undefined ? undefined : _input.organizationTenantPartyId
      }
    })
    return mapOrgUnit(orgUnit)
  }

  async move(_input: {
    tenantId: string
    orgUnitId: string
    newParentOrgId: string
  }): Promise<OrgUnitSummary> {
    return this.prisma.$transaction(async (tx) => {
      const [orgUnit, newParent] = await Promise.all([
        tx.orgUnit.findFirst({ where: { id: _input.orgUnitId, tenantId: _input.tenantId } }),
        tx.orgUnit.findFirst({
          where: {
            id: _input.newParentOrgId,
            tenantId: _input.tenantId,
            status: OrgUnitStatus.ACTIVE
          }
        })
      ])

      if (!orgUnit) {
        throw new NotFoundException(`Org unit ${_input.orgUnitId} not found`)
      }
      if (!newParent) {
        throw new NotFoundException(`New parent org unit ${_input.newParentOrgId} not found`)
      }
      if (!orgUnit.parentOrgId || orgUnit.type === OrgUnitType.ROOT) {
        throw new BadRequestException('Root org unit cannot be moved')
      }
      if (newParent.id === orgUnit.id || newParent.path.startsWith(`${orgUnit.path}/`)) {
        throw new BadRequestException('Cannot move org unit below its descendant')
      }

      const oldPath = orgUnit.path
      const newPath = `${newParent.path}/${orgUnit.id}`
      const depthDelta = newParent.depth + 1 - orgUnit.depth
      const descendants = await tx.orgUnit.findMany({
        where: {
          tenantId: _input.tenantId,
          path: { startsWith: `${oldPath}/` }
        },
        orderBy: { depth: 'asc' }
      })
      const moved = await tx.orgUnit.update({
        where: { id: orgUnit.id },
        data: {
          parentOrgId: newParent.id,
          path: newPath,
          depth: newParent.depth + 1
        }
      })

      for (const descendant of descendants) {
        const suffix = descendant.path.slice(oldPath.length)
        await tx.orgUnit.update({
          where: { id: descendant.id },
          data: {
            path: `${newPath}${suffix}`,
            depth: descendant.depth + depthDelta
          }
        })
      }

      return mapOrgUnit(moved)
    })
  }

  async archive(_input: { tenantId: string; orgUnitId: string }): Promise<OrgUnitSummary> {
    const existing = await this.prisma.orgUnit.findFirst({
      where: {
        id: _input.orgUnitId,
        tenantId: _input.tenantId
      }
    })
    if (!existing) {
      throw new NotFoundException(`Org unit ${_input.orgUnitId} not found`)
    }
    if (!existing.parentOrgId || existing.type === OrgUnitType.ROOT) {
      throw new BadRequestException('Root org unit cannot be archived in the first phase')
    }
    const orgUnit = await this.prisma.orgUnit.update({
      where: { id: existing.id },
      data: { status: OrgUnitStatus.ARCHIVED }
    })
    return mapOrgUnit(orgUnit)
  }

  async listAncestors(_tenantId: string, _orgUnitId: string): Promise<OrgUnitSummary[]> {
    const orgUnit = await this.prisma.orgUnit.findFirst({
      where: {
        id: _orgUnitId,
        tenantId: _tenantId
      }
    })
    if (!orgUnit) {
      return []
    }

    const ancestorIds = orgUnit.path
      .split('/')
      .filter(Boolean)
      .filter((id) => id !== orgUnit.id)
    if (ancestorIds.length === 0) {
      return []
    }
    const ancestors = await this.prisma.orgUnit.findMany({
      where: {
        tenantId: _tenantId,
        id: { in: ancestorIds }
      }
    })
    const byId = new Map(ancestors.map((ancestor) => [ancestor.id, mapOrgUnit(ancestor)]))
    return ancestorIds.map((id) => byId.get(id)).filter(Boolean) as OrgUnitSummary[]
  }

  async listDescendants(
    _tenantId: string,
    _orgUnitId: string,
    _maxDepth?: number
  ): Promise<OrgUnitSummary[]> {
    const orgUnit = await this.prisma.orgUnit.findFirst({
      where: {
        id: _orgUnitId,
        tenantId: _tenantId
      }
    })
    if (!orgUnit) {
      return []
    }

    const descendants = await this.prisma.orgUnit.findMany({
      where: {
        tenantId: _tenantId,
        path: { startsWith: `${orgUnit.path}/` },
        depth: _maxDepth ? { lte: orgUnit.depth + _maxDepth } : undefined
      },
      orderBy: [{ depth: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }]
    })
    return descendants.map(mapOrgUnit)
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
  organizationTenantPartyId: string | null
}): OrgUnitSummary {
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
    organizationTenantPartyId: orgUnit.organizationTenantPartyId
  }
}

/** buildTree converts flat org unit rows into tenant-scoped root nodes with children. */
function buildTree(orgUnits: OrgUnitSummary[]): OrgNode[] {
  const nodes = new Map<string, OrgNode>()
  for (const orgUnit of orgUnits) {
    nodes.set(orgUnit.id, { orgUnit, children: [] })
  }

  const roots: OrgNode[] = []
  for (const orgUnit of orgUnits) {
    const node = nodes.get(orgUnit.id)
    if (!node) continue
    const parent = orgUnit.parentOrgId ? nodes.get(orgUnit.parentOrgId) : undefined
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}
