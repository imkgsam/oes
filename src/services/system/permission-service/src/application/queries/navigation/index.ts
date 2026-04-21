import { GetNavigationEntryHandler } from './get-navigation-entry.handler'
import { GetRoleNavigationHandler } from './get-role-navigation.handler'
import { ListNavigationEntriesHandler } from './list-navigation-entries.handler'
import { ResolveNavigationPreviewHandler } from './resolve-navigation-preview.handler'

export * from './get-navigation-entry.query'
export * from './get-role-navigation.query'
export * from './list-navigation-entries.query'
export * from './navigation-query.result'
export * from './resolve-navigation-preview.query'

export const NavigationQueryHandlers = [
  ListNavigationEntriesHandler,
  GetNavigationEntryHandler,
  GetRoleNavigationHandler,
  ResolveNavigationPreviewHandler
]
