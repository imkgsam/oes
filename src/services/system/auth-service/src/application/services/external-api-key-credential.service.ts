import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { ApiKeyCredential } from '../../domain/api-key/api-key.credential'
import { ExternalApiKeyVerifierPort } from '../ports/external-api-key-verifier.port'
import { TenantLifecycleAccessPort } from '../ports/tenant-lifecycle-access.port'

/** Persists Auth-owned API-key credential verifiers without any recoverable secret material. */
export interface ExternalApiKeyCredentialStore {
  create(credentialId: string, credential: ApiKeyCredential): Promise<void>
  findById?(credentialId: string): Promise<StoredExternalApiKeyCredential | undefined>
  findByIdentifier(keyIdentifier: string): Promise<StoredExternalApiKeyCredential | undefined>
  listByMachine(
    integrationMachineId: string,
    tenantId: string
  ): Promise<readonly StoredExternalApiKeyCredential[]>
  listUsableVerifierKeyVersions(now: Date): Promise<readonly string[]>
  revoke(credentialId: string, revokedAt: Date): Promise<void>
  rotate?(input: {
    predecessorId: string
    replacement: {
      id: string
      integrationMachineId: string
      tenantId: string
      keyIdentifier: string
      verifier: string
      verifierKeyVersion: string
      expiresAt: Date
    }
    overlapUntil: Date
  }): Promise<unknown>
}

export interface ExternalApiKeyManagementContext {
  trustedHuman: boolean
  permitted: boolean
  tenantId: string
  integrationMachineId: string
  operatorId?: string
  requestId?: string
  traceId?: string
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
  verifierKeyVersion: string
  status: string
  createdAt: Date
  expiresAt: Date
  revokedAt?: Date | null
  supersedesCredentialId?: string | null
  predecessorValidUntil?: Date | null
  lastUsedAt?: Date | null
}

/** Auth consumes these narrow owner facts only through trusted service adapters. */
export interface IntegrationMachineOwnerPort {
  resolve(id: string): Promise<{ eligible: boolean; tenantId: string }>
}
export interface ExternalMachineAuthorizationPort {
  snapshot(machineId: string, tenantId: string): Promise<{ codes: string[]; authzVersion: string }>
}
export interface ExternalApiKeyContextPort {
  resolve(): {
    trustedHuman: boolean
    tenantId: string
    operatorId: string
    verifiedGatewayExchange: boolean
    requestId?: string
    traceId?: string
  }
}
export interface ExternalApiKeyAuditPort {
  record(input: unknown): Promise<void>
}

/** Enforces the Auth-owned API-key lifecycle boundary before any credential secret is issued or exchanged. */
@Injectable()
export class ExternalApiKeyCredentialService {
  constructor(
    private readonly credentials: ExternalApiKeyCredentialStore,
    private readonly verifier?: ExternalApiKeyVerifierPort,
    private readonly machineOwner?: IntegrationMachineOwnerPort,
    private readonly tenantLifecycle?: TenantLifecycleAccessPort,
    private readonly authorization?: ExternalMachineAuthorizationPort,
    private readonly contextPort?: ExternalApiKeyContextPort,
    private readonly auditPort?: ExternalApiKeyAuditPort,
    private readonly externalIssuer?: { issue(input: unknown): Promise<any> },
    private readonly now: () => Date = () => new Date()
  ) {}

  /** Reads the current trusted request facts for deny-path audit without granting any authority by itself. */
  private requestContext(): {
    trustedHuman: boolean
    tenantId: string
    operatorId: string
    verifiedGatewayExchange: boolean
    requestId?: string
    traceId?: string
  } {
    const context = this.contextPort?.resolve()
    return {
      trustedHuman: context?.trustedHuman === true,
      tenantId: context?.tenantId ?? '',
      operatorId: context?.operatorId ?? '',
      verifiedGatewayExchange: context?.verifiedGatewayExchange === true,
      ...(context?.requestId ? { requestId: context.requestId } : {}),
      ...(context?.traceId ? { traceId: context.traceId } : {})
    }
  }

  /** Resolves management authority from the trusted request context; missing context is deny-by-default. */
  private managementContext(integrationMachineId = '') {
    const context = this.requestContext()
    if (!context.trustedHuman || !context.tenantId || !context.operatorId) {
      throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    }
    return {
      trustedHuman: true,
      permitted: true,
      tenantId: context.tenantId,
      integrationMachineId,
      operatorId: context.operatorId,
      requestId: context.requestId,
      traceId: context.traceId
    }
  }

