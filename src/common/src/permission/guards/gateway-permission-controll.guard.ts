import { CanActivate, ExecutionContext, Injectable, OnModuleInit } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ClientGrpc } from '@nestjs/microservices'
import { firstValueFrom, Observable } from 'rxjs'
import { PERMISSION_CHECK_KEY, PermissionCheckType } from '../decorators/permission-check.decorator'
import { InjectGrpcClient } from '../../transport/grpc/grpc-client.decorator'

/**
 * gRPC service interface for permission checking.
 * Must match the PermissionCheckService defined in permission_check.proto.
 */
interface PermissionCheckService {
  checkPermission(data: {
    accountId: string
    permissionCode: string
  }): Observable<{ pass: boolean }>
}

/**
 * Gateway-level permission guard.
 *
 * Checks if the current user has the required permissions by calling
 * the permission-service via gRPC.
 *
 * Note: Only checks permissions, not scopes.
 */
@Injectable()
export class GatewayPermissionControllGuard implements CanActivate, OnModuleInit {
  private permissionSvc: PermissionCheckService

  constructor(
    @InjectGrpcClient('permission-service')
    private readonly permissionClient: ClientGrpc,
    private readonly reflector: Reflector
  ) {}

  onModuleInit() {
    this.permissionSvc =
      this.permissionClient.getService<PermissionCheckService>('PermissionCheckService')
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get<{
      type: PermissionCheckType
      permissions: string[]
    }>(PERMISSION_CHECK_KEY, context.getHandler())
    if (!metadata) return true
    const { permissions, type } = metadata
    const request = context.switchToHttp().getRequest<any>()
    const userId = request.user?.id || undefined
    if (!userId) return false

    const results = await Promise.all(
      permissions.map(async (permissionCode) => {
        const response = await firstValueFrom(
          this.permissionSvc.checkPermission({
            accountId: userId,
            permissionCode
          })
        )
        return response.pass
      })
    )

    if (type === PermissionCheckType.ALL) {
      return results.every(Boolean)
    }
    if (type === PermissionCheckType.ANY) {
      return results.some(Boolean)
    }
    return false
  }
}
