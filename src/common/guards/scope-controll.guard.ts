import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ClientProxy } from '@nestjs/microservices'
import { SCOPE_CHECK_KEY } from '../decorators/scope-check.decorator'
import { PERMISSION_MESSAGES } from '../constants/messages/permission.message'
import { InjectServiceClient } from '../modules/clients/client.decorator'
import { ServiceKeys } from '../modules/clients/service-map'
import { safeRpcCall } from "../helpers/rpc.helper";
ServiceKeys
@Injectable()
export class ScopeControllGuard implements CanActivate {
  constructor(
    @InjectServiceClient(ServiceKeys.PERMI_TCP)
    private readonly permissionServiceClient: ClientProxy,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get(SCOPE_CHECK_KEY, context.getHandler())
    if (!metadata) return true
    const { permission, resourceParam } = metadata
    let userId: string | undefined
    let resourceId: string | undefined
    const data = context.switchToRpc().getData()
    userId = data.user?.id
    if (resourceParam && data?.[resourceParam])
      resourceId = data?.[resourceParam]
    if (!userId) return false
    const hasPermission = await safeRpcCall(
      this.permissionServiceClient.send<boolean>(
        PERMISSION_MESSAGES.CHECK_USER_PERMISSION,
        {
          userId,
          permissionCode: permission,
          resourceId,
        },
      ),
    )
    return hasPermission === true
  }
}
