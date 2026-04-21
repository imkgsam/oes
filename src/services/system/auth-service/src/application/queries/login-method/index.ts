import { InspectPasswordRecoveryChannelsHandler } from './inspect-password-recovery-channels.handler'
import { ListLoginMethodsHandler } from './list-login-methods.handler'

export * from './login-method-query.result'
export * from './inspect-password-recovery-channels.handler'
export * from './inspect-password-recovery-channels.query'
export * from './list-login-methods.handler'
export * from './list-login-methods.query'

export const LoginMethodQueryHandlers = [
  InspectPasswordRecoveryChannelsHandler,
  ListLoginMethodsHandler
]
