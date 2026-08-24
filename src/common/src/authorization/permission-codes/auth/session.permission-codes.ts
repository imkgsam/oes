import type { PermissionDefinitionGroup } from '../types'

export const AUTH_SESSION_PERMISSION_CODES = {
  ADMIN_VIEW_USER_SESSIONS: 'auth.session.admin.view',
  ADMIN_REVOKE_SESSION: 'auth.session.admin.revoke'
} as const

export const AUTH_SESSION_PERMISSION_DEFINITIONS = {
  ownerService: 'auth-service',
  permissions: {
    [AUTH_SESSION_PERMISSION_CODES.ADMIN_VIEW_USER_SESSIONS]: {
      description: '查看用户会话',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [AUTH_SESSION_PERMISSION_CODES.ADMIN_REVOKE_SESSION]: {
      description: '撤销用户会话',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
