import { CanActivate, ExecutionContext, OnModuleInit } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientGrpc } from '@nestjs/microservices';
import { AppLogger } from '../../logging/app-logger.service';
import { GrpcMetadataPropagationFactory } from '../types';
/**
 * 网关层权限守卫。
 *
 * 通过 gRPC 调用 permission-service 检查当前用户是否拥有所需权限。
 * 采用 fail-closed 策略：下游异常时拒绝访问，确保安全。
 */
export declare class GatewayPermissionGuard implements CanActivate, OnModuleInit {
    private readonly permissionClient;
    private readonly reflector;
    private readonly logger;
    private readonly metadataFactory;
    private permissionSvc;
    constructor(permissionClient: ClientGrpc, reflector: Reflector, logger: AppLogger, metadataFactory: GrpcMetadataPropagationFactory);
    onModuleInit(): void;
    canActivate(context: ExecutionContext): Promise<boolean>;
    /**
     * 单个权限检查，fail-closed：异常时返回 false。
     */
    private checkSingle;
    private buildInternalMetadata;
    private resolveOperatorId;
}
