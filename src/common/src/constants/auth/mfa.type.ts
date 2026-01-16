export enum MfaType {
  // 时间动态密码，典型 MFA 方式
  TOTP = 'TOTP',
  // 邮箱验证码，作为第二因素
  EMAIL_OTP = 'EMAIL_OTP',
  // 短信验证码
  SMS_OTP = 'SMS_OTP',
  // 备用码
  BACKUP_CODE = 'BACKUP_CODE',
  // 推送通知
  PUSH_NOTIFICATION = 'PUSH_NOTIFICATION',
  // 硬件令牌
  HARDWARE_TOKEN = 'HARDWARE_TOKEN',
  // 生物识别
  BIOMETRIC = 'BIOMETRIC'
}
