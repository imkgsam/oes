import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post,
  },
}));

// Verifies tenant-web reads persisted PolicyInstance facts through the dedicated Gateway contract.
describe('tenant-web policy instance management api', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('lists readonly PolicyInstance records with governance filters', async () => {
    const { listPolicyInstancesApi } = await import('./index');

    await listPolicyInstancesApi({
      enabled: true,
      page: 2,
      pageSize: 10,
      permissionCode: 'wms.inventory.view',
      resourceType: 'inventory',
      templateCode: 'resource-field-in-set',
      tenantId: 'tenant-1',
    });

    expect(get).toHaveBeenCalledWith('/policy-instance', {
      params: {
        enabled: true,
        page: 2,
        pageSize: 10,
        permissionCode: 'wms.inventory.view',
        resourceType: 'inventory',
        templateCode: 'resource-field-in-set',
        tenantId: 'tenant-1',
      },
    });
  });

  it('loads one readonly PolicyInstance detail by stable id', async () => {
    const { getPolicyInstanceByIdApi } = await import('./index');

    await getPolicyInstanceByIdApi('policy-instance-1');

    expect(get).toHaveBeenCalledWith('/policy-instance/policy-instance-1');
  });

  it('creates one PolicyInstance through the dedicated mutation contract', async () => {
    const { createPolicyInstanceApi } = await import('./index');

    await createPolicyInstanceApi({
      tenantId: 'tenant-1',
      subjectSelector: {
        type: 'ACCOUNT',
        accountId: 'account-1',
      },
      permissionCode: 'wms.inventory.view',
      resourceType: 'inventory',
      templateCode: 'resource-field-in-set',
      effect: 'ALLOW',
      params: {
        field: 'warehouseId',
        allowedValues: ['W1'],
      },
      enabled: true,
      priority: 100,
    });

    expect(post).toHaveBeenCalledWith('/policy-instance', {
      effect: 'ALLOW',
      enabled: true,
      params: {
        allowedValues: ['W1'],
        field: 'warehouseId',
      },
      permissionCode: 'wms.inventory.view',
      priority: 100,
      resourceType: 'inventory',
      subjectSelector: {
        accountId: 'account-1',
        type: 'ACCOUNT',
      },
      templateCode: 'resource-field-in-set',
      tenantId: 'tenant-1',
    });
  });

  it('enables or disables one PolicyInstance by stable id', async () => {
    const { setPolicyInstanceEnabledApi } = await import('./index');

    await setPolicyInstanceEnabledApi('policy-instance-1', false);

    expect(post).toHaveBeenCalledWith('/policy-instance/policy-instance-1/enabled', {
      enabled: false,
    });
  });
});
