import { CanActivate, ExecutionContext, Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ClientGrpc } from '@nestjs/microservices'
import { Observable } from 'rxjs'
import { SERVICE_NAMES } from '../../constants'
import { RequirePermissionsMetadata } from '../decorators'
import { InjectGrpcClient } from '../../transport/grpc/grpc-client.decorator'
import { safeGrpcCall } from '../../transport/grpc/safe-grpc-call'
import { AppLogger } from '../../logging/app-logger.service'
import { PermissionCheckServiceClient } from '../../generated/permission_service/permission_check'
import { GRPC_METADATA_PROPAGATION_FACTORY, REQUIRE_PERMISSIONS_METADATA_KEY } from '../constants'
import { GrpcMetadataPropagationFactory } from '../types'

/** 权限检查超时时间（毫秒） */
const PERMISSION_CHECK_TIMEOUT_MS = 3000
const GATEWAY_SERVICE_NAME = 'api-gateway'

/**
 * 网关层权限守卫。
 *
 * 通过 gRPC 调用 permission-service 检查当前用户是否拥有所需权限。
 * 采用 fail-closed 策略：下游异常时拒绝访问，确保安全。
 */
@Injectable()
export class GatewayPermissionGuard implements CanActivate, OnModuleInit {
  private permissionSvc!: PermissionCheckServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PERMISSION)
    private readonly permissionClient: ClientGrpc,
    private readonly reflector: Reflector,
    private readonly logger: AppLogger,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit() {
    this.permissionSvc =
      this.permissionClient.getService<PermissionCheckServiceClient>('PermissionCheckService')
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<RequirePermissionsMetadata>(
      REQUIRE_PERMISSIONS_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    )
    if (!metadata) return true

    const mode = this.resolveMode(metadata)
    const permissions = metadata[mode]
    const request = context.switchToHttp().getRequest<any>()
    const userId = this.resolveOperatorId(request.user)
    if (!userId) return false

    const results = await Promise.all(permissions.map((code) => this.checkSingle(userId, code)))

    if (mode === 'all') {
      return results.every(Boolean)
    }
    return results.some(Boolean)
  }

  // Resolves the permission requirement mode and fails closed for malformed metadata.
  private resolveMode(metadata: RequirePermissionsMetadata): 'all' | 'any' {
    const hasAll = Array.isArray(metadata.all)
    const hasAny = Array.isArray(metadata.any)

    if (hasAll === hasAny) {
      throw new Error('RequirePermissions metadata must declare exactly one of all or any')
    }

    return hasAll ? 'all' : 'any'
  }

  /**
   * 单个权限检查，fail-closed：异常时返回 false。
   */
  private async checkSingle(accountId: string, permissionCode: string): Promise<boolean> {
    try {
      const { allowed } = await safeGrpcCall(
        this.permissionSvc.checkPermission(
          { accountId, permissionCode },
          this.buildInternalMetadata()
        ),
        {
          timeoutMs: PERMISSION_CHECK_TIMEOUT_MS,
          caller: 'api-gateway',
          method: 'PermissionCheckService.checkPermission'
        }
      )
      return allowed ?? false
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

  // Builds the internal service metadata required by permission-service for gateway permission checks.
  private buildInternalMetadata() {
    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: GATEWAY_SERVICE_NAME
    })
  }

  // Resolves the authenticated account id used for permission checks from legacy and current JWT shapes.
  private resolveOperatorId(user?: {
    holderId?: string
    aid?: string
    id?: string
    sub?: string
  }): string | undefined {
    const candidates = [user?.holderId, user?.aid, user?.id, user?.sub]

    for (const candidate of candidates) {
      const normalized = candidate?.trim()
      if (normalized) {
        return normalized
      }
    }

    return undefined
  }
}
