import { LoginWithEmailPasswordHandler } from './login-with-email-password.handler'
import { LoginWithEmailOtpHandler } from './login-with-email-otp.handler'
import { LoginWithPhoneOtpHandler } from './login-with-phone-otp.handler'
import { LoginWithPhonePasswordHandler } from './login-with-phone-password.handler'
import { RefreshSessionHandler } from './refresh-session.handler'
import { RequestEmailOtpLoginChallengeHandler } from './request-email-otp-login-challenge.handler'
import { RequestPhoneOtpLoginChallengeHandler } from './request-phone-otp-login-challenge.handler'
import { SelectAccountHandler } from './select-account.handler'
import { SubmitMfaChallengeHandler } from './submit-mfa-challenge.handler'

export * from './login-with-email-password.command'
export * from './login-with-email-password.handler'
export * from './login-with-email-otp.command'
export * from './login-with-email-otp.handler'
export * from './login-with-phone-otp.command'
export * from './login-with-phone-otp.handler'
export * from './login-with-phone-password.command'
export * from './login-with-phone-password.handler'
export * from './refresh-session.command'
export * from './refresh-session.handler'
export * from './request-email-otp-login-challenge.command'
export * from './request-email-otp-login-challenge.handler'
export * from './request-phone-otp-login-challenge.command'
export * from './request-phone-otp-login-challenge.handler'
export * from './select-account.command'
export * from './select-account.handler'
export * from './submit-mfa-challenge.command'
export * from './submit-mfa-challenge.handler'

export const AuthCommandHandlers = [
  LoginWithEmailPasswordHandler,
  LoginWithEmailOtpHandler,
  LoginWithPhoneOtpHandler,
  LoginWithPhonePasswordHandler,
  RefreshSessionHandler,
  RequestEmailOtpLoginChallengeHandler,
  RequestPhoneOtpLoginChallengeHandler,
  SelectAccountHandler,
  SubmitMfaChallengeHandler
]
