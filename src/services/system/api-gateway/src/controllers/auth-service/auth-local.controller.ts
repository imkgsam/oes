import { Body, Controller, Post } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'

import {
  EmailPasswordLoginDto,
  GoogleLoginDto,
  EmailOtpLoginDto,
  PhoneOtpLoginDto,
  WechatLoginDto,
} from 'src/dtos/login.dto'

@Controller('auth')
export class AuthController {
  constructor(
    @InjectServiceClient(ServiceKeys.AUTH_TCP)
    private readonly authClient: ClientProxy,
  ) { }

  @Post('login/email-password')
  async loginWithEmailPassword(@Body() dto: EmailPasswordLoginDto) {
    console.log('in api-gateway, http, loginWithEmailPassword')
    const result = await this.authClient.send('email_password_login', dto)
    console.log(result)
    return result
  }

  @Post('login/google')
  async loginWithGoogle(@Body() dto: GoogleLoginDto) { }

  @Post('login/email-otp')
  async loginWithEmailOtp(@Body() dto: EmailOtpLoginDto) { }

  @Post('login/phone-otp')
  async loginWithPhoneOtp(@Body() dto: PhoneOtpLoginDto) { }

  @Post('login/wechat')
  async loginWithWechat(@Body() dto: WechatLoginDto) { }
}
