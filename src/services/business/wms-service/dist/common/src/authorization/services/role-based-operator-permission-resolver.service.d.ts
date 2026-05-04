import { PermissionServicePermissionReadAdaptor } from '../adaptors';
import { OperatorContextPayload, OperatorPermissionResolver } from '../types';
export declare class RoleBasedOperatorPermissionResolver implements OperatorPermissionResolver {
    private readonly permissionReadAdaptor;
    constructor(permissionReadAdaptor: PermissionServicePermissionReadAdaptor);
    resolvePermissions(operatorContext: OperatorContextPayload): Promise<string[]>;
}
