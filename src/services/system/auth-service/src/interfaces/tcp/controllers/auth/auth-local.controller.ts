import { Body, Controller, Post } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { EmailOtpLoginDto, EmailPasswordLoginDto, GoogleLoginDto, PhoneOtpLoginDto, WechatLoginDto } from "src/application/dtos/login.dto";
import { AuthService } from "src/application/services/auth-service";
import { LoginMethodEnum } from "src/domain/constants/login-method.enum";

@Controller('auth')
export class TcpAuthController {
  constructor(private readonly authService: AuthService) { }

  @MessagePattern('email_password_login')
  async loginWithEmailPassword(@Body() dto: EmailPasswordLoginDto) {
    console.log('in auth-service, tcp, loginWithEmailPassword')
    return this.authService.login(LoginMethodEnum.EmailPassword, dto)
  }

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