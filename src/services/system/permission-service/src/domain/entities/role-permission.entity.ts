import { Permission } from './permission.entity'

export class RolePermission {
  static fromPrisma(r: { id: string; roleId: string; permissionId: string }): any {
    return new RolePermission(r.id, r.roleId, r.permissionId)
  }
  constructor(
    public readonly id: string,
    public roleId: string,
    public permissionId: string,
    public permission?: Permission,
  ) {}
}
