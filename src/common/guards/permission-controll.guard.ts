import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ClientProxy } from '@nestjs/microservices'
import {
  PERMISSION_CHECK_KEY,
  PermissionCheckType,
} from '../decorators/permission-check.decorator'
import { PERMISSION_MESSAGES } from '../constants/messages/permission.message'
import { InjectServiceClient } from '../modules/clients/client.decorator'
import { ServiceKeys } from '../modules/clients/service-map'
import { safeRpcCall } from '../helpers/rpc.helper'

@Injectable()
export class PermissionControllGuard implements CanActivate {
  constructor(
    @InjectServiceClient(ServiceKeys.PERMI_TCP)
    private readonly permissionServiceClient: ClientProxy,
    private readonly reflector: Reflector,
  ) { }

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
        safeRpcCall(
          this.permissionServiceClient.send<boolean>(
            PERMISSION_MESSAGES.CHECK_USER_PERMISSION,
            { userId, permissionCode },
          ),
        ),
      ),
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
