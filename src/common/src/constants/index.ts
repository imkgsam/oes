export * from '../auth'
export * from './http'
export * from './identity'
export * from './permissions/permissions'
export * from './permissions/roles'
export * from './services'
export * from './system'
export * from '../authorization/constants'

import { DATABASE_CONNECTION_FAILED } from '../core/exceptions/exception-enums/infrastructure-exception.enum'

export const GLOBAL_SYSTEM_ERRORS = {
  DATABASE_CONNECTION_FAILED
} as const
