import { requestClient } from '#/api/request';

export namespace TenantManagementApi {
  export interface TenantSummary {
    code: string;
    id: string;
    name: string;
    rootOrgId?: string;
    rootOrgName?: string;
    status: string;
  }

  export interface TenantListQuery {
    keyword?: string;
    page?: number;
    pageSize?: number;
    status?: 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
  }

  export interface TenantListResult {
    items: TenantSummary[];
    page: number;
    pageSize: number;
    total: number;
  }

  export interface TenantDetailResult {
    tenant: TenantSummary;
  }

  export interface CreateTenantPayload {
    code: string;
    name: string;
    rootOrgName?: string;
  }

  export interface UpdateTenantProfilePayload {
    code?: string;
    name?: string;
  }

  export interface UpdateTenantStatusPayload {
    reason?: string;
    status: 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
  }

  export interface ManagedOrgUnit {
    depth: number;
    id: string;
    name: string;
    organizationParty?: {
      canonicalName?: string;
      displayName?: string;
      id: string;
      status: string;
      type: string;
    } | null;
    organizationPartyId?: string | null;
    parentOrgId?: string;
    path: string;
    sortOrder: number;
    status: string;
    tenantId: string;
    type: string;
  }

  export interface ManagedOrgNode {
    children: ManagedOrgNode[];
    orgUnit: ManagedOrgUnit;
  }

  export interface ManagedOrgTreeResult {
    roots: ManagedOrgNode[];
    scope: 'SYSTEM' | 'TENANT';
    tenant?: {
      code: string;
      id: string;
      name: string;
      rootOrgId?: string;
      status: string;
    };
  }

  export interface ManagedOrgUnitDetailResult {
    orgUnit: ManagedOrgUnit;
  }

  export interface CreateManagedOrgUnitPayload {
    name: string;
    parentOrgId: string;
    sortOrder?: number;
    type: string;
  }

  export interface UpdateManagedOrgUnitPayload {
    name?: string;
    sortOrder?: number;
    type?: string;
  }
}

// Lists tenant summaries for the system-admin tenant management entry.
export async function listManagedTenantsApi(
  params: TenantManagementApi.TenantListQuery,
) {
  return requestClient.get<TenantManagementApi.TenantListResult>(
    '/tenant-management/tenants',
    {
      params,
    },
  );
}

// Loads one tenant detail snapshot for the tenant management drawer.
export async function getManagedTenantByIdApi(id: string) {
  return requestClient.get<TenantManagementApi.TenantDetailResult>(
    `/tenant-management/tenants/${encodeURIComponent(id)}`,
  );
}

// Creates one tenant with its root org display name.
export async function createManagedTenantApi(
  data: TenantManagementApi.CreateTenantPayload,
) {
  return requestClient.post<TenantManagementApi.TenantDetailResult>(
    '/tenant-management/tenants',
    data,
  );
}

// Updates mutable tenant profile metadata from the system-admin drawer.
export async function updateManagedTenantProfileApi(
  id: string,
  data: TenantManagementApi.UpdateTenantProfilePayload,
) {
  return requestClient.request<TenantManagementApi.TenantDetailResult>(
    `/tenant-management/tenants/${encodeURIComponent(id)}/profile`,
    {
      data,
      method: 'PATCH',
    },
  );
}

// Changes one tenant lifecycle status from the system-admin tenant list or drawer.
export async function updateManagedTenantStatusApi(
  id: string,
  data: TenantManagementApi.UpdateTenantStatusPayload,
) {
  return requestClient.request<TenantManagementApi.TenantDetailResult>(
    `/tenant-management/tenants/${encodeURIComponent(id)}/status`,
    {
      data,
      method: 'PATCH',
    },
  );
}

// Loads one tenant org tree for the shared org structure entry.
export async function getManagedOrgTreeApi(tenantId: string) {
  return requestClient.get<TenantManagementApi.ManagedOrgTreeResult>(
    `/tenant-management/tenants/${encodeURIComponent(tenantId)}/org-tree`,
  );
}

// Loads one org node detail snapshot for the shared org structure detail workspace.
export async function getManagedOrgUnitByIdApi(
  tenantId: string,
  orgUnitId: string,
) {
  return requestClient.get<TenantManagementApi.ManagedOrgUnitDetailResult>(
    `/tenant-management/tenants/${encodeURIComponent(tenantId)}/org-units/${encodeURIComponent(orgUnitId)}`,
  );
}

// Creates one org node under the selected parent node.
export async function createManagedOrgUnitApi(
  tenantId: string,
  data: TenantManagementApi.CreateManagedOrgUnitPayload,
) {
  return requestClient.post<TenantManagementApi.ManagedOrgUnitDetailResult>(
    `/tenant-management/tenants/${encodeURIComponent(tenantId)}/org-units`,
    data,
  );
}

// Updates one selected org node metadata.
export async function updateManagedOrgUnitApi(
  tenantId: string,
  orgUnitId: string,
  data: TenantManagementApi.UpdateManagedOrgUnitPayload,
) {
  return requestClient.request<TenantManagementApi.ManagedOrgUnitDetailResult>(
    `/tenant-management/tenants/${encodeURIComponent(tenantId)}/org-units/${encodeURIComponent(orgUnitId)}`,
    {
      data,
      method: 'PATCH',
    },
  );
}

// Archives one selected org node while keeping the org tree truth inside tenant-org-service.
export async function archiveManagedOrgUnitApi(
  tenantId: string,
  orgUnitId: string,
) {
  return requestClient.post<TenantManagementApi.ManagedOrgUnitDetailResult>(
    `/tenant-management/tenants/${encodeURIComponent(tenantId)}/org-units/${encodeURIComponent(orgUnitId)}/archive`,
  );
}
