import type {
  ActiveExternalApiKeyVerifierVersionStatus,
  CompromisedDisabledExternalApiKeyVerifierVersionStatus,
  ExternalApiKeyVerifierPort,
  VerifyOnlyExternalApiKeyVerifierVersionStatus
} from '../../application/ports/external-api-key-verifier.port'

/** Defines the narrow protected-client methods Auth may use for external API-key verifier operations. */
export interface ProtectedExternalApiKeyVerifierClient {
  getExternalApiKeyVerifierStatus(): Promise<{
    activeVerifierKeyVersion: string
    versions: readonly (
      | ActiveExternalApiKeyVerifierVersionStatus
      | VerifyOnlyExternalApiKeyVerifierVersionStatus
      | CompromisedDisabledExternalApiKeyVerifierVersionStatus
    )[]
  }>
  computeExternalApiKeyVerifier(input: {
    mode: 'ISSUE' | 'VERIFY'
    identifier: string
    secret: string
    verifierKeyVersion?: string
  }): Promise<{
    verifier: string
    verifierKeyVersion: string
  }>
}

/** Delegates Auth verifier operations to the deployment-owned protected UDS provider without exposing key material. */
export class ProtectedExternalApiKeyVerifierAdapter implements ExternalApiKeyVerifierPort {
  constructor(private readonly client: ProtectedExternalApiKeyVerifierClient | undefined) {}

  /** Reads the provider-owned readiness window required by Auth before issuing or exchanging credentials. */
  async getStatus() {
    const status = await this.client?.getExternalApiKeyVerifierStatus()
    if (!status?.activeVerifierKeyVersion || !Array.isArray(status.versions)) {
      throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    }
    return status
  }

  /** Computes one verifier through the protected provider while preserving its mode and version constraints. */
  async compute(input: {
    mode: 'ISSUE' | 'VERIFY'
    identifier: string
    secret: string
    verifierKeyVersion?: string
  }) {
    const computed = await this.client?.computeExternalApiKeyVerifier(input)
    if (!computed?.verifier || !computed.verifierKeyVersion) {
      throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    }
    return computed
  }
}
