import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { NavigationRepository } from '../../../domain/repositories/navigation.repository'
import { NavigationResolverService } from '../../../domain/services/navigation-resolver.service'
import { NavigationPreviewResult } from './navigation-query.result'
import { ResolveNavigationPreviewQuery } from './resolve-navigation-preview.query'

@QueryHandler(ResolveNavigationPreviewQuery)
export class ResolveNavigationPreviewHandler implements IQueryHandler<ResolveNavigationPreviewQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.NAVIGATION)
    private readonly navigationRepo: NavigationRepository,
    private readonly resolver: NavigationResolverService
  ) {}

  async execute(query: ResolveNavigationPreviewQuery): Promise<NavigationPreviewResult> {
    const [visibleEntries, landingPolicies] = await Promise.all([
      this.navigationRepo.findVisibleEntriesForRoles({
        roleIds: query.roleIds,
        terminal: query.terminal
      }),
      this.navigationRepo.findLandingPoliciesForRoles({
        roleIds: query.roleIds,
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
