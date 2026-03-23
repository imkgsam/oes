import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { ListRoleInstancesQuery } from './list-role-instances.query'
import { PagedRoleResult, RoleRepository } from '../../../domain/repositories/role.repository'
import { SYMBOLS } from '../../../common/constants/symbols'
import { AUTHORIZATION_DENIED } from '../../../common/constants/exception-enums'

@QueryHandler(ListRoleInstancesQuery)
export class ListRoleInstancesHandler implements IQueryHandler<ListRoleInstancesQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(query: ListRoleInstancesQuery): Promise<PagedRoleResult> {
    const operatorScope = query.operatorScope
    const requestedTenantId = query.tenantId?.trim() || undefined

    if (operatorScope && !operatorScope.isSystemScope) {
      if (requestedTenantId && requestedTenantId !== operatorScope.tenantId) {
        throw ExceptionFactory.application(AUTHORIZATION_DENIED, {
          operatorId: operatorScope.operatorId,
          tenantId: operatorScope.tenantId,
          requestedTenantId
        })
      }

      return this.roleRepo.findRoleInstances({
        page: query.page,
        pageSize: query.pageSize,
        tenantId: operatorScope.tenantId,
        keyword: query.keyword
      })
    }

    return this.roleRepo.findRoleInstances({
      page: query.page,
      pageSize: query.pageSize,
      tenantId: requestedTenantId,
      keyword: query.keyword
    })
  }
}
