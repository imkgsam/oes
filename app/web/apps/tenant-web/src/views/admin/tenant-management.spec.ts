/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Modal, message } from 'ant-design-vue';

const createManagedTenantApi = vi.fn();
const getManagedTenantByIdApi = vi.fn();
const listManagedTenantsApi = vi.fn();
const updateManagedTenantProfileApi = vi.fn();
const updateManagedTenantStatusApi = vi.fn();

const authContextState = {
  actionCodes: [
    'tenant_org.tenant.create',
    'tenant_org.tenant.get_by_id',
    'tenant_org.tenant.list',
    'tenant_org.tenant.update_profile',
    'tenant_org.tenant.update_status',
  ],
  isPlatformScope: true,
  sessionContext: {
    tenant: null,
  },
  tenantName: '',
  visibleEntries: ['admin.tenant-management'],
};

vi.mock('#/api', () => ({
  createManagedTenantApi,
  getManagedTenantByIdApi,
  listManagedTenantsApi,
  updateManagedTenantProfileApi,
  updateManagedTenantStatusApi,
}));

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState,
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<div><slot /></div>',
  },
}));

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    props: ['icon'],
    template: '<span :data-icon="icon" />',
  },
}));

describe('tenant management page', () => {
  beforeEach(() => {
    createManagedTenantApi.mockReset();
    getManagedTenantByIdApi.mockReset();
    listManagedTenantsApi.mockReset();
    updateManagedTenantProfileApi.mockReset();
    updateManagedTenantStatusApi.mockReset();
    authContextState.isPlatformScope = true;
    authContextState.visibleEntries = ['admin.tenant-management'];
    listManagedTenantsApi.mockResolvedValue({
      items: [
        {
          code: 'tenant.alpha',
          id: 'tenant-1',
          name: 'Alpha Tenant',
          rootOrgId: 'org-root-1',
          status: 'ACTIVE',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    getManagedTenantByIdApi.mockResolvedValue({
      tenant: {
        code: 'tenant.alpha',
        id: 'tenant-1',
        name: 'Alpha Tenant',
        rootOrgId: 'org-root-1',
        rootOrgName: 'Alpha Root',
        status: 'ACTIVE',
      },
    });
    createManagedTenantApi.mockResolvedValue({
      tenant: {
        code: 'tenant.beta',
        id: 'tenant-2',
        name: 'Beta Tenant',
        rootOrgId: 'org-root-2',
        status: 'ACTIVE',
      },
    });
    updateManagedTenantProfileApi.mockResolvedValue({
      tenant: {
        code: 'tenant.alpha.updated',
        id: 'tenant-1',
        name: 'Alpha Tenant Updated',
        rootOrgId: 'org-root-1',
        status: 'ACTIVE',
      },
    });
    updateManagedTenantStatusApi.mockResolvedValue({
      tenant: {
        code: 'tenant.alpha',
        id: 'tenant-1',
        name: 'Alpha Tenant',
        rootOrgId: 'org-root-1',
        status: 'SUSPENDED',
      },
    });
    vi.spyOn(message, 'success').mockImplementation(vi.fn());
    vi.spyOn(message, 'error').mockImplementation(vi.fn());
    vi.spyOn(Modal, 'confirm').mockImplementation((options: any) => {
      void options?.onOk?.();
      return {
        destroy: vi.fn(),
        update: vi.fn(),
      } as any;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders one system-admin tenant list and loads tenant detail into the side drawer', async () => {
    const view = await import('./tenant-management.vue');

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('Tenant 创建与基础管理');
    expect(wrapper.text()).toContain('Alpha Tenant');
    expect(wrapper.text()).toContain('tenant.alpha');
    expect(listManagedTenantsApi).toHaveBeenCalledWith({
      keyword: undefined,
      page: 1,
      pageSize: 20,
      status: undefined,
    });

    await wrapper.find('[data-testid="tenant-detail-button-tenant-1"]').trigger('click');
    await flushPromises();

    expect(getManagedTenantByIdApi).toHaveBeenCalledWith('tenant-1');
    expect(wrapper.text()).toContain('Alpha Root');
  });

  it('creates a tenant, updates basic profile metadata, and suspends the current tenant', async () => {
    const view = await import('./tenant-management.vue');

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    await wrapper.find('[data-testid="tenant-create-open"]').trigger('click');
    await flushPromises();

    const inputs = document.body.querySelectorAll('input');
    inputs[0]?.dispatchEvent(new Event('focus'));
    await wrapper.find('input[placeholder="例如 tenant.alpha"]').setValue('tenant.beta');
    await wrapper.find('input[placeholder="例如 Alpha Tenant"]').setValue('Beta Tenant');
    await wrapper.find('input[placeholder="默认与租户名称一致，可按需覆盖"]').setValue('Beta Root');
    await wrapper.find('[data-testid="tenant-create-submit"]').trigger('click');
    await flushPromises();

    expect(createManagedTenantApi).toHaveBeenCalledWith({
      code: 'tenant.beta',
      name: 'Beta Tenant',
      rootOrgName: 'Beta Root',
    });

    await wrapper.find('[data-testid="tenant-detail-button-tenant-1"]').trigger('click');
    await flushPromises();

    await wrapper.find('input[placeholder="输入租户名称"]').setValue('Alpha Tenant Updated');
    await wrapper.find('input[placeholder="输入租户编码"]').setValue('tenant.alpha.updated');
    await wrapper.find('[data-testid="tenant-detail-save"]').trigger('click');
    await flushPromises();

    expect(updateManagedTenantProfileApi).toHaveBeenCalledWith('tenant-1', {
      code: 'tenant.alpha.updated',
      name: 'Alpha Tenant Updated',
    });

    await wrapper.find('[data-testid="tenant-suspend-button-tenant-1"]').trigger('click');
    await flushPromises();

    expect(updateManagedTenantStatusApi).toHaveBeenCalledWith('tenant-1', {
      reason: '系统管理员执行停用',
      status: 'SUSPENDED',
    });
  });

  it('shows a guarded empty state and skips data loading outside system scope', async () => {
    authContextState.isPlatformScope = false;
    authContextState.visibleEntries = [];

    const view = await import('./tenant-management.vue');

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('仅系统管理员可访问');
    expect(listManagedTenantsApi).not.toHaveBeenCalled();
  });
});
