import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { ClientProxy } from '@nestjs/microservices'
import { SCOPE_CHECK_KEY } from '../decorators/scope-check.decorator'
import { PERMISSION_MESSAGES } from '../constants/messages/permission.message'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class ScopeControllGuard implements CanActivate {
  constructor(
    private readonly permissionServiceClient: ClientProxy,
    private readonly reflector: Reflector,
  ) { }

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
    const hasPermission = await firstValueFrom(
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
