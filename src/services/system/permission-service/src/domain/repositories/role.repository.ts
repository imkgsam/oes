import { Permission } from '../aggregates/permission.aggregate'
import { Role } from '../aggregates/role.aggregate'
import { AccountType } from '../enums/account-type.enum'

export interface RoleRepository {
  findById(id: string): Promise<Role | null>
  findByCode(code: string): Promise<Role | null>
  findAll(): Promise<Role[]>
  save(role: Role): Promise<Role>
  delete(id: string): Promise<Role | null>
  findOwnPermissions(roleId: string): Promise<Permission[]>
  findRolesForAccountId(accountId: string): Promise<Role[]>

  // Account-Role binding
  assignAccountRole(
    accountId: string,
    roleId: string,
    tenantId: string,
    accountType: AccountType
  ): Promise<void>
  revokeAccountRole(accountId: string, roleId: string): Promise<void>
  findAccountRoles(accountId: string, tenantId: string): Promise<Role[]>
}
