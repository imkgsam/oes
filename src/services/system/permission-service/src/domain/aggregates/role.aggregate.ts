import { RolePermission } from '../vo/role-permission.value-object'

export class Role {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public code: string,
    public description?: string,
    private _permissions: RolePermission[] = []
  ) {}

  removePermissionById(permissionId: string) {
    this._permissions.filter((p) => p.permissionId !== permissionId)
  }
  hasPermissionByCode(permissionCode: string): boolean {
    return this._permissions.some((p) => p.permissionCode === permissionCode)
  }
  hasPermissionById(permissionId: string): boolean {
    return this._permissions.some((p) => p.permissionId === permissionId)
  }
}
