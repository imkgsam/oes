import { IsEmail, Length, IsPhoneNumber, IsNotEmpty } from 'class-validator'
import { MfaType } from '../../../../constants/const/auth-service.const'

// ============================== 登录 LOGIN ==============================

//邮箱密码登录
export class EmailPasswordLoginRequestDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string
  @IsNotEmpty()
  @Length(6, 30)
  readonly password: string
}

//邮箱验证码登录
export class EmailOtpLoginRequestDto {
  @IsEmail()
  readonly email: string
  @Length(6)
  readonly otp: string
}

//手机验证码登录
export class PhoneOtpLoginRequestDto {
  @IsPhoneNumber()
  readonly phone: string
  @Length(6)
  readonly otp: string
}

//手机密码登录
export class PhonePasswordLoginRequestDto {
  @IsPhoneNumber()
  readonly phone: string
  @IsNotEmpty()
  @Length(6, 30)
  readonly password: string
}

//微信扫码登录
export class WechatLoginRequestDto {
  readonly code: string
}

//google登录
export class GoogleLoginRequestDto {
  readonly token: string
}

export class LoginResponseDto {
  // 以下字段仅在 SUCCESS 时有值
  userId: string
  accessToken?: string
  refreshToken?: string
  // user?: {
  //   id: string
  //   name: string
  //   email?: string
  //   phone?: string
  //   tenantId: string
  // }
  roles?: {
    id: string
    name: string
    code: string
    permissions: string[]
  }[]

  // 以下字段仅在 MFA_REQUIRED 时有值
  mfa?: {
    ticket: string // 👈 MFA 的临时票据，后续验证用
    methods: MfaType[] // 👈 可用的 MFA 类型（如 ["TOTP", "EMAIL_OTP"]）
    preferredMethod?: MfaType // 👈 建议的验证方式（如有）
  }
}
