import { requestClient } from '#/api/request';

export namespace PolicyInstancePreviewApi {
  export type PreviewMode = 'CHECK_RESOURCE' | 'QUERY_SCOPE';
  export type SubjectSelectorType = 'ACCOUNT' | 'ROLE' | 'TENANT_WIDE';
  export type Effect = 'ALLOW' | 'DENY';

  export interface SubjectFacts {
    accountId: string;
    orgIds?: string[];
    roleCodes?: string[];
    roleIds: string[];
    tenantId: string;
    visibleOrgIds?: string[];
  }

  export interface SubjectSelector {
    accountId?: string;
    roleId?: string;
    type: SubjectSelectorType;
  }

  export interface Params {
    allowedValues?: string[];
    field?: string;
    value?: string;
  }

  export interface PolicyInstanceCandidate {
    effect: Effect;
    enabled?: boolean;
    id: string;
    params: Params;
    permissionCode: string;
    priority?: number;
    resourceType: string;
    subjectSelector: SubjectSelector;
    templateCode: string;
    tenantId: string;
  }

  export interface ResourceFacts {
    categoryId?: string;
    factoryId?: string;
    resourceId?: string;
    resourceType?: string;
    tenantId?: string;
    warehouseId?: string;
    workCenterId?: string;
    workshopId?: string;
  }

  export interface EvaluatePreviewRequest {
    mode: PreviewMode;
    permissionCode: string;
    policyInstances: PolicyInstanceCandidate[];
    resource?: ResourceFacts;
    resourceType: string;
    subject: SubjectFacts;
  }

  export interface QueryScopeExpression {
    and?: QueryScopeExpression[];
    field?: string;
    op?: 'EQ' | 'IN' | 'INTERSECTS';
    or?: QueryScopeExpression[];
    value?: string | string[];
  }

  export interface EvaluatePreviewResult {
    allowed: boolean;
    deniedPolicyIds?: string[];
    matchedPolicyIds?: string[];
    reasonCode?: string;
    scope?: QueryScopeExpression;
  }
}

// Evaluates a preview-only PolicyInstance request through the Gateway contract.
export async function evaluatePolicyInstancePreviewApi(
  payload: PolicyInstancePreviewApi.EvaluatePreviewRequest,
) {
  return requestClient.post<PolicyInstancePreviewApi.EvaluatePreviewResult>(
    '/policy-instance/evaluate-preview',
    payload,
  );
}
