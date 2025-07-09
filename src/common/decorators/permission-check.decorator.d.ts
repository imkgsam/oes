export declare const PERMISSION_CHECK_KEY = "permission_check";
export interface PermissionCheckOptions {
    resourceParam?: string;
}
export declare const PermissionCheck: (permission: string) => import("node_modules/@nestjs/common").CustomDecorator<string>;
