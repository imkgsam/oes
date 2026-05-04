import { OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { GrpcRequestContextStore } from '../services/grpc-request-context.store';
import { GrpcMetadataPropagationFactory, OperatorContextPayload } from '../types';
export declare class PermissionServicePermissionReadAdaptor implements OnModuleInit {
    private readonly permissionClient;
    private readonly metadataFactory;
    private readonly requestContextStore;
    private readonly logger;
    private readonly cache;
    private readonly inflight;
    private readonly cacheTtlMs;
    private permissionManagementService;
    private permissionAccessSummaryService;
    constructor(permissionClient: ClientGrpc, metadataFactory: GrpcMetadataPropagationFactory, requestContextStore: GrpcRequestContextStore);
    onModuleInit(): void;
    listPermissionCodesByOperatorContext(operatorContext: OperatorContextPayload): Promise<string[]>;
    listPermissionCodesByRoleId(roleId: string): Promise<string[]>;
    private buildRequest;
    private fetchPermissionCodes;
    private fetchOperatorPermissionCodes;
    private getPermissionAccessSummaryService;
    private getCachedPermissions;
    private resolveCacheTtlMs;
    private now;
    private metadata;
    private resolveCurrentServiceName;
}
