import { AdminListOnlineUsersHandler } from './admin-list-online-users.handler'
import { AdminListTerminalDeviceSessionsHandler } from './admin-list-terminal-device-sessions.handler'
import { AdminListUserSessionsHandler } from './admin-list-user-sessions.handler'
import { ListSessionsHandler } from './list-sessions.handler'
import { ValidateAccessTokenHandler } from './validate-access-token.handler'

export * from './admin-list-online-users.query'
export * from './admin-list-online-users.handler'
export * from './admin-list-terminal-device-sessions.query'
export * from './admin-list-terminal-device-sessions.handler'
export * from './admin-list-user-sessions.query'
export * from './admin-list-user-sessions.handler'
export * from './list-sessions.query'
export * from './list-sessions.handler'
export * from './validate-access-token.query'
export * from './validate-access-token.handler'

export const SessionQueryHandlers = [
  AdminListOnlineUsersHandler,
  AdminListTerminalDeviceSessionsHandler,
  AdminListUserSessionsHandler,
  ListSessionsHandler,
  ValidateAccessTokenHandler
]
