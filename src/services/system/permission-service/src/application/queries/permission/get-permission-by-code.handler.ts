import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { GetPermissionByCodeQuery } from './get-permission-by-code.query'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { Permission } from '../../../domain/aggregates/permission.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import { PERMISSION_NOT_FOUND } from '../../../common/constants/exception-enums'

@QueryHandler(GetPermissionByCodeQuery)
export class GetPermissionByCodeHandler implements IQueryHandler<GetPermissionByCodeQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(query: GetPermissionByCodeQuery): Promise<Permission> {
    const permission = await this.permissionRepo.findByCode(query.code)
    if (!permission) throw ExceptionFactory.domain(PERMISSION_NOT_FOUND)
    return permission
  }
}
