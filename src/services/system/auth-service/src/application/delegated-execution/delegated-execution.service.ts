import {
  actionDescriptorDigest,
  actionValueDigest,
  type ActionDescriptorV1
} from '@oes/common/authorization'
import { randomUUID } from 'node:crypto'
import type { ExecutionTokenSigningPort } from '../../domain/ports/execution-token-signing.port'
import type {
  DelegatedAuthorizationPort,
  DelegatedConfirmationEvidencePort,
  DelegatedExecutionAuditInput,
  DelegationGrantRepository,
  DelegationGrantSnapshot
} from './delegated-execution.ports'

export type CreateDelegationGrantInput = {
  readonly humanPrincipalId: string
  readonly sessionId: string
  readonly tenantId: string
  readonly orgId?: string
  readonly agentPrincipalId: string
  readonly toolContract: { readonly id: string; readonly version: string }
  readonly operationKeys: readonly string[]
  readonly permissionCodes: readonly string[]
  readonly expiresAt: Date
  readonly traceId: string
}

export type RequestActionGrantInput = {
  readonly delegationReference: string
  readonly humanPrincipalId: string
  readonly agentPrincipalId: string
  readonly tenantId: string
  readonly orgId?: string
  readonly targetAudience: string
  readonly workloadIdentity: { readonly spiffeId: string; readonly certificateThumbprint: string }
  readonly descriptor: ActionDescriptorV1
  readonly confirmation: {
    readonly reference: string
    readonly descriptorDigest: string
    readonly stepUpReference?: string
  }
  readonly traceId: string
}

type DelegatedExecutionServiceOptions = {
  readonly repository: DelegationGrantRepository
  readonly authorization: DelegatedAuthorizationPort
  readonly confirmationEvidence: DelegatedConfirmationEvidencePort
  readonly signer: ExecutionTokenSigningPort
  readonly issuer: string
  readonly now?: () => number
  readonly randomId?: () => string
}

/** Orchestrates Auth-owned DelegationGrant lifecycle and one-time ActionGrant issuance. */
export class DelegatedExecutionService {
  private readonly now: () => number
  private readonly randomId: () => string

