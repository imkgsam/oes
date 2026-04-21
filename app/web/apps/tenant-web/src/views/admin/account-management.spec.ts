/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listAdminAccountsApi = vi.fn();
const listAdminAccountTenantOptionsApi = vi.fn();
const createAdminAccountApi = vi.fn();
const getAdminAccountBasicInfoApi = vi.fn();
const updateAdminAccountBasicInfoApi = vi.fn();
const getAccountRoleSelectionApi = vi.fn();
const setAccountRolesApi = vi.fn();

const authContextState = {
  actionCodes: [
    'identity.account.create',
    'identity.account.profile.update',
    'identity.account.update_status',
    'permission.account.get_roles',
    'permission.account.assign_roles',
  ],
  isPlatformScope: true,
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant',
    },
  },
  tenantName: 'Alpha Tenant',
};

vi.mock('#/api', () => ({
  createAdminAccountApi,
  getAdminAccountBasicInfoApi,
  getAccountRoleSelectionApi,
  listAdminAccountsApi,
  listAdminAccountTenantOptionsApi,
  setAccountRolesApi,
  updateAdminAccountBasicInfoApi,
}));

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState,
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<div><h1>{{ title }}</h1><slot /></div>',
  },
}));

describe('account management page', () => {
  function findPrimaryButtonWithinModal(title: string) {
    const modal = Array.from(document.body.querySelectorAll('.ant-modal')).find((element) =>
      element.textContent?.includes(title),
    ) as HTMLElement | undefined;

    return modal?.querySelector('.ant-modal-footer .ant-btn-primary') as HTMLButtonElement | null;
  }

  beforeEach(() => {
    listAdminAccountsApi.mockReset();
    listAdminAccountTenantOptionsApi.mockReset();
    createAdminAccountApi.mockReset();
    getAdminAccountBasicInfoApi.mockReset();
    updateAdminAccountBasicInfoApi.mockReset();
    getAccountRoleSelectionApi.mockReset();
    setAccountRolesApi.mockReset();
    authContextState.isPlatformScope = true;
    authContextState.sessionContext = {
      tenant: {
        tenantId: 'tenant-1',
        name: 'Alpha Tenant',
      },
    };
    authContextState.tenantName = 'Alpha Tenant';
    listAdminAccountsApi.mockResolvedValue({
      items: [
        {
          accountDisplayName: 'Legacy Account / Alpha Tenant tenant-1',
          accountId: '9894c123-0f4b-452e-812f-f7cc9eed6006',
          isEnabled: true,
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          tenantName: 'Alpha Tenant',
          userDisplayName: '陈双武',
          userId: 'user-1',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    getAccountRoleSelectionApi.mockResolvedValue({
      availableRoles: [
        {
          code: 'tenant.admin',
          id: 'role-1',
          isEnabled: true,
          isSystem: false,
          name: '租户管理员',
          roleKind: 2,
        },
        {
          code: 'tenant.viewer',
          id: 'role-2',
          isEnabled: true,
          isSystem: false,
          name: '租户观察员',
          roleKind: 2,
        },
      ],
      selectedRoleIds: ['role-1'],
    });
    setAccountRolesApi.mockResolvedValue({
      roles: [],
    });
    listAdminAccountTenantOptionsApi.mockResolvedValue({
      items: [
        {
          id: 'tenant-1',
          code: 'alpha',
          name: 'Alpha Tenant',
          isActive: true,
        },
      ],
    });
    createAdminAccountApi.mockResolvedValue({
      accountDisplayName: 'New User',
      accountId: 'account-2',
      isEnabled: true,
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      tenantName: 'Alpha Tenant',
      userId: 'user-2',
    });
    getAdminAccountBasicInfoApi.mockResolvedValue({
      accountId: '9894c123-0f4b-452e-812f-f7cc9eed6006',
      userId: 'user-1',
      displayName: '陈双武',
      email: 'chen@example.com',
      phone: '+8613800138000',
      tenantId: 'tenant-1',
      tenantName: 'Alpha Tenant',
      scopeLevel: 'TENANT',
      isEnabled: true,
    });
    updateAdminAccountBasicInfoApi.mockResolvedValue({
      accountId: '9894c123-0f4b-452e-812f-f7cc9eed6006',
      userId: 'user-1',
      displayName: '陈双武（新）',
      email: 'new@example.com',
      phone: '+8613900139000',
      tenantId: 'tenant-1',
      tenantName: 'Alpha Tenant',
      scopeLevel: 'TENANT',
      isEnabled: true,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('loads account rows and opens a role-only configuration panel with search filtering', async () => {
    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(document.body.textContent).toContain('账号管理');
    expect(document.body.textContent).toContain('账号列表');
    expect(listAdminAccountsApi).toHaveBeenCalledWith({
      keyword: undefined,
      page: 1,
      pageSize: 20,
      scopeLevel: undefined,
      status: undefined,
    });
    expect(document.body.textContent).toContain('陈双武');
    expect(document.body.textContent).not.toContain('Legacy Account / Alpha Tenant tenant-1');
    expect(document.body.textContent).not.toContain('9894c123-0f4b-452e-812f-f7cc9eed6006');
    expect(document.body.textContent).toContain('user-1');

    const actionButton = document.body.querySelector(
      '.account-management__action-trigger',
    ) as HTMLButtonElement | null;
    actionButton?.click();
    await flushPromises();

    const configureButton = Array.from(document.body.querySelectorAll('.ant-dropdown-menu-title-content')).find(
      (element) => element.textContent?.includes('角色配置'),
    ) as HTMLElement | undefined;
    configureButton?.click();
    await flushPromises();

    expect(getAccountRoleSelectionApi).toHaveBeenCalledWith('9894c123-0f4b-452e-812f-f7cc9eed6006', {
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
    });
    const roleDrawer = Array.from(document.body.querySelectorAll('.ant-drawer')).find((element) =>
      element.textContent?.includes('保存角色'),
    ) as HTMLElement | undefined;
    expect(roleDrawer?.textContent).toContain('租户管理员');
    expect(roleDrawer?.textContent).toContain('租户观察员');
    expect(roleDrawer?.textContent).not.toContain('用户 ID');
    expect(roleDrawer?.textContent).not.toContain('Scope');
    expect(roleDrawer?.textContent).not.toContain('Alpha Tenant');

    const roleSearchInput = document.body.querySelector(
      'input[placeholder="搜索角色名称或角色码"]',
    ) as HTMLInputElement | null;
    expect(roleSearchInput).not.toBeNull();

    roleSearchInput!.value = 'viewer';
    roleSearchInput!.dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();

    expect(roleDrawer?.textContent).toContain('租户观察员');
    expect(roleDrawer?.textContent).not.toContain('租户管理员');

    const saveButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('保存角色'),
    ) as HTMLButtonElement | undefined;
    saveButton?.click();
    await flushPromises();

    expect(setAccountRolesApi).toHaveBeenCalledWith('9894c123-0f4b-452e-812f-f7cc9eed6006', {
      accountType: 'USER',
      roleIds: ['role-1'],
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
    });
  });

  it('opens the create modal without showing the tenant column to tenant administrators', async () => {
    authContextState.isPlatformScope = false;

    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(
      Array.from(document.body.querySelectorAll('th'))
        .map((element) => element.textContent?.trim())
        .filter(Boolean),
    ).not.toContain('租户');

    const createButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('新增账号'),
    ) as HTMLButtonElement | undefined;
    createButton?.click();
    await flushPromises();

    const displayNameInput = document.body.querySelector(
      'input[placeholder="请输入用户姓名"]',
    ) as HTMLInputElement | null;
    expect(displayNameInput).not.toBeNull();
  });

  it('submits create-account phone numbers in the same normalized format used by the login page', async () => {
    authContextState.isPlatformScope = false;

    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const createButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('新增账号'),
    ) as HTMLButtonElement | undefined;
    createButton?.click();
    await flushPromises();

    const displayNameInput = document.body.querySelector(
      'input[placeholder="请输入用户姓名"]',
    ) as HTMLInputElement | null;
    displayNameInput!.value = '李测试';
    displayNameInput!.dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();

    const phoneInput = document.body.querySelector(
      'input[placeholder="请输入手机号"]',
    ) as HTMLInputElement | null;
    phoneInput!.value = '138 0013 8000';
    phoneInput!.dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();

    const submitButton = findPrimaryButtonWithinModal('新增账号');
    submitButton?.click();
    await flushPromises();

    expect(createAdminAccountApi).toHaveBeenCalledWith({
      displayName: '李测试',
      email: undefined,
      phone: '+8613800138000',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      username: '李测试',
    });
  });

  it('does not render legacy account display names when user display name is unavailable', async () => {
    listAdminAccountsApi.mockResolvedValueOnce({
      items: [
        {
          accountDisplayName: 'Legacy Account / Alpha Tenant tenant-1',
          accountId: 'account-1',
          isEnabled: true,
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          tenantName: 'Alpha Tenant',
          userId: 'user-1',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });

    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(document.body.textContent).not.toContain('Legacy Account / Alpha Tenant tenant-1');
    expect(document.body.textContent).toContain('user-1');
  });

  it('opens the basic-info modal from the action menu and submits account basic-info updates', async () => {
    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const actionButton = document.body.querySelector(
      '.account-management__action-trigger',
    ) as HTMLButtonElement | null;
    actionButton?.click();
    await flushPromises();

    const basicInfoButton = Array.from(document.body.querySelectorAll('.ant-dropdown-menu-title-content')).find(
      (element) => element.textContent?.includes('基本信息'),
    ) as HTMLElement | undefined;
    basicInfoButton?.click();
    await flushPromises();

    expect(getAdminAccountBasicInfoApi).toHaveBeenCalledWith(
      '9894c123-0f4b-452e-812f-f7cc9eed6006',
    );

    const nameInput = document.body.querySelector(
      'input[placeholder="请输入用户姓名"]',
    ) as HTMLInputElement | null;
    nameInput!.value = '陈双武（新）';
    nameInput!.dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();

    const phoneInput = document.body.querySelector(
      'input[placeholder="请输入手机号"]',
    ) as HTMLInputElement | null;
    phoneInput!.value = '13900139000';
    phoneInput!.dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();

    const emailInput = document.body.querySelector(
      'input[placeholder="请输入邮箱"]',
    ) as HTMLInputElement | null;
    expect(emailInput?.closest('.account-management__field-input')).not.toBeNull();
    emailInput!.value = 'new@example.com';
    emailInput!.dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();

    const submitButton = findPrimaryButtonWithinModal('基本信息');
    submitButton?.click();
    await flushPromises();

    expect(updateAdminAccountBasicInfoApi).toHaveBeenCalledWith(
      '9894c123-0f4b-452e-812f-f7cc9eed6006',
      {
        displayName: '陈双武（新）',
        email: 'new@example.com',
        isEnabled: true,
        phone: '+8613900139000',
      },
    );
    expect(listAdminAccountsApi).toHaveBeenCalledTimes(2);
  });
});
