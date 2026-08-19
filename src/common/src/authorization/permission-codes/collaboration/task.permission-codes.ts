import type { PermissionDefinitionGroup } from '../types'

export const COLLABORATION_TASK_PERMISSION_CODES = {
  CREATE: 'collaboration.task.create',
  ASSIGN: 'collaboration.task.assign'
} as const

export const COLLABORATION_TASK_PERMISSION_DEFINITIONS = {
  ownerService: 'collaboration-service',
  permissions: {
    [COLLABORATION_TASK_PERMISSION_CODES.CREATE]: {
      description: '创建协作任务或个人待办',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [COLLABORATION_TASK_PERMISSION_CODES.ASSIGN]: {
      description: '指派协作任务给租户内其他账号',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
