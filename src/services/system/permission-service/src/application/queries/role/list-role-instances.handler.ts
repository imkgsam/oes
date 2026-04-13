import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { AuthorizationQueryScopeService } from '../../authorization'
import { ListRoleInstancesQuery } from './list-role-instances.query'
import { PagedRoleResult, RoleRepository } from '../../../domain/repositories/role.repository'
import { SYMBOLS } from '../../../common/constants/symbols'
import { RoleInstanceQueryScope } from '../../authorization/operator-scope'

@QueryHandler(ListRoleInstancesQuery)
export class ListRoleInstancesHandler implements IQueryHandler<ListRoleInstancesQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(query: ListRoleInstancesQuery): Promise<PagedRoleResult> {
    const queryScope = this.authorizationQueryScopeService.build<RoleInstanceQueryScope>({
      resource: 'role_instance',
      action: 'list',
      operatorScope: query.operatorScope,
      filters: {
        requestedTenantId: query.tenantId,
        scopeLevel: query.scopeLevel
      }
    })

    return this.roleRepo.findRoleInstances({
      page: query.page,
      pageSize: query.pageSize,
      tenantId: queryScope.tenantId,
      scopeLevel: queryScope.scopeLevel,
      keyword: query.keyword
    })
  }
}
