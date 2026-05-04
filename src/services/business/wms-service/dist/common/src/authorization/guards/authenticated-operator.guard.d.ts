import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OperatorContextVerifier } from '../types';
export declare class AuthenticatedOperatorGuard implements CanActivate {
    private readonly reflector;
    private readonly verifier;
    constructor(reflector: Reflector, verifier: OperatorContextVerifier);
    canActivate(context: ExecutionContext): boolean;
}
