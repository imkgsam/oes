import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ListRoleTemplatesQuery } from './list-role-templates.query'
import { PagedRoleResult, RoleRepository } from '../../../domain/repositories/role.repository'
import { SYMBOLS } from '../../../common/constants/symbols'

@QueryHandler(ListRoleTemplatesQuery)
export class ListRoleTemplatesHandler implements IQueryHandler<ListRoleTemplatesQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(query: ListRoleTemplatesQuery): Promise<PagedRoleResult> {
    return this.roleRepo.findRoleTemplates({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword
    })
  }
}
