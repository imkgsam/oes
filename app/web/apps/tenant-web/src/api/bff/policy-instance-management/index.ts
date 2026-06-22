import { requestClient } from '#/api/request';

export namespace PolicyInstanceManagementApi {
  export type SubjectSelectorType = 'ACCOUNT' | 'ROLE' | 'TENANT_WIDE';
  export type Effect = 'ALLOW' | 'DENY';

  export interface SubjectSelector {
    accountId?: string;
    roleId?: string;
    type: SubjectSelectorType;
  }

  export interface Params {
    allowedValues?: string[];
    cidrs?: string[];
    field?: string;
    orgField?: string;
    ownerField?: string;
    resourceField?: string;
    subjectField?: string;
    timezone?: string;
    value?: string;
  }

  export interface PolicyInstance {
    createdAt?: string;
    createdBy?: string;
    effect: Effect;
    enabled: boolean;
    id: string;
    params: Params;
    permissionCode: string;
    priority: number;
    resourceType?: string;
    subjectSelector: SubjectSelector;
    templateCode: string;
    tenantId: string;
    updatedAt?: string;
    updatedBy?: string;
  }

  export interface ListPolicyInstancesQuery {
    enabled?: boolean;
    page?: number;
    pageSize?: number;
    permissionCode?: string;
    resourceType?: string;
    templateCode?: string;
    tenantId?: string;
  }

  export interface ListPolicyInstancesResult {
    page: number;
    pageSize: number;
    policyInstances: PolicyInstance[];
    total: number;
  }

  export interface CreatePolicyInstancePayload {
    effect: Effect;
    enabled?: boolean;
    params: Params;
    permissionCode: string;
    priority?: number;
    resourceType?: string;
    subjectSelector: SubjectSelector;
    templateCode: string;
    tenantId: string;
  }
}

// Lists persisted PolicyInstance governance rows through the Gateway management contract.
export async function listPolicyInstancesApi(
  params: PolicyInstanceManagementApi.ListPolicyInstancesQuery,
) {
  return requestClient.get<PolicyInstanceManagementApi.ListPolicyInstancesResult>(
    '/policy-instance',
    {
      params,
    },
  );
}

// Loads one persisted PolicyInstance governance row by stable id.
export async function getPolicyInstanceByIdApi(id: string) {
  return requestClient.get<PolicyInstanceManagementApi.PolicyInstance>(
    `/policy-instance/${encodeURIComponent(id)}`,
  );
}

// Creates one persisted PolicyInstance fact through the template-based Gateway contract.
export async function createPolicyInstanceApi(
  payload: PolicyInstanceManagementApi.CreatePolicyInstancePayload,
) {
  return requestClient.post<PolicyInstanceManagementApi.PolicyInstance>(
    '/policy-instance',
    payload,
  );
}

// Enables or disables one persisted PolicyInstance fact by stable id.
export async function setPolicyInstanceEnabledApi(id: string, enabled: boolean) {
  return requestClient.post<PolicyInstanceManagementApi.PolicyInstance>(
    `/policy-instance/${encodeURIComponent(id)}/enabled`,
    { enabled },
  );
}
