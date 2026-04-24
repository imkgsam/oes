export const REPO = {
  AUDIT_EVENT: Symbol('AuthAuditRepository'),
  SESSION: Symbol('SessionRepository'),
  MFA_BINDING: Symbol('MfaBindingRepository'),
  OTP: Symbol('OtpRepository'),
  OTP_SEND_THROTTLE: Symbol('OtpSendThrottleRepository'),
  LOGIN_METHOD: Symbol('LoginMethodRepository'),
  PLATFORM_MFA_POLICY: Symbol('PlatformMfaPolicyRepository'),
  TENANT_MFA_POLICY: Symbol('TenantMfaPolicyRepository'),
  TRUSTED_DEVICE: Symbol('TrustedDeviceRepository'),
  PASSWORD_SETUP_REQUIREMENT: Symbol('PasswordSetupRequirementRepository'),
  PASSWORD_RECOVERY_GRANT: Symbol('PasswordRecoveryGrantRepository'),
  LOGIN_RISK: Symbol('LoginRiskRepository')
}
