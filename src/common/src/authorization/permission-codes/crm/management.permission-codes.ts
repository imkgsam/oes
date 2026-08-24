import type { PermissionDefinitionGroup } from '../types'

export const CRM_MANAGEMENT_PERMISSION_CODES = {
  READ_CRM_ACCOUNT: 'crm.account.read',
  CREATE_CRM_ACCOUNT: 'crm.account.create',
  UPDATE_CRM_ACCOUNT: 'crm.account.update',
  CONVERT_CRM_ACCOUNT: 'crm.account.convert',
  CLAIM_CRM_ACCOUNT: 'crm.account.claim',
  RELEASE_CRM_ACCOUNT: 'crm.account.release',
  MANAGE_CRM_ACCOUNT: 'crm.account.manage',
  VIEW_RESTRICTED_DUPLICATE: 'crm.duplicate.viewRestricted',
  MANAGE_CRM_CONTACT: 'crm.contact.manage',
  MANAGE_CRM_SOURCE: 'crm.source.manage',
  CREATE_CRM_ACTIVITY: 'crm.activity.create',
  MANAGE_CRM_OPPORTUNITY: 'crm.opportunity.manage'
} as const

export const CRM_MANAGEMENT_PERMISSION_DEFINITIONS = {
  ownerService: 'crm-service',
  permissions: {
    [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT]: {
      description: '查看 CRM P1 客户关系账户',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT]: {
      description: '创建 CRM P1 Lead 客户关系账户',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT]: {
      description: '更新 CRM P1 客户关系账户',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [CRM_MANAGEMENT_PERMISSION_CODES.CONVERT_CRM_ACCOUNT]: {
      description: '将 CRM P1 Lead 转为 Prospect Customer',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [CRM_MANAGEMENT_PERMISSION_CODES.CLAIM_CRM_ACCOUNT]: {
      description: '认领 CRM P1 公海 Lead 或 Prospect Customer',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [CRM_MANAGEMENT_PERMISSION_CODES.RELEASE_CRM_ACCOUNT]: {
      description: '释放 CRM P1 Lead 或 Prospect Customer 回公海',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [CRM_MANAGEMENT_PERMISSION_CODES.MANAGE_CRM_ACCOUNT]: {
      description: '管理 CRM P1 客户资源与公海例外动作',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
