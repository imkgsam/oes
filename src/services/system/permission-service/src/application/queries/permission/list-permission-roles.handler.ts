import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { ListPermissionRolesQuery } from './list-permission-roles.query'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'
import { PERMISSION_NOT_FOUND } from '../../../common/constants/exception-enums'

@QueryHandler(ListPermissionRolesQuery)
export class ListPermissionRolesHandler implements IQueryHandler<ListPermissionRolesQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository,
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(query: ListPermissionRolesQuery): Promise<Role[]> {
    const permission = await this.permissionRepo.findById(query.permissionId)
    if (!permission) {
      throw ExceptionFactory.domain(PERMISSION_NOT_FOUND)
    }

    return this.roleRepo.findRolesByPermissionId(query.permissionId)
  }
}
