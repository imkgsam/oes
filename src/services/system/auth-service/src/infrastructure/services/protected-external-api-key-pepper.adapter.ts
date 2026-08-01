import { ExternalApiKeyPepperPort } from '../../application/ports/external-api-key-pepper.port'

/** Calls a deployment-owned protected secret provider using only an opaque pepper reference. */
export interface ProtectedPepperProviderClient { resolvePepper(reference: string): Promise<{ version: string; material: string }> }
export class ProtectedExternalApiKeyPepperAdapter implements ExternalApiKeyPepperPort {
  constructor(private readonly client: ProtectedPepperProviderClient | undefined, private readonly reference: string | undefined, private readonly expectedVersion: string | undefined) {}
  async resolve(): Promise<{ version: string; material: string }> {
    if (!this.client || !this.reference || !this.expectedVersion) throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    const value = await this.client.resolvePepper(this.reference)
    if (!value?.material || value.version !== this.expectedVersion) throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    return value
  }
}
