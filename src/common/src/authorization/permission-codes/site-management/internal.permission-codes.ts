import type { PermissionDefinitionGroup } from '../types'

export const SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES = {
  RUNTIME_CAPABILITY_REGISTER: 'site.internal.runtime.capability.register',
  RUNTIME_PUBLICATION_READ: 'site.internal.runtime.publication.read',
  RUNTIME_SYNC_REPORT: 'site.internal.runtime.sync.report',
  RUNTIME_PREVIEW_READ: 'site.internal.runtime.preview.read'
} as const

export const SITE_MANAGEMENT_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'site-service',
  permissions: {
    [SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES.RUNTIME_CAPABILITY_REGISTER]: {
      description: '注册 Site Runtime 页面能力',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES.RUNTIME_PUBLICATION_READ]: {
      description: '读取 Site Runtime 已发布视图',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES.RUNTIME_SYNC_REPORT]: {
      description: '上报 Site Runtime 同步结果',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES.RUNTIME_PREVIEW_READ]: {
      description: '读取 Site Runtime 预览视图',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
