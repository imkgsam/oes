import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { NavigationRepository } from '../../../domain/repositories/navigation.repository'
import { GetRoleNavigationQuery } from './get-role-navigation.query'
import { RoleNavigationQueryResult } from './navigation-query.result'

@QueryHandler(GetRoleNavigationQuery)
export class GetRoleNavigationHandler implements IQueryHandler<GetRoleNavigationQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.NAVIGATION)
    private readonly navigationRepo: NavigationRepository
  ) {}

  async execute(query: GetRoleNavigationQuery): Promise<RoleNavigationQueryResult> {
    return this.navigationRepo.findRoleNavigation(query.roleId)
  }
}
