/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createPolicyInstanceApi = vi.fn();
const getPolicyInstanceByIdApi = vi.fn();
const listPolicyInstancesApi = vi.fn();
const setPolicyInstanceEnabledApi = vi.fn();

vi.mock('#/api', () => ({
  createPolicyInstanceApi,
  getPolicyInstanceByIdApi,
  listPolicyInstancesApi,
  setPolicyInstanceEnabledApi,
}));

describe('policy instance management page', () => {
  beforeEach(() => {
    createPolicyInstanceApi.mockReset();
    listPolicyInstancesApi.mockReset();
    getPolicyInstanceByIdApi.mockReset();
    setPolicyInstanceEnabledApi.mockReset();
    listPolicyInstancesApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      policyInstances: [
        {
          id: 'policy-instance-1',
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
            allowedValues: ['W1', 'W2'],
          },
          enabled: true,
          priority: 100,
        },
      ],
      total: 1,
    });
    getPolicyInstanceByIdApi.mockResolvedValue({
      id: 'policy-instance-1',
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
        allowedValues: ['W1', 'W2'],
      },
      enabled: true,
      priority: 100,
    });
    createPolicyInstanceApi.mockResolvedValue({
      id: 'policy-instance-created',
    });
    setPolicyInstanceEnabledApi.mockResolvedValue({
      id: 'policy-instance-1',
      enabled: false,
    });
  });

  it('loads persisted PolicyInstance facts and opens readonly detail', async () => {
    const view = await import('./policy-instance-management.vue');
    const wrapper = mount(view.default, {
      attachTo: document.body,
    });

    await flushPromises();

    expect(listPolicyInstancesApi).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
    });
    expect(wrapper.text()).toContain('wms.inventory.view');
    expect(wrapper.text()).toContain('resource-field-in-set');

    await wrapper.get('[data-testid="open-policy-instance-detail"]').trigger('click');
    await flushPromises();

    expect(getPolicyInstanceByIdApi).toHaveBeenCalledWith('policy-instance-1');
    expect(wrapper.text()).toContain('warehouseId');
    expect(wrapper.text()).toContain('W1');
  });

  it('creates a WMS warehouse scope PolicyInstance from the frontend operation entry', async () => {
    const view = await import('./policy-instance-management.vue');
    const wrapper = mount(view.default, {
      attachTo: document.body,
    });

    await flushPromises();

    await wrapper.get('[data-testid="policy-instance-create"]').trigger('click');
    await flushPromises();

    expect(createPolicyInstanceApi).toHaveBeenCalledWith({
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
        allowedValues: ['W1', 'W2'],
      },
      enabled: true,
      priority: 100,
    });
    expect(listPolicyInstancesApi).toHaveBeenCalledTimes(2);
  });

  it('enables or disables a persisted PolicyInstance from the list action', async () => {
    const view = await import('./policy-instance-management.vue');
    const wrapper = mount(view.default, {
      attachTo: document.body,
    });

    await flushPromises();

    await wrapper.get('[data-testid="toggle-policy-instance-enabled"]').trigger('click');
    await flushPromises();

    expect(setPolicyInstanceEnabledApi).toHaveBeenCalledWith(
      'policy-instance-1',
      false,
    );
    expect(listPolicyInstancesApi).toHaveBeenCalledTimes(2);
  });
});
