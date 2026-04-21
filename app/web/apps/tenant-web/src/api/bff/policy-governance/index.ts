import { requestClient } from '#/api/request';

export namespace PolicyGovernanceApi {
  export interface Policy {
    conditionAstJson?: string;
    description?: string;
    effect: number | string;
    id: string;
    isEnabled: boolean;
    name: string;
    permissionCode?: string;
    priority?: number;
    resourceType?: string;
    subjectId?: string;
    subjectType: number | string;
    tenantId?: string;
  }

  export interface PolicyListQuery {
    isEnabled?: boolean;
    keyword?: string;
    page?: number;
    pageSize?: number;
    permissionCode?: string;
    tenantId?: string;
  }

  export interface PolicyListResult {
    page: number;
    pageSize: number;
    policies: Policy[];
    total: number;
  }

  export interface PermissionPolicyListQuery {
    tenantId?: string;
  }

  export interface PermissionPolicyListResult {
    policies: Policy[];
  }
}

// Lists readonly policy governance rows through the Gateway management contract.
export async function listPoliciesApi(
  params: PolicyGovernanceApi.PolicyListQuery,
) {
  return requestClient.get<PolicyGovernanceApi.PolicyListResult>('/policy', {
    params,
  });
}

// Loads one readonly policy governance row by stable id.
export async function getPolicyByIdApi(id: string) {
  return requestClient.get<PolicyGovernanceApi.Policy>(
    `/policy/${encodeURIComponent(id)}`,
  );
}

// Lists readonly policies linked to one permission code.
export async function listPermissionPoliciesApi(
  permissionCode: string,
  params?: PolicyGovernanceApi.PermissionPolicyListQuery,
) {
  return requestClient.get<PolicyGovernanceApi.PermissionPolicyListResult>(
    `/permission/${encodeURIComponent(permissionCode)}/policies`,
    {
      params,
    },
  );
}
