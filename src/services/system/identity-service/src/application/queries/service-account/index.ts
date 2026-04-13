import { GetApiKeyByIdHandler } from './get-api-key-by-id.handler'
import { GetServiceAccountByIdHandler } from './get-service-account-by-id.handler'
import { ListApiKeysByServiceAccountIdHandler } from './list-api-keys-by-service-account-id.handler'
import { ListServiceAccountsHandler } from './list-service-accounts.handler'

export * from './get-api-key-by-id.query'
export * from './get-service-account-by-id.query'
export * from './list-api-keys-by-service-account-id.query'
export * from './list-service-accounts.query'
export * from './service-account-query.result'

export const ServiceAccountQueryHandlers = [
  GetApiKeyByIdHandler,
  GetServiceAccountByIdHandler,
  ListApiKeysByServiceAccountIdHandler,
  ListServiceAccountsHandler
]
