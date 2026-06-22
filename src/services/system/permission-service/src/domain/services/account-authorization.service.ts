import { PermissionRepository } from '../repositories/permission.repository'
import { RoleRepository } from '../repositories/role.repository'

export const ACCOUNT_AUTHORIZATION_SERVICE = Symbol('AccountAuthorizationService')

// AccountAuthorizationService evaluates current account-level RBAC permission checks.
export class AccountAuthorizationService {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly permissionRepo: PermissionRepository
  ) {}

  async checkPermission(accountId: string, permissionCode: string): Promise<boolean> {
    const permission = await this.permissionRepo.findByCode(permissionCode)
    if (!permission) return false

    const roles = await this.roleRepo.findRolesForAccountId(accountId)
    return roles.some((role) => role.hasPermissionByCode(permissionCode))
  }
}
