export * from './auth'
export * from './enums/service.symbols'
export * from './errors/system.errors'
export * from './modules/identity-service.const'
export * from './permissions/permissions'
export * from './permissions/roles'
export * from '../security/constants'

import { DATABASE_CONNECTION_FAILED } from '../core/exceptions/exception-enums/infrastructure-exception.enum'

export const GLOBAL_SYSTEM_ERRORS = {
  DATABASE_CONNECTION_FAILED
} as const
