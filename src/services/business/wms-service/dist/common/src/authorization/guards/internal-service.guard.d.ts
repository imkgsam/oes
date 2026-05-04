import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InternalServiceAuthenticator } from '../types';
export declare class InternalServiceGuard implements CanActivate {
    private readonly reflector;
    private readonly authenticator;
    constructor(reflector: Reflector, authenticator: InternalServiceAuthenticator);
    canActivate(context: ExecutionContext): boolean;
}
