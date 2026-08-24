import type { PermissionDefinitionGroup } from '../types'

export const NOTIFICATION_INTERNAL_PERMISSION_CODES = {
  AUTH_DISPATCH: 'notification.internal.auth.dispatch'
} as const

export const NOTIFICATION_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'notification-service',
  permissions: {
    [NOTIFICATION_INTERNAL_PERMISSION_CODES.AUTH_DISPATCH]: {
      description: '受理 Auth 的 SYSTEM 认证通知投递命令',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
