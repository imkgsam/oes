/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Modal, message } from 'ant-design-vue';

const listRolePermissionsApi = vi.fn();
const listNavigationEntriesApi = vi.fn();
const getRoleNavigationApi = vi.fn();
const listRoleTenantOptionsApi = vi.fn();
const listPermissionsApi = vi.fn();
const listRolesApi = vi.fn();
const listRoleTemplatesApi = vi.fn();
const setRoleLandingPoliciesApi = vi.fn();
const setRoleNavigationVisibilityApi = vi.fn();
const syncRoleNavigationFromTemplateApi = vi.fn();
const authContextState = {
  actionCodes: [
    'permission.role.create',
    'permission.role.delete_by_id',
    'permission.role.get_by_id',
    'permission.role.list',
    'permission.role.update',
  ],
  isPlatformScope: true,
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: '潮州市美隆陶瓷实业有限公司',
    },
  },
  tenantName: '潮州市美隆陶瓷实业有限公司',
  visibleEntries: ['admin.role-management'],
};

vi.mock('#/api', () => ({
  assignRolePermissionApi: vi.fn(),
  assignRoleTemplatePermissionApi: vi.fn(),
  createRoleApi: vi.fn(),
  createRoleTemplateApi: vi.fn(),
  deleteRoleApi: vi.fn(),
  deleteRoleTemplateApi: vi.fn(),
  getRoleNavigationApi,
  getRoleByIdApi: vi.fn(),
  getRoleTemplateByIdApi: vi.fn(),
  instantiateRoleTemplateApi: vi.fn(),
  listNavigationEntriesApi,
  listPermissionsApi,
  listRolePermissionsApi,
  listRoleTenantOptionsApi,
  listRolesApi,
  listRoleTemplatePermissionsApi: vi.fn(),
  listRoleTemplatesApi,
  revokeRolePermissionApi: vi.fn(),
  revokeRoleTemplatePermissionApi: vi.fn(),
  setRoleEnabledApi: vi.fn(),
  setRoleLandingPoliciesApi,
  setRoleNavigationVisibilityApi,
  syncRoleNavigationFromTemplateApi,
  setRoleTemplateEnabledApi: vi.fn(),
  updateRoleApi: vi.fn(),
  updateRoleTemplateApi: vi.fn(),
}));

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState,
}));

