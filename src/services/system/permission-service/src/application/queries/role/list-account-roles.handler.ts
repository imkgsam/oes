import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ListAccountRolesQuery } from './list-account-roles.query'
import { RoleRepository } from 'src/domain/repositories/role.repository'
import { Role } from 'src/domain/aggregates/role.aggregate'
import { SYMBOLS } from 'src/common/constants/symbols'

@QueryHandler(ListAccountRolesQuery)
export class ListAccountRolesHandler implements IQueryHandler<ListAccountRolesQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(query: ListAccountRolesQuery): Promise<Role[]> {
    return this.roleRepo.findAccountRoles(query.accountId, query.tenantId)
  }
}
