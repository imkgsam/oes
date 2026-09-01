import type { PermissionDefinitionGroup } from '../types'

export const PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES = {
  READ: 'public-entry.business-card.read',
  MANAGE: 'public-entry.business-card.manage',
  ENABLE: 'public-entry.business-card.enable',
  DISABLE: 'public-entry.business-card.disable',
  PUBLIC_ENTRY_MANAGE: 'public-entry.business-card.public-entry.manage',
  STATS_READ: 'public-entry.business-card.stats.read'
} as const

export const PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_DEFINITIONS = {
  ownerService: 'public-entry-service',
  permissions: {
    [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.READ]: {
      description: '查看员工数字名片',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.MANAGE]: {
      description: '维护员工数字名片配置',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.ENABLE]: {
      description: '启用员工数字名片',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.DISABLE]: {
      description: '禁用员工数字名片',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.PUBLIC_ENTRY_MANAGE]: {
      description: '绑定或刷新员工数字名片主公开入口',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.STATS_READ]: {
      description: '查看员工数字名片访问摘要',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