vi.mock('#/store', () => ({
  useAuthStore: () => ({
    refreshCurrentSessionAccess: vi.fn().mockResolvedValue(undefined),
  }),
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

/** collectNodeText flattens modal vnode content into plain text fragments for copy assertions. */
function collectNodeText(node: unknown): string[] {
  if (typeof node === 'string') {
    return [node];
  }

  if (Array.isArray(node)) {
    return node.flatMap((item) => collectNodeText(item));
  }

  if (node && typeof node === 'object' && 'children' in node) {
    return collectNodeText((node as { children?: unknown }).children);
  }

  return [];
}

describe('role management page', () => {
  beforeEach(() => {
    getRoleNavigationApi.mockReset();
    listNavigationEntriesApi.mockReset();
    listRolePermissionsApi.mockReset();
    listRoleTenantOptionsApi.mockReset();
    listPermissionsApi.mockReset();
    listRolesApi.mockReset();
    listRoleTemplatesApi.mockReset();
    setRoleLandingPoliciesApi.mockReset();
    setRoleNavigationVisibilityApi.mockReset();
    syncRoleNavigationFromTemplateApi.mockReset();
    authContextState.isPlatformScope = true;
    authContextState.sessionContext = {
      tenant: {
        tenantId: 'tenant-1',
        name: '潮州市美隆陶瓷实业有限公司',
      },
    };
    authContextState.tenantName = '潮州市美隆陶瓷实业有限公司';
    listPermissionsApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      permissions: [],
      total: 0,
    });
    listRolePermissionsApi.mockResolvedValue({
      permissions: [],
    });
    getRoleNavigationApi.mockResolvedValue({
      landingPolicies: [
        {
          defaultEntryKey: 'finance.dashboard',
          enabled: true,
          priority: 100,
          roleId: 'role-1',
          terminal: 'DEFAULT',
        },
      ],
      roleId: 'role-1',
      visibility: [],
    });
    listNavigationEntriesApi.mockResolvedValue({
      entries: [
        {
          description: '财务驾驶舱',
          enabled: true,
          entryKey: 'finance.dashboard',
          name: '财务驾驶舱',
          entryType: 'page',
          featureKey: 'finance',
          registryPriority: 100,
          supportedTerminals: ['WEB'],
        },
        {
          description: '财务报表',
          enabled: true,
          entryKey: 'finance.report',
          name: '财务报表',
          entryType: 'page',
          featureKey: 'finance',
          registryPriority: 90,
          supportedTerminals: ['WEB'],
        },
      ],
      page: 1,
      pageSize: 50,
      total: 2,
    });
    listRoleTenantOptionsApi.mockResolvedValue({
      tenants: [
        {
          code: 'tenant.alpha',
          id: 'tenant-1',
          isActive: true,
          name: '潮州市美隆陶瓷实业有限公司',
        },
      ],
    });
    listRolesApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      roles: [
        {
          code: 'SYSTEM_AUDITOR',
          description: 'System auditor role',
          id: 'role-1',
          isEnabled: true,
          isSystem: true,
          name: 'System Auditor',
          roleKind: 'SYSTEM_INSTANCE',
          templateRoleId: 'template-source-1',
          templateRoleName: '租户管理员模板',
          tenantId: 'tenant-1',
          tenantName: '潮州市美隆陶瓷实业有限公司',
        },
      ],
      total: 1,
    });
    listRoleTemplatesApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      roles: [
        {
          code: 'tenant.admin',
          description: '租户管理员模板',
          id: 'template-1',
          isEnabled: true,
          isSystem: true,
          name: '租户管理员模板',
          roleKind: 'SYSTEM_TEMPLATE',
        },
      ],
      total: 1,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders both tabs and opens the create-role modal', async () => {
    const view = await import('./role-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(document.body.textContent).toContain('角色实例');
    expect(document.body.textContent).toContain('角色模板');
    expect(listPermissionsApi).not.toHaveBeenCalled();

    const createButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('直接创建'),
    ) as HTMLButtonElement | undefined;

    createButton?.click();
    await flushPromises();

    expect(document.body.textContent).toContain('创建角色实例');
    expect(listRoleTenantOptionsApi).toHaveBeenCalledWith({
      keyword: undefined,
      pageSize: 20,
    });
  });

  it('uses a tenant selector instead of a raw tenant id input in the instance filter', async () => {
    const view = await import('./role-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const filterCard = document.body.querySelector('.role-management__filter-card');

    expect(listRoleTenantOptionsApi).toHaveBeenCalledWith({
      keyword: undefined,
      pageSize: 20,
    });
    expect(filterCard?.querySelectorAll('.ant-select').length).toBe(2);
    expect(filterCard?.querySelector('input[placeholder=\"Tenant ID\"]')).toBeNull();
  });

  it('opens the instance action dropdown when the trigger button is clicked', async () => {
    const view = await import('./role-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const trigger = document.body.querySelector(
      'button[aria-label="角色操作"]',
    ) as HTMLButtonElement | null;

    expect(trigger).not.toBeNull();

    trigger?.click();
    await flushPromises();

    expect(document.body.textContent).toContain('编辑');
    expect(document.body.textContent).toContain('权限');
    expect(document.body.textContent).toContain('删除');
  });

  it('renders tenant and source template names from the read model instead of raw ids', async () => {
    const view = await import('./role-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();
    await flushPromises();

    expect(document.body.textContent).toContain('潮州市美隆陶瓷实业有限公司');
    expect(document.body.textContent).toContain('租户管理员模板');
    expect(document.body.textContent).not.toContain('template-source-1');
    expect(document.body.textContent).not.toContain('tenant-1');
  });

  it('renders the permission maintenance drawer as stacked sections instead of side-by-side columns', async () => {
    const view = await import('./role-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const trigger = document.body.querySelector(
      'button[aria-label="角色操作"]',
    ) as HTMLButtonElement | null;

    trigger?.click();
    await flushPromises();

    const permissionAction = Array.from(
      document.body.querySelectorAll('.ant-dropdown-menu-title-content'),
    ).find((node) => node.textContent?.includes('权限')) as HTMLElement | undefined;

    expect(listPermissionsApi).not.toHaveBeenCalled();

    permissionAction?.click();
    await flushPromises();
    await flushPromises();

    expect(listPermissionsApi).toHaveBeenCalled();
    expect(
      document.body.querySelector('.role-management__permission-stack'),
    ).not.toBeNull();
  });

  it('hides the template-management tab for tenant scope while keeping instance-first creation available', async () => {
    authContextState.isPlatformScope = false;

    const view = await import('./role-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(document.body.textContent).not.toContain('角色模板');
    expect(document.body.textContent).toContain('从模板创建');
    expect(document.body.textContent).toContain('直接创建');
  });

  it('uses tenant selector options instead of a raw tenant id input in the instantiate modal', async () => {
    const view = await import('./role-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const instantiateButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('从模板创建'),
    ) as HTMLButtonElement | undefined;

    instantiateButton?.click();
    await flushPromises();

    expect(listRoleTenantOptionsApi).toHaveBeenCalledWith({
      keyword: undefined,
      pageSize: 20,
    });
    expect(document.body.textContent).toContain('租户');
    expect(document.body.textContent).not.toContain('输入目标租户 ID');
    expect(document.body.textContent).not.toContain('例如 tenant.admin.copy');
  });

  it('keeps the navigation drawer focused on default web configuration when only web entries exist', async () => {
    const view = await import('./role-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const trigger = document.body.querySelector(
      'button[aria-label="角色操作"]',
    ) as HTMLButtonElement | null;

    trigger?.click();
    await flushPromises();

    const navigationAction = Array.from(
      document.body.querySelectorAll('.ant-dropdown-menu-title-content'),
    ).find((node) => node.textContent?.includes('导航')) as HTMLElement | undefined;

    navigationAction?.click();
    await flushPromises();
    await flushPromises();

    expect(getRoleNavigationApi).toHaveBeenCalledWith('role-1');
    expect(document.body.textContent).toContain('默认配置');
    expect(document.body.textContent).toContain('默认进入');
    expect(document.body.textContent).not.toContain('前端差异配置');
    expect(document.body.textContent).not.toContain('管理差异');
    expect(
      document.body.querySelector('.role-management__navigation-selection-panel'),
    ).not.toBeNull();
    expect(document.body.querySelectorAll('.ant-checkbox-group').length).toBeGreaterThan(0);
    expect(document.body.querySelectorAll('.ant-radio-group').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toContain('Priority');
    expect(document.body.textContent).not.toContain('添加入口');
    expect(document.body.textContent).toContain('保存导航配置');
    expect(document.body.textContent).not.toContain('保存可见入口');
    expect(document.body.textContent).not.toContain('保存默认进入');
  });

  it('saves visibility and landing together from one navigation action and closes the instance drawer', async () => {
    getRoleNavigationApi.mockResolvedValue({
      landingPolicies: [
        {
          defaultEntryKey: 'finance.dashboard',
          enabled: true,
          priority: 100,
          roleId: 'role-1',
          terminal: 'DEFAULT',
        },
      ],
      roleId: 'role-1',
      visibility: [
        {
          enabled: true,
          entryKey: 'finance.dashboard',
          roleId: 'role-1',
          terminal: 'DEFAULT',
        },
      ],
    });
    setRoleNavigationVisibilityApi.mockResolvedValue({
      landingPolicies: [],
      roleId: 'role-1',
      visibility: [
        {
          enabled: true,
          entryKey: 'finance.dashboard',
          roleId: 'role-1',
          terminal: 'DEFAULT',
        },
      ],
    });
    setRoleLandingPoliciesApi.mockResolvedValue({
      landingPolicies: [
        {
          defaultEntryKey: 'finance.dashboard',
          enabled: true,
          priority: 100,
          roleId: 'role-1',
          terminal: 'DEFAULT',
        },
      ],
      roleId: 'role-1',
      visibility: [
        {
          enabled: true,
          entryKey: 'finance.dashboard',
          roleId: 'role-1',
          terminal: 'DEFAULT',
        },
      ],
    });

    const view = await import('./role-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const trigger = document.body.querySelector(
      'button[aria-label="角色操作"]',
    ) as HTMLButtonElement | null;

    trigger?.click();
    await flushPromises();

    const navigationAction = Array.from(
      document.body.querySelectorAll('.ant-dropdown-menu-title-content'),
    ).find((node) => node.textContent?.includes('导航')) as HTMLElement | undefined;

    navigationAction?.click();
    await flushPromises();
    await flushPromises();

    const saveButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('保存导航配置'),
    ) as HTMLButtonElement | undefined;

    saveButton?.click();
    await flushPromises();

    expect(setRoleNavigationVisibilityApi).toHaveBeenCalledWith('role-1', {
      visibility: [
        {
          enabled: true,
          entryKey: 'finance.dashboard',
          terminal: 'DEFAULT',
        },
      ],
    });
    expect(setRoleLandingPoliciesApi).toHaveBeenCalledWith('role-1', {
      landingPolicies: [
        {
          defaultEntryKey: 'finance.dashboard',
          enabled: true,
          priority: 100,
          terminal: 'DEFAULT',
        },
      ],
    });
    expect(document.body.textContent).not.toContain('导航配置 · System Auditor');
  });

  it('blocks unified navigation save when visible entries have no default landing', async () => {
    const warningSpy = vi
      .spyOn(message, 'warning')
      .mockImplementation(() => undefined as never);
    getRoleNavigationApi.mockResolvedValue({
      landingPolicies: [],
      roleId: 'role-1',
      visibility: [
        {
          enabled: true,
          entryKey: 'finance.dashboard',
          roleId: 'role-1',
          terminal: 'DEFAULT',
        },
      ],
    });

    const view = await import('./role-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const trigger = document.body.querySelector(
      'button[aria-label="角色操作"]',
    ) as HTMLButtonElement | null;

    trigger?.click();
    await flushPromises();

    const navigationAction = Array.from(
      document.body.querySelectorAll('.ant-dropdown-menu-title-content'),
    ).find((node) => node.textContent?.includes('导航')) as HTMLElement | undefined;

    navigationAction?.click();
    await flushPromises();
    await flushPromises();

    const saveButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('保存导航配置'),
    ) as HTMLButtonElement | undefined;

    saveButton?.click();
    await flushPromises();

    expect(warningSpy).toHaveBeenCalledWith('请为默认配置选择默认进入');
    expect(setRoleNavigationVisibilityApi).not.toHaveBeenCalled();
    expect(setRoleLandingPoliciesApi).not.toHaveBeenCalled();
    warningSpy.mockRestore();
  });

  it('lets administrators configure navigation on role templates', async () => {
    const view = await import('./role-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const templateTab = Array.from(document.body.querySelectorAll('[role="tab"]')).find(
      (node) => node.textContent?.includes('角色模板'),
    ) as HTMLElement | undefined;

    templateTab?.click();
    await flushPromises();

    const trigger = document.body.querySelector(
      'button[aria-label="模板操作"]',
    ) as HTMLButtonElement | null;

    trigger?.click();
    await flushPromises();

    const navigationAction = Array.from(
      document.body.querySelectorAll('.ant-dropdown-menu-title-content'),
    ).find((node) => node.textContent?.includes('导航')) as HTMLElement | undefined;

    navigationAction?.click();
    await flushPromises();
    await flushPromises();

    expect(getRoleNavigationApi).toHaveBeenCalledWith('template-1');
    expect(document.body.textContent).toContain('导航配置 · 租户管理员模板');
    expect(document.body.textContent).toContain('模板导航会在实例化时作为初始配置复制到新角色实例');
  });

  it('closes the template navigation drawer after saving', async () => {
    getRoleNavigationApi.mockResolvedValue({
      landingPolicies: [
        {
          defaultEntryKey: 'finance.dashboard',
          enabled: true,
          priority: 100,
          roleId: 'template-1',
          terminal: 'DEFAULT',
        },
      ],
      roleId: 'template-1',
      visibility: [
        {
          enabled: true,
          entryKey: 'finance.dashboard',
          roleId: 'template-1',
          terminal: 'DEFAULT',
        },
      ],
    });
    setRoleNavigationVisibilityApi.mockResolvedValue({
      landingPolicies: [],
      roleId: 'template-1',
      visibility: [
        {
          enabled: true,
          entryKey: 'finance.dashboard',
          roleId: 'template-1',
          terminal: 'DEFAULT',
        },
      ],
    });
    setRoleLandingPoliciesApi.mockResolvedValue({
      landingPolicies: [
        {
          defaultEntryKey: 'finance.dashboard',
          enabled: true,
          priority: 100,
          roleId: 'template-1',
          terminal: 'DEFAULT',
        },
      ],
      roleId: 'template-1',
      visibility: [
        {
          enabled: true,
          entryKey: 'finance.dashboard',
          roleId: 'template-1',
          terminal: 'DEFAULT',
        },
      ],
    });

    const view = await import('./role-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const templateTab = Array.from(document.body.querySelectorAll('[role="tab"]')).find(
      (node) => node.textContent?.includes('角色模板'),
    ) as HTMLElement | undefined;

    templateTab?.click();
    await flushPromises();

    const trigger = document.body.querySelector(
      'button[aria-label="模板操作"]',
    ) as HTMLButtonElement | null;

    trigger?.click();
    await flushPromises();

    const navigationAction = Array.from(
      document.body.querySelectorAll('.ant-dropdown-menu-title-content'),
    ).find((node) => node.textContent?.includes('导航')) as HTMLElement | undefined;

    navigationAction?.click();
    await flushPromises();
    await flushPromises();

    const saveButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('保存导航配置'),
    ) as HTMLButtonElement | undefined;

    saveButton?.click();
    await flushPromises();

    expect(setRoleNavigationVisibilityApi).toHaveBeenCalledWith('template-1', {
      visibility: [
        {
          enabled: true,
          entryKey: 'finance.dashboard',
          terminal: 'DEFAULT',
        },
      ],
    });
    expect(setRoleLandingPoliciesApi).toHaveBeenCalledWith('template-1', {
      landingPolicies: [
        {
          defaultEntryKey: 'finance.dashboard',
          enabled: true,
          priority: 100,
          terminal: 'DEFAULT',
        },
      ],
    });
    expect(document.body.textContent).not.toContain('导航配置 · 租户管理员模板');
  });

  it('confirms template sync for role instances and keeps source template details visible', async () => {
    let confirmOptions:
      | Parameters<typeof Modal.confirm>[0]
      | undefined;
    const confirmSpy = vi
      .spyOn(Modal, 'confirm')
      .mockImplementation((options) => {
        confirmOptions = options;
        return {
          destroy: vi.fn(),
          update: vi.fn(),
        } as never;
      });

    syncRoleNavigationFromTemplateApi.mockResolvedValue({
      landingPolicies: [
        {
          defaultEntryKey: 'finance.dashboard',
          enabled: true,
          priority: 100,
          roleId: 'role-1',
          terminal: 'DEFAULT',
        },
      ],
      roleId: 'role-1',
      visibility: [],
    });

    const view = await import('./role-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const trigger = document.body.querySelector(
      'button[aria-label="角色操作"]',
    ) as HTMLButtonElement | null;

    trigger?.click();
    await flushPromises();

    const navigationAction = Array.from(
      document.body.querySelectorAll('.ant-dropdown-menu-title-content'),
    ).find((node) => node.textContent?.includes('导航')) as HTMLElement | undefined;

    navigationAction?.click();
    await flushPromises();
    await flushPromises();

    expect(document.body.textContent).toContain('实例详情');
    expect(document.body.textContent).toContain('来源模板');
    expect(document.body.textContent).toContain('租户管理员模板');

    const syncButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('同步模板导航'),
    ) as HTMLButtonElement | undefined;

    syncButton?.click();
    await flushPromises();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(syncRoleNavigationFromTemplateApi).not.toHaveBeenCalled();
    expect(collectNodeText(confirmOptions?.content)).toEqual([
      '将使用来源模板当前的导航配置覆盖该实例已有配置。',
      '包括可见入口与默认落点，请确认后再继续。',
    ]);

    await confirmOptions?.onOk?.();
    await flushPromises();

    expect(syncRoleNavigationFromTemplateApi).toHaveBeenCalledWith('role-1');
    confirmSpy.mockRestore();
  });

  it('shows a separate override manager only when multiple frontends are available', async () => {
    listNavigationEntriesApi.mockResolvedValue({
      entries: [
        {
          description: '财务驾驶舱',
          enabled: true,
          entryKey: 'finance.dashboard',
          name: '财务驾驶舱',
          entryType: 'page',
          featureKey: 'finance',
          registryPriority: 100,
          supportedTerminals: ['WEB'],
        },
        {
          description: '移动待办',
          enabled: true,
          entryKey: 'mobile.todo',
          name: '移动待办',
          entryType: 'page',
          featureKey: 'mobile',
          registryPriority: 90,
          supportedTerminals: ['MOBILE'],
        },
      ],
      page: 1,
      pageSize: 50,
      total: 2,
    });

    const view = await import('./role-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const trigger = document.body.querySelector(
      'button[aria-label="角色操作"]',
    ) as HTMLButtonElement | null;

    trigger?.click();
    await flushPromises();

    const navigationAction = Array.from(
      document.body.querySelectorAll('.ant-dropdown-menu-title-content'),
    ).find((node) => node.textContent?.includes('导航')) as HTMLElement | undefined;

    navigationAction?.click();
    await flushPromises();
    await flushPromises();

    expect(document.body.textContent).toContain('前端差异配置');
    expect(document.body.textContent).toContain('管理差异');
  });
});
