import { Injectable } from '@nestjs/common'
import { ApiKeyCredential } from '../../domain/api-key/api-key.credential'
import { randomUUID } from 'node:crypto'
import { ExternalApiKeyPepperPort } from '../ports/external-api-key-pepper.port'

/** Persists Auth-owned API-key credential verifiers without any recoverable secret material. */
export interface ExternalApiKeyCredentialStore {
  create(credentialId: string, credential: ApiKeyCredential): Promise<void>
  findById?(credentialId: string): Promise<StoredExternalApiKeyCredential | undefined>
  findByIdentifier(keyIdentifier: string): Promise<StoredExternalApiKeyCredential | undefined>
  listByMachine(integrationMachineId: string, tenantId: string): Promise<readonly StoredExternalApiKeyCredential[]>
  revoke(credentialId: string, revokedAt: Date): Promise<void>
  rotate?(input: { predecessorId: string; replacement: { id: string; integrationMachineId: string; tenantId: string; keyIdentifier: string; verifier: string; pepperVersion: string; expiresAt: Date }; overlapUntil: Date }): Promise<unknown>
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

export interface StoredExternalApiKeyCredential {
  id?: string
  integrationMachineId: string
  tenantId: string
  keyIdentifier: string
  verifier: string
  pepperVersion: string
  status: string
  createdAt: Date
  expiresAt: Date
  revokedAt?: Date | null
  supersedesCredentialId?: string | null
  lastUsedAt?: Date | null
}

/** Auth consumes these narrow owner facts only through trusted service adapters. */
export interface IntegrationMachineOwnerPort { resolve(id: string): Promise<{ eligible: boolean; tenantId: string }> }
export interface ExternalMachineAuthorizationPort { snapshot(machineId: string, tenantId: string): Promise<{ codes: string[]; authzVersion: string }> }
export interface ExternalApiKeyContextPort { resolve(): { trustedHuman: boolean; tenantId: string; operatorId: string; verifiedGatewayExchange: boolean } }
export interface ExternalApiKeyAuditPort { record(input: any): Promise<void> }

/** Enforces the Auth-owned API-key lifecycle boundary before any credential secret is issued or exchanged. */
@Injectable()
export class ExternalApiKeyCredentialService {
  constructor(
    private readonly credentials: ExternalApiKeyCredentialStore,
    private readonly protectedPepper?: ExternalApiKeyPepperPort,
    private readonly machineOwner?: IntegrationMachineOwnerPort,
    private readonly authorization?: ExternalMachineAuthorizationPort,
    private readonly contextPort?: ExternalApiKeyContextPort,
    private readonly auditPort?: ExternalApiKeyAuditPort,
    private readonly externalIssuer?: { issue(input: any): Promise<any> },
    private readonly now: () => Date = () => new Date()
  ) {}

  /** Resolves management authority from the trusted request context; missing context is deny-by-default. */
  private managementContext(integrationMachineId = '') {
    const context = this.contextPort?.resolve()
    if (!context?.trustedHuman || !context.tenantId || !context.operatorId) throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    return {
      trustedHuman: true,
      permitted: true,
      tenantId: context.tenantId,
      integrationMachineId,
      operatorId: context.operatorId
    }
  }

  /** Creates one server-generated credential only for an already authorized trusted human request. */
  async create(input: Pick<ExternalApiKeyManagementContext, 'integrationMachineId'>): Promise<{ credentialId: string; apiKey: string; credential: StoredExternalApiKeyCredential }> {
    const context = this.managementContext(input.integrationMachineId)
    try {
      const protectedPepper = await this.resolveCreationPepper()
      const credentialId = randomUUID()
      const issued = ApiKeyCredential.issue({
        integrationMachineId: context.integrationMachineId,
        tenantId: context.tenantId,
        pepper: protectedPepper.material,
        pepperVersion: protectedPepper.version,
        now: this.now()
      })
      const credential = toStoredCredential(credentialId, issued.credential)
      await this.credentials.create(credentialId, issued.credential)
      await this.auditPort?.record({ eventType: 'CREATE', outcome: 'SUCCESS', credentialId, machineId: credential.integrationMachineId, tenantId: credential.tenantId, operatorId: context.operatorId })
      return { credentialId, apiKey: issued.presentedKey, credential }
    } catch (error) {
      await this.auditPort?.record({ eventType: 'CREATE', outcome: 'DENIED', machineId: input.integrationMachineId ?? '', tenantId: context.tenantId, operatorId: context.operatorId })
      throw error
    }
  }

