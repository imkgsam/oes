import type { PermissionDefinitionGroup } from '../types'

export const COLLABORATION_INTERNAL_PERMISSION_CODES = {
  AI_ACTION_RESOLVE: 'collaboration.internal.ai_action.resolve'
} as const

export const COLLABORATION_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'collaboration-service',
  permissions: {
    [COLLABORATION_INTERNAL_PERMISSION_CODES.AI_ACTION_RESOLVE]: {
      description: '解析 Auth ActionGrant 所需的 Collaboration owner action 事实',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
