import { RolePermission } from './role-permission.entity';

export class Permission {
  constructor(
    public readonly id: string,
    public code: string,
    public module: string,
    public description?: string | "",
    public permissions?: RolePermission[],
  ) {}

  assignPermission(permission: RolePermission) {
    this.permissions.push(permission);
  }
}
