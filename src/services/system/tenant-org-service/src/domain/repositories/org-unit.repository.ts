import { OrgUnitStatus, OrgUnitType } from '../value-objects'

export const ORG_UNIT_REPOSITORY = Symbol('ORG_UNIT_REPOSITORY')

export interface OrgUnitSummary {
  id: string
  tenantId: string
  parentOrgId: string | null
  name: string
  type: OrgUnitType | string
  status: OrgUnitStatus | string
  path: string
  depth: number
  sortOrder: number
  organizationPartyId: string | null
}

export interface OrgNode {
  orgUnit: OrgUnitSummary
  children: OrgNode[]
}

export interface CreateOrgUnitInput {
  tenantId: string
  parentOrgId: string
  name: string
  type: OrgUnitType | string
  sortOrder?: number
  organizationPartyId?: string
}

export interface UpdateOrgUnitInput {
  tenantId: string
  orgUnitId: string
  name?: string
  type?: OrgUnitType | string
  sortOrder?: number
  organizationPartyId?: string | null
}

export interface OrgUnitRepository {
  create(input: CreateOrgUnitInput): Promise<OrgUnitSummary>
  findById(tenantId: string, orgUnitId: string): Promise<OrgUnitSummary | null>
  listTreeByTenant(tenantId: string): Promise<OrgNode[]>
  update(input: UpdateOrgUnitInput): Promise<OrgUnitSummary>
  move(input: {
    tenantId: string
    orgUnitId: string
    newParentOrgId: string
  }): Promise<OrgUnitSummary>
  archive(input: { tenantId: string; orgUnitId: string }): Promise<OrgUnitSummary>
  listAncestors(tenantId: string, orgUnitId: string): Promise<OrgUnitSummary[]>
  listDescendants(tenantId: string, orgUnitId: string, maxDepth?: number): Promise<OrgUnitSummary[]>
}
