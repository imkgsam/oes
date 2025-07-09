import { RolePermission } from './role-permission.entity';
import { UserRole } from './user-role.entity';

export class Role {
  constructor(
    public readonly id: string,
    public name: string,
    public module: string,
    public description?: string,
    public permissions: RolePermission[] = [],
    public users: UserRole[] = [],
  ) {}

  get permissionIds(): string[] {
    return this.permissions.map(rp => rp.permissionId);
  }

  // addPermission(permissionId: string) {
  //   if (!this.permissionIds.includes(permissionId)) {
  //     this.permissions.push(permissionId);
  //   }
  // }

  // removePermission(permissionId: string) {
  //   this.permissions = this.permissions.filter(id => id !== permissionId);
  // }

  // hasPermission(permissionId: string): boolean {
  //   return this.permissions.includes(permissionId);
  // }
}
