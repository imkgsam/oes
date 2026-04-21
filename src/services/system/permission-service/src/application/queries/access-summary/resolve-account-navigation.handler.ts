import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { AUTHORIZATION_DENIED } from '../../../common/constants/exception-enums'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { NavigationRepository } from '../../../domain/repositories/navigation.repository'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { NavigationResolverService, NavigationResolution } from '../../../domain/services/navigation-resolver.service'
import { ResolveAccountNavigationQuery } from './resolve-account-navigation.query'

/** ResolveAccountNavigationHandler resolves runtime navigation from effective roles and navigation facts. */
@QueryHandler(ResolveAccountNavigationQuery)
export class ResolveAccountNavigationHandler
  implements IQueryHandler<ResolveAccountNavigationQuery, NavigationResolution>
{
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    @Inject(SYMBOLS.REPO.NAVIGATION)
    private readonly navigationRepo: NavigationRepository,
    private readonly resolver: NavigationResolverService
  ) {}

  async execute(query: ResolveAccountNavigationQuery): Promise<NavigationResolution> {
    const tenantId = query.scopeLevel === ScopeLevel.SYSTEM ? null : query.tenantId?.trim()
    if (query.scopeLevel === ScopeLevel.TENANT && !tenantId) {
      throw ExceptionFactory.application(AUTHORIZATION_DENIED, {
        reason: 'tenant navigation resolution requires tenantId'
      })
    }

    const roles = await this.roleRepo.findAccountRoles(query.accountId, tenantId, query.scopeLevel)
    const roleIds = roles.map((role) => role.id)
    const [visibleEntries, landingPolicies] = await Promise.all([
      this.navigationRepo.findVisibleEntriesForRoles({
        roleIds,
        terminal: query.terminal
      }),
      this.navigationRepo.findLandingPoliciesForRoles({
        roleIds,
        terminal: query.terminal
      })
    ])

    return this.resolver.resolve({
      visibleEntries,
      landingPolicies,
      scopeLevel: query.scopeLevel,
      terminal: query.terminal
    })
  }
}
