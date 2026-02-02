export class RolePermission {
  constructor(
    public readonly roleId: string,
    public readonly permissionId: string,
    public readonly permissionCode: string
  ) {}
}
