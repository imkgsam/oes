import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const request = vi.fn();
const del = vi.fn();

vi.mock('#/api/request', () => ({
  requestClient: {
    delete: del,
    get,
    post,
    request,
  },
}));

// Verifies the tenant-web role-management API client stays aligned with the Gateway role and role-template contract.
describe('tenant-web role management api', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    request.mockReset();
    del.mockReset();
  });

  it('lists and creates role instances with scope-aware payloads', async () => {
    const { createRoleApi, listRoleTenantOptionsApi, listRolesApi } =
      await import('./index');

    await listRolesApi({
      keyword: 'admin',
      page: 2,
      pageSize: 50,
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
    });
    await listRoleTenantOptionsApi({
      keyword: 'alpha',
      pageSize: 10,
    });
    await createRoleApi({
      code: 'TENANT_FINANCE_ADMIN',
      description: 'Tenant finance administrator',
      name: 'Tenant Finance Admin',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
    });

    expect(get).toHaveBeenCalledWith('/role', {
      params: {
        keyword: 'admin',
        page: 2,
        pageSize: 50,
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
      },
    });
    expect(get).toHaveBeenCalledWith('/role/tenant-options', {
      params: {
        keyword: 'alpha',
        pageSize: 10,
      },
    });
    expect(post).toHaveBeenCalledWith('/role', {
      code: 'TENANT_FINANCE_ADMIN',
      description: 'Tenant finance administrator',
      name: 'Tenant Finance Admin',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
    });
  });

  it('updates role metadata, enablement, permissions, and deletion by stable id', async () => {
    const {
      assignRolePermissionApi,
      deleteRoleApi,
      getRoleByIdApi,
      listRolePermissionsApi,
      revokeRolePermissionApi,
      setRoleEnabledApi,
      updateRoleApi,
    } = await import('./index');

    await getRoleByIdApi('role-1');
    await updateRoleApi('role-1', {
      description: 'Updated description',
      name: 'Updated Role',
    });
    await setRoleEnabledApi('role-1', { isEnabled: false });
    await listRolePermissionsApi('role-1');
    await assignRolePermissionApi('role-1', { permissionId: 'perm-1' });
    await revokeRolePermissionApi('role-1', 'perm-1');
    await deleteRoleApi('role-1');

    expect(get).toHaveBeenCalledWith('/role/role-1');
    expect(request).toHaveBeenCalledWith('/role/role-1', {
      data: {
        description: 'Updated description',
        name: 'Updated Role',
      },
      method: 'PATCH',
    });
    expect(request).toHaveBeenCalledWith('/role/role-1/enabled', {
      data: {
        isEnabled: false,
      },
      method: 'PATCH',
    });
    expect(get).toHaveBeenCalledWith('/role/role-1/permissions');
    expect(post).toHaveBeenCalledWith('/role/role-1/permissions', {
      permissionId: 'perm-1',
    });
    expect(del).toHaveBeenCalledWith('/role/role-1/permissions/perm-1');
    expect(del).toHaveBeenCalledWith('/role/role-1');
  });

  it('lists, edits, and instantiates role templates through the dedicated endpoints', async () => {
    const {
      createRoleTemplateApi,
      deleteRoleTemplateApi,
      getRoleTemplateByIdApi,
      instantiateRoleTemplateApi,
      listRoleTemplatePermissionsApi,
      listRoleTemplatesApi,
      revokeRoleTemplatePermissionApi,
      setRoleTemplateEnabledApi,
      updateRoleTemplateApi,
      assignRoleTemplatePermissionApi,
    } = await import('./index');

    await listRoleTemplatesApi({
      keyword: 'finance',
      page: 1,
      pageSize: 20,
    });
    await createRoleTemplateApi({
      code: 'TENANT_FINANCE_TEMPLATE',
      description: 'Tenant finance template',
      name: 'Tenant Finance Template',
    });
    await getRoleTemplateByIdApi('template-1');
    await updateRoleTemplateApi('template-1', {
      description: 'Updated template',
      name: 'Finance Template',
    });
    await setRoleTemplateEnabledApi('template-1', { isEnabled: true });
    await listRoleTemplatePermissionsApi('template-1');
    await assignRoleTemplatePermissionApi('template-1', {
      permissionId: 'perm-2',
    });
    await revokeRoleTemplatePermissionApi('template-1', 'perm-2');
    await instantiateRoleTemplateApi('template-1', {
      description: 'Tenant finance role',
      name: 'Tenant Finance Role',
      tenantId: 'tenant-1',
    });
    await deleteRoleTemplateApi('template-1');

    expect(get).toHaveBeenCalledWith('/role-template', {
      params: {
        keyword: 'finance',
        page: 1,
        pageSize: 20,
      },
    });
    expect(post).toHaveBeenCalledWith('/role-template', {
      code: 'TENANT_FINANCE_TEMPLATE',
      description: 'Tenant finance template',
      name: 'Tenant Finance Template',
    });
    expect(get).toHaveBeenCalledWith('/role-template/template-1');
    expect(request).toHaveBeenCalledWith('/role-template/template-1', {
      data: {
        description: 'Updated template',
        name: 'Finance Template',
      },
      method: 'PATCH',
    });
    expect(request).toHaveBeenCalledWith('/role-template/template-1/enabled', {
      data: {
        isEnabled: true,
      },
      method: 'PATCH',
    });
    expect(get).toHaveBeenCalledWith('/role-template/template-1/permissions');
    expect(post).toHaveBeenCalledWith('/role-template/template-1/permissions', {
      permissionId: 'perm-2',
    });
    expect(del).toHaveBeenCalledWith('/role-template/template-1/permissions/perm-2');
    expect(post).toHaveBeenCalledWith('/role-template/template-1/instantiate', {
      description: 'Tenant finance role',
      name: 'Tenant Finance Role',
      tenantId: 'tenant-1',
    });
    expect(del).toHaveBeenCalledWith('/role-template/template-1');
  });
});
