"use strict";
/**
 * @file gRPC transport module — NestJS DynamicModule for gRPC client management
 * @module transport/grpc
 *
 * Provides two static methods:
 * - `forRoot()` — Registers the GrpcClientManager globally with service configurations
 * - `forFeature()` — Registers specific service client providers for a feature module
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GrpcTransportModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrpcTransportModule = void 0;
const common_1 = require("@nestjs/common");
const grpc_client_manager_1 = require("./grpc-client.manager");
const grpc_constants_1 = require("./grpc.constants");
/**
 * NestJS module for gRPC inter-service communication.
 *
 * Uses NestJS native `@nestjs/microservices` Transport.GRPC under the hood,
 * with added connection pooling, load balancing, and Nacos service discovery.
 *
 * ## Architecture
 *
 * ```
 * GrpcTransportModule.forRoot()     → Global: GrpcClientManager + config
 * GrpcTransportModule.forFeature()  → Per-module: service-specific client providers
 * ```
 *
 * @example Root module setup
 * ```typescript
 * @Module({
 *   imports: [
 *     RegistryModule,  // Provides NacosDiscoveryService
 *     GrpcTransportModule.forRoot({
 *       services: {
 *         'permission-service': {
 *           serviceName: 'permission-service',
 *           protoPath: 'protos/permission_check.proto',
 *           packageName: 'permission_service',
 *         },
 *         'auth-service': {
 *           serviceName: 'auth-service',
 *           protoPath: 'protos/auth.proto',
 *           packageName: 'auth_service',
 *         },
 *       },
 *       defaultPoolConfig: {
 *         minSize: 2,
 *         maxSize: 10,
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example Feature module setup
 * ```typescript
 * @Module({
 *   imports: [
 *     GrpcTransportModule.forFeature(['permission-service']),
 *   ],
 * })
 * export class PermissionModule {}
 * ```
 *
 * @example Injecting in a service
 * ```typescript
 * @Injectable()
 * export class PermissionAdapter {
 *   constructor(
 *     @InjectGrpcClient('permission-service')
 *     private readonly client: ClientGrpc,
 *   ) {}
 * }
 * ```
 */
let GrpcTransportModule = GrpcTransportModule_1 = class GrpcTransportModule {
    /**
     * Register the gRPC transport module globally.
     *
     * This should be called once in the root AppModule. It registers:
     * - The module options (service configs)
     * - The GrpcClientManager (singleton)
     *
     * @param options - gRPC module configuration including service definitions
     */
    static forRoot(options) {
        const optionsProvider = {
            provide: grpc_constants_1.GRPC_MODULE_OPTIONS,
            useValue: options
        };
        return {
            module: GrpcTransportModule_1,
            global: true,
            providers: [optionsProvider, grpc_client_manager_1.GrpcClientManager],
            exports: [grpc_client_manager_1.GrpcClientManager, grpc_constants_1.GRPC_MODULE_OPTIONS]
        };
    }
    /**
     * Register gRPC client providers for specific services in a feature module.
     *
     * Each service name gets a dedicated injection token that resolves to
     * a `ClientGrpc` instance obtained from the GrpcClientManager.
     *
     * @param serviceNames - Array of service keys (must match keys in forRoot config)
     */
    static forFeature(serviceNames) {
        const providers = serviceNames.map((name) => ({
            provide: (0, grpc_constants_1.getGrpcClientToken)(name),
            useFactory: async (manager) => {
                return manager.getClient(name);
            },
            inject: [grpc_client_manager_1.GrpcClientManager]
        }));
        return {
            module: GrpcTransportModule_1,
            providers,
            exports: providers
        };
    }
    /**
     * Register gRPC transport with async configuration.
     *
     * Useful when the configuration depends on other providers
     * (e.g., NacosConfigService for dynamic configuration).
     *
     * @param options - Async module options
     */
    static forRootAsync(options) {
        const optionsProvider = {
            provide: grpc_constants_1.GRPC_MODULE_OPTIONS,
            useFactory: options.useFactory,
            inject: options.inject ?? []
        };
        return {
            module: GrpcTransportModule_1,
            global: true,
            imports: options.imports ?? [],
            providers: [optionsProvider, grpc_client_manager_1.GrpcClientManager],
            exports: [grpc_client_manager_1.GrpcClientManager, grpc_constants_1.GRPC_MODULE_OPTIONS]
        };
    }
};
exports.GrpcTransportModule = GrpcTransportModule;
exports.GrpcTransportModule = GrpcTransportModule = GrpcTransportModule_1 = __decorate([
    (0, common_1.Module)({})
], GrpcTransportModule);
//# sourceMappingURL=grpc-transport.module.js.map