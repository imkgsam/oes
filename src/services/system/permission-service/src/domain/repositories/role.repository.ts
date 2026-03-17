import { Permission } from '../aggregates/permission.aggregate'
import { Role } from '../aggregates/role.aggregate'
import { AccountType } from '../enums/account-type.enum'
import { AccountRole } from '../vo/account-role.value-object'

export interface RoleRepository {
  findById(id: string): Promise<Role | null>
  findByCode(code: string): Promise<Role | null>
  findAll(): Promise<Role[]>
  save(role: Role): Promise<Role>
  delete(id: string): Promise<Role | null>
  hasAssignedAccounts(roleId: string): Promise<boolean>
  hasAssignedPermissions(roleId: string): Promise<boolean>
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
  findRoleAccounts(roleId: string): Promise<AccountRole[]>
  findTenantRoles(tenantId: string): Promise<Role[]>
  replaceAccountRoles(
    accountId: string,
    tenantId: string,
    accountType: AccountType,
    roleIds: string[]
  ): Promise<Role[]>
}
