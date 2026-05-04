import { OperatorContextPayload, OperatorPermissionResolver } from '../types';
export declare class DenyAllOperatorPermissionResolver implements OperatorPermissionResolver {
    resolvePermissions(operatorContext: OperatorContextPayload): Promise<string[]>;
}
