import { Permission } from '../aggregates/permission.aggregate'
import { PermissionModule } from '../enums/permission-module.enum'

export interface PermissionRepository {
  findById(id: string): Promise<Permission | null>
  findByCode(code: string): Promise<Permission | null>
  findAll(): Promise<Permission[]>
  findByModule(module: PermissionModule): Promise<Permission[]>
  save(permission: Permission): Promise<Permission>
  delete(id: string): Promise<Permission | null>
}
