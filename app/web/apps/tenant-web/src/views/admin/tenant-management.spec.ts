/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Modal, Select, message } from 'ant-design-vue';

const getManagedTenantByIdApi = vi.fn();
const listManagedTenantsApi = vi.fn();
const searchFirstAdminUserCandidatesApi = vi.fn();
const startTenantOnboardingApi = vi.fn();
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
    account: {
      name: 'Platform Admin',
    },
    operator: {
      displayName: 'Platform Admin',
      userId: 'user-system-admin',
    },
    tenant: null,
  },
  tenantName: '',
  visibleEntries: ['admin.tenant-management'],
};

vi.mock('@vben/preferences', () => ({
  preferences: {
    app: {
      locale: 'zh-CN',
    },
  },
}));

vi.mock('#/api', () => ({
  getManagedTenantByIdApi,
  listManagedTenantsApi,
  searchFirstAdminUserCandidatesApi,
  startTenantOnboardingApi,
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
    getManagedTenantByIdApi.mockReset();
    listManagedTenantsApi.mockReset();
    searchFirstAdminUserCandidatesApi.mockReset();
    startTenantOnboardingApi.mockReset();
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
          userCount: 3,
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
        userCount: 3,
      },
    });
    searchFirstAdminUserCandidatesApi.mockResolvedValue({
      items: [
        {
          displayName: 'Existing Admin',
          isActive: true,
          maskedEmail: 'ex***@example.com',
          maskedPhone: '+14***0100',
          userId: 'user-existing-1',
        },
      ],
    });
    startTenantOnboardingApi.mockResolvedValue({
      onboarding: {
        access: { grantId: 'grant-1', roleCode: 'tenant.admin', roleId: 'role-1' },
        firstAdmin: { accountId: 'account-1', userId: 'user-1' },
        onboardingId: 'onboarding-1',
        organizationParty: { partyId: 'party-1', tenantPartyId: 'tenant-party-1' },
        rootOrg: { id: 'org-root-2' },
        status: 'SUCCEEDED',
        tenant: {
          code: 'tenant.beta',
          id: 'tenant-2',
          name: 'Beta Tenant',
          rootOrgId: 'org-root-2',
          status: 'ACTIVE',
        },
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

    expect(wrapper.text()).toContain('租户管理');
    expect(wrapper.text()).toContain('Alpha Tenant');
    expect(wrapper.text()).toContain('tenant.alpha');
    expect(wrapper.text()).toContain('用户数');
    expect(wrapper.text()).toContain('3');
    expect(wrapper.text()).not.toContain('org-root-1');
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
    expect(wrapper.text()).not.toContain('Root Org ID');
    expect(wrapper.text()).not.toContain('org-root-1');
  });

  it('renders the system-admin tenant list as one minimal business workbench', async () => {
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

    expect(wrapper.find('.tenant-management__workspace').exists()).toBe(true);
    expect(wrapper.find('.tenant-management__hero').exists()).toBe(false);
    expect(wrapper.text()).toContain('租户管理');
    expect(wrapper.text()).not.toContain('开通入口、生命周期状态与基础资料维护');
    expect(wrapper.text()).not.toContain('System Admin');
    expect(wrapper.text()).toContain('共 1 个租户');
    expect(wrapper.get('[data-testid="tenant-create-open"]').text()).toContain('开通租户');
  });

  it('creates tenant onboarding through separated tenant and first-admin steps', async () => {
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

    expect(wrapper.text()).toContain('租户信息');
    expect(wrapper.text()).toContain('首管理员');
    expect(wrapper.text()).toContain('企业法定名称');
    expect(wrapper.text()).not.toContain('幂等键');
    expect(wrapper.text()).not.toContain('要求首次登录设置密码');
    expect(wrapper.find('input[placeholder="例如 Alpha Tenant"]').exists()).toBe(false);

    const inputs = document.body.querySelectorAll('input');
    inputs[0]?.dispatchEvent(new Event('focus'));
    await wrapper.find('input[placeholder="例如 tenant.alpha"]').setValue('tenant.beta');
    await wrapper.find('input[placeholder="例如 Alpha Inc."]').setValue('Beta Inc.');
    expect(wrapper.find('input[placeholder="默认与租户名称一致，可按需覆盖"]').exists()).toBe(false);
    wrapper.findComponent({ name: 'CountryRegionSelect' }).vm.$emit('update:value', 'US');
    await flushPromises();
    expect(wrapper.text()).toContain('企业唯一识别码');
    expect(wrapper.text()).toContain('EIN');
    await wrapper.find('input[placeholder="例如 12-3456789"]').setValue('12-3456789');
    await wrapper.find('[data-testid="tenant-create-next"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('首管理员姓名');
    await wrapper.find('input[placeholder="例如 Alice Admin"]').setValue('Alice Admin');
    await wrapper.find('input[placeholder="例如 alice@example.com"]').setValue('alice@example.com');
    await wrapper.find('[data-testid="tenant-create-submit"]').trigger('click');
    await flushPromises();

    expect(startTenantOnboardingApi).toHaveBeenCalledWith(
      expect.objectContaining({
        firstAdmin: expect.objectContaining({
          displayName: 'Alice Admin',
          email: 'alice@example.com',
          requirePasswordSetup: true,
        }),
        organizationParty: expect.objectContaining({
          identifiers: [
            {
              identifierType: 'EIN',
              issuerCountryOrRegion: 'US',
              normalizedValue: '123456789',
              rawValue: '12-3456789',
            },
          ],
          legalName: 'Beta Inc.',
          registeredCountry: 'US',
        }),
        rootOrg: {
          name: 'Beta Inc.',
        },
        tenant: {
          code: 'tenant.beta',
          name: 'Beta Inc.',
        },
      }),
    );
    expect(message.success).toHaveBeenCalledWith('租户开通已完成');
    expect(wrapper.text()).not.toContain('Onboarding ID');
    expect(wrapper.text()).not.toContain('tenant.admin Grant');
    expect(wrapper.text()).not.toContain('onboarding-1');
    expect(wrapper.text()).not.toContain('grant-1');

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

  it('uses the shared country-code phone input when creating a new tenant admin', async () => {
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
    await wrapper.find('input[placeholder="例如 tenant.alpha"]').setValue('tenant.phone');
    await wrapper.find('input[placeholder="例如 Alpha Inc."]').setValue('Phone Tenant Inc.');
    wrapper.findComponent({ name: 'CountryRegionSelect' }).vm.$emit('update:value', 'US');
    await flushPromises();
    await wrapper.find('input[placeholder="例如 12-3456789"]').setValue('12-3456789');
    await wrapper.find('[data-testid="tenant-create-next"]').trigger('click');
    await flushPromises();

    expect(wrapper.findComponent({ name: 'PhoneNumberInput' }).exists()).toBe(true);
    expect(wrapper.find('.phone-country-select').exists()).toBe(true);
    await wrapper.find('input[placeholder="例如 Alice Admin"]').setValue('Phone Admin');
    await wrapper.find('.phone-local-input').setValue('138 1111 2222');
    await wrapper.find('[data-testid="tenant-create-submit"]').trigger('click');
    await flushPromises();

    expect(startTenantOnboardingApi).toHaveBeenCalledWith(
      expect.objectContaining({
        firstAdmin: expect.objectContaining({
          displayName: 'Phone Admin',
          email: undefined,
          phone: '+8613811112222',
        }),
      }),
    );
  });

  it('can select an existing user as the first tenant admin', async () => {
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
    await wrapper.find('input[placeholder="例如 tenant.alpha"]').setValue('tenant.own');
    await wrapper.find('input[placeholder="例如 Alpha Inc."]').setValue('Own Company Inc.');
    wrapper.findComponent({ name: 'CountryRegionSelect' }).vm.$emit('update:value', 'US');
    await flushPromises();
    await wrapper.find('input[placeholder="例如 12-3456789"]').setValue('98-7654321');
    await wrapper.find('[data-testid="tenant-create-next"]').trigger('click');
    await flushPromises();

    const existingUserRadio = document.body.querySelector(
      'input[value="EXISTING_USER"]',
    ) as HTMLInputElement;
    existingUserRadio.click();
    await flushPromises();
    const existingUserSelects = wrapper.findAllComponents(Select);
    existingUserSelects[existingUserSelects.length - 1]?.vm.$emit('search', 'existing@example.com');
    await flushPromises();
    existingUserSelects[existingUserSelects.length - 1]?.vm.$emit('change', 'user-existing-1');
    await flushPromises();
    await wrapper.find('[data-testid="tenant-create-submit"]').trigger('click');
    await flushPromises();

    expect(searchFirstAdminUserCandidatesApi).toHaveBeenCalledWith('existing@example.com', 'US');
    expect(startTenantOnboardingApi).toHaveBeenCalledWith(
      expect.objectContaining({
        firstAdmin: {
          displayName: 'Existing Admin',
          email: undefined,
          existingUserId: 'user-existing-1',
          phone: undefined,
          provisioningMode: 'EXISTING_USER',
          requirePasswordSetup: false,
        },
      }),
    );
  });

  it('keeps failed onboarding details visible when create returns a non-2xx error', async () => {
    startTenantOnboardingApi.mockRejectedValueOnce({
      message: 'Internal service is unavailable',
      response: {
        data: {
          details: {
            onboarding: {
              onboardingId: 'onboarding-failed-1',
              status: 'FAILED_RETRYABLE',
              failure: {
                failedStep: 'REGISTER_ORGANIZATION_PARTY',
                message: 'Internal service is unavailable',
              },
            },
          },
        },
      },
    });
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
    await wrapper.find('input[placeholder="例如 tenant.alpha"]').setValue('tenant.beta');
    await wrapper.find('input[placeholder="例如 Alpha Inc."]').setValue('Beta Inc.');
    wrapper.findComponent({ name: 'CountryRegionSelect' }).vm.$emit('update:value', 'US');
    await flushPromises();
    await wrapper.find('input[placeholder="例如 12-3456789"]').setValue('12-3456789');
    await wrapper.find('[data-testid="tenant-create-next"]').trigger('click');
    await flushPromises();
    await wrapper.find('input[placeholder="例如 Alice Admin"]').setValue('Alice Admin');
    await wrapper.find('input[placeholder="例如 alice@example.com"]').setValue('alice@example.com');
    await wrapper.find('[data-testid="tenant-create-submit"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('FAILED_RETRYABLE');
    expect(wrapper.text()).not.toContain('onboarding-failed-1');
    expect(wrapper.text()).not.toContain('Onboarding ID');
    expect(wrapper.text()).toContain('REGISTER_ORGANIZATION_PARTY');
    expect(wrapper.text()).toContain('Internal service is unavailable');
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
