import { Permission } from '../aggregates/permission.aggregate'
export interface PermissionRepository {
  findById(id: string): Promise<Permission | null>
  findByCode(code: string): Promise<Permission | null>
}
