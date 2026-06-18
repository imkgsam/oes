export interface AccountContactAssetView {
  id: string
  tenantId: string
  accountId: string
  userId: string | null
  employeeId: string | null
  type: string
  provider: string | null
  value: string
  displayName: string | null
  ownership: string
  usage: string[]
  status: string
  isPrimary: boolean
  assignedAt: Date
  releasedAt: Date | null
}

export interface ContactAssetPublicValueSummaryView {
  type: string
  provider: string | null
  label: string
  displayValue: string
  actionValue: string
  actionUri: string
  includeInVCardAllowed: boolean
}

export interface ResolvedContactActionTargetView {
  contactActionType: string
  targetRefType: string
  targetRefId: string | null
  renderable: boolean
  hiddenReason: string | null
  publicValueSummary: ContactAssetPublicValueSummaryView | null
}

export interface ResolveContactActionTargetsView {
  targets: ResolvedContactActionTargetView[]
}
