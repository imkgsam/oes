import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { OrganizationPartySummary, PartyQueryGrpcAdapter } from './adapters/party-query-grpc.adapter'
import { TenantOrgManagementGrpcAdapter } from './adapters/tenant-org-management-grpc.adapter'
import {
  TenantManagementQueryOrgNode,
  TenantManagementQueryOrgUnit,
  TenantOrgQueryGrpcAdapter
} from './adapters/tenant-org-query-grpc.adapter'

// Builds the shared org tree management model for system-admin and tenant-admin entry points.
@Injectable()
export class OrgManagementService {
  constructor(
    private readonly tenantOrgQueryAdapter: TenantOrgQueryGrpcAdapter,
    private readonly partyQueryAdapter: PartyQueryGrpcAdapter,
    private readonly tenantOrgManagementAdapter: TenantOrgManagementGrpcAdapter
  ) {}

  async getOrgTree(tenantId: string, source: DownstreamRequestSource) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    const scope = source.user?.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
    const tenant =
      scope === 'SYSTEM' ? await this.loadTenantSummary(resolvedTenantId, source) : undefined
    const result = await this.tenantOrgQueryAdapter.getOrgTreeByTenantId(resolvedTenantId, source)
    const organizationPartyMap = await this.loadOrganizationPartyMap(
      collectOrganizationPartyIdsFromNodes(result.roots ?? []),
      source
    )

