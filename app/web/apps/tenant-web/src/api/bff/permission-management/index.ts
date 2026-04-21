import { requestClient } from '#/api/request';

export namespace PermissionManagementApi {
  export interface Permission {
    code: string;
    description?: string;
    id: string;
    module: string;
  }

  export interface PermissionListQuery {
    keyword?: string;
    module?: string;
    page?: number;
    pageSize?: number;
  }

  export interface PermissionListResult {
    page: number;
    pageSize: number;
    permissions: Permission[];
    total: number;
  }

  export interface CreatePermissionPayload {
    code: string;
    description?: string;
    module: string;
  }

  export interface UpdatePermissionPayload {
    description?: string;
    module?: string;
  }

  export interface RoleReference {
    code: string;
    description?: string;
    id: string;
    isEnabled?: boolean;
    name: string;
    roleKind?: string;
    templateRoleId?: string;
    tenantId?: string;
  }

  export interface RoleReferenceListResult {
    roles: RoleReference[];
  }

  export interface NavigationEntry {
    description?: string;
    enabled: boolean;
    entryKey: string;
    entryType: string;
    featureKey?: string;
    name: string;
    registryPriority: number;
    supportedTerminals: string[];
  }

  export interface NavigationEntryListQuery {
    enabled?: boolean;
    featureKey?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
    terminal?: string;
  }

  export interface NavigationEntryListResult {
    entries: NavigationEntry[];
    page: number;
    pageSize: number;
    total: number;
  }

  export interface CreateNavigationEntryPayload {
    description?: string;
    enabled: boolean;
    entryKey: string;
    entryType: string;
    featureKey?: string;
    name: string;
    registryPriority: number;
    supportedTerminals: string[];
  }

  export interface UpdateNavigationEntryPayload {
    description?: null | string;
    enabled?: boolean;
    entryType?: string;
    featureKey?: null | string;
    name?: string;
    registryPriority?: number;
    supportedTerminals?: string[];
  }

  export interface RoleNavigationVisibility {
    enabled: boolean;
    entryKey: string;
    roleId: string;
    terminal: string;
  }

  export interface RoleLandingPolicy {
    defaultEntryKey: string;
    enabled: boolean;
    priority: number;
    roleId: string;
    terminal: string;
  }

  export interface RoleNavigationConfig {
    landingPolicies: RoleLandingPolicy[];
    roleId: string;
    visibility: RoleNavigationVisibility[];
  }

  export interface SetRoleNavigationVisibilityPayload {
    visibility: Array<Omit<RoleNavigationVisibility, 'roleId'>>;
  }

  export interface SetRoleLandingPoliciesPayload {
    landingPolicies: Array<Omit<RoleLandingPolicy, 'roleId'>>;
  }

  export interface ResolveNavigationPreviewPayload {
    roleIds: string[];
    scopeLevel: string;
    terminal: string;
  }

  export interface ResolveNavigationPreviewResult {
    defaultEntry: string;
    fallbackReason?: string;
    resolvedByRoleId?: string;
    visibleEntries: string[];
  }
}

// Lists global permission dictionary entries through the Gateway management contract.
export async function listPermissionsApi(
  params: PermissionManagementApi.PermissionListQuery,
) {
  return requestClient.get<PermissionManagementApi.PermissionListResult>(
    '/permission',
    { params },
  );
}

// Creates one global permission dictionary entry.
export async function createPermissionApi(
  data: PermissionManagementApi.CreatePermissionPayload,
) {
  return requestClient.post<PermissionManagementApi.Permission>(
    '/permission',
    data,
  );
}

// Loads one permission dictionary entry by stable id.
export async function getPermissionByIdApi(id: string) {
  return requestClient.get<PermissionManagementApi.Permission>(
    `/permission/id/${encodeURIComponent(id)}`,
  );
}

