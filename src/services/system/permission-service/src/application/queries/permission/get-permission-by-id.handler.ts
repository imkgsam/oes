import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { GetPermissionByIdQuery } from './get-permission-by-id.query'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { Permission } from '../../../domain/aggregates/permission.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import { PERMISSION_NOT_FOUND } from '../../../common/constants/exception-enums'

@QueryHandler(GetPermissionByIdQuery)
export class GetPermissionByIdHandler implements IQueryHandler<GetPermissionByIdQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(query: GetPermissionByIdQuery): Promise<Permission> {
    const permission = await this.permissionRepo.findById(query.id)
    if (!permission) throw ExceptionFactory.domain(PERMISSION_NOT_FOUND)
    return permission
  }
}