  constructor(private readonly options: DelegatedExecutionServiceOptions) {
    this.now = options.now ?? (() => Math.floor(Date.now() / 1_000))
    this.randomId = options.randomId ?? randomUUID
    if (!/^https:\/\//.test(options.issuer))
      throw new Error('ActionGrant issuer must be one exact HTTPS issuer')
  }

  /** Creates one explicit immutable delegation only after Permission approves the complete requested upper bound. */
  async createDelegationGrant(input: CreateDelegationGrantInput): Promise<DelegationGrantSnapshot> {
    const now = this.now()
    const operationKeys = canonicalSet(input.operationKeys, 'operation key')
    const permissionCodes = canonicalSet(input.permissionCodes, 'permission code', true)
    requireText(input.humanPrincipalId, 'human principal')
    requireText(input.sessionId, 'session')
    requireText(input.tenantId, 'tenant')
    requireText(input.agentPrincipalId, 'agent principal')
    requireText(input.toolContract.id, 'ToolContract id')
    requireText(input.toolContract.version, 'ToolContract version')
    requireText(input.traceId, 'trace')
    if (
      !(input.expiresAt instanceof Date) ||
      !Number.isFinite(input.expiresAt.getTime()) ||
      input.expiresAt.getTime() <= now * 1_000
    ) {
      throw new Error('DELEGATION_GRANT_EXPIRED')
    }
    const decision = await this.options.authorization.authorizeDelegation({
      humanPrincipalId: input.humanPrincipalId,
      tenantId: input.tenantId,
      ...(input.orgId === undefined ? {} : { orgId: input.orgId }),
      agentPrincipalId: input.agentPrincipalId,
      toolContract: input.toolContract,
      operationKeys,
      permissionCodes
    })
    if (!decision.allowed) throw new Error('DELEGATION_TOOL_BOUNDARY_DENIED')
    const grant: DelegationGrantSnapshot = Object.freeze({
      delegationReference: this.randomId(),
      humanPrincipalId: input.humanPrincipalId,
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      ...(input.orgId === undefined ? {} : { orgId: input.orgId }),
      agentPrincipalId: input.agentPrincipalId,
      toolContractId: input.toolContract.id,
      toolContractVersion: input.toolContract.version,
      operationKeys,
      permissionCodes,
      authzVersion: decision.authzVersion,
      authorizationDecisionReference: decision.decisionReference,
      expiresAt: new Date(input.expiresAt),
      createdAt: new Date(now * 1_000)
    })
    await this.options.repository.create(
      grant,
      this.audit({
        eventType: 'DELEGATION_GRANT_CREATED',
        grant,
        authorizationDecisionReference: decision.decisionReference,
        traceId: input.traceId,
        occurredAt: grant.createdAt
      })
    )
    return grant
  }

  /** Revokes only the owning HUMAN's grant and returns the immutable first-revoke outcome on retry. */
  async revokeDelegationGrant(input: {
    readonly delegationReference: string
    readonly humanPrincipalId: string
    readonly reasonCategory: string
    readonly traceId: string
  }): Promise<DelegationGrantSnapshot> {
    const grant = await this.requireGrant(input.delegationReference)
    if (grant.humanPrincipalId !== input.humanPrincipalId)
      throw new Error('DELEGATION_TOOL_BOUNDARY_DENIED')
    if (grant.revokedAt) return grant
    const revokedAt = new Date(this.now() * 1_000)
    return this.options.repository.revoke(
      grant.delegationReference,
      revokedAt,
      this.audit({
        eventType: 'DELEGATION_GRANT_REVOKED',
        grant,
        authorizationDecisionReference: grant.authorizationDecisionReference,
        traceId: input.traceId,
        occurredAt: revokedAt
      }),
      requireText(input.reasonCategory, 'revoke reason category')
    )
  }

  /** Issues one descriptor-bound ag+jwt after rechecking the active delegation, Permission decision and confirmation. */
  async requestActionGrant(input: RequestActionGrantInput): Promise<{
    readonly actionGrant: string
    readonly actionGrantJti: string
    readonly descriptorDigest: string
    readonly expiresAt: Date
  }> {
    const grant = await this.requireGrant(input.delegationReference)
    this.assertActiveGrant(grant)
    const descriptorDigest = actionDescriptorDigest(input.descriptor)
    if (
      grant.humanPrincipalId !== input.humanPrincipalId ||
      grant.agentPrincipalId !== input.agentPrincipalId ||
      grant.tenantId !== input.tenantId ||
      grant.orgId !== input.orgId ||
      grant.toolContractId !== input.descriptor.toolContract.id ||
      grant.toolContractVersion !== input.descriptor.toolContract.version ||
      !grant.operationKeys.includes(input.descriptor.operationKey) ||
      input.confirmation.descriptorDigest !== descriptorDigest
    ) {
      throw new Error('ACTION_GRANT_DESCRIPTOR_MISMATCH')
    }
    assertAudience(input.targetAudience)
    assertWorkload(input.workloadIdentity)
    requireText(input.confirmation.reference, 'confirmation reference')
    const confirmation = await this.options.confirmationEvidence.verify({
      reference: input.confirmation.reference,
      humanPrincipalId: input.humanPrincipalId,
      sessionId: grant.sessionId,
      tenantId: input.tenantId,
      descriptorDigest
    })
    if (!confirmation.matched || confirmation.reference !== input.confirmation.reference) {
      throw new Error('ACTION_GRANT_CONFIRMATION_REQUIRED')
    }
    const decision = await this.options.authorization.authorizeAction({
      grant,
      descriptor: input.descriptor,
      targetAudience: input.targetAudience
    })
    if (!decision.allowed || decision.authzVersion !== grant.authzVersion) {
      throw new Error('DELEGATION_TOOL_BOUNDARY_DENIED')
    }
    if (decision.riskClass === 'AI_FORBIDDEN') throw new Error('ACTION_GRANT_FORBIDDEN_OPERATION')
    if (decision.riskClass !== 'ACTION_GRANT_REQUIRED')
      throw new Error('ACTION_GRANT_FORBIDDEN_OPERATION')
    if (decision.stepUpRequired && !confirmation.stepUpReference)
      throw new Error('ACTION_GRANT_STEP_UP_REQUIRED')

    const signingKey = await this.options.signer.currentSigningKey()
    const now = this.now()
    if (
      signingKey.publishNotBeforeUnixSeconds + 300 > signingKey.signingNotBeforeUnixSeconds ||
      signingKey.signingNotBeforeUnixSeconds > now ||
      signingKey.retireAfterUnixSeconds <= now
    ) {
      throw new Error('ACTION_GRANT_SIGNING_KEY_INELIGIBLE')
    }
    const expiresAt = Math.min(now + 120, Math.floor(grant.expiresAt.getTime() / 1_000))
    if (expiresAt <= now) throw new Error('DELEGATION_GRANT_EXPIRED')
    const actionGrantJti = this.randomId()
    const header = encode({ alg: 'ES256', kid: signingKey.kid, typ: 'ag+jwt' })
    const claims = encode({
      iss: this.options.issuer,
      aud: input.targetAudience,
      sub: input.humanPrincipalId,
      principal_type: 'DELEGATED',
      client_id: input.workloadIdentity.spiffeId,
      tenant_id: input.tenantId,
      ...(input.orgId === undefined ? {} : { org_id: input.orgId }),
      delegation_id: grant.delegationReference,
      agent_id: input.agentPrincipalId,
      tool_contract_id: input.descriptor.toolContract.id,
      tool_contract_version: input.descriptor.toolContract.version,
      operation_key: input.descriptor.operationKey,
      target_digest: actionValueDigest(input.descriptor.target),
      input_digest: actionValueDigest(input.descriptor.input),
      descriptor_digest: descriptorDigest,
      idempotency_key: input.descriptor.idempotencyKey,
      confirmation_ref: confirmation.reference,
      authorization_decision_ref: decision.decisionReference,
      ...(confirmation.stepUpReference === undefined
        ? {}
        : { step_up_ref: confirmation.stepUpReference }),
      jti: actionGrantJti,
      iat: now,
      nbf: now,
      exp: expiresAt,
      cnf: { 'x5t#S256': input.workloadIdentity.certificateThumbprint }
    })
    const signingInput = `${header}.${claims}`
    const signature = await this.options.signer.sign(
      signingKey.kid,
      Buffer.from(signingInput, 'utf8')
    )
    await this.options.repository.appendAudit(
      this.audit({
        eventType: 'ACTION_GRANT_ISSUED',
        grant,
        actionGrantJti,
        operationKey: input.descriptor.operationKey,
        descriptorDigest,
        authorizationDecisionReference: decision.decisionReference,
        traceId: input.traceId,
        occurredAt: new Date(now * 1_000)
      })
    )
    return Object.freeze({
      actionGrant: `${signingInput}.${Buffer.from(signature).toString('base64url')}`,
      actionGrantJti,
      descriptorDigest,
      expiresAt: new Date(expiresAt * 1_000)
    })
  }

  /** Loads one opaque delegation reference without revealing near-match state. */
  private async requireGrant(reference: string): Promise<DelegationGrantSnapshot> {
    const grant = await this.options.repository.find(requireText(reference, 'delegation reference'))
    if (!grant) throw new Error('DELEGATION_GRANT_INACTIVE')
    return grant
  }

  /** Rejects revoked and expired grants before authorization or signing work. */
  private assertActiveGrant(grant: DelegationGrantSnapshot): void {
    if (grant.revokedAt) throw new Error('DELEGATION_GRANT_REVOKED')
    if (grant.expiresAt.getTime() <= this.now() * 1_000) throw new Error('DELEGATION_GRANT_EXPIRED')
  }

  /** Builds a non-secret Auth lifecycle audit fact with stable attribution and correlation. */
  private audit(input: {
    readonly eventType: DelegatedExecutionAuditInput['eventType']
    readonly grant: DelegationGrantSnapshot
    readonly actionGrantJti?: string
    readonly operationKey?: string
    readonly descriptorDigest?: string
    readonly authorizationDecisionReference: string
    readonly traceId: string
    readonly occurredAt: Date
  }): DelegatedExecutionAuditInput {
    return Object.freeze({
      auditId: this.randomId(),
      eventType: input.eventType,
      result: 'SUCCEEDED',
      humanPrincipalId: input.grant.humanPrincipalId,
      tenantId: input.grant.tenantId,
      ...(input.grant.orgId === undefined ? {} : { orgId: input.grant.orgId }),
      delegationReference: input.grant.delegationReference,
      ...(input.actionGrantJti === undefined ? {} : { actionGrantJti: input.actionGrantJti }),
      ...(input.operationKey === undefined ? {} : { operationKey: input.operationKey }),
      ...(input.descriptorDigest === undefined ? {} : { descriptorDigest: input.descriptorDigest }),
      authorizationDecisionReference: input.authorizationDecisionReference,
      traceId: input.traceId,
      occurredAt: input.occurredAt
    })
  }
}

/** Encodes one Auth-controlled JWS segment without caller-selected serialization. */
function encode(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}

/** Canonicalizes one immutable delegation bound, allowing an explicit empty permission set only. */
function canonicalSet(
  values: readonly string[],
  label: string,
  allowEmpty = false
): readonly string[] {
  if (!Array.isArray(values) || (!allowEmpty && values.length === 0))
    throw new Error(`delegation ${label} set is required`)
  const normalized = values.map((value) => requireText(value, label))
  if (new Set(normalized).size !== normalized.length)
    throw new Error(`delegation ${label} set contains duplicates`)
  return Object.freeze([...normalized].sort())
}

/** Validates exact trusted references without silently trimming authority inputs. */
function requireText(value: string, label: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value)
    throw new Error(`${label} is invalid`)
  return value
}

/** Requires one exact stable OES service audience. */
function assertAudience(value: string): void {
  if (!/^urn:oes:service:[a-z0-9][a-z0-9-]*$/.test(value))
    throw new Error('ActionGrant audience is invalid')
}

/** Requires the direct SPIFFE workload and current mTLS certificate binding used by DG-1. */
function assertWorkload(value: RequestActionGrantInput['workloadIdentity']): void {
  if (
    !value.spiffeId.startsWith('spiffe://') ||
    !/^[A-Za-z0-9_-]{43}$/.test(value.certificateThumbprint)
  ) {
    throw new Error('ActionGrant workload binding is invalid')
  }
}
