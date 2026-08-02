/** Safe persisted credential projection for management responses; it intentionally excludes every secret-bearing field. */
export interface ExternalApiKeyCredentialView {
  credentialId: string
  integrationMachineId: string
  tenantId: string
  keyIdentifier: string
  status: string
  createdAt: Date
  expiresAt: Date
  lastUsedAt: Date | null
  supersedesCredentialId: string | null
  predecessorValidUntil: Date | null
}

/** Maps persistence records to a response-safe credential view without verifier or pepper leakage. */
export function toExternalApiKeyCredentialView(record: any): ExternalApiKeyCredentialView {
  return { credentialId: record.id, integrationMachineId: record.integrationMachineId, tenantId: record.tenantId, keyIdentifier: record.keyIdentifier, status: record.status, createdAt: record.createdAt, expiresAt: record.expiresAt, lastUsedAt: record.lastUsedAt ?? null, supersedesCredentialId: record.supersedesCredentialId ?? null, predecessorValidUntil: record.predecessorValidUntil ?? null }
}
