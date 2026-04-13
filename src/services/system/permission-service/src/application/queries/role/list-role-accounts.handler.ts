import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  AuthorizationQueryScopeService,
  AccountRoleQueryScope
} from '../../authorization'
import { ListRoleAccountsQuery } from './list-role-accounts.query'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { AccountRole } from '../../../domain/vo/account-role.value-object'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ROLE_NOT_FOUND } from '../../../common/constants/exception-enums'

@QueryHandler(ListRoleAccountsQuery)
export class ListRoleAccountsHandler implements IQueryHandler<ListRoleAccountsQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(query: ListRoleAccountsQuery): Promise<AccountRole[]> {
    const role = await this.roleRepo.findById(query.roleId)
    if (!role || !role.isAssignable) {
      throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    }

    this.authorizationQueryScopeService.build<AccountRoleQueryScope>({
      resource: 'role_account',
      action: 'list',
      operatorScope: query.operatorScope,
      filters: {
        tenantId: role.tenantId,
        scopeLevel: role.kind === RoleKind.SYSTEM_INSTANCE ? ScopeLevel.SYSTEM : ScopeLevel.TENANT,
        roleId: role.id
      }
    })

    return this.roleRepo.findRoleAccounts(query.roleId)
  }
}
