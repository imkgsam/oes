import { PermissionRepository } from '../repositories/permission.repository'
import { RoleRepository } from '../repositories/role.repository'

export class AccountPermissionCheckerService {
  constructor(
    private roleRepo: RoleRepository,
    private permissionRepo: PermissionRepository
  ) {}

  async checkAccountPermission(accountId: string, permissionCode: string): Promise<boolean> {
    const permisson = await this.permissionRepo.findByCode(permissionCode)
    if (!permisson) throw new Error(`invalid PermissionCode ${permissionCode}`)
    const roles = await this.roleRepo.findRolesForAccountId(accountId)
    return roles.some((role) => role.hasPermissionByCode(permissionCode))
  }
}
