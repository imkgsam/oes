import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { AuthorizationQueryScopeService } from '../../authorization'
import { ListAccountRolesQuery } from './list-account-roles.query'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'
import { AccountRoleQueryScope } from '../../authorization/operator-scope'

@QueryHandler(ListAccountRolesQuery)
export class ListAccountRolesHandler implements IQueryHandler<ListAccountRolesQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(query: ListAccountRolesQuery): Promise<Role[]> {
    const queryScope = this.authorizationQueryScopeService.build<AccountRoleQueryScope>({
      resource: 'account_role',
      action: 'list',
      operatorScope: query.operatorScope,
      filters: {
        tenantId: query.tenantId,
        scopeLevel: query.scopeLevel
      }
    })

    return this.roleRepo.findAccountRoles(query.accountId, queryScope.tenantId, queryScope.scopeLevel)
  }
}
