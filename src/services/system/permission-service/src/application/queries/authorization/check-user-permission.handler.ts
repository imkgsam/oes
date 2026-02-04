import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { CheckUserPermissionQuery } from './check-user-permission.query'
import { RoleRepository } from 'src/domain/repositories/role.repository'
import { PermissionRepository } from 'src/domain/repositories/permission.repository'
import { SYMBOLS } from 'src/common/constants/symbols'

@QueryHandler(CheckUserPermissionQuery)
export class CheckUserPermissionHandler implements IQueryHandler<CheckUserPermissionQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(query: CheckUserPermissionQuery): Promise<boolean> {
    // First verify the permission code exists
    const permission = await this.permissionRepo.findByCode(query.permissionCode)
    if (!permission) {
      return false
    }

    // Get all roles for the user
    const roles = await this.roleRepo.findRolesForAccountId(query.userId)
    if (!roles || roles.length === 0) {
      return false
    }

    // Check if any role has the required permission
    return roles.some((role) => role.hasPermissionByCode(query.permissionCode))
  }
}
