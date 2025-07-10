import { RolePermission } from './role-permission.entity';
import { UserRole } from './user-role.entity';
import { Role as PrismaRole } from "prisma/generated/prisma";

export class Role {
  constructor(
    public readonly id: string,
    public name: string,
    public module: string,
    public description?: string,
    public permissions: RolePermission[] = [],
    public users: UserRole[] = [],
  ) { }

  get permissionIds(): string[] {
    return this.permissions.map(rp => rp.permissionId);
  }

  static fromPrisma (role: PrismaRole, permissions: RolePermission[] = [], users: UserRole[] = []): Role {
    return new Role(
      role.id,
      role.name,
      role.module,
      role.description || "",
      permissions,
      users
    )
  } 

  removePermission(permissionId: string) {
    this.permissions = this.permissions.filter(p => p.permissionId !== permissionId);
  }

  hasPermission(permissionId: string): boolean {
    return this.permissions.some(p => p.permissionId === permissionId);
  }
}
