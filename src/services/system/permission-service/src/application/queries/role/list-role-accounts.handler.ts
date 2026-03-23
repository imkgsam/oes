import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { ListRoleAccountsQuery } from './list-role-accounts.query'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { AccountRole } from '../../../domain/vo/account-role.value-object'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ROLE_NOT_FOUND } from '../../../common/constants/exception-enums'

@QueryHandler(ListRoleAccountsQuery)
export class ListRoleAccountsHandler implements IQueryHandler<ListRoleAccountsQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(query: ListRoleAccountsQuery): Promise<AccountRole[]> {
    const role = await this.roleRepo.findById(query.roleId)
    if (!role || role.kind !== RoleKind.TENANT_INSTANCE) {
      throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    }

    return this.roleRepo.findRoleAccounts(query.roleId)
  }
}
