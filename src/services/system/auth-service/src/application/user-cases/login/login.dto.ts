import { MfaType } from '@oes/common/constants/enums/auth-service.enums'

export class LoginResultDto {
  // 以下字段仅在 SUCCESS 时有值
  accessToken?: string
  refreshToken?: string
  user?: {
    id: string
    name: string
    email: string
    tenantId: string
  }
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
