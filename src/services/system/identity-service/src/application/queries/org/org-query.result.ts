export interface OrgNodeView {
  id: string
  tenantId: string
  parentId: string | null
  name: string
  code: string | null
  type: string
  sortOrder: number
  children: OrgNodeView[]
}

export interface AccountOrgMembershipView {
  id: string
  accountId: string
  orgId: string
  orgName: string | null
  orgType: string | null
  relationType: string
  isPrimary: boolean
}
