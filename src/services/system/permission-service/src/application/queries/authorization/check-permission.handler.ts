import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { CheckPermissionQuery } from './check-permission.query'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { SYMBOLS } from '../../../common/constants/symbols'

@QueryHandler(CheckPermissionQuery)
export class CheckPermissionHandler implements IQueryHandler<CheckPermissionQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(query: CheckPermissionQuery): Promise<boolean> {
    const permission = await this.permissionRepo.findByCode(query.permissionCode)
    if (!permission) return false

    const roles = await this.roleRepo.findRolesForAccountId(query.accountId)
    if (!roles || roles.length === 0) return false

    return roles.some((role) => role.hasPermissionByCode(query.permissionCode))
  }
}
