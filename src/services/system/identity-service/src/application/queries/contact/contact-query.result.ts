export interface AccountContactAssetView {
  id: string
  tenantId: string
  accountId: string
  type: string
  value: string
  status: string
  isPrimary: boolean
  assignedAt: Date
  revokedAt: Date | null
}
