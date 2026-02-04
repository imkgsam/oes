import { Permission } from '../aggregates/permission.aggregate'
import { Role } from '../aggregates/role.aggregate'

export interface RoleRepository {
  findById(id: string): Promise<Role | null>
  findByCode(code: string): Promise<Role | null>
  findAll(): Promise<Role[]>
  save(role: Role): Promise<Role>
  delete(id: string): Promise<Role | null>
  //查找role拥有的所有permissions
  findOwnPermissions(roleId: string): Promise<Permission[]>
  //根据accountid找所拥有的roles
  findRolesForAccountId(accountId: string): Promise<Role[]>
}
