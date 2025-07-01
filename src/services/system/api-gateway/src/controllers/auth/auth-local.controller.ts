import { Body, Controller, Post } from "@nestjs/common";
import { AuthClient } from "src/clients/auth.client";
import { EmailPasswordLoginDto, GoogleLoginDto, EmailOtpLoginDto, PhoneOtpLoginDto, WechatLoginDto } from "src/dtos/login.dto";

@Controller('auth')
export class AuthController {
  constructor(private readonly authClient: AuthClient) { }

  @Post('login/email-password')
  async loginWithEmailPassword(@Body() dto: EmailPasswordLoginDto) {
    console.log('in api-gateway, http, loginWithEmailPassword')
    const result = await this.authClient.send('email_password_login', dto)
    console.log(result)
    return result
  }

  @Post('login/google')
  async loginWithGoogle(@Body() dto: GoogleLoginDto) {
  }

  @Post('login/email-otp')
  async loginWithEmailOtp(@Body() dto: EmailOtpLoginDto) {
  }

  @Post('login/phone-otp')
  async loginWithPhoneOtp(@Body() dto: PhoneOtpLoginDto) {
  }

  @Post('login/wechat')
  async loginWithWechat(@Body() dto: WechatLoginDto) {
  }

}