import { GetAccountAccessSummaryHandler } from './get-account-access-summary.handler'
import { ResolveAccountNavigationHandler } from './resolve-account-navigation.handler'

export * from './get-account-access-summary.handler'
export * from './get-account-access-summary.query'
export * from './resolve-account-navigation.handler'
export * from './resolve-account-navigation.query'

// Collects access-summary query handlers for module registration.
export const AccessSummaryQueryHandlers = [GetAccountAccessSummaryHandler, ResolveAccountNavigationHandler]
