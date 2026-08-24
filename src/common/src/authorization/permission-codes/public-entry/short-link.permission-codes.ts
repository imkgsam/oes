import type { PermissionDefinitionGroup } from '../types'

export const PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES = {
  READ: 'public-entry.short-link.read',
  CREATE: 'public-entry.short-link.create',
  UPDATE: 'public-entry.short-link.update',
  DISABLE: 'public-entry.short-link.disable',
  ARCHIVE: 'public-entry.short-link.archive',
  STATS_READ: 'public-entry.short-link.stats.read'
} as const

export const PUBLIC_ENTRY_SHORT_LINK_PERMISSION_DEFINITIONS = {
  ownerService: 'public-entry-service',
  permissions: {
    [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.READ]: {
      description: '查看 ShortLink 公开入口',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.CREATE]: {
      description: '创建 ShortLink 公开入口',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.UPDATE]: {
      description: '更新 ShortLink 公开入口',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.DISABLE]: {
      description: '禁用 ShortLink 公开入口',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.ARCHIVE]: {
      description: '归档 ShortLink 公开入口',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.STATS_READ]: {
      description: '查看 ShortLink 访问摘要',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
