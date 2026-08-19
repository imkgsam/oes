import type { PermissionDefinitionGroup } from '../types'

export const IDENTITY_ACCOUNT_SELF_PERMISSION_CODES = {
  READ: 'identity.account.self.read',
  UPDATE_PROFILE: 'identity.account.self.update_profile'
} as const

export const IDENTITY_ACCOUNT_SELF_PERMISSION_DEFINITIONS = {
  ownerService: 'identity-service',
  permissions: {
    [IDENTITY_ACCOUNT_SELF_PERMISSION_CODES.READ]: {
      description: '查看自己的账号资料',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
