import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
const request = vi.fn();
const del = vi.fn();

vi.mock('#/api/request', () => ({
  requestClient: {
    delete: del,
    get,
    post,
    put,
    request,
  },
}));

// Verifies the tenant-web permission API client stays aligned with the Gateway permission-management contract.
describe('tenant-web permission management api', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
    request.mockReset();
    del.mockReset();
  });

  it('lists permissions with filters and pagination', async () => {
    const { listPermissionsApi } = await import('./index');

    await listPermissionsApi({
      keyword: 'role',
      module: 'PERMISSION_SERVICE',
      page: 2,
      pageSize: 50,
    });

    expect(get).toHaveBeenCalledWith('/permission', {
      params: {
        keyword: 'role',
        module: 'PERMISSION_SERVICE',
        page: 2,
        pageSize: 50,
      },
    });
  });

  it('creates and updates permission metadata without editing the code on update', async () => {
    const { createPermissionApi, updatePermissionApi } = await import('./index');

    await createPermissionApi({
      code: 'permission.audit.list',
      description: 'List permission audit records',
      module: 'PERMISSION_SERVICE',
    });
    await updatePermissionApi('perm-1', {
      description: 'Updated description',
      module: 'PERMISSION_SERVICE',
    });

    expect(post).toHaveBeenCalledWith('/permission', {
      code: 'permission.audit.list',
      description: 'List permission audit records',
      module: 'PERMISSION_SERVICE',
    });
    expect(request).toHaveBeenCalledWith('/permission/perm-1', {
      data: {
        description: 'Updated description',
        module: 'PERMISSION_SERVICE',
      },
      method: 'PATCH',
    });
  });

  it('loads details, role references, and deletes by stable id', async () => {
    const {
      deletePermissionApi,
      getPermissionByIdApi,
      listPermissionRolesApi,
    } = await import('./index');

    await getPermissionByIdApi('perm-1');
    await listPermissionRolesApi('perm-1');
    await deletePermissionApi('perm-1');

    expect(get).toHaveBeenCalledWith('/permission/id/perm-1');
    expect(get).toHaveBeenCalledWith('/permission/perm-1/roles');
    expect(del).toHaveBeenCalledWith('/permission/perm-1');
  });

  it('calls navigation management endpoints through the gateway contract', async () => {
    const {
      createNavigationEntryApi,
      getRoleNavigationApi,
      listNavigationEntriesApi,
      resolveNavigationPreviewApi,
      setRoleLandingPoliciesApi,
      setRoleNavigationVisibilityApi,
      syncRoleNavigationFromTemplateApi,
      updateNavigationEntryApi,
    } = await import('./index');

    await listNavigationEntriesApi({ enabled: true, page: 1, terminal: 'WEB' });
    await createNavigationEntryApi({
      enabled: true,
      entryKey: 'workbench.home',
      entryType: 'page',
      name: 'Workbench',
      registryPriority: 100,
      supportedTerminals: ['WEB'],
    });
    await updateNavigationEntryApi('workbench.home', { enabled: false });
    await getRoleNavigationApi('role-1');
    await setRoleNavigationVisibilityApi('role-1', {
      visibility: [
        {
          enabled: true,
          entryKey: 'workbench.home',
          terminal: 'WEB',
        },
      ],
    });
    await setRoleLandingPoliciesApi('role-1', {
      landingPolicies: [
        {
          defaultEntryKey: 'workbench.home',
          enabled: true,
          priority: 100,
          terminal: 'WEB',
        },
      ],
    });
    await syncRoleNavigationFromTemplateApi('role-1');
    await resolveNavigationPreviewApi({
      roleIds: ['role-1'],
      scopeLevel: 'TENANT',
      terminal: 'WEB',
    });

    expect(get).toHaveBeenCalledWith('/navigation/entries', {
      params: { enabled: true, page: 1, terminal: 'WEB' },
    });
    expect(post).toHaveBeenCalledWith('/navigation/entries', {
      enabled: true,
      entryKey: 'workbench.home',
      entryType: 'page',
      name: 'Workbench',
      registryPriority: 100,
      supportedTerminals: ['WEB'],
    });
    expect(request).toHaveBeenCalledWith('/navigation/entries/workbench.home', {
      data: { enabled: false },
      method: 'PATCH',
    });
    expect(get).toHaveBeenCalledWith('/roles/role-1/navigation');
    expect(put).toHaveBeenCalledWith('/roles/role-1/navigation/visibility', {
      visibility: [
        {
          enabled: true,
          entryKey: 'workbench.home',
          terminal: 'WEB',
        },
      ],
    });
    expect(put).toHaveBeenCalledWith('/roles/role-1/navigation/landing-policies', {
      landingPolicies: [
        {
          defaultEntryKey: 'workbench.home',
          enabled: true,
          priority: 100,
          terminal: 'WEB',
        },
      ],
    });
    expect(post).toHaveBeenCalledWith('/roles/role-1/navigation/sync-template');
    expect(post).toHaveBeenCalledWith('/navigation/resolve-preview', {
      roleIds: ['role-1'],
      scopeLevel: 'TENANT',
      terminal: 'WEB',
    });
  });
});
