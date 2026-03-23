import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { ListRoleTemplatesQuery } from './list-role-templates.query'
import { PagedRoleResult, RoleRepository } from '../../../domain/repositories/role.repository'
import { SYMBOLS } from '../../../common/constants/symbols'
import { AUTHORIZATION_DENIED } from '../../../common/constants/exception-enums'

@QueryHandler(ListRoleTemplatesQuery)
export class ListRoleTemplatesHandler implements IQueryHandler<ListRoleTemplatesQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(query: ListRoleTemplatesQuery): Promise<PagedRoleResult> {
    const operatorScope = query.operatorScope
    if (operatorScope && !operatorScope.isSystemScope) {
      throw ExceptionFactory.application(AUTHORIZATION_DENIED, {
        operatorId: operatorScope.operatorId,
        tenantId: operatorScope.tenantId,
        reason: 'template list requires system scope'
      })
    }

    return this.roleRepo.findRoleTemplates({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword
    })
  }
}
