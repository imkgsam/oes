import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ListPermissionsQuery } from './list-permissions.query'
import { PermissionRepository } from 'src/domain/repositories/permission.repository'
import { Permission } from 'src/domain/aggregates/permission.aggregate'
import { SYMBOLS } from 'src/common/constants/symbols'

@QueryHandler(ListPermissionsQuery)
export class ListPermissionsHandler implements IQueryHandler<ListPermissionsQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(_query: ListPermissionsQuery): Promise<Permission[]> {
    return this.permissionRepo.findAll()
  }
}
