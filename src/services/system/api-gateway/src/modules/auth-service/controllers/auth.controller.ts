import { Body, Controller, Post } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { ApiTags } from '@nestjs/swagger'
import { safeRpcCall } from '@oes/common/helpers/rpc.helper'
import {
  EmailPasswordLoginRequestDto,
  GoogleLoginRequestDto,
  EmailOtpLoginRequestDto,
  PhoneOtpLoginRequestDto,
  WechatLoginRequestDto,
  PhonePasswordLoginRequestDto
} from '@oes/common/dtos/auth-service/api/rpc/all.dto'
import { AUTH_MESSAGES } from '@oes/common/constants/messages/auth.message'

@ApiTags('身份认证')
@Controller('auth')
export class AuthController {
  constructor(
    @InjectServiceClient(ServiceKeys.AUTH_TCP)
    private readonly authClient: ClientProxy
  ) {}

  @Post('login/email-password')
  async loginWithEmailPassword(@Body() dto: EmailPasswordLoginRequestDto) {
    return safeRpcCall(this.authClient.send(AUTH_MESSAGES.LOGIN_WITH_EMAIL_PW, dto))
  }

  @Post('login/phone-password')
  async loginWithPhonePassword(@Body() dto: PhonePasswordLoginRequestDto) {
    return safeRpcCall(this.authClient.send(AUTH_MESSAGES.LOGIN_WITH_PHONE_PW, dto))
  }

  @Post('login/email-otp')
  async loginWithEmailOtp(@Body() dto: EmailOtpLoginRequestDto) {
    return safeRpcCall(this.authClient.send(AUTH_MESSAGES.LOGIN_WITH_EMAIL_OTP, dto))
  }

  @Post('login/phone-otp')
  async loginWithPhoneOtp(@Body() dto: PhoneOtpLoginRequestDto) {
    return safeRpcCall(this.authClient.send(AUTH_MESSAGES.LOGIN_WITH_EMAIL_OTP, dto))
  }

  @Post('login/wechat')
  async loginWithWechat(@Body() dto: WechatLoginRequestDto) {
    return safeRpcCall(this.authClient.send(AUTH_MESSAGES.LOGIN_WITH_EMAIL_OTP, dto))
  }

  @Post('login/google')
  async loginWithGoogle(@Body() dto: GoogleLoginRequestDto) {
    return safeRpcCall(this.authClient.send(AUTH_MESSAGES.LOGIN_WITH_EMAIL_OTP, dto))
  }
}
