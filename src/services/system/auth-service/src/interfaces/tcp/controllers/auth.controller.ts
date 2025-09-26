import { Controller, Post } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { AuthService } from 'src/application/services/auth-service'
import { AUTH_MESSAGES } from '@oes/common/constants/messages/auth.message'
import {
  EmailPasswordLoginRequestDto,
  PhonePasswordLoginRequestDto,
  LoginResponseDto,
  EmailOtpLoginRequestDto,
  PhoneOtpLoginRequestDto,
  GoogleLoginRequestDto,
  WechatLoginRequestDto
} from '@oes/common/dtos/auth-service/all.dto'
import { LoginMethodEnum } from '@oes/common/constants/const/auth-service.const'
import { IAuthServiceRpcAuthContract } from '@oes/common/interfaces/services/auth-service/rpc.contract'

@Controller()
export class TcpAuthController implements IAuthServiceRpcAuthContract {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_EMAIL_PW)
  async loginWithEmailPassword(
    @Payload() data: EmailPasswordLoginRequestDto
  ): Promise<LoginResponseDto> {
    return this.authService.login<EmailPasswordLoginRequestDto>(LoginMethodEnum.EmailPassword, data)
  }

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_PHONE_PW)
  async loginWithPhonePassword(
    @Payload() data: PhonePasswordLoginRequestDto
  ): Promise<LoginResponseDto> {
    return this.authService.login<PhonePasswordLoginRequestDto>(LoginMethodEnum.PhonePassword, data)
  }

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_EMAIL_OTP)
  async loginWithEmailOtp(@Payload() data: EmailOtpLoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login<EmailOtpLoginRequestDto>(LoginMethodEnum.EmailOtp, data)
  }

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_PHONE_OTP)
  async loginWithPhoneOtp(@Payload() data: PhoneOtpLoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login<PhoneOtpLoginRequestDto>(LoginMethodEnum.PhoneOtp, data)
  }

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_GOOGLE)
  async loginWithGoogle(@Payload() data: GoogleLoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login<GoogleLoginRequestDto>(LoginMethodEnum.Google, data)
  }

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_WECHAT)
  async loginWithWechat(@Payload() data: WechatLoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login<WechatLoginRequestDto>(LoginMethodEnum.Wechat, data)
  }
}
