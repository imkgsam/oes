import { DeleteAccountTerminalAccessOverrideHandler } from './delete-account-terminal-access-override.handler'
import { ReplaceAccountTerminalAccessOverrideHandler } from './replace-account-terminal-access-override.handler'
import { SetRoleTerminalAccessHandler } from './set-role-terminal-access.handler'

export * from './delete-account-terminal-access-override.command'
export * from './delete-account-terminal-access-override.handler'
export * from './replace-account-terminal-access-override.command'
export * from './replace-account-terminal-access-override.handler'
export * from './set-role-terminal-access.command'
export * from './set-role-terminal-access.handler'

// Collects terminal-access management command handlers for permission management registration.
export const TerminalAccessCommandHandlers = [
  SetRoleTerminalAccessHandler,
  ReplaceAccountTerminalAccessOverrideHandler,
  DeleteAccountTerminalAccessOverrideHandler
]
