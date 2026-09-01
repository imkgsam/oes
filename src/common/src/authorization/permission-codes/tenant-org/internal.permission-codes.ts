import type { PermissionDefinitionGroup } from '../types'

export const TENANT_ORG_INTERNAL_PERMISSION_CODES = {
  AUTH_SESSION_TENANT_LIFECYCLE_RESOLVE:
    'tenant_org.internal.auth_session_tenant_lifecycle.resolve',
  PUBLIC_BUSINESS_CARD_ORGANIZATION_RESOLVE:
    'tenant_org.internal.public_business_card_organization.resolve'
} as const

export const TENANT_ORG_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'tenant-org-service',
  permissions: {
    [TENANT_ORG_INTERNAL_PERMISSION_CODES.AUTH_SESSION_TENANT_LIFECYCLE_RESOLVE]: {
      description: '解析 Auth 登录与会话复核所需的租户生命周期事实',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [TENANT_ORG_INTERNAL_PERMISSION_CODES.PUBLIC_BUSINESS_CARD_ORGANIZATION_RESOLVE]: {
      description: '解析公开名片所需的租户与组织公开投影',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
