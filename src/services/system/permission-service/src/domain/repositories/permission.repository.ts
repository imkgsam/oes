import { Permission } from '../aggregates/permission.aggregate'
import { PermissionModule } from '../enums/permission-module.enum'

export interface PermissionRepository {
  findById(id: string): Promise<Permission | null>
  findByCode(code: string): Promise<Permission | null>
  findAll(): Promise<Permission[]>
  findByModule(module: PermissionModule): Promise<Permission[]>
  findPaged(query: {
    page: number
    pageSize: number
    module?: PermissionModule
    keyword?: string
  }): Promise<{ permissions: Permission[]; total: number; page: number; pageSize: number }>
  findByCodes(codes: string[]): Promise<Permission[]>
  hasAssignedRoles(permissionId: string): Promise<boolean>
  hasAttachedPolicies(permissionCode: string): Promise<boolean>
  createMany(permissions: Permission[]): Promise<Permission[]>
  save(permission: Permission): Promise<Permission>
  delete(id: string): Promise<Permission | null>
}
