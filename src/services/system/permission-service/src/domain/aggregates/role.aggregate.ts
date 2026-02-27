import { RolePermission } from '../vo/role-permission.value-object'

/** Role aggregate root – RBAC core entity */
export class Role {
  constructor(
    public readonly id: string,
    public name: string,
    public code: string,
    public tenantId: string | null,
    public isSystem: boolean,
    public isEnabled: boolean,
    public description?: string,
    private _permissions: RolePermission[] = []
  ) {}

  get permissions(): ReadonlyArray<RolePermission> {
    return [...this._permissions]
  }

  addPermission(permission: RolePermission): void {
    if (this.hasPermissionById(permission.permissionId)) return
    this._permissions.push(permission)
  }

  removePermissionById(permissionId: string): void {
    this._permissions = this._permissions.filter((p) => p.permissionId !== permissionId)
  }

  hasPermissionByCode(permissionCode: string): boolean {
    return this._permissions.some((p) => p.permissionCode === permissionCode)
  }

  hasPermissionById(permissionId: string): boolean {
    return this._permissions.some((p) => p.permissionId === permissionId)
  }

  disable(): void {
    this.isEnabled = false
  }

  enable(): void {
    this.isEnabled = true
  }
}
