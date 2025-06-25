import { IsEmail, MaxLength, MinLength, Length, IsPhone } from 'class-validator';


//邮箱密码登录
export class EmailPasswordLoginDto {
  @IsEmail()
  readonly email: string;

  @MinLength(6)
  @MaxLength(100)
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
  @IsPhone()
  readonly phone: string;
  @Length(6)
  readonly otp: string;
}
