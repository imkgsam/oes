import { CreateServiceAccountHandler } from './create-service-account.handler'
import { SetServiceAccountEnabledHandler } from './set-service-account-enabled.handler'

export * from './create-service-account.command'
export * from './set-service-account-enabled.command'

export const ServiceAccountCommandHandlers = [
  CreateServiceAccountHandler,
  SetServiceAccountEnabledHandler
]
