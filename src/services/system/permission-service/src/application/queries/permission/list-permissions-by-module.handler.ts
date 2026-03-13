import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ListPermissionsByModuleQuery } from './list-permissions-by-module.query'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { Permission } from '../../../domain/aggregates/permission.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'

@QueryHandler(ListPermissionsByModuleQuery)
export class ListPermissionsByModuleHandler implements IQueryHandler<ListPermissionsByModuleQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(query: ListPermissionsByModuleQuery): Promise<Permission[]> {
    return this.permissionRepo.findByModule(query.module)
  }
}
