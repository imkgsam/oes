export declare const PERMISSION_CHECK_KEY = "permission_check";
export interface PermissionCheckOptions {
    resourceParam?: string;
}
export declare enum PermissionCheckType {
    ALL = "ALL",
    ANY = "ANY"
}
export declare const PermissionCheckAll: (permissions: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const PermissionCheckAny: (permissions: string[]) => import("@nestjs/common").CustomDecorator<string>;
