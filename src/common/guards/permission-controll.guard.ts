import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ClientProxy } from '@nestjs/microservices'
import { PERMISSION_CHECK_KEY } from '../decorators/permission-check.decorator'
import { PERMISSION_MESSAGES } from '../constants/messages/permission.message'
import { firstValueFrom } from 'rxjs'
import { InjectServiceClient } from '../modules/clients/client.decorator'

@Injectable()
export class PermissionControllGuard implements CanActivate {
  constructor(
    @InjectServiceClient('PERMI_TCP')
    private readonly permissionServiceClient: ClientProxy,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get(
      PERMISSION_CHECK_KEY,
      context.getHandler(),
    )
    if (!metadata) return true
    const { permission } = metadata
    const request = context.switchToHttp().getRequest<any>()
    const userId = request.user?.id || undefined
    if (!userId) return false
    const hasPermission = await firstValueFrom(
      this.permissionServiceClient.send<boolean>(
        PERMISSION_MESSAGES.CHECK_USER_PERMISSION,
        { userId, permissionCode: permission, resourceId: undefined },
      ),
    )
    return hasPermission === true
  }
}
