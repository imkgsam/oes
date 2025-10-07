import { Controller, Get } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { AUTH_MESSAGES } from '@oes/common/constants/messages/auth.message'
import { safeRpcCall2 } from '@oes/common/helpers/rpc.helper'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'

@Controller('auth/test')
export class TestController {
  constructor(
    @InjectServiceClient(ServiceKeys.AUTH_TCP)
    private readonly authClient: ClientProxy
  ) {}

  @Get('testing')
  async test() {
    return await safeRpcCall2(this.authClient, AUTH_MESSAGES.TESTING, {})
  }
}
