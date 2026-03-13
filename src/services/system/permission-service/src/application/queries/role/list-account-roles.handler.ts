import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ListAccountRolesQuery } from './list-account-roles.query'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'

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
