import { CanActivate, ExecutionContext, Injectable, OnModuleInit } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ClientGrpc } from '@nestjs/microservices'
import { Observable } from 'rxjs'
import { PERMISSION_CHECK_KEY, PermissionCheckType } from '../decorators/permission-check.decorator'
import { InjectGrpcClient } from '../../transport/grpc/grpc-client.decorator'
import { safeGrpcCall } from '../../transport/grpc/safe-grpc-call'
import { AppLogger } from '../../logging/app-logger.service'
import { PermissionCheckServiceClient } from '../../generated/permission_service/permission_check'

/** 权限检查超时时间（毫秒） */
const PERMISSION_CHECK_TIMEOUT_MS = 3000

/**
 * 网关层权限守卫。
 *
 * 通过 gRPC 调用 permission-service 检查当前用户是否拥有所需权限。
 * 采用 fail-closed 策略：下游异常时拒绝访问，确保安全。
 */
@Injectable()
export class GatewayPermissionControllGuard implements CanActivate, OnModuleInit {
  private permissionSvc: PermissionCheckServiceClient

  constructor(
    @InjectGrpcClient('permission-service')
    private readonly permissionClient: ClientGrpc,
    private readonly reflector: Reflector,
    private readonly logger: AppLogger
  ) {}

  onModuleInit() {
    this.permissionSvc =
      this.permissionClient.getService<PermissionCheckServiceClient>('PermissionCheckService')
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

    const results = await Promise.all(permissions.map((code) => this.checkSingle(userId, code)))

    if (type === PermissionCheckType.ALL) {
      return results.every(Boolean)
    }
    if (type === PermissionCheckType.ANY) {
      return results.some(Boolean)
    }
    return false
  }

  /**
   * 单个权限检查，fail-closed：异常时返回 false。
   */
  private async checkSingle(accountId: string, permissionCode: string): Promise<boolean> {
    try {
      const { pass } = await safeGrpcCall(
        this.permissionSvc.checkPermission({ accountId, permissionCode }),
        {
          timeoutMs: PERMISSION_CHECK_TIMEOUT_MS,
          caller: 'api-gateway',
          method: 'PermissionCheckService.checkPermission'
        }
      )
      return pass
    } catch (error) {
      // fail-closed：无论业务异常还是基础设施异常，都拒绝访问
      this.logger.warn('权限检查失败，拒绝访问（fail-closed）', {
        accountId,
        permissionCode,
        error: (error as Error)?.message ?? error
      })
      return false
    }
  }
}
