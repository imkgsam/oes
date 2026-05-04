import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OperatorPermissionResolver } from '../types';
export declare class PermissionGuard implements CanActivate {
    private readonly reflector;
    private readonly permissionResolver;
    private readonly logger;
    constructor(reflector: Reflector, permissionResolver: OperatorPermissionResolver);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getOperatorContext;
    private resolvePermissions;
    private describeRequestTarget;
    private readStringField;
}