  /** Creates one server-generated credential only for an already authorized trusted human request. */
  async create(input: Pick<ExternalApiKeyManagementContext, 'integrationMachineId'>): Promise<{
    credentialId: string
    apiKey: string
    credential: StoredExternalApiKeyCredential
  }> {
    const deniedContext = this.requestContext()
    try {
      const context = this.managementContext(input.integrationMachineId)
      await this.assertEligibleManagementMachine(context.integrationMachineId, context.tenantId)
      await this.assertTenantActive(context.tenantId)
      await this.assertVerifierReadiness()
      const credentialId = randomUUID()
      const issued = await this.issueCredential(
        context.integrationMachineId,
        context.tenantId,
        this.now()
      )
      const credential = toStoredCredential(credentialId, issued.credential)
      await this.credentials.create(credentialId, issued.credential)
      await this.auditPort?.record({
        eventType: 'CREATE',
        outcome: 'SUCCESS',
        credentialId,
        machineId: credential.integrationMachineId,
        tenantId: credential.tenantId,
        operatorId: context.operatorId,
        requestId: context.requestId,
        traceId: context.traceId
      })
      return { credentialId, apiKey: issued.presentedKey, credential }
    } catch (error) {
      await this.auditPort?.record({
        eventType: 'CREATE',
        outcome: 'DENIED',
        machineId: input.integrationMachineId ?? '',
        tenantId: deniedContext.tenantId,
        operatorId: deniedContext.operatorId,
        requestId: deniedContext.requestId,
        traceId: deniedContext.traceId
      })
      throw error
    }
  }

  /** Lists only non-secret credential metadata scoped to the already trusted machine and tenant. */
  async list(
    input: Pick<ExternalApiKeyManagementContext, 'integrationMachineId'>
  ): Promise<readonly StoredExternalApiKeyCredential[]> {
    const deniedContext = this.requestContext()
    try {
      const context = this.managementContext(input.integrationMachineId)
      await this.assertEligibleManagementMachine(context.integrationMachineId, context.tenantId)
      const records = (await this.credentials.listByMachine(
        context.integrationMachineId,
        context.tenantId
      )) as readonly StoredExternalApiKeyCredential[]
      await this.auditPort?.record({
        eventType: 'LIST',
        outcome: 'SUCCESS',
        machineId: context.integrationMachineId,
        tenantId: context.tenantId,
        operatorId: context.operatorId,
        requestId: context.requestId,
        traceId: context.traceId
      })
      return records
    } catch (error) {
      await this.auditPort?.record({
        eventType: 'LIST',
        outcome: 'DENIED',
        machineId: input.integrationMachineId ?? '',
        tenantId: deniedContext.tenantId,
        operatorId: deniedContext.operatorId,
        requestId: deniedContext.requestId,
        traceId: deniedContext.traceId
      })
      throw error
    }
  }

  /** Revokes a credential permanently; repeating the operation leaves the first revocation fact intact. */
  async revoke(credentialId: string): Promise<void> {
    const deniedContext = this.requestContext()
    let existing: StoredExternalApiKeyCredential | undefined
    if (!credentialId) {
      throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    }
    try {
      const context = this.managementContext('')
      existing = await this.credentials.findById?.(credentialId)
      if (!existing || existing.tenantId !== context.tenantId) {
        throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
      }
      await this.credentials.revoke(credentialId, this.now())
      await this.auditPort?.record({
        eventType: 'REVOKE',
        outcome: 'SUCCESS',
        credentialId,
        machineId: existing.integrationMachineId,
        tenantId: context.tenantId,
        operatorId: context.operatorId,
        requestId: context.requestId,
        traceId: context.traceId
      })
    } catch (error) {
      await this.auditPort?.record({
        eventType: 'REVOKE',
        outcome: 'DENIED',
        credentialId,
        machineId: existing?.integrationMachineId ?? '',
        tenantId: existing?.tenantId ?? deniedContext.tenantId,
        operatorId: deniedContext.operatorId,
        requestId: deniedContext.requestId,
        traceId: deniedContext.traceId
      })
      throw error
    }
  }

