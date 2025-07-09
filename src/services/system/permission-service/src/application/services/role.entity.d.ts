import { RolePermission } from "src/domain/entities/role-permission.entity";
export declare class Role {
    readonly id: string;
    name: string;
    module: string;
    description: string | null;
    permissions: RolePermission[];
    constructor(id: string, name: string, module: string, description?: string | null);
}
