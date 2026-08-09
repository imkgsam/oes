import { AuthorizationPrincipalType } from '../../domain/authorization/permission-decision.types'

export const PERMISSION_DECISION_AUDIT_PORT = Symbol('PermissionDecisionAuditPort')

/** Records safe issuance and delegated decision evidence without credentials or internal role graphs. */
export interface PermissionDecisionAuditPort {
  emitIssuanceDecision(input: {
    decisionType: 'PRINCIPAL_AUTHORIZATION' | 'WORKLOAD_ISSUANCE' | 'DELEGATED_AUTHORIZATION'
    decisionReference: string
    allowed: boolean
    reasonCode: string
    principalType: AuthorizationPrincipalType
    principalId: string
    tenantId?: string
    orgId?: string
    directWorkloadSpiffeId: string
    certificateThumbprint: string
    targetAudience: string
    requestedPermissionCodes: string[]
    grantedPermissionCodes: string[]
    deniedPermissionCodes: string[]
    policyDecisionReference: string
    authzVersion: string
    policyVersion?: string
    operationKey?: string
    requestId?: string
    traceId?: string
  }): void
}
