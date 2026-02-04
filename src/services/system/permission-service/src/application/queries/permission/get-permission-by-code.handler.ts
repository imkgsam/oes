import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { GetPermissionByCodeQuery } from './get-permission-by-code.query'
import { PermissionRepository } from 'src/domain/repositories/permission.repository'
import { Permission } from 'src/domain/aggregates/permission.aggregate'
import { SYMBOLS } from 'src/common/constants/symbols'

@QueryHandler(GetPermissionByCodeQuery)
export class GetPermissionByCodeHandler implements IQueryHandler<GetPermissionByCodeQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(query: GetPermissionByCodeQuery): Promise<Permission | null> {
    return this.permissionRepo.findByCode(query.code)
  }
}