  /** Rotates an authorized machine credential with a bounded seven-day predecessor overlap. */
  async rotate(
    credentialId: string,
    _input?: Pick<ExternalApiKeyManagementContext, 'integrationMachineId'>
  ): Promise<{
    credentialId: string
    apiKey: string
    predecessorValidUntil: Date
    credential: StoredExternalApiKeyCredential
  }> {
    const deniedContext = this.requestContext()
    let predecessor: StoredExternalApiKeyCredential | undefined
    if (!credentialId) {
      throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    }
    try {
      const context = this.managementContext()
      if (!this.credentials.rotate) {
        throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
      }
      predecessor = await this.credentials.findById?.(credentialId)
      if (!predecessor) {
        throw new Error('EXTERNAL_API_KEY_INVALID')
      }
      if (predecessor.tenantId !== context.tenantId) {
        throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
      }
      await this.assertEligibleManagementMachine(predecessor.integrationMachineId, context.tenantId)
      await this.assertTenantActive(context.tenantId)
      await this.assertVerifierReadiness()
      const now = this.now()
      const overlapUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const issued = await this.issueCredential(
        predecessor.integrationMachineId,
        context.tenantId,
        now
      )
      const replacementId = randomUUID()
      await this.credentials.rotate({
        predecessorId: credentialId,
        overlapUntil,
        replacement: {
          id: replacementId,
          integrationMachineId: predecessor.integrationMachineId,
          tenantId: context.tenantId,
          keyIdentifier: issued.credential.keyIdentifier,
          verifier: issued.credential.verifier,
          verifierKeyVersion: issued.credential.verifierKeyVersion,
          expiresAt: issued.credential.expiresAt
        }
      })
      const credential = toStoredCredential(replacementId, issued.credential, predecessor.id)
      await this.auditPort?.record({
        eventType: 'ROTATE',
        outcome: 'SUCCESS',
        credentialId: replacementId,
        machineId: credential.integrationMachineId,
        tenantId: credential.tenantId,
        operatorId: context.operatorId,
        requestId: context.requestId,
        traceId: context.traceId
      })
      return {
        credentialId: replacementId,
        apiKey: issued.presentedKey,
        predecessorValidUntil: overlapUntil,
        credential
      }
    } catch (error) {
      await this.auditPort?.record({
        eventType: 'ROTATE',
        outcome: 'DENIED',
        credentialId,
        machineId: predecessor?.integrationMachineId ?? '',
        tenantId: predecessor?.tenantId ?? deniedContext.tenantId,
        operatorId: deniedContext.operatorId,
        requestId: deniedContext.requestId,
        traceId: deniedContext.traceId
      })
      throw error
    }
  }

