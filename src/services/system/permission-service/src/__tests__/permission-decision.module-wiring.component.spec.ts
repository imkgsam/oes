import { AuthorizationQueryHandlers } from '../application/queries/authorization'
import { ResolveDelegatedAuthorizationHandler } from '../application/queries/authorization/resolve-delegated-authorization.handler'
import { ResolvePrincipalAuthorizationHandler } from '../application/queries/authorization/resolve-principal-authorization.handler'
import { ResolveWorkloadIssuanceHandler } from '../application/queries/authorization/resolve-workload-issuance.handler'
import { PERMISSION_DECISION_AUDIT_PORT } from '../application/ports/permission-decision-audit.port'
import { SYMBOLS } from '../common/constants/symbols'
import { PermissionDecisionPolicy } from '../domain/services/permission-decision-policy'
import { AuthorizationModule } from '../modules/authorization/authorization.module'

describe('Permission decision module wiring', () => {
  it('registers all decision handlers, policy, repositories and audit port in the AuthorizationModule', () => {
    const providers = Reflect.getMetadata('providers', AuthorizationModule) as Array<
      Function | { provide?: unknown }
    >
    const tokens = providers.map((provider) =>
      typeof provider === 'function' ? provider : provider.provide
    )

    expect(AuthorizationQueryHandlers).toEqual(
      expect.arrayContaining([
        ResolvePrincipalAuthorizationHandler,
        ResolveWorkloadIssuanceHandler,
        ResolveDelegatedAuthorizationHandler
      ])
    )
    expect(tokens).toEqual(
      expect.arrayContaining([
        PermissionDecisionPolicy,
        SYMBOLS.REPO.PRINCIPAL_AUTHORIZATION,
        SYMBOLS.REPO.WORKLOAD_ISSUANCE_POLICY,
        PERMISSION_DECISION_AUDIT_PORT
      ])
    )
  })
})
