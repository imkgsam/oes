import { Permission } from '../aggregates/permission.aggregate'
import { Role } from '../aggregates/role.aggregate'

export interface RoleRepository {
  findById(id: string): Promise<Role | null>
  findAll(): Promise<Role[]>
  //查找role拥有的所有permissions
  findOwnPermissions(): Promise<Permission[]>
  //根据accountid找所拥有的roles
  findRolesForAccountId(accountId: string): Promise<Role[]>
}
