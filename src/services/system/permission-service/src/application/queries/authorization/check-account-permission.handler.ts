import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { CheckAccountPermissionQuery } from './check-account-permission.query'
import { RoleRepository } from 'src/domain/repositories/role.repository'
import { PermissionRepository } from 'src/domain/repositories/permission.repository'
import { SYMBOLS } from 'src/common/constants/symbols'

@QueryHandler(CheckAccountPermissionQuery)
export class CheckAccountPermissionHandler implements IQueryHandler<CheckAccountPermissionQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(query: CheckAccountPermissionQuery): Promise<boolean> {
    const permission = await this.permissionRepo.findByCode(query.permissionCode)
    if (!permission) {
      return false
    }

    const roles = await this.roleRepo.findRolesForAccountId(query.accountId)
    if (!roles || roles.length === 0) {
      return false
    }

    return roles.some((role) => role.hasPermissionByCode(query.permissionCode))
  }
}