  /** Lists only non-secret credential metadata scoped to the already trusted machine and tenant. */
  async list(input: Pick<ExternalApiKeyManagementContext, 'integrationMachineId'>): Promise<readonly StoredExternalApiKeyCredential[]> {
    const context = this.managementContext(input.integrationMachineId)
    return this.credentials.listByMachine(context.integrationMachineId, context.tenantId) as Promise<readonly StoredExternalApiKeyCredential[]>
  }

  /** Revokes a credential permanently; repeating the operation leaves the first revocation fact intact. */
  async revoke(credentialId: string): Promise<void> {
    const context = this.managementContext('')
    if (!credentialId) throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    await this.credentials.revoke(credentialId, this.now())
    await this.auditPort?.record({ eventType: 'REVOKE', outcome: 'SUCCESS', credentialId, machineId: '', tenantId: context.tenantId, operatorId: context.operatorId })
  }

  /** Rotates an authorized machine credential with a bounded seven-day predecessor overlap. */
  async rotate(credentialId: string, _input?: Pick<ExternalApiKeyManagementContext, 'integrationMachineId'>): Promise<{ credentialId: string; apiKey: string; predecessorValidUntil: Date; credential: StoredExternalApiKeyCredential }> {
    const context = this.managementContext()
    if (!this.credentials.rotate) throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    const protectedPepper = await this.resolveCreationPepper()
    const predecessor = await this.credentials.findById?.(credentialId)
    if (!predecessor) throw new Error('EXTERNAL_API_KEY_INVALID')
    if (predecessor.tenantId !== context.tenantId) throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    const now = this.now(); const overlapUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const issued = ApiKeyCredential.issue({ integrationMachineId: predecessor.integrationMachineId, tenantId: context.tenantId, pepper: protectedPepper.material, pepperVersion: protectedPepper.version, now })
    const replacementId = randomUUID()
    await this.credentials.rotate({ predecessorId: credentialId, overlapUntil, replacement: { id: replacementId, integrationMachineId: predecessor.integrationMachineId, tenantId: context.tenantId, keyIdentifier: issued.credential.keyIdentifier, verifier: issued.credential.verifier, pepperVersion: issued.credential.pepperVersion, expiresAt: issued.credential.expiresAt } })
    const credential = toStoredCredential(replacementId, issued.credential, predecessor.id)
    await this.auditPort?.record({ eventType: 'ROTATE', outcome: 'SUCCESS', credentialId: replacementId, machineId: credential.integrationMachineId, tenantId: credential.tenantId, operatorId: context.operatorId })
    return { credentialId: replacementId, apiKey: issued.presentedKey, predecessorValidUntil: overlapUntil, credential }
  }

