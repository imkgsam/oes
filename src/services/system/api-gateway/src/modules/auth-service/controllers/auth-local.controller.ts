import { Body, Controller, Post } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { safeRpcCall } from '@oes/common/helpers/rpc.helper'
import { EmailPasswordLoginDto, GoogleLoginDto, EmailOtpLoginDto, PhoneOtpLoginDto, WechatLoginDto } from 'src/dtos/login.dto'

@ApiTags("身份认证")
@Controller('auth/login')
export class AuthController {
  constructor(
    @InjectServiceClient(ServiceKeys.AUTH_TCP)
    private readonly authClient: ClientProxy
  ) { }

  @Post('/email-password')
  async loginWithEmailPassword(@Body() dto: EmailPasswordLoginDto) {
    return safeRpcCall(this.authClient.send('email_password_login', dto))
  }

  @Post('/google')
  async loginWithGoogle(@Body() dto: GoogleLoginDto) { }

  @Post('/email-otp')
  async loginWithEmailOtp(@Body() dto: EmailOtpLoginDto) { }

  @Post('/phone-otp')
  async loginWithPhoneOtp(@Body() dto: PhoneOtpLoginDto) { }

  @Post('/wechat')
  async loginWithWechat(@Body() dto: WechatLoginDto) { }
}