    return {
      scope,
      tenant,
      roots: (result.roots ?? []).map((node) => this.mapOrgNode(node, organizationPartyMap))
    }
  }

  async getOrgUnitDetail(
    tenantId: string,
    orgUnitId: string,
    source: DownstreamRequestSource
  ) {
    const result = await this.tenantOrgQueryAdapter.getOrgUnitById(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        orgUnitId: requireNonBlank(orgUnitId, 'orgUnitId')
      },
      source
    )

    if (!result.orgUnit?.id) {
      throw new NotFoundException('Org unit not found')
    }
    const organizationPartyMap = await this.loadOrganizationPartyMap(
      collectOrganizationPartyIdsFromOrgUnit(result.orgUnit),
      source
    )

    return {
      orgUnit: this.mapOrgUnit(result.orgUnit, organizationPartyMap)
    }
  }

  async createOrgUnit(
    tenantId: string,
    input: {
      name: string
      organizationPartyId?: string
      parentOrgId: string
      sortOrder?: number
      type: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.tenantOrgManagementAdapter.createOrgUnit(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        parentOrgId: requireNonBlank(input.parentOrgId, 'parentOrgId'),
        name: requireNonBlank(input.name, 'name'),
        type: requireNonBlank(input.type, 'type'),
        organizationPartyId: normalize(input.organizationPartyId),
        sortOrder: input.sortOrder
      },
      source
    )

    return {
      orgUnit: this.mapOrgUnit(result.orgUnit)
    }
  }

  async updateOrgUnit(
    tenantId: string,
    orgUnitId: string,
    input: { name?: string; organizationPartyId?: string | null; sortOrder?: number; type?: string },
    source: DownstreamRequestSource
  ) {
    const hasOrganizationPartyId = Object.prototype.hasOwnProperty.call(
      input,
      'organizationPartyId'
    )
    const result = await this.tenantOrgManagementAdapter.updateOrgUnit(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        orgUnitId: requireNonBlank(orgUnitId, 'orgUnitId'),
        name: normalize(input.name),
        type: normalize(input.type),
        sortOrder: input.sortOrder,
        organizationPartyId: hasOrganizationPartyId
          ? normalize(input.organizationPartyId ?? undefined) ?? null
          : undefined
      },
      source
    )

    return {
      orgUnit: this.mapOrgUnit(result.orgUnit)
    }
  }

  async moveOrgUnit(
    tenantId: string,
    orgUnitId: string,
    input: { newParentOrgId?: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.tenantOrgManagementAdapter.moveOrgUnit(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        orgUnitId: requireNonBlank(orgUnitId, 'orgUnitId'),
        newParentOrgId: requireNonBlank(input.newParentOrgId, 'newParentOrgId')
      },
      source
    )

    return {
      orgUnit: this.mapOrgUnit(result.orgUnit)
    }
  }

  async archiveOrgUnit(tenantId: string, orgUnitId: string, source: DownstreamRequestSource) {
    const result = await this.tenantOrgManagementAdapter.archiveOrgUnit(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        orgUnitId: requireNonBlank(orgUnitId, 'orgUnitId')
      },
      source
    )

    return {
      orgUnit: this.mapOrgUnit(result.orgUnit)
    }
  }

  private async loadTenantSummary(tenantId: string, source: DownstreamRequestSource) {
    const result = await this.tenantOrgQueryAdapter.getTenantById(tenantId, source)
    if (!result.tenant?.id) {
      throw new NotFoundException('Tenant not found')
    }

    return {
      id: result.tenant.id,
      code: result.tenant.code ?? '',
      name: result.tenant.name ?? '',
      rootOrgId: normalize(result.tenant.rootOrgId),
      status: result.tenant.status ?? ''
    }
  }

  private resolveTenantId(tenantId: string, source: DownstreamRequestSource): string {
    const requestedTenantId = requireNonBlank(tenantId, 'tenantId')
    const operatorTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)

    if (source.user?.scopeLevel === 'SYSTEM') {
      return requestedTenantId
    }

    if (!operatorTenantId || operatorTenantId !== requestedTenantId) {
      throw new ForbiddenException('Tenant administrators can only manage their current tenant org tree')
    }

    return operatorTenantId
  }

  private async loadOrganizationPartyMap(
    partyIds: string[],
    source: DownstreamRequestSource
  ): Promise<Map<string, OrganizationPartySummary>> {
    const entries = await Promise.all(
      partyIds.map(async (partyId) => {
        const party = await this.partyQueryAdapter.getPartyById(partyId, source)
        return party ? ([partyId, party] as const) : undefined
      })
    )

    return new Map(entries.filter(Boolean) as Array<readonly [string, OrganizationPartySummary]>)
  }

  private mapOrgNode(
    node: TenantManagementQueryOrgNode,
    organizationPartyMap?: Map<string, OrganizationPartySummary>
  ) {
    return {
      orgUnit: this.mapOrgUnit(node.orgUnit, organizationPartyMap),
      children: (node.children ?? []).map((child) => this.mapOrgNode(child, organizationPartyMap))
    }
  }

  private mapOrgUnit(
    orgUnit?: TenantManagementQueryOrgUnit,
    organizationPartyMap?: Map<string, OrganizationPartySummary>
  ) {
    if (!orgUnit?.id) {
      throw new NotFoundException('Org unit not found')
    }

    const organizationPartyId = normalize(orgUnit.organizationPartyId) ?? null

    return {
      id: orgUnit.id,
      tenantId: orgUnit.tenantId ?? '',
      parentOrgId: normalize(orgUnit.parentOrgId),
      name: orgUnit.name ?? '',
      type: orgUnit.type ?? '',
      status: orgUnit.status ?? '',
      path: orgUnit.path ?? '',
      depth: Number(orgUnit.depth ?? 0),
      sortOrder: Number(orgUnit.sortOrder ?? 0),
      organizationPartyId,
      organizationParty:
        organizationPartyId && organizationPartyMap
          ? organizationPartyMap.get(organizationPartyId) ?? null
          : null
    }
  }
}

function collectOrganizationPartyIdsFromNodes(nodes: TenantManagementQueryOrgNode[]): string[] {
  const partyIds = new Set<string>()
  const collect = (currentNodes: TenantManagementQueryOrgNode[]) => {
    for (const node of currentNodes) {
      const organizationPartyId = normalize(node.orgUnit?.organizationPartyId)
      if (organizationPartyId) {
        partyIds.add(organizationPartyId)
      }
      collect(node.children ?? [])
    }
  }

  collect(nodes)
  return [...partyIds]
}

function collectOrganizationPartyIdsFromOrgUnit(orgUnit?: TenantManagementQueryOrgUnit): string[] {
  const organizationPartyId = normalize(orgUnit?.organizationPartyId)
  return organizationPartyId ? [organizationPartyId] : []
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