  /** Rejects all exchange callers except the verified Gateway internal issuance policy boundary. */
  async exchange(
    presentedKey: string,
    _legacyContext?: ExternalApiKeyExchangeContext
  ): Promise<any> {
    const context = this.requestContext()
    if (context.verifiedGatewayExchange !== true) {
      await this.auditPort?.record({
        eventType: 'EXCHANGE',
        outcome: 'DENIED',
        machineId: '',
        tenantId: '',
        requestId: context.requestId,
        traceId: context.traceId
      })
      throw new Error('EXTERNAL_API_KEY_INVALID')
    }

    const parsed = ApiKeyCredential.parse(presentedKey)
    if (!parsed) {
      await this.auditPort?.record({
        eventType: 'EXCHANGE',
        outcome: 'DENIED',
        machineId: '',
        tenantId: '',
        requestId: context.requestId,
        traceId: context.traceId
      })
      throw new Error('EXTERNAL_API_KEY_INVALID')
    }

    let credential: StoredExternalApiKeyCredential | undefined
    try {
      await this.assertVerifierReadiness()
      credential = await this.credentials.findByIdentifier(parsed.identifier)
      if (!credential) {
        await this.exerciseUnknownIdentifierPath(parsed.identifier, parsed.secret)
        throw new Error('EXTERNAL_API_KEY_INVALID')
      }
      const candidate = await this.computeVerifier({
        mode: 'VERIFY',
        identifier: parsed.identifier,
        secret: parsed.secret,
        verifierKeyVersion: credential.verifierKeyVersion
      })
      if (
        candidate.verifierKeyVersion !== credential.verifierKeyVersion ||
        !matchesCredential(credential, presentedKey, candidate.verifier)
      ) {
        throw new Error('EXTERNAL_API_KEY_INVALID')
      }
      const now = this.now()
      const lifecycleError = resolveCredentialLifecycleError(credential, now)
      if (lifecycleError) {
        throw new Error(lifecycleError)
      }
      const machine = await this.machineOwner?.resolve(credential.integrationMachineId)
      if (!machine?.eligible || machine.tenantId !== credential.tenantId) {
        throw new Error('EXTERNAL_INTEGRATION_MACHINE_INACTIVE')
      }
      await this.assertTenantActive(credential.tenantId)
      const snapshot = await this.authorization?.snapshot(
        credential.integrationMachineId,
        credential.tenantId
      )
      if (!snapshot || snapshot.codes.length === 0 || !snapshot.authzVersion) {
        throw new Error('EXTERNAL_CAPABILITY_NOT_ALLOWED')
      }
      if (!this.externalIssuer) {
        throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
      }
      const result = await this.externalIssuer.issue({
        machineId: credential.integrationMachineId,
        tenantId: credential.tenantId,
        credentialId: credential.id ?? credential.keyIdentifier,
        scope: snapshot.codes,
        authzVersion: snapshot.authzVersion
      })
      await this.auditPort?.record({
        eventType: 'EXCHANGE',
        outcome: 'SUCCESS',
        credentialId: credential.id,
        machineId: credential.integrationMachineId,
        tenantId: credential.tenantId,
        correlationId: result.auditCorrelationId,
        requestId: context.requestId,
        traceId: context.traceId
      })
      return result
    } catch (error) {
      await this.auditPort?.record({
        eventType: 'EXCHANGE',
        outcome: 'DENIED',
        credentialId: credential?.id,
        machineId: credential?.integrationMachineId ?? '',
        tenantId: credential?.tenantId ?? '',
        requestId: context.requestId,
        traceId: context.traceId
      })
      throw error
    }
  }

  async exchangeExternalApiKey(presentedKey: string): Promise<any> {
    return this.exchange(presentedKey)
  }

  /** Generates, seals, and materializes one credential through the protected verifier provider. */
  private async issueCredential(
    integrationMachineId: string,
    tenantId: string,
    now: Date
  ): Promise<{ credential: ApiKeyCredential; presentedKey: string }> {
    const generated = ApiKeyCredential.generatePresentation({ now })
    const computed = await this.computeVerifier({
      mode: 'ISSUE',
      identifier: generated.keyIdentifier,
      secret: generated.secret
    })
    return ApiKeyCredential.issue({
      integrationMachineId,
      tenantId,
      keyIdentifier: generated.keyIdentifier,
      secret: generated.secret,
      verifier: computed.verifier,
      verifierKeyVersion: computed.verifierKeyVersion,
      now: generated.createdAt,
      expiresAt: generated.expiresAt
    })
  }

  /** Requires a single active issue version plus every still-usable persisted verifier version before protected operations run. */
  private async assertVerifierReadiness(): Promise<void> {
    if (!this.verifier) {
      throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    }
    const status = await this.verifier.getStatus()
    const versions = Array.isArray(status?.versions) ? status.versions : []
    const now = this.now()
    const readyVersionsByLifecycle = versions.filter((version) => {
      const activatedAt = version.activatedAt?.getTime()
      if (!Number.isFinite(activatedAt) || (activatedAt as number) > now.getTime()) {
        return false
      }
      if (version.state === 'ACTIVE') {
        return version.verifyOnlyAt == null && version.retireAfter == null
      }
      const verifyOnlyAt = version.verifyOnlyAt?.getTime()
      const retireAfter = version.retireAfter?.getTime()
      return (
        Number.isFinite(verifyOnlyAt) &&
        Number.isFinite(retireAfter) &&
        (verifyOnlyAt as number) >= (activatedAt as number) &&
        (verifyOnlyAt as number) <= now.getTime() &&
        now.getTime() < (retireAfter as number)
      )
    })
    const activeVersions = readyVersionsByLifecycle.filter((version) => version.state === 'ACTIVE')
    if (
      !status?.activeVerifierKeyVersion ||
      activeVersions.length !== 1 ||
      activeVersions[0]?.verifierKeyVersion !== status.activeVerifierKeyVersion
    ) {
      throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    }
    const readyVersions = new Set(
      readyVersionsByLifecycle.map((version) => version.verifierKeyVersion)
    )
    const referencedVersions = await this.credentials.listUsableVerifierKeyVersions(this.now())
    if (referencedVersions.some((verifierKeyVersion) => !readyVersions.has(verifierKeyVersion))) {
      throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    }
  }

