import { ScopeResourceType } from '../enums/scope-resource-type.enum';
export declare class UserScope {
    readonly id: string;
    userId: string;
    permissionCode: string;
    resourceType: ScopeResourceType;
    resourceId: string;
    constructor(id: string, userId: string, permissionCode: string, resourceType: ScopeResourceType, resourceId: string);
    matches(resourceType: ScopeResourceType, resourceId: string): boolean;
}
