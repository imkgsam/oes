import { RolePermission } from "src/domain/entities/role-permission.entity"

export class Role {

  public permissions: RolePermission[]
  constructor(
    public readonly id: string,
    public name: string,
    public module: string,
    public description: string | null = null,
  ) {
  }
}
