import type { ActionDescriptorV1 } from '@oes/common/authorization'

export type DelegationGrantSnapshot = {
  readonly delegationReference: string
  readonly humanPrincipalId: string
  readonly sessionId: string
  readonly tenantId: string
  readonly orgId?: string
  readonly agentPrincipalId: string
  readonly toolContractId: string
  readonly toolContractVersion: string
  readonly operationKeys: readonly string[]
  readonly permissionCodes: readonly string[]
  readonly authzVersion: string
  readonly authorizationDecisionReference: string
  readonly expiresAt: Date
  readonly createdAt: Date
  readonly revokedAt?: Date
  readonly revokeReasonCategory?: string
}

export type DelegatedExecutionAuditInput = {
  readonly auditId: string
  readonly eventType:
    | 'DELEGATION_GRANT_CREATED'
    | 'DELEGATION_GRANT_REVOKED'
    | 'ACTION_GRANT_ISSUED'
  readonly result: 'SUCCEEDED' | 'DENIED'
  readonly humanPrincipalId: string
  readonly tenantId: string
  readonly orgId?: string
  readonly delegationReference: string
  readonly actionGrantJti?: string
  readonly operationKey?: string
  readonly descriptorDigest?: string
  readonly authorizationDecisionReference: string
  readonly traceId: string
  readonly occurredAt: Date
}

/** Persists Auth-owned delegation state and non-secret credential lifecycle audit facts. */
export interface DelegationGrantRepository {
  create(grant: DelegationGrantSnapshot, audit: DelegatedExecutionAuditInput): Promise<void>
  find(delegationReference: string): Promise<DelegationGrantSnapshot | undefined>
  revoke(
    delegationReference: string,
    revokedAt: Date,
    audit: DelegatedExecutionAuditInput,
    reasonCategory: string
  ): Promise<DelegationGrantSnapshot>
  appendAudit(audit: DelegatedExecutionAuditInput): Promise<void>
}

export type DelegatedAuthorizationDecision = {
  readonly allowed: boolean
  readonly riskClass?: 'DELEGATION_ALLOWED' | 'ACTION_GRANT_REQUIRED' | 'AI_FORBIDDEN'
  readonly decisionReference: string
  readonly authzVersion: string
  readonly stepUpRequired?: boolean
}

/** Resolves Permission-owned intersections without moving role or policy truth into Auth. */
export interface DelegatedAuthorizationPort {
  authorizeDelegation(input: {
    readonly humanPrincipalId: string
    readonly tenantId: string
    readonly orgId?: string
    readonly agentPrincipalId: string
    readonly toolContract: { readonly id: string; readonly version: string }
    readonly operationKeys: readonly string[]
    readonly permissionCodes: readonly string[]
  }): Promise<DelegatedAuthorizationDecision>
  authorizeAction(input: {
    readonly grant: DelegationGrantSnapshot
    readonly descriptor: ActionDescriptorV1
    readonly targetAudience: string
  }): Promise<DelegatedAuthorizationDecision>
}

/** Resolves immutable HUMAN confirmation and optional step-up evidence from Auth-owned challenge truth. */
export interface DelegatedConfirmationEvidencePort {
  verify(input: {
    readonly reference: string
    readonly humanPrincipalId: string
    readonly sessionId: string
    readonly tenantId: string
    readonly descriptorDigest: string
  }): Promise<{
    readonly matched: boolean
    readonly reference: string
    readonly stepUpReference?: string
  }>
}
