import { Controller, Post } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { LoginUsecase } from 'src/application/use-cases/login.usecase'
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
  constructor(private readonly loginUsecase: LoginUsecase) {}

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_EMAIL_PW)
  async loginWithEmailPassword(
    @Payload() data: EmailPasswordLoginRequestDto
  ): Promise<LoginResponseDto> {
    return this.loginUsecase.login<EmailPasswordLoginRequestDto>(
      LoginMethodEnum.EmailPassword,
      data
    )
  }

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_PHONE_PW)
  async loginWithPhonePassword(
    @Payload() data: PhonePasswordLoginRequestDto
  ): Promise<LoginResponseDto> {
    return this.loginUsecase.login<PhonePasswordLoginRequestDto>(
      LoginMethodEnum.PhonePassword,
      data
    )
  }

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_EMAIL_OTP)
  async loginWithEmailOtp(@Payload() data: EmailOtpLoginRequestDto): Promise<LoginResponseDto> {
    return this.loginUsecase.login<EmailOtpLoginRequestDto>(LoginMethodEnum.EmailOtp, data)
  }

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_PHONE_OTP)
  async loginWithPhoneOtp(@Payload() data: PhoneOtpLoginRequestDto): Promise<LoginResponseDto> {
    return this.loginUsecase.login<PhoneOtpLoginRequestDto>(LoginMethodEnum.PhoneOtp, data)
  }

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_GOOGLE)
  async loginWithGoogle(@Payload() data: GoogleLoginRequestDto): Promise<LoginResponseDto> {
    return this.loginUsecase.login<GoogleLoginRequestDto>(LoginMethodEnum.Google, data)
  }

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_WECHAT)
  async loginWithWechat(@Payload() data: WechatLoginRequestDto): Promise<LoginResponseDto> {
    return this.loginUsecase.login<WechatLoginRequestDto>(LoginMethodEnum.Wechat, data)
  }
}
