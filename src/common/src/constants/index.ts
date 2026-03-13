export * from './auth'
export * from './enums/service.symbols'
export * from './errors/system.errors'
export * from './messages/audit.message'
export * from './messages/auth.message'
export * from './messages/entity.message'
export * from './messages/erp.message'
export * from './messages/identity.message'
export * from './messages/mes.message'
export * from './messages/notification.message'
export * from './messages/permission.message'
export * from './messages/resource-service.messages'
export * from './modules/identity-service.const'
export * from './permissions/permissions'
export * from './permissions/roles'

import { DATABASE_CONNECTION_FAILED } from '../core/exceptions/exception-enums/infrastructure-exception.enum'

export const GLOBAL_SYSTEM_ERRORS = {
  DATABASE_CONNECTION_FAILED
} as const
