import { RolePermission } from './role-permission.entity';
import { UserRole } from './user-role.entity';
export declare class Role {
    readonly id: string;
    name: string;
    module: string;
    description: string | null;
    permissions: RolePermission[];
    users: UserRole[];
    constructor(id: string, name: string, module: string, description?: string | null, permissions?: RolePermission[], users?: UserRole[]);
    assignPermission(permission: RolePermission): void;
    assignUser(user: UserRole): void;
}
