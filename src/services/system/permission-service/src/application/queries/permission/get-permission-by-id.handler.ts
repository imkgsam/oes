import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { GetPermissionByIdQuery } from './get-permission-by-id.query'
import { PermissionRepository } from 'src/domain/repositories/permission.repository'
import { Permission } from 'src/domain/aggregates/permission.aggregate'
import { SYMBOLS } from 'src/common/constants/symbols'

@QueryHandler(GetPermissionByIdQuery)
export class GetPermissionByIdHandler implements IQueryHandler<GetPermissionByIdQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(query: GetPermissionByIdQuery): Promise<Permission | null> {
    return this.permissionRepo.findById(query.id)
  }
}
