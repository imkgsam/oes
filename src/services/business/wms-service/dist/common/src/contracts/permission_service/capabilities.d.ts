import { PermissionCheckInput, PermissionCheckOutput, PermissionCheckWithContextInput, AuthzDecisionOutput } from './contract';
import { Cability } from '../../core/interfaces/capability.interface';
export declare const PermissionCheckCapability: {
    checkPermission: Cability<PermissionCheckInput, PermissionCheckOutput>;
    checkPermissionWithContext: Cability<PermissionCheckWithContextInput, AuthzDecisionOutput>;
};
