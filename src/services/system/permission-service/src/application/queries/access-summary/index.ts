import { GetAccountAccessSummaryHandler } from './get-account-access-summary.handler'

export * from './get-account-access-summary.handler'
export * from './get-account-access-summary.query'

// Collects access-summary query handlers for module registration.
export const AccessSummaryQueryHandlers = [GetAccountAccessSummaryHandler]
