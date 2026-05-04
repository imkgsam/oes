/**
 * @file gRPC client injection decorator
 * @module transport/grpc
 */
/**
 * Parameter decorator that injects a gRPC client for the specified service.
 *
 * The injected value is a `ClientGrpc` instance from which you can obtain
 * typed service stubs via `.getService<T>(serviceName)`.
 *
 * @param serviceName - The service key as defined in GrpcTransportModule configuration
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class PermissionAdapter {
 *   private permissionSvc: PermissionCheckService
 *
 *   constructor(
 *     @InjectGrpcClient('permission-service')
 *     private readonly client: ClientGrpc,
 *   ) {}
 *
 *   onModuleInit() {
 *     this.permissionSvc = this.client.getService<PermissionCheckService>('PermissionCheckService')
 *   }
 *
 *   async check(userId: string, resource: string) {
 *     return firstValueFrom(this.permissionSvc.checkPermission({ userId, resource }))
 *   }
 * }
 * ```
 */
export declare function InjectGrpcClient(serviceName: string): ParameterDecorator;
