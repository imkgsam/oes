import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { AuthorizationQueryScopeService } from '../../authorization'
import { ListAccountRolesQuery } from './list-account-roles.query'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'
import { AccountRoleQueryScope } from '../../authorization/operator-scope'
import { AccountRole } from '../../../domain/vo/account-role.value-object'

@QueryHandler(ListAccountRolesQuery)
export class ListAccountRolesHandler implements IQueryHandler<ListAccountRolesQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  /** execute returns effective roles together with their precise immutable binding facts. */
  async execute(query: ListAccountRolesQuery): Promise<{ roles: Role[]; bindings: AccountRole[] }> {
    const queryScope = this.authorizationQueryScopeService.build<AccountRoleQueryScope>({
      resource: 'account_role',
      action: 'list',
      operatorScope: query.operatorScope,
      filters: {
        tenantId: query.tenantId,
        scopeLevel: query.scopeLevel
      }
    })

    const [roles, bindings] = await Promise.all([
      this.roleRepo.findAccountRoles(query.accountId, queryScope.tenantId, queryScope.scopeLevel),
      this.roleRepo.findPrincipalRoleBindings(
        query.accountId,
        queryScope.tenantId,
        queryScope.scopeLevel
      )
    ])

    return { roles, bindings }
  }
}
