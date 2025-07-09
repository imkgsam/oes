import { Body, Controller, Post } from "@nestjs/common";
import { EmailOtpLoginDto, EmailPasswordLoginDto, GoogleLoginDto, PhoneOtpLoginDto, WechatLoginDto } from "../../../../application/dtos/login.dto";
import { AuthService } from "../../../../application/services/auth-service";
import { LoginMethodEnum } from "../../../../domain/constants/login-method.enum";

@Controller('auth')
export class HttpAuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login/email-password')
  async loginWithEmailPassword(@Body() dto: EmailPasswordLoginDto) {
    return this.authService.login(LoginMethodEnum.EmailPassword, dto)
  }

  @Post('login/google')
  async loginWithGoogle(@Body() dto: GoogleLoginDto) {
    return this.authService.login(LoginMethodEnum.Google, dto)
  }

  @Post('login/email-otp')
  async loginWithEmailOtp(@Body() dto: EmailOtpLoginDto) {
    return this.authService.login(LoginMethodEnum.EmailOtp, dto)
  }

  @Post('login/phone-otp')
  async loginWithPhoneOtp(@Body() dto: PhoneOtpLoginDto) {
    return this.authService.login(LoginMethodEnum.PhoneOtp, dto)
  }

  @Post('login/wechat')
  async loginWithWechat(@Body() dto: WechatLoginDto) {
    return this.authService.login(LoginMethodEnum.Wechat, dto)
  }

}