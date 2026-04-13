import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { AuthorizationQueryScopeService } from '../../authorization'
import { ListRoleTemplatesQuery } from './list-role-templates.query'
import { PagedRoleResult, RoleRepository } from '../../../domain/repositories/role.repository'
import { SYMBOLS } from '../../../common/constants/symbols'
import { SystemQueryScope } from '../../authorization/operator-scope'

@QueryHandler(ListRoleTemplatesQuery)
export class ListRoleTemplatesHandler implements IQueryHandler<ListRoleTemplatesQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(query: ListRoleTemplatesQuery): Promise<PagedRoleResult> {
    this.authorizationQueryScopeService.build<SystemQueryScope>({
      resource: 'role_template',
      action: 'list',
      operatorScope: query.operatorScope
    })

    return this.roleRepo.findRoleTemplates({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword
    })
  }
}
