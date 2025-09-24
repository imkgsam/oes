import { Controller, Post } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { LoginUsecase } from 'src/application/use-cases/login.usecase'
import { AUTH_MESSAGES } from '@oes/common/constants/messages/auth.message'
import {
  EmailPasswordLoginRequestDto,
  PhonePasswordLoginDto
} from '@oes/common/dtos/auth-service/api/rpc/all.dto'
import { LoginResultDto } from '@oes/common/dtos/auth-service/api/rpc/all.dto'
import { LoginMethodEnum } from '@oes/common/constants/const/auth-service.const'
@Controller()
export class TcpAuthController {
  constructor(private readonly loginUsecase: LoginUsecase) {}

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_EMAIL_PW)
  async loginWithEmailPassword(
    @Payload() data: EmailPasswordLoginRequestDto
  ): Promise<LoginResultDto> {
    return this.loginUsecase.login<EmailPasswordLoginRequestDto>(
      LoginMethodEnum.EmailPassword,
      data
    )
  }

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_PHONE_PW)
  async loginWithPhonePassword(@Payload() data: PhonePasswordLoginDto): Promise<LoginResultDto> {
    return this.loginUsecase.login<PhonePasswordLoginDto>(LoginMethodEnum.PhonePassword, data)
  }

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_EMAIL_OTP)
  async loginWithEmailOtp(@Payload() data: any): Promise<LoginResultDto> {
    return this.loginUsecase.login<any>(LoginMethodEnum.EmailOtp, data)
  }

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_PHONE_OTP)
  async loginWithPhoneOtp(@Payload() data: any): Promise<LoginResultDto> {
    return this.loginUsecase.login<any>(LoginMethodEnum.PhoneOtp, data)
  }

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_GOOGLE)
  async loginWithGoogle(@Payload() data: any): Promise<LoginResultDto> {
    return this.loginUsecase.login<any>(LoginMethodEnum.Google, data)
  }

  @MessagePattern(AUTH_MESSAGES.LOGIN_WITH_WECHAT)
  async loginWithWechat(@Payload() data: any): Promise<LoginResultDto> {
    return this.loginUsecase.login<any>(LoginMethodEnum.Wechat, data)
  }
}
