import { IsEmail, Length, IsPhoneNumber, IsNotEmpty } from 'class-validator';

//邮箱密码登录
export class EmailPasswordLoginDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @Length(6, 30)
  readonly password: string;
}

//邮箱验证码登录
export class EmailOtpLoginDto {
  @IsEmail()
  readonly email: string
  @Length(6)
  readonly otp: string
}

//手机验证码登录
export class PhoneOtpLoginDto {
  @IsPhoneNumber()
  readonly phone: string;
  @Length(6)
  readonly otp: string;
}

//微信扫码登录
export class WechatLoginDto {
  readonly code: string;
}

//google登录
export class GoogleLoginDto {
  readonly idToken: string;
}