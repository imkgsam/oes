import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { MicroservicesList } from '../constants/microservices-list';
import { ClientProxy } from '@nestjs/microservices';
import { PERMISSION_CHECK_KEY } from '../decorators/permission-check.decorator';
import { ResourceSourceEnum } from '../constants/http-request-permission-controll-resource-source.enum';
import { PERMISSION_MESSAGES } from '../constants/messages/permission.message';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class PermissionControllGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector,
    @Inject(MicroservicesList.PERMISSION_SERVICE)
    private readonly permissionServiceClient: ClientProxy
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get(PERMISSION_CHECK_KEY, context.getHandler())

    if (!metadata) return true

    const { permission, resourceParam, source } = metadata
    const contextType = context.getType()

    let userId: string | undefined
    let resourceId: string | undefined

    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest<any>()
      userId = request.user?.id
      switch (source) {
        case ResourceSourceEnum.Param:
          resourceId = request.params?.[resourceParam]
          break
        case ResourceSourceEnum.Body:
          resourceId = request.body?.[resourceParam]
          break
        case ResourceSourceEnum.Header:
          resourceId = request.headers?.[resourceParam]
          break
        case ResourceSourceEnum.Query:
          resourceId = request.query?.[resourceParam]
          break
      }
    } else if (contextType === 'rpc') {
      const data = context.switchToRpc().getData()

      userId = data.user?.id
      if (resourceParam && data?.[resourceParam])
        resourceId = data?.[resourceParam]

    } else {

    }

    if (!userId)
      return false

    const hasPermission = await firstValueFrom(this.permissionServiceClient.send<boolean>(PERMISSION_MESSAGES.CHECK_USER_PERMISSION, {
      userId,
      permissionCode: permission,
      resourceId,
    }))

    return hasPermission === true;
  }

}
