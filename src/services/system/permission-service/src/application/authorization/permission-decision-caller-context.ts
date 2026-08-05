import { AuthorizationPrincipalType } from '../../domain/authorization/permission-decision.types'

/** Carries only transport-verified caller and token claims, never the bearer credential itself. */
export interface PermissionDecisionCallerContext {
  directWorkloadSpiffeId: string
  certificateThumbprint: string
  requestId?: string
  traceId?: string
  verifiedExecutionToken?: {
    subject: string
    principalType: AuthorizationPrincipalType
    tenantId?: string
    orgId?: string
    sessionId?: string
    delegationId?: string
    authzVersion?: string | number
  }
}
