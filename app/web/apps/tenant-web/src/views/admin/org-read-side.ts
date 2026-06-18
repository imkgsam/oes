import type { TenantManagementApi } from '#/api'

export interface FlatManagedOrgUnit {
  depth: number
  id: string
  label: string
  name: string
  organizationTenantParty?: TenantManagementApi.ManagedOrgUnit['organizationTenantParty']
  organizationTenantPartyId?: string | null
  parentOrgId?: string
  path: string
  sortOrder: number
  status: string
  tenantId: string
  type: string
}

export interface ManagedOrgGridRow extends FlatManagedOrgUnit {
  children?: ManagedOrgGridRow[]
}

/** formatManagedOrganizationTenantPartyName chooses the most human-readable organization-party label available for tenant/org read models. */
export function formatManagedOrganizationTenantPartyName(
  orgUnit?: Pick<TenantManagementApi.ManagedOrgUnit, 'organizationTenantParty' | 'organizationTenantPartyId'> | null
) {
  return (
    orgUnit?.organizationTenantParty?.legalName ||
    orgUnit?.organizationTenantPartyId ||
    ''
  )
}

/** formatManagedOrgSelectorLabel builds one indentation-friendly org selector label without redefining org ownership semantics. */
export function formatManagedOrgSelectorLabel(orgUnit: TenantManagementApi.ManagedOrgUnit) {
  const organizationTenantPartyName = formatManagedOrganizationTenantPartyName(orgUnit)
  const metadata = [orgUnit.type, organizationTenantPartyName].filter(Boolean).join(' · ')
  return `${'　'.repeat(orgUnit.depth)}${orgUnit.name}${metadata ? ` · ${metadata}` : ''}`
}

/** flattenManagedOrgTree converts the managed org tree into one flat read-side list that can back tables, trees, and selectors. */
export function flattenManagedOrgTree(
  nodes: TenantManagementApi.ManagedOrgNode[],
  rows: FlatManagedOrgUnit[] = []
) {
  for (const node of nodes) {
    rows.push({
      depth: node.orgUnit.depth,
      id: node.orgUnit.id,
      label: formatManagedOrgSelectorLabel(node.orgUnit),
      name: node.orgUnit.name,
      organizationTenantParty: node.orgUnit.organizationTenantParty,
      organizationTenantPartyId: node.orgUnit.organizationTenantPartyId,
      parentOrgId: node.orgUnit.parentOrgId,
      path: node.orgUnit.path,
      sortOrder: node.orgUnit.sortOrder,
      status: node.orgUnit.status,
      tenantId: node.orgUnit.tenantId,
      type: node.orgUnit.type
    })
    flattenManagedOrgTree(node.children ?? [], rows)
  }

  return rows
}

/** mapManagedOrgTreeToGridRows preserves the nested org tree shape required by the VXE tree grid. */
export function mapManagedOrgTreeToGridRows(
  nodes: TenantManagementApi.ManagedOrgNode[]
): ManagedOrgGridRow[] {
  return nodes.map((node) => ({
    depth: node.orgUnit.depth,
    id: node.orgUnit.id,
    label: formatManagedOrgSelectorLabel(node.orgUnit),
    name: node.orgUnit.name,
    organizationTenantParty: node.orgUnit.organizationTenantParty,
    organizationTenantPartyId: node.orgUnit.organizationTenantPartyId,
    parentOrgId: node.orgUnit.parentOrgId,
    path: node.orgUnit.path,
    sortOrder: node.orgUnit.sortOrder,
    status: node.orgUnit.status,
    tenantId: node.orgUnit.tenantId,
    type: node.orgUnit.type,
    children: mapManagedOrgTreeToGridRows(node.children ?? [])
  }))
}

/** findManagedOrgUnitOption resolves one flat org read-side row by orgUnitId for HR and tenant workspace displays. */
export function findManagedOrgUnitOption(
  options: FlatManagedOrgUnit[],
  orgUnitId?: string
) {
  if (!orgUnitId) {
    return undefined
  }

  return options.find((item) => item.id === orgUnitId)
}
