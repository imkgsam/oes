import { LoginWithEmailPasswordHandler } from './login-with-email-password.handler'
import { RefreshSessionHandler } from './refresh-session.handler'
import { SelectAccountHandler } from './select-account.handler'
import { SubmitMfaChallengeHandler } from './submit-mfa-challenge.handler'

export * from './login-with-email-password.command'
export * from './login-with-email-password.handler'
export * from './refresh-session.command'
export * from './refresh-session.handler'
export * from './select-account.command'
export * from './select-account.handler'
export * from './submit-mfa-challenge.command'
export * from './submit-mfa-challenge.handler'

export const AuthCommandHandlers = [
  LoginWithEmailPasswordHandler,
  RefreshSessionHandler,
  SelectAccountHandler,
  SubmitMfaChallengeHandler
]
