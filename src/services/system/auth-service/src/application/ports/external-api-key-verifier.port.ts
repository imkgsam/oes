export type ExternalApiKeyVerifierMode = 'ISSUE' | 'VERIFY'
export type ExternalApiKeyVerifierVersionState =
  | 'ACTIVE'
  | 'VERIFY_ONLY'
  | 'COMPROMISED_DISABLED'

/** Describes one provider-owned active verifier version without exposing any backend key selector. */
export interface ActiveExternalApiKeyVerifierVersionStatus {
  verifierKeyVersion: string
  state: 'ACTIVE'
  activatedAt: Date
}

/** Describes one provider-owned verify-only version that may still validate persisted credentials. */
export interface VerifyOnlyExternalApiKeyVerifierVersionStatus {
  verifierKeyVersion: string
  state: 'VERIFY_ONLY'
  activatedAt: Date
  verifyOnlyAt?: Date | null
  retireAfter?: Date | null
}

/** Describes one terminal compromised-disabled version with only safe incident evidence. */
export interface CompromisedDisabledExternalApiKeyVerifierVersionStatus {
  verifierKeyVersion: string
  state: 'COMPROMISED_DISABLED'
  incidentReference: string
  occurredAt: Date
  stateRevision: string
}

/** Describes one provider-owned verifier version without exposing any backend key selector. */
export type ExternalApiKeyVerifierVersionStatus =
  | ActiveExternalApiKeyVerifierVersionStatus
  | VerifyOnlyExternalApiKeyVerifierVersionStatus
  | CompromisedDisabledExternalApiKeyVerifierVersionStatus

/** Reports the provider-owned issue and verification window that gates Auth API-key readiness. */
export interface ExternalApiKeyVerifierStatus {
  activeVerifierKeyVersion: string
  versions: readonly ExternalApiKeyVerifierVersionStatus[]
}

/** Computes or verifies an Auth-owned API-key verifier without exposing raw Pepper material. */
export interface ExternalApiKeyVerifierPort {
  getStatus(): Promise<ExternalApiKeyVerifierStatus>
  compute(input: {
    mode: ExternalApiKeyVerifierMode
    identifier: string
    secret: string
    verifierKeyVersion?: string
  }): Promise<{
    verifier: string
    verifierKeyVersion: string
  }>
}

export const EXTERNAL_API_KEY_VERIFIER_PORT = 'ExternalApiKeyVerifierPort'
