import { RolePermission } from './role-permission.entity';
import { UserRole } from './user-role.entity';

export class Role {
  constructor(
    public readonly id: string,
    public name: string,
    public module: string,
    public description: string | null = null,
    public permissions: RolePermission[] = [],
    public users: UserRole[] = [],
  ) {}

  assignPermission(permission: RolePermission) {
    this.permissions.push(permission);
  }

  assignUser(user: UserRole) {
    this.users.push(user);
  }
}
