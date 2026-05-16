import { AdminDeleteAccountSessionsHandler } from './admin-delete-account-sessions.handler'
import { AdminRevokeSessionHandler } from './admin-revoke-session.handler'
import { ActivateTotpBindingHandler } from './activate-totp-binding.handler'
import { BootstrapUserLoginMethodsHandler } from './bootstrap-user-login-methods.handler'
import { ChangeOwnPasswordHandler } from './change-own-password.handler'
import { CompleteStepUpMfaChallengeHandler } from './complete-step-up-mfa-challenge.handler'
import { CompletePasswordRecoveryHandler } from './complete-password-recovery.handler'
import { CompleteFirstLoginPasswordSetupHandler } from './complete-first-login-password-setup.handler'
import { DisableMfaBindingHandler } from './disable-mfa-binding.handler'
import { EnableMfaBindingHandler } from './enable-mfa-binding.handler'
import { InitializeRecoveryCodesHandler } from './initialize-recovery-codes.handler'
import { InitializeTotpBindingHandler } from './initialize-totp-binding.handler'
import { HandleTerminalDeviceUnavailableHandler } from './handle-terminal-device-unavailable.handler'
import { LoginWithEmailPasswordHandler } from './login-with-email-password.handler'
import { LoginWithEmailOtpHandler } from './login-with-email-otp.handler'
import { LoginWithPhoneOtpHandler } from './login-with-phone-otp.handler'
import { LoginWithPhonePasswordHandler } from './login-with-phone-password.handler'
import { LogoutAllHandler } from './logout-all.handler'
import { LogoutSessionHandler } from './logout-session.handler'
import { LogoutOtherDevicesHandler } from './logout-other-devices.handler'
import { LogoutHandler } from './logout.handler'
import { RefreshSessionHandler } from './refresh-session.handler'
import { RegenerateRecoveryCodesHandler } from './regenerate-recovery-codes.handler'
import { RevokeOtherTrustedDevicesHandler } from './revoke-other-trusted-devices.handler'
import { RevokeTenantSessionsHandler } from './revoke-tenant-sessions.handler'
import { RevokeTrustedDeviceHandler } from './revoke-trusted-device.handler'
import { RequestPasswordRecoveryChallengeHandler } from './request-password-recovery-challenge.handler'
import { RequestLoginMfaFactorChallengeHandler } from './request-login-mfa-factor-challenge.handler'
import { RequestEmailBindingChallengeHandler } from './request-email-binding-challenge.handler'
import { RequestEmailOtpLoginChallengeHandler } from './request-email-otp-login-challenge.handler'
import { RequestPhoneBindingChallengeHandler } from './request-phone-binding-challenge.handler'
import { RequestPhoneOtpLoginChallengeHandler } from './request-phone-otp-login-challenge.handler'
import { SelectAccountHandler } from './select-account.handler'
import { SetLoginMethodEnabledHandler } from './set-login-method-enabled.handler'
import { StartStepUpMfaChallengeHandler } from './start-step-up-mfa-challenge.handler'
import { SubmitMfaChallengeHandler } from './submit-mfa-challenge.handler'
import { UpdateTenantMfaPolicyHandler } from './update-tenant-mfa-policy.handler'
import { UpdatePlatformMfaPolicyHandler } from './update-platform-mfa-policy.handler'
import { VerifyPasswordRecoveryChallengeHandler } from './verify-password-recovery-challenge.handler'
import { RequirePasswordSetupHandler } from './require-password-setup.handler'
import { VerifyEmailBindingHandler } from './verify-email-binding.handler'
import { VerifyPhoneBindingHandler } from './verify-phone-binding.handler'

