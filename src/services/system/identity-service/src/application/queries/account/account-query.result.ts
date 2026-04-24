export interface AccountSummaryView {
  id: string
  userId: string
  tenantId: string | null
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
  userPartyId: string | null
  tenantId: string | null
  scopeLevel: 'SYSTEM' | 'TENANT'
  displayName: string | null
  userDisplayName: string | null
  isEnabled: boolean
}

export interface AccountDirectoryPageView {
  items: AccountDirectoryView[]
  total: number
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
    willDeleteOrgMemberships: boolean
    willDeleteContactAssets: boolean
  }
  blockingReasons: AccountDeletionBlockingReasonView[]
  orgMembershipCount: number
  contactAssetCount: number
}
