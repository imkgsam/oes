export class RolePermission {
  constructor(
    public readonly id: string,
    public roleId: string,
    public permissionId: string,
  ) { }
}
