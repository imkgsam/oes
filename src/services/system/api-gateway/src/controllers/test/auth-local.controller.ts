import { Body, Controller, Get, Post } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { safeRpcCall } from '@oes/common/helpers/rpc.helper'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { AUTH_MESSAGES } from '@oes/common/constants/messages/auth.message'
import {
  EmailPasswordLoginDto,
  GoogleLoginDto,
  EmailOtpLoginDto,
  PhoneOtpLoginDto,
  WechatLoginDto,
} from 'src/dtos/login.dto'

@Controller('test')
export class TestController {
  constructor(
    @InjectServiceClient(ServiceKeys.AUTH_TCP)
    private readonly authClient: ClientProxy,
  ) { }

  @Get('/')
  async testing() {
    console.log('in api, role/test')
    return safeRpcCall(this.authClient.send(AUTH_MESSAGES.Test, {}))
  }

}
