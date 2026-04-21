import { requestClient } from '#/api/request';

export namespace RoleManagementApi {
  export interface Role {
    code: string;
    description?: string;
    id: string;
    isEnabled: boolean;
    isSystem: boolean;
    name: string;
    roleKind: number | string;
    templateRoleId?: string;
    templateRoleName?: string;
    tenantId?: string;
    tenantName?: string;
  }

  export interface Permission {
    code: string;
    description?: string;
    id: string;
    module: string;
  }

  export interface RoleListQuery {
    keyword?: string;
    page?: number;
    pageSize?: number;
    scopeLevel?: 'SYSTEM' | 'TENANT';
    tenantId?: string;
  }

  export interface RoleTemplateListQuery {
    keyword?: string;
    page?: number;
    pageSize?: number;
  }

  export interface RoleListResult {
    page: number;
    pageSize: number;
    roles: Role[];
    total: number;
  }

  export interface TenantOption {
    code: string;
    id: string;
    isActive: boolean;
    name: string;
  }

  export interface TenantOptionListQuery {
    keyword?: string;
    pageSize?: number;
  }

  export interface TenantOptionListResult {
    tenants: TenantOption[];
  }

  export interface RolePermissionListResult {
    permissions: Permission[];
  }

  export interface CreateRolePayload {
    code: string;
    description?: string;
    name: string;
    scopeLevel: 'SYSTEM' | 'TENANT';
    templateRoleId?: string;
    tenantId?: string;
  }

  export interface UpdateRolePayload {
    description?: string;
    name?: string;
  }

  export interface SetRoleEnabledPayload {
    isEnabled: boolean;
  }

  export interface AssignRolePermissionPayload {
    permissionId: string;
  }

  export interface CreateRoleTemplatePayload {
    code: string;
    description?: string;
    name: string;
  }

  export interface InstantiateRoleTemplatePayload {
    description?: string;
    name?: string;
    tenantId: string;
  }
}

// Lists role instances with the current management filters.
export async function listRolesApi(params: RoleManagementApi.RoleListQuery) {
  return requestClient.get<RoleManagementApi.RoleListResult>('/role', {
    params,
  });
}

// Lists tenant selector options for role creation flows.
export async function listRoleTenantOptionsApi(
  params: RoleManagementApi.TenantOptionListQuery,
) {
  return requestClient.get<RoleManagementApi.TenantOptionListResult>(
    '/role/tenant-options',
    {
      params,
    },
  );
}

// Creates one system- or tenant-scoped role instance.
export async function createRoleApi(data: RoleManagementApi.CreateRolePayload) {
  return requestClient.post<RoleManagementApi.Role>('/role', data);
}

// Loads one role instance by stable id.
export async function getRoleByIdApi(id: string) {
  return requestClient.get<RoleManagementApi.Role>(
    `/role/${encodeURIComponent(id)}`,
  );
}

// Updates mutable metadata on one role instance.
export async function updateRoleApi(
  id: string,
  data: RoleManagementApi.UpdateRolePayload,
) {
  return requestClient.request<RoleManagementApi.Role>(
    `/role/${encodeURIComponent(id)}`,
    {
      data,
      method: 'PATCH',
    },
  );
}

// Enables or disables one role instance.
export async function setRoleEnabledApi(
  id: string,
  data: RoleManagementApi.SetRoleEnabledPayload,
) {
  return requestClient.request<RoleManagementApi.Role>(
    `/role/${encodeURIComponent(id)}/enabled`,
    {
      data,
      method: 'PATCH',
    },
  );
}

// Lists permissions currently assigned to one role instance.
export async function listRolePermissionsApi(id: string) {
  return requestClient.get<RoleManagementApi.RolePermissionListResult>(
    `/role/${encodeURIComponent(id)}/permissions`,
  );
}

// Assigns one permission to one role instance.
export async function assignRolePermissionApi(
  id: string,
  data: RoleManagementApi.AssignRolePermissionPayload,
) {
  return requestClient.post(
    `/role/${encodeURIComponent(id)}/permissions`,
    data,
  );
}

// Revokes one permission from one role instance.
export async function revokeRolePermissionApi(
  id: string,
  permissionId: string,
) {
  return requestClient.delete(
    `/role/${encodeURIComponent(id)}/permissions/${encodeURIComponent(permissionId)}`,
  );
}

// Deletes one role instance.
export async function deleteRoleApi(id: string) {
  return requestClient.delete(`/role/${encodeURIComponent(id)}`);
}

// Lists global role templates.
export async function listRoleTemplatesApi(
  params: RoleManagementApi.RoleTemplateListQuery,
) {
  return requestClient.get<RoleManagementApi.RoleListResult>('/role-template', {
    params,
  });
}

// Creates one global role template.
export async function createRoleTemplateApi(
  data: RoleManagementApi.CreateRoleTemplatePayload,
) {
  return requestClient.post<RoleManagementApi.Role>('/role-template', data);
}

// Loads one role template by stable id.
export async function getRoleTemplateByIdApi(id: string) {
  return requestClient.get<RoleManagementApi.Role>(
    `/role-template/${encodeURIComponent(id)}`,
  );
}

// Updates mutable metadata on one role template.
export async function updateRoleTemplateApi(
  id: string,
  data: RoleManagementApi.UpdateRolePayload,
) {
  return requestClient.request<RoleManagementApi.Role>(
    `/role-template/${encodeURIComponent(id)}`,
    {
      data,
      method: 'PATCH',
    },
  );
}

// Enables or disables one role template.
export async function setRoleTemplateEnabledApi(
  id: string,
  data: RoleManagementApi.SetRoleEnabledPayload,
) {
  return requestClient.request<RoleManagementApi.Role>(
    `/role-template/${encodeURIComponent(id)}/enabled`,
    {
      data,
      method: 'PATCH',
    },
  );
}

// Lists permissions currently assigned to one role template.
export async function listRoleTemplatePermissionsApi(id: string) {
  return requestClient.get<RoleManagementApi.RolePermissionListResult>(
    `/role-template/${encodeURIComponent(id)}/permissions`,
  );
}

// Assigns one permission to one role template.
export async function assignRoleTemplatePermissionApi(
  id: string,
  data: RoleManagementApi.AssignRolePermissionPayload,
) {
  return requestClient.post(
    `/role-template/${encodeURIComponent(id)}/permissions`,
    data,
  );
}

// Revokes one permission from one role template.
export async function revokeRoleTemplatePermissionApi(
  id: string,
  permissionId: string,
) {
  return requestClient.delete(
    `/role-template/${encodeURIComponent(id)}/permissions/${encodeURIComponent(permissionId)}`,
  );
}

// Instantiates one tenant role instance from one role template.
export async function instantiateRoleTemplateApi(
  id: string,
  data: RoleManagementApi.InstantiateRoleTemplatePayload,
) {
  return requestClient.post<RoleManagementApi.Role>(
    `/role-template/${encodeURIComponent(id)}/instantiate`,
    data,
  );
}

// Deletes one role template.
export async function deleteRoleTemplateApi(id: string) {
  return requestClient.delete(`/role-template/${encodeURIComponent(id)}`);
}
