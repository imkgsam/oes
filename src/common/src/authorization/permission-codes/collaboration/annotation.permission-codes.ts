import type { PermissionDefinitionGroup } from '../types'

export const COLLABORATION_ANNOTATION_PERMISSION_CODES = {
  CREATE: 'collaboration.annotation.create',
  MANAGE: 'collaboration.annotation.manage'
} as const

export const COLLABORATION_ANNOTATION_PERMISSION_DEFINITIONS = {
  ownerService: 'collaboration-service',
  permissions: {
    [COLLABORATION_ANNOTATION_PERMISSION_CODES.CREATE]: {
      description: '在支持的业务对象上创建协作备注',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [COLLABORATION_ANNOTATION_PERMISSION_CODES.MANAGE]: {
      description: '治理协作备注，包括置顶、取消置顶或删除他人备注',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
