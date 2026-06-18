import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const request = vi.fn();

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post,
    request,
  },
}));

// Verifies the tenant-web tenant-management API client stays aligned with the gateway tenant management contract.
describe('tenant-web tenant management api', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    request.mockReset();
  });

  it('lists tenant summaries and loads one tenant detail', async () => {
    const { getManagedTenantByIdApi, listManagedTenantsApi } = await import('./index');

    await listManagedTenantsApi({
      keyword: 'alpha',
      page: 2,
      pageSize: 20,
      status: 'ACTIVE',
    });
    await getManagedTenantByIdApi('tenant-1');

    expect(get).toHaveBeenCalledWith('/tenant-management/tenants', {
      params: {
        keyword: 'alpha',
        page: 2,
        pageSize: 20,
        status: 'ACTIVE',
      },
    });
    expect(get).toHaveBeenCalledWith('/tenant-management/tenants/tenant-1');
  });

  it('creates tenants, updates tenant profile metadata, and changes tenant status', async () => {
    const {
      createManagedTenantApi,
      searchFirstAdminUserCandidatesApi,
      startTenantOnboardingApi,
      updateManagedTenantProfileApi,
      updateManagedTenantStatusApi,
    } = await import('./index');

    await createManagedTenantApi({
      code: 'tenant.alpha',
      employeeCodePrefix: 'ALP',
      name: 'Alpha Tenant',
      rootOrgName: 'Alpha Root',
    });
    await startTenantOnboardingApi({
      idempotencyKey: 'key-1',
      tenant: { code: 'tenant.alpha', employeeCodePrefix: 'ALP', name: 'Alpha Tenant' },
      organizationTenantParty: { legalName: 'Alpha Inc.', identifiers: [] },
      rootOrg: { name: 'Alpha Root' },
      firstAdmin: { displayName: 'Alice Admin', email: 'alice@example.com' },
    });
    await searchFirstAdminUserCandidatesApi('existing@example.com', 'US');
    await updateManagedTenantProfileApi('tenant-1', {
      code: 'tenant.alpha.updated',
      name: 'Alpha Tenant Updated',
    });
    await updateManagedTenantStatusApi('tenant-1', {
      reason: 'Manual review',
      status: 'SUSPENDED',
    });

    expect(post).toHaveBeenCalledWith('/tenant-management/tenants', {
      code: 'tenant.alpha',
      employeeCodePrefix: 'ALP',
      name: 'Alpha Tenant',
      rootOrgName: 'Alpha Root',
    });
    expect(post).toHaveBeenCalledWith('/tenant-management/tenants/onboardings', {
      idempotencyKey: 'key-1',
      tenant: { code: 'tenant.alpha', employeeCodePrefix: 'ALP', name: 'Alpha Tenant' },
      organizationTenantParty: { legalName: 'Alpha Inc.', identifiers: [] },
      rootOrg: { name: 'Alpha Root' },
      firstAdmin: { displayName: 'Alice Admin', email: 'alice@example.com' },
    });
    expect(get).toHaveBeenCalledWith(
      '/tenant-management/tenants/first-admin-candidates',
      {
        params: { countryOrRegion: 'US', keyword: 'existing@example.com' },
      },
    );
    expect(request).toHaveBeenCalledWith('/tenant-management/tenants/tenant-1/profile', {
      data: {
        code: 'tenant.alpha.updated',
        name: 'Alpha Tenant Updated',
      },
      method: 'PATCH',
    });
    expect(request).toHaveBeenCalledWith('/tenant-management/tenants/tenant-1/status', {
      data: {
        reason: 'Manual review',
        status: 'SUSPENDED',
      },
      method: 'PATCH',
    });
  });

  it('calls org tree and org unit management endpoints through the gateway contract', async () => {
    const {
      archiveManagedOrgUnitApi,
      createManagedOrgUnitApi,
      getManagedOrgTreeApi,
      getManagedOrgUnitByIdApi,
      moveManagedOrgUnitApi,
      updateManagedOrgUnitApi,
    } = await import('./index');

    await getManagedOrgTreeApi('tenant-1');
    await getManagedOrgUnitByIdApi('tenant-1', 'org-1');
    await createManagedOrgUnitApi('tenant-1', {
      name: 'Manufacturing',
      parentOrgId: 'org-root-1',
      sortOrder: 10,
      type: 'DEPARTMENT',
    });
    await updateManagedOrgUnitApi('tenant-1', 'org-1', {
      name: 'Manufacturing Updated',
      sortOrder: 11,
      type: 'DEPARTMENT',
    });
    await moveManagedOrgUnitApi('tenant-1', 'org-1', {
      newParentOrgId: 'org-root-2',
    });
    await archiveManagedOrgUnitApi('tenant-1', 'org-1');

    expect(get).toHaveBeenCalledWith('/tenant-management/tenants/tenant-1/org-tree');
    expect(get).toHaveBeenCalledWith('/tenant-management/tenants/tenant-1/org-units/org-1');
    expect(post).toHaveBeenCalledWith('/tenant-management/tenants/tenant-1/org-units', {
      name: 'Manufacturing',
      parentOrgId: 'org-root-1',
      sortOrder: 10,
      type: 'DEPARTMENT',
    });
    expect(request).toHaveBeenCalledWith('/tenant-management/tenants/tenant-1/org-units/org-1', {
      data: {
        name: 'Manufacturing Updated',
        sortOrder: 11,
        type: 'DEPARTMENT',
      },
      method: 'PATCH',
    });
    expect(post).toHaveBeenCalledWith('/tenant-management/tenants/tenant-1/org-units/org-1/move', {
      newParentOrgId: 'org-root-2',
    });
    expect(post).toHaveBeenCalledWith('/tenant-management/tenants/tenant-1/org-units/org-1/archive');
  });
});
