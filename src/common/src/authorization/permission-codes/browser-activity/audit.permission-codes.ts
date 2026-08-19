import type { PermissionDefinitionGroup } from '../types'

export const BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES = {
  POLICY_READ: 'browser_activity.policy.read',
  POLICY_MANAGE: 'browser_activity.policy.manage',
  OVERVIEW_READ: 'browser_activity.overview.read',
  EMPLOYEE_DETAIL_READ: 'browser_activity.employee_detail.read',
  URL_DETAIL_READ: 'browser_activity.url_detail.read'
} as const

export const BROWSER_ACTIVITY_AUDIT_PERMISSION_DEFINITIONS = {
  ownerService: 'browser-activity-service',
  permissions: {
    [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.POLICY_READ]: {
      description: '查看租户浏览器访问审计策略',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.POLICY_MANAGE]: {
      description: '维护租户浏览器访问审计开关与保留周期',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.OVERVIEW_READ]: {
      description: '查看租户浏览器访问审计概览与员工活跃浏览排名',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.EMPLOYEE_DETAIL_READ]: {
      description: '查看员工浏览器访问时间线与访问事实明细',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.URL_DETAIL_READ]: {
      description: '查询浏览器访问审计 URL 与 domain 明细',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
