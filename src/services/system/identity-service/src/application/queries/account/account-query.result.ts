export interface AccountSummaryView {
  id: string
  userId: string
  tenantId: string | null
  scopeLevel: 'SYSTEM' | 'TENANT'
  avatarUrl: string | null
  displayName: string | null
  bio: string | null
  isEnabled: boolean
}

export interface AccountCandidateView {
  accountId: string
  tenantId: string | null
  tenantName: string | null
  scopeLevel: 'SYSTEM' | 'TENANT'
  displayName: string | null
  isEnabled: boolean
}

export interface AccountDirectoryView {
  accountId: string
  userId: string
  tenantId: string | null
  tenantName: string | null
  scopeLevel: 'SYSTEM' | 'TENANT'
  displayName: string | null
  userDisplayName: string | null
  isEnabled: boolean
}

export interface AccountDirectoryPageView {
  items: AccountDirectoryView[]
  total: number
}
