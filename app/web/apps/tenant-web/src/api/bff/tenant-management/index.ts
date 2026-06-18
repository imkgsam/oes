import { requestClient } from '#/api/request';

export namespace TenantManagementApi {
  export interface TenantSummary {
    code: string;
    employeeCodePrefix: string;
    id: string;
    name: string;
    rootOrgId?: string;
    rootOrgName?: string;
    status: string;
    userCount?: number;
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
    employeeCodePrefix: string;
    name: string;
    rootOrgName?: string;
  }

  export interface CreateTenantOnboardingPayload {
    firstAdmin: {
      displayName: string;
      email?: string;
      existingUserId?: string;
      phone?: string;
      provisioningMode?: 'CREATE_NEW_USER' | 'EXISTING_USER';
      requirePasswordSetup?: boolean;
    };
    idempotencyKey: string;
    organizationTenantParty: {
      identifiers?: Array<{
        identifierType: string;
        issuerCountryOrRegion?: string;
        normalizedValue?: string;
        rawValue?: string;
      }>;
      legalName: string;
      registeredCountry?: string;
    };
    rootOrg: {
      name: string;
    };
    tenant: {
      code: string;
      employeeCodePrefix: string;
      name: string;
    };
  }

  export interface TenantOnboardingResult {
    access?: {
      grantId?: string;
      accountBasicRoleCode?: string;
      accountBasicRoleId?: string;
      hrAdminGrantId?: string;
      hrAdminRoleCode?: string;
      hrAdminRoleId?: string;
      roleCode?: string;
      roleId?: string;
    };
    failure?: {
      code?: string;
      failedStep?: string;
      message?: string;
      retryable?: boolean;
    };
    firstAdmin?: {
      accountId?: string;
      tenantPartyId?: string;
      userId?: string;
    };
    firstAdminEmployee?: {
      accessProcessId?: string;
      employeeId?: string;
      employmentId?: string;
    };
    onboardingId?: string;
    organizationTenantParty?: {
      tenantPartyId?: string;
    };
    rootOrg?: ManagedOrgUnit;
    status?: string;
    steps?: Array<{
      attemptCount?: number;
      key?: string;
      message?: string;
      status?: string;
    }>;
    tenant?: TenantSummary;
  }

  export interface TenantOnboardingResponse {
    onboarding?: TenantOnboardingResult;
  }

  export interface FirstAdminUserCandidate {
    displayName: string;
    isActive: boolean;
    maskedEmail?: string;
    maskedPhone?: string;
    userId: string;
  }

  export interface FirstAdminUserCandidateResult {
    items: FirstAdminUserCandidate[];
  }

  export interface UpdateTenantProfilePayload {
    code?: string;
    employeeCodePrefix?: string;
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
    organizationTenantParty?: {
      id: string;
      legalName?: string;
      status: string;
      type: string;
      tenantId?: string;
    } | null;
    organizationTenantPartyId?: string | null;
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
    organizationTenantPartyId?: string;
    parentOrgId: string;
    sortOrder?: number;
    type: string;
  }

  export interface UpdateManagedOrgUnitPayload {
    name?: string;
    organizationTenantPartyId?: string | null;
    sortOrder?: number;
    type?: string;
  }

  export interface MoveManagedOrgUnitPayload {
    newParentOrgId: string;
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

// Starts the production tenant onboarding flow through tenant-org-service orchestration.
export async function startTenantOnboardingApi(
  data: TenantManagementApi.CreateTenantOnboardingPayload,
) {
  return requestClient.post<TenantManagementApi.TenantOnboardingResponse>(
    '/tenant-management/tenants/onboardings',
    data,
  );
}

// Loads the current state of one tenant onboarding run.
export async function getTenantOnboardingApi(onboardingId: string) {
  return requestClient.get<TenantManagementApi.TenantOnboardingResponse>(
    `/tenant-management/tenants/onboardings/${encodeURIComponent(onboardingId)}`,
  );
}

// Finds an existing identity user by email or phone for first-admin binding.
export async function searchFirstAdminUserCandidatesApi(
  keyword: string,
  countryOrRegion?: string,
) {
  return requestClient.get<TenantManagementApi.FirstAdminUserCandidateResult>(
    '/tenant-management/tenants/first-admin-candidates',
    {
      params: { countryOrRegion, keyword },
    },
  );
}

// Retries a failed tenant onboarding run from the durable Saga state.
export async function retryTenantOnboardingApi(
  onboardingId: string,
  reason?: string,
) {
  return requestClient.post<TenantManagementApi.TenantOnboardingResponse>(
    `/tenant-management/tenants/onboardings/${encodeURIComponent(onboardingId)}/retry`,
    { reason },
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

// Moves one org node below another parent while tenant-org-service keeps path/depth truth.
export async function moveManagedOrgUnitApi(
  tenantId: string,
  orgUnitId: string,
  data: TenantManagementApi.MoveManagedOrgUnitPayload,
) {
  return requestClient.post<TenantManagementApi.ManagedOrgUnitDetailResult>(
    `/tenant-management/tenants/${encodeURIComponent(tenantId)}/org-units/${encodeURIComponent(orgUnitId)}/move`,
    data,
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
