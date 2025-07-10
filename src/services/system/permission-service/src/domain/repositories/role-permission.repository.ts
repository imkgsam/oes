import { RolePermission } from '../entities/role-permission.entity';

export abstract class RolePermissionRepository {
  abstract findByRoleId(roleId: string): Promise<RolePermission[]>;
  abstract find(roleId: string, permissionId: string): Promise<RolePermission | null>;
  abstract add(rolePermission: RolePermission): Promise<void>;
  abstract remove(roleId: string, permissionId: string): Promise<void>;
}