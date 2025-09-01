import { Body, Controller, Post } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import {
  EmailOtpLoginDto,
  EmailPasswordLoginDto,
  GoogleLoginDto,
  PhoneOtpLoginDto,
  WechatLoginDto
} from '@oes/common/dtos/auth-service/api/rpc/all.dto'
import { LoginMethodEnum } from '@oes/common/constants/enums/auth-relative.enums'
import { IAuthServiceRpcAuthPort } from '@oes/common/interfaces/services/auth-service.interface'

@Controller('auth')
export class TcpAuthController implements IAuthServiceRpcAuthPort {
  // @MessagePattern('email_password_login')
  // async loginWithEmailPassword(@Body() dto: EmailPasswordLoginDto) {
  //   console.log('in auth-service, tcp, loginWithEmailPassword')
  // }
  // @Post('login/google')
  // async loginWithGoogle(@Body() dto: GoogleLoginDto) {
  //   return this.authService.login(LoginMethodEnum.Google, dto)
  // }
  // @Post('login/email-otp')
  // async loginWithEmailOtp(@Body() dto: EmailOtpLoginDto) {
  //   return this.authService.login(LoginMethodEnum.EmailOtp, dto)
  // }
  // @Post('login/phone-otp')
  // async loginWithPhoneOtp(@Body() dto: PhoneOtpLoginDto) {
  //   return this.authService.login(LoginMethodEnum.PhoneOtp, dto)
  // }
  // @Post('login/wechat')
  // async loginWithWechat(@Body() dto: WechatLoginDto) {
  //   return this.authService.login(LoginMethodEnum.Wechat, dto)
  // }
}
