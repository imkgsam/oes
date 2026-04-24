import { GetAccountByIdHandler } from './get-account-by-id.handler'
import { GetAccountDeletionImpactHandler } from './get-account-deletion-impact.handler'
import { GetAccountsByUserIdHandler } from './get-accounts-by-user-id.handler'
import { ListAccountsHandler } from './list-accounts.handler'

export * from './get-account-by-id.query'
export * from './get-account-deletion-impact.query'
export * from './get-accounts-by-user-id.query'
export * from './list-accounts.query'
export * from './account-query.result'

export const AccountQueryHandlers = [
  GetAccountByIdHandler,
  GetAccountDeletionImpactHandler,
  GetAccountsByUserIdHandler,
  ListAccountsHandler
]
