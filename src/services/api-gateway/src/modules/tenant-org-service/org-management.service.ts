import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { VerifiedTenantTarget } from '../../common/tenant-target'
import {
  OrganizationTenantPartySummary,
  PartyQueryGrpcAdapter
} from './adapters/party-query-grpc.adapter'
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

  async getOrgTree(tenantId: VerifiedTenantTarget, source: DownstreamRequestSource) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    const scope = source.user?.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
    const tenant =
      scope === 'SYSTEM' ? await this.loadTenantSummary(resolvedTenantId, source) : undefined
    const result = await this.tenantOrgQueryAdapter.getOrgTreeByTenantId(resolvedTenantId, source)
    const organizationTenantPartyMap = await this.loadOrganizationTenantPartyMap(
      { kind: 'VERIFIED', tenantId: resolvedTenantId },
      collectOrganizationTenantPartyIdsFromNodes(result.roots ?? []),
      source
    )

    return {
      scope,
      tenant,
      roots: (result.roots ?? []).map((node) => this.mapOrgNode(node, organizationTenantPartyMap))
    }
  }

  /** getOrgUnitDetailByVerifiedTarget preserves the bounded HTTP selector provenance. */
  async getOrgUnitDetailByVerifiedTarget(
    tenantId: VerifiedTenantTarget,
    orgUnitId: string,
    source: DownstreamRequestSource
  ) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    return this.loadOrgUnitDetail(
      { kind: 'VERIFIED', tenantId: resolvedTenantId },
      orgUnitId,
      source
    )
  }

  /** getOrgUnitDetail retains the pre-existing internal string API without fabricating a verified target. */
  async getOrgUnitDetail(tenantId: string, orgUnitId: string, source: DownstreamRequestSource) {
    const resolvedTenantId = this.resolveInternalTenantId(tenantId, source)
    return this.loadOrgUnitDetail(
      { kind: 'INTERNAL', tenantId: resolvedTenantId },
      orgUnitId,
      source
    )
  }

  /** loadOrgUnitDetail shares response hydration while selecting the provenance-specific adapter entry. */
  private async loadOrgUnitDetail(
    selector:
      | { kind: 'VERIFIED'; tenantId: VerifiedTenantTarget }
      | { kind: 'INTERNAL'; tenantId: string },
    orgUnitId: string,
    source: DownstreamRequestSource
  ) {
    const resolvedOrgUnitId = requireNonBlank(orgUnitId, 'orgUnitId')
    const result = await (selector.kind === 'VERIFIED'
      ? this.tenantOrgQueryAdapter.getOrgUnitByVerifiedTarget(
          { tenantId: selector.tenantId, orgUnitId: resolvedOrgUnitId },
          source
        )
      : this.tenantOrgQueryAdapter.getOrgUnitById(
          { tenantId: selector.tenantId, orgUnitId: resolvedOrgUnitId },
          source
        ))

    if (!result.orgUnit?.id) {
      throw new NotFoundException('Org unit not found')
    }
    const organizationTenantPartyMap = await this.loadOrganizationTenantPartyMap(
      selector,
      collectOrganizationTenantPartyIdsFromOrgUnit(result.orgUnit),
      source
    )

    return {
      orgUnit: this.mapOrgUnit(result.orgUnit, organizationTenantPartyMap)
    }
  }

  async getTenantEmployeeCodePrefix(tenantId: string, source: DownstreamRequestSource) {
    const result = await this.tenantOrgQueryAdapter.getTenantById(
      this.resolveInternalTenantId(tenantId, source),
      source
    )
    const prefix = normalize(result.tenant?.employeeCodePrefix)?.toUpperCase()
    if (!prefix) {
      throw new NotFoundException('Tenant employee code prefix not found')
    }
    return prefix
  }

  async createOrgUnit(
    tenantId: VerifiedTenantTarget,
    input: {
      name: string
      organizationTenantPartyId?: string
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
        organizationTenantPartyId: normalize(input.organizationTenantPartyId),
        sortOrder: input.sortOrder
      },
      source
    )

    return {
      orgUnit: this.mapOrgUnit(result.orgUnit)
    }
  }

  async updateOrgUnit(
    tenantId: VerifiedTenantTarget,
    orgUnitId: string,
    input: {
      name?: string
      organizationTenantPartyId?: string | null
      sortOrder?: number
      type?: string
    },
    source: DownstreamRequestSource
  ) {
    const hasOrganizationTenantPartyId = Object.prototype.hasOwnProperty.call(
      input,
      'organizationTenantPartyId'
    )
    const result = await this.tenantOrgManagementAdapter.updateOrgUnit(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        orgUnitId: requireNonBlank(orgUnitId, 'orgUnitId'),
        name: normalize(input.name),
        type: normalize(input.type),
        sortOrder: input.sortOrder,
        organizationTenantPartyId: hasOrganizationTenantPartyId
          ? (normalize(input.organizationTenantPartyId ?? undefined) ?? null)
          : undefined
      },
      source
    )

    return {
      orgUnit: this.mapOrgUnit(result.orgUnit)
    }
  }

  async moveOrgUnit(
    tenantId: VerifiedTenantTarget,
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

  async archiveOrgUnit(
    tenantId: VerifiedTenantTarget,
    orgUnitId: string,
    source: DownstreamRequestSource
  ) {
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

  private async loadTenantSummary(tenantId: VerifiedTenantTarget, source: DownstreamRequestSource) {
    const result = await this.tenantOrgQueryAdapter.getTenantByVerifiedTarget(tenantId, source)
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

  /** resolveTenantId preserves the supplied target after checking TENANT subject equality. */
  private resolveTenantId(
    tenantId: VerifiedTenantTarget,
    source: DownstreamRequestSource
  ): VerifiedTenantTarget {
    const operatorTenantId = source.user?.tenantId ?? source.user?.tid

    if (source.user?.scopeLevel === 'SYSTEM') {
      return tenantId
    }

    if (!operatorTenantId || operatorTenantId !== tenantId) {
      throw new ForbiddenException(
        'Tenant administrators can only manage their current tenant org tree'
      )
    }

    return tenantId
  }

  /** resolveInternalTenantId validates legacy internal selectors without fabricating a verified target. */
  private resolveInternalTenantId(tenantId: string, source: DownstreamRequestSource): string {
    const requestedTenantId = requireNonBlank(tenantId, 'tenantId')
    const operatorTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)
    if (source.user?.scopeLevel === 'SYSTEM') return requestedTenantId
    if (!operatorTenantId || operatorTenantId !== requestedTenantId) {
      throw new ForbiddenException(
        'Tenant administrators can only manage their current tenant org tree'
      )
    }
    return requestedTenantId
  }

  private async loadOrganizationTenantPartyMap(
    selector:
      | { kind: 'VERIFIED'; tenantId: VerifiedTenantTarget }
      | { kind: 'INTERNAL'; tenantId: string },
    tenantPartyIds: string[],
    source: DownstreamRequestSource
  ): Promise<Map<string, OrganizationTenantPartySummary>> {
    const entries = await Promise.all(
      tenantPartyIds.map(async (tenantPartyId) => {
        const party = await (selector.kind === 'VERIFIED'
          ? this.partyQueryAdapter.getOrganizationTenantPartyByVerifiedTarget(
              selector.tenantId,
              tenantPartyId,
              source
            )
          : this.partyQueryAdapter.getOrganizationTenantPartyById(
              selector.tenantId,
              tenantPartyId,
              source
            ))
        return party ? ([tenantPartyId, party] as const) : undefined
      })
    )

    return new Map(
      entries.filter(Boolean) as Array<readonly [string, OrganizationTenantPartySummary]>
    )
  }

  private mapOrgNode(
    node: TenantManagementQueryOrgNode,
    organizationTenantPartyMap?: Map<string, OrganizationTenantPartySummary>
  ) {
    return {
      orgUnit: this.mapOrgUnit(node.orgUnit, organizationTenantPartyMap),
      children: (node.children ?? []).map((child) =>
        this.mapOrgNode(child, organizationTenantPartyMap)
      )
    }
  }

  private mapOrgUnit(
    orgUnit?: TenantManagementQueryOrgUnit,
    organizationTenantPartyMap?: Map<string, OrganizationTenantPartySummary>
  ) {
    if (!orgUnit?.id) {
      throw new NotFoundException('Org unit not found')
    }

    const organizationTenantPartyId = normalize(orgUnit.organizationTenantPartyId) ?? null

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
      organizationTenantPartyId,
      organizationTenantParty:
        organizationTenantPartyId && organizationTenantPartyMap
          ? (organizationTenantPartyMap.get(organizationTenantPartyId) ?? null)
          : null
    }
  }
}

function collectOrganizationTenantPartyIdsFromNodes(
  nodes: TenantManagementQueryOrgNode[]
): string[] {
  const tenantPartyIds = new Set<string>()
  const collect = (currentNodes: TenantManagementQueryOrgNode[]) => {
    for (const node of currentNodes) {
      const organizationTenantPartyId = normalize(node.orgUnit?.organizationTenantPartyId)
      if (organizationTenantPartyId) {
        tenantPartyIds.add(organizationTenantPartyId)
      }
      collect(node.children ?? [])
    }
  }

  collect(nodes)
  return [...tenantPartyIds]
}

function collectOrganizationTenantPartyIdsFromOrgUnit(
  orgUnit?: TenantManagementQueryOrgUnit
): string[] {
  const organizationTenantPartyId = normalize(orgUnit?.organizationTenantPartyId)
  return organizationTenantPartyId ? [organizationTenantPartyId] : []
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
