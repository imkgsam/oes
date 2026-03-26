import { GetServiceAccountByIdHandler } from './get-service-account-by-id.handler'
import { ListServiceAccountsHandler } from './list-service-accounts.handler'

export * from './get-service-account-by-id.query'
export * from './list-service-accounts.query'

export const ServiceAccountQueryHandlers = [
  GetServiceAccountByIdHandler,
  ListServiceAccountsHandler
]
