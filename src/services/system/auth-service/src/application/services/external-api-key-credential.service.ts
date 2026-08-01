import { ApiKeyCredential } from '../../domain/api-key/api-key.credential'
import { randomUUID } from 'node:crypto'

/** Persists Auth-owned API-key credential verifiers without any recoverable secret material. */
export interface ExternalApiKeyCredentialStore {
  create(credentialId: string, credential: ApiKeyCredential): Promise<void>
  findByIdentifier(keyIdentifier: string): Promise<ApiKeyCredential | undefined>
  listByMachine(integrationMachineId: string, tenantId: string): Promise<readonly ApiKeyCredential[]>
  revoke(credentialId: string, revokedAt: Date): Promise<void>
}

export interface ExternalApiKeyManagementContext {
  trustedHuman: boolean
  permitted: boolean
  tenantId: string
  integrationMachineId: string
}

export interface ExternalApiKeyExchangeContext {
  readonly trustedGatewayExchange: true
}

/** Auth consumes these narrow owner facts only through trusted service adapters. */
export interface IntegrationMachineOwnerPort { resolve(id: string): Promise<{ eligible: boolean; tenantId: string }> }
export interface ExternalMachineAuthorizationPort { snapshot(machineId: string, tenantId: string): Promise<{ codes: string[]; authzVersion: string }> }

/** Enforces the Auth-owned API-key lifecycle boundary before any credential secret is issued or exchanged. */
export class ExternalApiKeyCredentialService {
  constructor(
    private readonly credentials: ExternalApiKeyCredentialStore,
    private readonly pepper: string,
    private readonly machineOwner?: IntegrationMachineOwnerPort,
    private readonly authorization?: ExternalMachineAuthorizationPort,
    private readonly now: () => Date = () => new Date()
  ) {}

  /** Creates one server-generated credential only for an already authorized trusted human request. */
  async create(context: ExternalApiKeyManagementContext): Promise<{ credentialId: string; apiKey: string }> {
    if (!context.trustedHuman || !context.permitted || !context.tenantId || !context.integrationMachineId) {
      throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    }
    this.assertPepper()

    const credentialId = randomUUID()
    const issued = ApiKeyCredential.issue({
      integrationMachineId: context.integrationMachineId,
      tenantId: context.tenantId,
      pepper: this.pepper,
      pepperVersion: 'configured',
      now: this.now()
    })
    await this.credentials.create(credentialId, issued.credential)
    return { credentialId, apiKey: issued.presentedKey }
  }

  /** Lists only non-secret credential metadata scoped to the already trusted machine and tenant. */
  async list(context: Pick<ExternalApiKeyManagementContext, 'trustedHuman' | 'permitted' | 'tenantId' | 'integrationMachineId'>): Promise<readonly ApiKeyCredential[]> {
    if (!context.trustedHuman || !context.permitted || !context.tenantId || !context.integrationMachineId) throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    return this.credentials.listByMachine(context.integrationMachineId, context.tenantId)
  }

  /** Revokes a credential permanently; repeating the operation leaves the first revocation fact intact. */
  async revoke(credentialId: string, trustedHuman: boolean, permitted: boolean): Promise<void> {
    if (!trustedHuman || !permitted || !credentialId) throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    await this.credentials.revoke(credentialId, this.now())
  }

  /** Rejects all exchange callers except the verified Gateway internal issuance policy boundary. */
  async exchange(presentedKey: string, context: ExternalApiKeyExchangeContext): Promise<void> {
    if (context.trustedGatewayExchange !== true) {
      throw new Error('EXTERNAL_API_KEY_INVALID')
    }
    this.assertPepper()
    const keyIdentifier = readKeyIdentifier(presentedKey)
    const credential = keyIdentifier
      ? await this.credentials.findByIdentifier(keyIdentifier)
      : undefined
    if (!credential || !credential.verify(presentedKey, this.pepper) || !credential.canExchange(this.now())) {
      throw new Error('EXTERNAL_API_KEY_INVALID')
    }
    const machine = await this.machineOwner?.resolve(credential.integrationMachineId)
    if (!machine?.eligible || machine.tenantId !== credential.tenantId) throw new Error('EXTERNAL_INTEGRATION_MACHINE_INACTIVE')
    const snapshot = await this.authorization?.snapshot(credential.integrationMachineId, credential.tenantId)
    if (!snapshot || snapshot.codes.length === 0) throw new Error('EXTERNAL_CAPABILITY_NOT_ALLOWED')
  }

  /** Fails closed when deployment has not supplied the protected verifier pepper. */
  private assertPepper(): void {
    if (!this.pepper) throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
  }
}

/** Extracts only the non-secret identifier so persistence never scans or receives full API-key material. */
function readKeyIdentifier(presentedKey: string): string | undefined {
  return /^oek_live_([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+$/.exec(presentedKey)?.[1]
}
