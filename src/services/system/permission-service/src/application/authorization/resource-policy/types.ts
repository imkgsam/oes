export type PolicyTemplateCategory = 'RESOURCE' | 'QUERY_SCOPE' | 'SECURITY'

export type PolicyTemplateEffectSupport = 'ALLOW_ONLY' | 'DENY_ONLY' | 'ALLOW_AND_DENY'

export type SubjectSelectorType = 'ACCOUNT' | 'ROLE' | 'TENANT_WIDE'

export type PolicyInstanceEffect = 'ALLOW' | 'DENY'

export type PolicyLayer = 'TENANT_WIDE' | 'ROLE' | 'ACCOUNT'

export type QueryScopeOperator = 'EQ' | 'IN' | 'INTERSECTS'

export interface PolicyTemplateDefinition {
  code: string
  category: PolicyTemplateCategory
  effectSupport: PolicyTemplateEffectSupport
  supportedSubjectSelectors: SubjectSelectorType[]
  resourceFieldParamsSchema?: Record<string, unknown>
  environmentParamsSchema?: Record<string, unknown>
  queryScopeCapable: boolean
  checkResourceCapable: boolean
  description: string
  version: string
  experimental?: boolean
}

export interface SubjectSelector {
  type: SubjectSelectorType
  accountId?: string
  roleId?: string
}

export interface PolicyInstance {
  id: string
  tenantId: string
  subjectSelector: SubjectSelector
  permissionCode: string
  resourceType?: string
  templateCode: string
  effect: PolicyInstanceEffect
  params: Record<string, unknown>
  enabled: boolean
  priority: number
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export interface AuthorizationSubjectFacts {
  accountId: string
  tenantId: string
  roleIds: string[]
  roleCodes?: string[]
  orgIds?: string[]
  visibleOrgIds?: string[]
  [key: string]: unknown
}

export interface ResourceFacts {
  tenantId: string
  resourceType: string
  resourceId?: string
  ownerAccountId?: string
  responsibleBuyerAccountId?: string
  managerAccountId?: string
  orgId?: string
  categoryId?: string
  customerId?: string
  supplierId?: string
  factoryId?: string
  plantId?: string
  workshopId?: string
  workCenterId?: string
  productionLineId?: string
  warehouseId?: string
  storageLocationId?: string
  attributes?: Record<string, unknown>
  [key: string]: unknown
}

export interface EnvironmentFacts {
  clientIp?: string
  requestTime?: string
  timezone?: string
  terminal?: string
  [key: string]: unknown
}

export interface CheckResourceRequest {
  subject: AuthorizationSubjectFacts
  permissionCode: string
  resource: ResourceFacts
  environment?: EnvironmentFacts
}

export interface CheckResourceResult {
  allowed: boolean
  reasonCode?: string
  matchedPolicyIds?: string[]
  deniedPolicyIds?: string[]
  trace?: PolicyDecisionTrace
}

export interface BuildQueryScopeRequest {
  subject: AuthorizationSubjectFacts
  permissionCode: string
  resourceType: string
  environment?: EnvironmentFacts
}

export interface BuildQueryScopeResult {
  allowed: boolean
  scope?: QueryScopeExpression
  reasonCode?: string
  matchedPolicyIds?: string[]
  deniedPolicyIds?: string[]
  trace?: PolicyDecisionTrace
}

export interface QueryScopeExpression {
  and?: QueryScopeExpression[]
  or?: QueryScopeExpression[]
  field?: string
  op?: QueryScopeOperator
  value?: string | string[]
}

export interface PolicyDecisionTrace {
  evaluatedPolicyIds: string[]
  matchedAllowPolicyIds: string[]
  matchedDenyPolicyIds: string[]
  skippedPolicyIds?: string[]
  reasonCode: string
}

export interface PolicyInstanceReader {
  listEnabledPolicyInstances(
    request: CheckResourceRequest | BuildQueryScopeRequest
  ): Promise<PolicyInstance[]> | PolicyInstance[]
}
