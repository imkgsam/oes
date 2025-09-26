import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { AUTH_MESSAGES } from '@oes/common/constants/messages/auth.message'
import { IAuthServiceRpcTestContract } from '@oes/common/interfaces/services/auth-service/rpc.contract'

@Controller('test')
export class TcpTestController implements IAuthServiceRpcTestContract {
  constructor() {}

  @MessagePattern(AUTH_MESSAGES.TESTING)
  async testing() {
    return await Promise.resolve(123)
  }
}