export * from './admin-delete-account-sessions.command'
export * from './admin-delete-account-sessions.handler'
export * from './admin-revoke-session.command'
export * from './admin-revoke-session.handler'
export * from './activate-totp-binding.command'
export * from './activate-totp-binding.handler'
export * from './bootstrap-user-login-methods.command'
export * from './bootstrap-user-login-methods.handler'
export * from './change-own-password.command'
export * from './change-own-password.handler'
export * from './complete-step-up-mfa-challenge.command'
export * from './complete-step-up-mfa-challenge.handler'
export * from './complete-password-recovery.command'
export * from './complete-password-recovery.handler'
export * from './complete-first-login-password-setup.command'
export * from './complete-first-login-password-setup.handler'
export * from './disable-mfa-binding.command'
export * from './disable-mfa-binding.handler'
export * from './enable-mfa-binding.command'
export * from './enable-mfa-binding.handler'
export * from './initialize-recovery-codes.command'
export * from './initialize-recovery-codes.handler'
export * from './initialize-totp-binding.command'
export * from './initialize-totp-binding.handler'
export * from './handle-terminal-device-unavailable.command'
export * from './handle-terminal-device-unavailable.handler'
export * from './login-with-email-password.command'
export * from './login-with-email-password.handler'
export * from './login-with-email-otp.command'
export * from './login-with-email-otp.handler'
export * from './login-with-phone-otp.command'
export * from './login-with-phone-otp.handler'
export * from './login-with-phone-password.command'
export * from './login-with-phone-password.handler'
export * from './logout-all.command'
export * from './logout-all.handler'
export * from './logout-session.command'
export * from './logout-session.handler'
export * from './logout-other-devices.command'
export * from './logout-other-devices.handler'
export * from './logout.command'
export * from './logout.handler'
export * from './refresh-session.command'
export * from './refresh-session.handler'
export * from './regenerate-recovery-codes.command'
export * from './regenerate-recovery-codes.handler'
export * from './revoke-other-trusted-devices.command'
export * from './revoke-other-trusted-devices.handler'
export * from './revoke-tenant-sessions.command'
export * from './revoke-tenant-sessions.handler'
export * from './revoke-trusted-device.command'
export * from './revoke-trusted-device.handler'
export * from './request-password-recovery-challenge.command'
export * from './request-password-recovery-challenge.handler'
export * from './request-login-mfa-factor-challenge.command'
export * from './request-login-mfa-factor-challenge.handler'
export * from './request-email-binding-challenge.command'
export * from './request-email-binding-challenge.handler'
export * from './request-email-otp-login-challenge.command'
export * from './request-email-otp-login-challenge.handler'
export * from './request-phone-binding-challenge.command'
export * from './request-phone-binding-challenge.handler'
export * from './request-phone-otp-login-challenge.command'
export * from './request-phone-otp-login-challenge.handler'
export * from './require-password-setup.command'
export * from './require-password-setup.handler'
export * from './select-account.command'
export * from './select-account.handler'
export * from './set-login-method-enabled.command'
export * from './set-login-method-enabled.handler'
export * from './start-step-up-mfa-challenge.command'
export * from './start-step-up-mfa-challenge.handler'
export * from './submit-mfa-challenge.command'
export * from './submit-mfa-challenge.handler'
export * from './update-tenant-mfa-policy.command'
export * from './update-tenant-mfa-policy.handler'
export * from './update-platform-mfa-policy.command'
export * from './update-platform-mfa-policy.handler'
export * from './verify-password-recovery-challenge.command'
export * from './verify-password-recovery-challenge.handler'
export * from './verify-email-binding.command'
export * from './verify-email-binding.handler'
export * from './verify-phone-binding.command'
export * from './verify-phone-binding.handler'

export const AuthCommandHandlers = [
  AdminDeleteAccountSessionsHandler,
  AdminRevokeSessionHandler,
  ActivateTotpBindingHandler,
  BootstrapUserLoginMethodsHandler,
  ChangeOwnPasswordHandler,
  CompleteStepUpMfaChallengeHandler,
  CompletePasswordRecoveryHandler,
  CompleteFirstLoginPasswordSetupHandler,
  DisableMfaBindingHandler,
  EnableMfaBindingHandler,
  HandleTerminalDeviceUnavailableHandler,
  InitializeRecoveryCodesHandler,
  InitializeTotpBindingHandler,
  LoginWithEmailPasswordHandler,
  LoginWithEmailOtpHandler,
  LoginWithPhoneOtpHandler,
  LoginWithPhonePasswordHandler,
  LogoutAllHandler,
  LogoutSessionHandler,
  LogoutOtherDevicesHandler,
  LogoutHandler,
  RefreshSessionHandler,
  RegenerateRecoveryCodesHandler,
  RevokeOtherTrustedDevicesHandler,
  RevokeTenantSessionsHandler,
  RevokeTrustedDeviceHandler,
  RequestPasswordRecoveryChallengeHandler,
  RequestLoginMfaFactorChallengeHandler,
  RequestEmailBindingChallengeHandler,
  RequestEmailOtpLoginChallengeHandler,
  RequestPhoneBindingChallengeHandler,
  RequestPhoneOtpLoginChallengeHandler,
  RequirePasswordSetupHandler,
  SelectAccountHandler,
  SetLoginMethodEnabledHandler,
  StartStepUpMfaChallengeHandler,
  SubmitMfaChallengeHandler,
  UpdatePlatformMfaPolicyHandler,
  UpdateTenantMfaPolicyHandler,
  VerifyPasswordRecoveryChallengeHandler,
  VerifyEmailBindingHandler,
  VerifyPhoneBindingHandler
]
