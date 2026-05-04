import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CommonJwtService } from '../jwt/jwt.service';
export declare enum AccountHolderType {
    USER = "USER",
    SERVICE = "SERVICE"
}
export interface UserAccountContext {
    holderType: AccountHolderType.USER;
    holderId: string;
    userId: string;
    tenantId?: string;
}
export declare class GatewayJwtAuthGuard implements CanActivate {
    private readonly reflector;
    private readonly jwtService;
    constructor(reflector: Reflector, jwtService: CommonJwtService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
