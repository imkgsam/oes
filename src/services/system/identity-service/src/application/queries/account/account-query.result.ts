export interface AccountSummaryView {
  id: string
  userId: string
  tenantId: string | null
  scopeLevel: 'SYSTEM' | 'TENANT'
  displayName: string | null
  isEnabled: boolean
}

export interface AccountCandidateView {
  accountId: string
  tenantId: string | null
  scopeLevel: 'SYSTEM' | 'TENANT'
  displayName: string | null
  isEnabled: boolean
}
