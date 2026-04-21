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

// Verifies the tenant-web account-role API client stays aligned with the Gateway account-role contract.
describe('tenant-web account role management api', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    request.mockReset();
    del.mockReset();
  });

  it('reads account role state and selection models by account id', async () => {
    const { getAccountRoleSelectionApi, listAccountRolesApi } =
      await import('./index');

    await listAccountRolesApi('account-1', {
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
    });
    await getAccountRoleSelectionApi('account-1', {
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
    });

    expect(get).toHaveBeenCalledWith('/account/account-1/roles', {
      params: {
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
      },
    });
    expect(get).toHaveBeenCalledWith('/account/account-1/roles/selection', {
      params: {
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
      },
    });
  });

  it('mutates account roles through incremental and full-set endpoints', async () => {
    const {
      assignAccountRoleApi,
      revokeAccountRoleApi,
      setAccountRolesApi,
    } = await import('./index');

    await assignAccountRoleApi('account-1', {
      accountType: 'USER',
      roleId: 'role-1',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
    });
    await setAccountRolesApi('account-1', {
      accountType: 'USER',
      roleIds: ['role-1', 'role-2'],
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
    });
    await revokeAccountRoleApi('account-1', 'role-1');

    expect(post).toHaveBeenCalledWith('/account/account-1/roles', {
      accountType: 'USER',
      roleId: 'role-1',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
    });
    expect(request).toHaveBeenCalledWith('/account/account-1/roles', {
      data: {
        accountType: 'USER',
        roleIds: ['role-1', 'role-2'],
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
      },
      method: 'PUT',
    });
    expect(del).toHaveBeenCalledWith('/account/account-1/roles/role-1');
  });

  it('lists role account bindings by role id', async () => {
    const { listRoleAccountsApi } = await import('./index');

    await listRoleAccountsApi('role-1');

    expect(get).toHaveBeenCalledWith('/role/role-1/accounts');
  });
});
