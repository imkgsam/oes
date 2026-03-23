import { GetAccountByIdHandler } from './get-account-by-id.handler'
import { GetAccountsByUserIdHandler } from './get-accounts-by-user-id.handler'

export * from './get-account-by-id.query'
export * from './get-accounts-by-user-id.query'

export const AccountQueryHandlers = [GetAccountByIdHandler, GetAccountsByUserIdHandler]
