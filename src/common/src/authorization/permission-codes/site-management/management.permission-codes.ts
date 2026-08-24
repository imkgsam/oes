import type { PermissionDefinitionGroup } from '../types'

export const SITE_MANAGEMENT_PERMISSION_CODES = {
  READ: 'site.management.read',
  MANAGE: 'site.management.manage',
  LOCALE_MANAGE: 'site.management.locale.manage',
  PRODUCT_MANAGE: 'site.management.product.manage',
  CONTENT_MANAGE: 'site.management.content.manage',
  SYNC: 'site.management.sync',
  CREDENTIAL_MANAGE: 'site.management.credential.manage',
  AUDIT_READ: 'site.management.audit.read',
  PREVIEW: 'site.management.preview'
} as const

export const SITE_MANAGEMENT_PERMISSION_DEFINITIONS = {
  ownerService: 'site-service',
  permissions: {
    [SITE_MANAGEMENT_PERMISSION_CODES.READ]: {
      description: '查看站点治理工作台、站点卡片与运行状态',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE]: {
      description: '创建、更新或禁用站点配置',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SITE_MANAGEMENT_PERMISSION_CODES.LOCALE_MANAGE]: {
      description: '维护站点语言生命周期',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SITE_MANAGEMENT_PERMISSION_CODES.PRODUCT_MANAGE]: {
      description: '维护站点产品发布配置',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE]: {
      description: '维护站点 Blog / News 内容',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SITE_MANAGEMENT_PERMISSION_CODES.SYNC]: {
      description: '执行站点 public view 同步和 webhook 重投递',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SITE_MANAGEMENT_PERMISSION_CODES.CREDENTIAL_MANAGE]: {
      description: '生成、轮换或吊销站点 runtime credential',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SITE_MANAGEMENT_PERMISSION_CODES.AUDIT_READ]: {
      description: '查看站点治理审计日志',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SITE_MANAGEMENT_PERMISSION_CODES.PREVIEW]: {
      description: '签发站点草稿预览 token',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
