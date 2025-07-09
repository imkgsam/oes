import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
export declare class ScopeControllGuard implements CanActivate {
    private readonly reflector;
    private readonly permissionServiceClient;
    constructor(reflector: Reflector, permissionServiceClient: ClientProxy);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
