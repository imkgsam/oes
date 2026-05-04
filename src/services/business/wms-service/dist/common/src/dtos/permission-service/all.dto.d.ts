export interface Permission {
    id: string;
    name: string;
    code: string;
    resource: string;
    action: string;
    description?: string;
}
export interface Role {
    id: string;
    name: string;
    code: string;
    description?: string;
    permissions: Permission[];
}
export interface UserPermission {
    userId: string;
    permissionId: string;
    granted: boolean;
    grantedAt?: Date;
    grantedBy?: string;
    expiresAt?: Date;
}
export interface UserRole {
    userId: string;
    roleId: string;
    granted: boolean;
    grantedAt?: Date;
    grantedBy?: string;
    expiresAt?: Date;
}
export interface AccountPermission {
    accountId: string;
    permissionId: string;
    granted: boolean;
    grantedAt?: Date;
    grantedBy?: string;
    expiresAt?: Date;
}
export interface AccountRole {
    accountId: string;
    roleId: string;
    granted: boolean;
    grantedAt?: Date;
    grantedBy?: string;
    expiresAt?: Date;
}
