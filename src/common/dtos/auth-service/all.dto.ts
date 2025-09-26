import { IsEmail, Length, IsPhoneNumber, IsNotEmpty } from 'class-validator'
import { MfaType } from '../../constants/const/auth-service.const'

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

export type LoginResponseDto =
  | LoginResponseDto_MFA_notRequired
  | LoginResponseDto_MFA_required
  | LoginResponseDto_MultipleAccounts
class LoginResponseDto_MFA_notRequired {
  mfaRequired: boolean = false
  accessToken: string
  refreshToken: string
  userId: string
  accountId: string
  tenantId: string
}

class LoginResponseDto_MFA_required {
  userId: string
  mfaRequired: boolean = true
  challengeId: string
  mfaType: MfaType
}

interface LoginResponseDto_MultipleAccounts {
  multipleAccounts: true // discriminant
  userId: string
  accounts: Array<{
    accountId: string
    tenantId: string
    displayName?: string // 账号显示名,用于用于区分不同账号
  }>
}
