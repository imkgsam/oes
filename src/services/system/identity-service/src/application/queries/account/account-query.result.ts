export interface AccountSummaryView {
  id: string
  userId: string
  tenantId: string | null
  tenantPartyId: string | null
  scopeLevel: 'SYSTEM' | 'TENANT'
  avatarUrl: string | null
  avatarAssetId: string | null
  displayName: string | null
  bio: string | null
  isEnabled: boolean
}

export interface AccountCandidateView {
  accountId: string
  tenantId: string | null
  scopeLevel: 'SYSTEM' | 'TENANT'
  displayName: string | null
  isEnabled: boolean
}

export interface AccountDirectoryView {
  accountId: string
  userId: string
  tenantId: string | null
  tenantPartyId: string | null
  scopeLevel: 'SYSTEM' | 'TENANT'
  displayName: string | null
  userDisplayName: string | null
  isEnabled: boolean
}

export interface AccountDirectoryPageView {
  items: AccountDirectoryView[]
  total: number
}

export interface TenantAccountCountView {
  tenantId: string
  total: number
}

export interface TenantAccountCountListView {
  counts: TenantAccountCountView[]
}

export interface AccountDeletionBlockingReasonView {
  resourceType: string
  resourceCount: number
  message: string
}

export interface AccountDeletionImpactView {
  accountId: string
  canDelete: boolean
  userRetained: true
  cleanupPlan: {
    willDeleteSessions: true
    willClearRoles: true
    willDeleteContactAssets: boolean
  }
  blockingReasons: AccountDeletionBlockingReasonView[]
  contactAssetCount: number
}