  /** Computes one provider-owned verifier while rejecting malformed provider output. */
  private async computeVerifier(input: {
    mode: 'ISSUE' | 'VERIFY'
    identifier: string
    secret: string
    verifierKeyVersion?: string
  }): Promise<{ verifier: string; verifierKeyVersion: string }> {
    const computed = await this.verifier?.compute(input)
    if (
      !computed?.verifierKeyVersion ||
      !ApiKeyCredential.sameVerifier(computed.verifier, computed.verifier)
    ) {
      throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    }
    return computed
  }

  /** Executes the bounded unknown-identifier deny path without disclosing whether the identifier exists. */
  private async exerciseUnknownIdentifierPath(identifier: string, secret: string): Promise<void> {
    const candidate = await this.computeVerifier({
      mode: 'ISSUE',
      identifier,
      secret
    })
    ApiKeyCredential.sameVerifier(candidate.verifier, ApiKeyCredential.dummyVerifier())
  }

  /** Verifies the trusted tenant machine boundary before management changes can touch credential state. */
  private async assertEligibleManagementMachine(
    integrationMachineId: string,
    tenantId: string
  ): Promise<void> {
    if (!integrationMachineId) {
      throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    }
    const machine = await this.machineOwner?.resolve(integrationMachineId)
    if (!machine?.eligible || machine.tenantId !== tenantId) {
      throw new Error('EXTERNAL_INTEGRATION_MACHINE_INACTIVE')
    }
  }

  /** Requires tenant-org ACTIVE before a credential can create, rotate, or exchange future external access. */
  private async assertTenantActive(tenantId: string): Promise<void> {
    const status = await this.tenantLifecycle?.getTenantStatus(tenantId)
    if (status !== 'ACTIVE') {
      throw new Error('EXTERNAL_INTEGRATION_TENANT_INACTIVE')
    }
  }
}

/** Restores runtime-safe credential metadata from the issued domain aggregate. */
function toStoredCredential(
  id: string,
  credential: ApiKeyCredential,
  supersedesCredentialId?: string
): StoredExternalApiKeyCredential {
  return {
    id,
    integrationMachineId: credential.integrationMachineId,
    tenantId: credential.tenantId,
    keyIdentifier: credential.keyIdentifier,
    verifier: credential.verifier,
    verifierKeyVersion: credential.verifierKeyVersion,
    status: credential.status,
    createdAt: credential.createdAt,
    expiresAt: credential.expiresAt,
    revokedAt: credential.revokedAt ?? null,
    supersedesCredentialId: supersedesCredentialId ?? null,
    lastUsedAt: null
  }
}

/** Verifies one persisted credential record without requiring a domain-entity instance from Prisma. */
function matchesCredential(
  credential: StoredExternalApiKeyCredential,
  presentedKey: string,
  verifier: string
): boolean {
  return new ApiKeyCredentialRecordVerifier(credential).verify(presentedKey, verifier)
}

/** Maps stored lifecycle state to the frozen exchange failure categories. */
function resolveCredentialLifecycleError(
  credential: StoredExternalApiKeyCredential,
  now: Date
): string | null {
  if (credential.status === 'REVOKED') return 'EXTERNAL_API_KEY_REVOKED'
  if (credential.status !== 'ACTIVE') return 'EXTERNAL_API_KEY_INACTIVE'
  if (
    credential.predecessorValidUntil &&
    now.getTime() >= credential.predecessorValidUntil.getTime()
  ) {
    return 'EXTERNAL_API_KEY_INACTIVE'
  }
  if (now.getTime() >= credential.expiresAt.getTime()) {
    return 'EXTERNAL_API_KEY_EXPIRED'
  }
  return null
}

/** Reuses the frozen verifier-comparison logic against one persisted credential record. */
class ApiKeyCredentialRecordVerifier {
  constructor(private readonly credential: StoredExternalApiKeyCredential) {}

  /** Compares a provider-computed verifier against one stored credential record without rehydrating a domain entity. */
  verify(presentedKey: string, verifier: string): boolean {
    const issued = { verify: ApiKeyCredential.prototype.verify } as ApiKeyCredential
    return issued.verify.call(this.credential, presentedKey, verifier)
  }
}
