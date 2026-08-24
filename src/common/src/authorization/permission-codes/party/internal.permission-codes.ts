import type { PermissionDefinitionGroup } from '../types'

export const PARTY_INTERNAL_PERMISSION_CODES = {
  REGISTER_TENANT_PARTY: 'party.internal.register_tenant_party',
  DEACTIVATE_TENANT_PARTY: 'party.internal.deactivate_tenant_party',
  GET_TENANT_PARTY_BY_ID: 'party.internal.get_tenant_party_by_id',
  RESOLVE_TENANT_PARTY_BY_IDENTIFIER: 'party.internal.resolve_tenant_party_by_identifier',
  RESOLVE_TENANT_PARTY_FOR_CONSUMER: 'party.internal.resolve_tenant_party_for_consumer',
  SEARCH_TENANT_PARTY_CANDIDATES: 'party.internal.search_tenant_party_candidates'
} as const

export const PARTY_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'party-service',
  permissions: {
    [PARTY_INTERNAL_PERMISSION_CODES.REGISTER_TENANT_PARTY]: {
      description: '注册租户主体',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PARTY_INTERNAL_PERMISSION_CODES.DEACTIVATE_TENANT_PARTY]: {
      description: '停用租户主体',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PARTY_INTERNAL_PERMISSION_CODES.GET_TENANT_PARTY_BY_ID]: {
      description: '按 ID 查询租户主体',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PARTY_INTERNAL_PERMISSION_CODES.RESOLVE_TENANT_PARTY_BY_IDENTIFIER]: {
      description: '按标识解析租户主体',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PARTY_INTERNAL_PERMISSION_CODES.RESOLVE_TENANT_PARTY_FOR_CONSUMER]: {
      description: '解析消费者租户主体证据',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PARTY_INTERNAL_PERMISSION_CODES.SEARCH_TENANT_PARTY_CANDIDATES]: {
      description: '搜索租户主体候选',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
