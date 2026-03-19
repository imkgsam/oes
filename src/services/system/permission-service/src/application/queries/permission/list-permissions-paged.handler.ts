import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Permission } from '../../../domain/aggregates/permission.aggregate'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ListPermissionsPagedQuery } from './list-permissions-paged.query'

@QueryHandler(ListPermissionsPagedQuery)
export class ListPermissionsPagedHandler implements IQueryHandler<ListPermissionsPagedQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(query: ListPermissionsPagedQuery): Promise<{
    permissions: Permission[]
    total: number
    page: number
    pageSize: number
  }> {
    return this.permissionRepo.findPaged({
      page: query.page,
      pageSize: query.pageSize,
      module: query.module,
      keyword: query.keyword
    })
  }
}
