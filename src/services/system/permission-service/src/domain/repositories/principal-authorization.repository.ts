import {
  AuthorizationScopeLevel,
  PrincipalAuthorizationFacts
} from '../authorization/permission-decision.types'

/** Loads current PrincipalRoleBinding and coarse policy facts without exposing persistence structures. */
export interface PrincipalAuthorizationRepository {
  resolveAuthorizationFacts(input: {
    principalType: 'HUMAN' | 'MACHINE'
    principalId: string
    scopeLevel: AuthorizationScopeLevel
    tenantId?: string
    requestedPermissionCodes: string[]
  }): Promise<PrincipalAuthorizationFacts | null>
}
