import { ResolveAccountTerminalAccessHandler } from './resolve-account-terminal-access.handler'
import { GetAccountTerminalAccessHandler } from './get-account-terminal-access.handler'
import { GetRoleTerminalAccessHandler } from './get-role-terminal-access.handler'

export * from './get-account-terminal-access.handler'
export * from './get-account-terminal-access.query'
export * from './get-role-terminal-access.handler'
export * from './get-role-terminal-access.query'
export * from './resolve-account-terminal-access.handler'
export * from './resolve-account-terminal-access.query'

// Collects terminal-access management query handlers that run inside PermissionModule.
export const TerminalAccessQueryHandlers = [
  GetRoleTerminalAccessHandler,
  GetAccountTerminalAccessHandler
]

// Collects terminal-access runtime query handlers that run inside AuthorizationModule.
export const TerminalAccessRuntimeQueryHandlers = [ResolveAccountTerminalAccessHandler]
