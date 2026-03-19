import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ListRoleInstancesQuery } from './list-role-instances.query'
import { PagedRoleResult, RoleRepository } from '../../../domain/repositories/role.repository'
import { SYMBOLS } from '../../../common/constants/symbols'

@QueryHandler(ListRoleInstancesQuery)
export class ListRoleInstancesHandler implements IQueryHandler<ListRoleInstancesQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(query: ListRoleInstancesQuery): Promise<PagedRoleResult> {
    return this.roleRepo.findRoleInstances({
      page: query.page,
      pageSize: query.pageSize,
      tenantId: query.tenantId,
      keyword: query.keyword
    })
  }
}
