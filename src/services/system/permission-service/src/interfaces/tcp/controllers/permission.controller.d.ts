import { CheckUserPermissionDto, CheckUserScopeDto } from "../dtos/permission.dto";
export declare class PermissionController {
    private readonly permissionService;
    constructor(permissionService: PermissionService);
    checkUserPermission(data: CheckUserPermissionDto): any;
    checkUserScope(data: CheckUserScopeDto): any;
}
