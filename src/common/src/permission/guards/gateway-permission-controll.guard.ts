import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ClientProxy } from '@nestjs/microservices'
import { PERMISSION_CHECK_KEY, PermissionCheckType } from '../decorators/permission-check.decorator'
import { PERMISSION_MESSAGES } from '../../constants/messages/permission.message'
import { InjectServiceClient } from '../../rpc/clients/client.decorator'
import { ServiceKeys } from '../../rpc/clients/service-map'
import { safeRpcCall } from '../../rpc/helpers/-rpc.helper'

/**
 * Note: 只检查permission， 不检查scope
 */
@Injectable()
export class GatewayPermissionControllGuard implements CanActivate {
  constructor(
    @InjectServiceClient(ServiceKeys.PERMISSION_TCP)
    private readonly permissionServiceClient: ClientProxy,
    private readonly reflector: Reflector
  ) {}

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
      permissions.map((permissionCode) =>
        safeRpcCall<boolean>(
          this.permissionServiceClient.send<boolean>(PERMISSION_MESSAGES.CHECK_USER_PERMISSION, {
            userId,
            permissionCode
          })
        )
      )
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