  /** Rejects all exchange callers except the verified Gateway internal issuance policy boundary. */
  async exchange(presentedKey: string, _legacyContext?: ExternalApiKeyExchangeContext): Promise<any> {
    const context = this.contextPort?.resolve()
    if (context?.verifiedGatewayExchange !== true) {
      throw new Error('EXTERNAL_API_KEY_INVALID')
    }
    const protectedPepper = await this.resolveCreationPepper()
    const keyIdentifier = readKeyIdentifier(presentedKey)
    const credential = keyIdentifier
      ? await this.credentials.findByIdentifier(keyIdentifier)
      : undefined
    const now = this.now()
    if (!credential) {
      await this.auditPort?.record({ eventType: 'EXCHANGE', outcome: 'DENIED', machineId: '', tenantId: '' })
      throw new Error('EXTERNAL_API_KEY_INVALID')
    }
    if (credential.pepperVersion !== protectedPepper.version || !matchesCredential(credential, presentedKey, protectedPepper.material)) {
      await this.auditPort?.record({ eventType: 'EXCHANGE', outcome: 'DENIED', credentialId: credential.id, machineId: credential.integrationMachineId, tenantId: credential.tenantId })
      throw new Error('EXTERNAL_API_KEY_INVALID')
    }
    const lifecycleError = resolveCredentialLifecycleError(credential, now)
    if (lifecycleError) {
      await this.auditPort?.record({ eventType: 'EXCHANGE', outcome: 'DENIED', credentialId: credential.id, machineId: credential.integrationMachineId, tenantId: credential.tenantId })
      throw new Error(lifecycleError)
    }
    const machine = await this.machineOwner?.resolve(credential.integrationMachineId)
    if (!machine?.eligible || machine.tenantId !== credential.tenantId) throw new Error('EXTERNAL_INTEGRATION_MACHINE_INACTIVE')
    const snapshot = await this.authorization?.snapshot(credential.integrationMachineId, credential.tenantId)
    if (!snapshot || snapshot.codes.length === 0) throw new Error('EXTERNAL_CAPABILITY_NOT_ALLOWED')
    if (!this.externalIssuer) throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    const result = await this.externalIssuer.issue({ machineId: credential.integrationMachineId, tenantId: credential.tenantId, credentialId: credential.id ?? credential.keyIdentifier, scope: snapshot.codes, authzVersion: snapshot.authzVersion })
    await this.auditPort?.record({ eventType: 'EXCHANGE', outcome: 'SUCCESS', credentialId: credential.id, machineId: credential.integrationMachineId, tenantId: credential.tenantId })
    return result
  }

  async exchangeExternalApiKey(presentedKey: string): Promise<any> { return this.exchange(presentedKey) }

  /** Obtains creation verifier material only from the protected provider; no configuration fallback exists. */
  private async resolveCreationPepper(): Promise<{ version: string; material: string }> {
    const pepper = await this.protectedPepper?.resolve()
    if (!pepper?.version || !pepper.material) throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    return pepper
  }
}

/** Extracts only the non-secret identifier so persistence never scans or receives full API-key material. */
function readKeyIdentifier(presentedKey: string): string | undefined {
  return /^oek_live_([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+$/.exec(presentedKey)?.[1]
}

/** Restores runtime-safe credential metadata from the issued domain aggregate. */
function toStoredCredential(id: string, credential: ApiKeyCredential, supersedesCredentialId?: string): StoredExternalApiKeyCredential {
  return {
    id,
    integrationMachineId: credential.integrationMachineId,
    tenantId: credential.tenantId,
    keyIdentifier: credential.keyIdentifier,
    verifier: credential.verifier,
    pepperVersion: credential.pepperVersion,
    status: credential.status,
    createdAt: credential.createdAt,
    expiresAt: credential.expiresAt,
    revokedAt: credential.revokedAt ?? null,
    supersedesCredentialId: supersedesCredentialId ?? null,
    lastUsedAt: null
  }
}

/** Verifies one persisted credential record without requiring a domain-entity instance from Prisma. */
function matchesCredential(credential: StoredExternalApiKeyCredential, presentedKey: string, pepper: string): boolean {
  return new ApiKeyCredentialRecordVerifier(credential).verify(presentedKey, pepper)
}

/** Maps stored lifecycle state to the frozen exchange failure categories. */
function resolveCredentialLifecycleError(credential: StoredExternalApiKeyCredential, now: Date): string | null {
  if (credential.status === 'REVOKED') return 'EXTERNAL_API_KEY_REVOKED'
  if (credential.status !== 'ACTIVE') return 'EXTERNAL_API_KEY_INACTIVE'
  if (now.getTime() >= credential.expiresAt.getTime()) return 'EXTERNAL_API_KEY_EXPIRED'
  return null
}

/** Reuses the frozen HMAC verifier logic against one persisted credential record. */
class ApiKeyCredentialRecordVerifier {
  constructor(private readonly credential: StoredExternalApiKeyCredential) {}
  verify(presentedKey: string, pepper: string): boolean {
    const issued = { verify: ApiKeyCredential.prototype.verify } as ApiKeyCredential
    return issued.verify.call(this.credential, presentedKey, pepper)
  }
}
