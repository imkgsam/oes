import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { AUTH_MESSAGES } from '@oes/common/constants/messages/auth.message'
import { IAuthServiceRpcTestPort } from '@oes/common/interfaces/services/auth-service.interface'

@Controller('test')
export class TcpTestController implements IAuthServiceRpcTestPort {
  constructor() {}

  @MessagePattern(AUTH_MESSAGES.TESTING)
  async testing() {
    // throw createBusinessException(AUTH_SERVICE_ERRORS.NOT_ALLOW_LOGIN, { message: 'banned' })
    // throw createSystemException(GLOBAL_SYSTEM_ERRORS.REDIS_OPERATION_FAILED)
    // return safeRpcCall(this.permissionClient.send(PERMISSION_MESSAGES.Test, {}))
    return await Promise.resolve(123)
  }
}
