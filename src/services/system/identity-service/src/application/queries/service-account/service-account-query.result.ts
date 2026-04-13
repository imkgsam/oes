export interface ServiceAccountView {
  id: string
  tenantId: string | null
  scopeLevel: string
  type: string
  name: string
  description: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  createdBy: string | null
  disabledAt: Date | null
  disabledBy: string | null
}

export interface ApiKeyView {
  id: string
  serviceAccountId: string
  keyCode: string
  status: string
  expiresAt: Date | null
  lastUsedAt: Date | null
  createdAt: Date
  updatedAt: Date
  createdBy: string | null
  revokedAt: Date | null
  revokedBy: string | null
}
