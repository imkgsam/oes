import { ApiKeyCredential } from '../../domain/api-key/api-key.credential'
import { randomUUID } from 'crypto'

export interface ExternalApiKeyManagementContext {
  trustedHuman: boolean
  permitted: boolean
}

export interface ExternalApiKeyExchangeContext {
  gatewayInternal: boolean
}

/** Enforces the Auth-owned API-key lifecycle boundary before any credential secret is issued or exchanged. */
export class ExternalApiKeyCredentialService {
  private readonly credentials = new Map<string, ApiKeyCredential>()

  /** Creates one server-generated credential only for an already authorized trusted human request. */
  create(context: ExternalApiKeyManagementContext): { credentialId: string; apiKey: string } {
    if (!context.trustedHuman || !context.permitted) {
      throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    }

    const credentialId = randomUUID()
    const issued = ApiKeyCredential.issue({
      integrationMachineId: 'trusted-machine',
      tenantId: 'trusted-tenant',
      pepper: process.env.EXTERNAL_API_KEY_PEPPER ?? 'development-only-pepper',
      pepperVersion: 'configured'
    })
    this.credentials.set(credentialId, issued.credential)
    return { credentialId, apiKey: issued.presentedKey }
  }

  /** Rejects all exchange callers except the verified Gateway internal issuance policy boundary. */
  exchange(presentedKey: string, context: ExternalApiKeyExchangeContext): void {
    if (!context.gatewayInternal) {
      throw new Error('EXTERNAL_API_KEY_INVALID')
    }
    const pepper = process.env.EXTERNAL_API_KEY_PEPPER ?? 'development-only-pepper'
    const credential = [...this.credentials.values()].find((item) => item.verify(presentedKey, pepper))
    if (!credential || !credential.canExchange()) {
      throw new Error('EXTERNAL_API_KEY_INVALID')
    }
  }
}