// Loads one permission dictionary entry by stable code.
export async function getPermissionByCodeApi(code: string) {
  return requestClient.get<PermissionManagementApi.Permission>(
    `/permission/${encodeURIComponent(code)}`,
  );
}

// Updates mutable metadata on one permission dictionary entry without editing its code.
export async function updatePermissionApi(
  id: string,
  data: PermissionManagementApi.UpdatePermissionPayload,
) {
  return requestClient.request<PermissionManagementApi.Permission>(
    `/permission/${encodeURIComponent(id)}`,
    {
      data,
      method: 'PATCH',
    },
  );
}

// Lists roles that currently reference one permission dictionary entry.
export async function listPermissionRolesApi(id: string) {
  return requestClient.get<PermissionManagementApi.RoleReferenceListResult>(
    `/permission/${encodeURIComponent(id)}/roles`,
  );
}

// Deletes one permission dictionary entry by stable id.
export async function deletePermissionApi(id: string) {
  return requestClient.delete(`/permission/${encodeURIComponent(id)}`);
}

// Lists managed navigation entry registry records.
export async function listNavigationEntriesApi(
  params: PermissionManagementApi.NavigationEntryListQuery,
) {
  return requestClient.get<PermissionManagementApi.NavigationEntryListResult>(
    '/navigation/entries',
    { params },
  );
}

// Creates one managed navigation entry registry record.
export async function createNavigationEntryApi(
  data: PermissionManagementApi.CreateNavigationEntryPayload,
) {
  return requestClient.post<PermissionManagementApi.NavigationEntry>(
    '/navigation/entries',
    data,
  );
}

// Loads one managed navigation entry by stable entry key.
export async function getNavigationEntryApi(entryKey: string) {
  return requestClient.get<PermissionManagementApi.NavigationEntry>(
    `/navigation/entries/${encodeURIComponent(entryKey)}`,
  );
}

// Updates mutable metadata on one managed navigation entry registry record.
export async function updateNavigationEntryApi(
  entryKey: string,
  data: PermissionManagementApi.UpdateNavigationEntryPayload,
) {
  return requestClient.request<PermissionManagementApi.NavigationEntry>(
    `/navigation/entries/${encodeURIComponent(entryKey)}`,
    {
      data,
      method: 'PATCH',
    },
  );
}

// Loads role-scoped navigation visibility and landing policy configuration.
export async function getRoleNavigationApi(roleId: string) {
  return requestClient.get<PermissionManagementApi.RoleNavigationConfig>(
    `/roles/${encodeURIComponent(roleId)}/navigation`,
  );
}

// Replaces one role's navigation visibility configuration as a full set.
export async function setRoleNavigationVisibilityApi(
  roleId: string,
  data: PermissionManagementApi.SetRoleNavigationVisibilityPayload,
) {
  return requestClient.put<PermissionManagementApi.RoleNavigationConfig>(
    `/roles/${encodeURIComponent(roleId)}/navigation/visibility`,
    data,
  );
}

// Replaces one role's landing policy configuration as a full set.
export async function setRoleLandingPoliciesApi(
  roleId: string,
  data: PermissionManagementApi.SetRoleLandingPoliciesPayload,
) {
  return requestClient.put<PermissionManagementApi.RoleNavigationConfig>(
    `/roles/${encodeURIComponent(roleId)}/navigation/landing-policies`,
    data,
  );
}

// Resets one role instance navigation to match the linked template snapshot.
export async function syncRoleNavigationFromTemplateApi(roleId: string) {
  return requestClient.post<PermissionManagementApi.RoleNavigationConfig>(
    `/roles/${encodeURIComponent(roleId)}/navigation/sync-template`,
  );
}

// Previews visible entries and default landing selection for one or more roles.
export async function resolveNavigationPreviewApi(
  data: PermissionManagementApi.ResolveNavigationPreviewPayload,
) {
  return requestClient.post<PermissionManagementApi.ResolveNavigationPreviewResult>(
    '/navigation/resolve-preview',
    data,
  );
}
