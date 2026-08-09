import {
  DelegatedAuthorizationInput,
  PrincipalAuthorizationInput
} from '../../domain/authorization/permission-decision.types'
import { PermissionDecisionCallerContext } from './permission-decision-caller-context'

/** Validates protected principal request fields against already-verified ExecutionToken claims. */
export function principalCallerBindingMatches(
  input: PrincipalAuthorizationInput,
  caller: PermissionDecisionCallerContext
): boolean {
  const token = caller.verifiedExecutionToken
  if (!token) return false
  if (
    token.subject !== input.principalId ||
    token.principalType !== input.principalType ||
    token.tenantId !== input.tenantId ||
    token.orgId !== input.orgId
  ) {
    return false
  }
  if (input.sessionReference && token.sessionId !== input.sessionReference) return false
  if (
    input.securityReference &&
    (token.authzVersion === undefined || String(token.authzVersion) !== input.securityReference)
  ) {
    return false
  }
  if (input.principalType === 'DELEGATED') {
    return token.delegationId === input.delegatedUpperBound?.delegationReference
  }
  return true
}

/** Validates protected delegated action fields against already-verified DELEGATED token claims. */
export function delegatedCallerBindingMatches(
  input: DelegatedAuthorizationInput,
  caller: PermissionDecisionCallerContext
): boolean {
  const token = caller.verifiedExecutionToken
  return (
    token?.principalType === 'DELEGATED' &&
    token.subject === input.humanPrincipalId &&
    token.tenantId === input.tenantId &&
    token.orgId === input.orgId &&
    token.sessionId === input.delegatedUpperBound.sessionReference &&
    token.delegationId === input.delegatedUpperBound.delegationReference &&
    token.authzVersion !== undefined &&
    String(token.authzVersion) === input.delegatedUpperBound.securityReference
  )
}
