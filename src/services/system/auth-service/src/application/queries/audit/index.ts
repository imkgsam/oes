import { ListAuditEventsHandler } from './list-audit-events.handler'
import { ListLoginHistoryHandler } from './list-login-history.handler'

export * from './audit-query.result'
export * from './login-history-query.result'
export * from './list-audit-events.query'
export * from './list-audit-events.handler'
export * from './list-login-history.query'
export * from './list-login-history.handler'

export const AuditQueryHandlers = [ListAuditEventsHandler, ListLoginHistoryHandler]
