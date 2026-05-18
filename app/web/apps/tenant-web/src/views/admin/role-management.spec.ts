/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Modal, message } from 'ant-design-vue';

const assignRolePermissionApi = vi.fn();
const assignRoleTemplatePermissionApi = vi.fn();
const revokeRolePermissionApi = vi.fn();
const revokeRoleTemplatePermissionApi = vi.fn();
const listRolePermissionsApi = vi.fn();
const listNavigationEntriesApi = vi.fn();
const getRoleNavigationApi = vi.fn();
const getRoleTerminalAccessApi = vi.fn();
const listRoleTenantOptionsApi = vi.fn();
const listPermissionsApi = vi.fn();
const listRolesApi = vi.fn();
const listRoleTemplatesApi = vi.fn();
const setRoleLandingPoliciesApi = vi.fn();
const setRoleNavigationVisibilityApi = vi.fn();
const setRoleTerminalAccessApi = vi.fn();
const syncRoleNavigationFromTemplateApi = vi.fn();
const refreshCurrentSessionAccess = vi.fn();
const authContextState = {
  actionCodes: [
    'permission.role_instance.assign_permissions',
    'permission.role_instance.create',
    'permission.role_instance.create_from_template',
    'permission.role_instance.delete',
    'permission.role_instance.get_by_id',
    'permission.role_instance.list',
    'permission.role_instance.sync_from_template',
    'permission.role_instance.update',
    'permission.role_template.assign_permissions',
    'permission.role_template.create',
    'permission.role_template.delete',
    'permission.role_template.get_by_id',
    'permission.role_template.list',
    'permission.role_template.update',
    'permission.terminal_access.role.manage',
    'permission.terminal_access.view',
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
  assignRolePermissionApi,
  assignRoleTemplatePermissionApi,
  createRoleApi: vi.fn(),
  createRoleTemplateApi: vi.fn(),
  deleteRoleApi: vi.fn(),
  deleteRoleTemplateApi: vi.fn(),
  getRoleNavigationApi,
  getRoleTerminalAccessApi,
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
  revokeRolePermissionApi,
  revokeRoleTemplatePermissionApi,
  setRoleEnabledApi: vi.fn(),
  setRoleLandingPoliciesApi,
  setRoleNavigationVisibilityApi,
  setRoleTerminalAccessApi,
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
    refreshCurrentSessionAccess,
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
    getRoleTerminalAccessApi.mockReset();
    listNavigationEntriesApi.mockReset();
    listRolePermissionsApi.mockReset();
    listRoleTenantOptionsApi.mockReset();
    listPermissionsApi.mockReset();
    listRolesApi.mockReset();
    listRoleTemplatesApi.mockReset();
    assignRolePermissionApi.mockReset();
    assignRoleTemplatePermissionApi.mockReset();
    revokeRolePermissionApi.mockReset();
    revokeRoleTemplatePermissionApi.mockReset();
    refreshCurrentSessionAccess.mockReset();
    setRoleLandingPoliciesApi.mockReset();
    setRoleNavigationVisibilityApi.mockReset();
    setRoleTerminalAccessApi.mockReset();
    syncRoleNavigationFromTemplateApi.mockReset();
    authContextState.actionCodes = [
      'permission.role_instance.assign_permissions',
      'permission.role_instance.create',
      'permission.role_instance.create_from_template',
      'permission.role_instance.delete',
      'permission.role_instance.get_by_id',
      'permission.role_instance.list',
      'permission.role_instance.sync_from_template',
      'permission.role_instance.update',
      'permission.role_template.assign_permissions',
      'permission.role_template.create',
      'permission.role_template.delete',
      'permission.role_template.get_by_id',
      'permission.role_template.list',
      'permission.role_template.update',
      'permission.terminal_access.role.manage',
      'permission.terminal_access.view',
    ];
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
      permissions: [
        {
          id: 'perm-delete-account',
          code: 'identity.account.delete',
          module: 'IDENTITY_SERVICE',
          description: '删除账号',
        },
      ],
      total: 1,
    });
    listRolePermissionsApi.mockResolvedValue({
      permissions: [],
    });
    assignRolePermissionApi.mockResolvedValue(undefined);
    assignRoleTemplatePermissionApi.mockResolvedValue(undefined);
    revokeRolePermissionApi.mockResolvedValue(undefined);
    revokeRoleTemplatePermissionApi.mockResolvedValue(undefined);
    refreshCurrentSessionAccess.mockResolvedValue(undefined);
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
    getRoleTerminalAccessApi.mockResolvedValue({
      roleId: 'role-1',
      allowedTerminals: ['WEB'],
    });
    setRoleTerminalAccessApi.mockResolvedValue({
      roleId: 'role-1',
      allowedTerminals: ['WEB', 'PDA'],
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
      (button) => button.textContent?.includes('创建角色'),
    ) as HTMLButtonElement | undefined;

    createButton?.click();
    await flushPromises();

    const directCreateAction = Array.from(
      document.body.querySelectorAll('.ant-dropdown-menu-title-content'),
    ).find((node) => node.textContent?.includes('直接创建')) as HTMLElement | undefined;

    directCreateAction?.click();
    await flushPromises();

    expect(document.body.textContent).toContain('创建角色实例');
    expect(listRoleTenantOptionsApi).toHaveBeenCalledWith({
      keyword: undefined,
      pageSize: 20,
    });
  });

  it('loads role instances and templates when the session carries split role permissions', async () => {
    authContextState.actionCodes = [
      'permission.role_instance.list',
      'permission.role_template.list',
    ];
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

    expect(listRolesApi).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: 20,
      }),
    );
    expect(listRoleTemplatesApi).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: 20,
      }),
    );
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

    const filterPanel = document.body.querySelector('.role-management__filter-panel');

    expect(listRoleTenantOptionsApi).toHaveBeenCalledWith({
      keyword: undefined,
      pageSize: 20,
    });
    expect(filterPanel?.querySelectorAll('.ant-select').length).toBe(2);
    expect(filterPanel?.querySelector('input[placeholder=\"Tenant ID\"]')).toBeNull();
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
    expect(document.body.textContent).toContain('终端准入');
    expect(document.body.textContent).toContain('删除');
  });

  it('loads and saves role terminal access from the dedicated action drawer', async () => {
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

    const terminalAction = Array.from(
      document.body.querySelectorAll('.ant-dropdown-menu-title-content'),
    ).find((node) => node.textContent?.includes('终端准入')) as HTMLElement | undefined;

    terminalAction?.click();
    await flushPromises();
    await flushPromises();

    expect(getRoleTerminalAccessApi).toHaveBeenCalledWith('role-1');
    expect(document.body.textContent).toContain('终端准入 · System Auditor');
    expect(document.body.textContent).toContain('WEB');
    expect(document.body.textContent).toContain('PDA');
    expect(document.body.textContent).toContain('KIOSK');

    const pdaCheckbox = Array.from(
      document.body.querySelectorAll('input[type="checkbox"]'),
    ).find((input) => (input as HTMLInputElement).value === 'PDA') as HTMLInputElement | undefined;
    pdaCheckbox?.click();
    await flushPromises();

    const saveButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('保存终端准入'),
    ) as HTMLButtonElement | undefined;
    saveButton?.click();
    await flushPromises();

    expect(setRoleTerminalAccessApi).toHaveBeenCalledWith('role-1', {
      allowedTerminals: ['WEB', 'PDA'],
    });
  });

  it('lets administrators configure terminal access on role templates', async () => {
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

    const terminalAction = Array.from(
      document.body.querySelectorAll('.ant-dropdown-menu-title-content'),
    ).find((node) => node.textContent?.includes('终端准入')) as HTMLElement | undefined;

    terminalAction?.click();
    await flushPromises();
    await flushPromises();

    expect(getRoleTerminalAccessApi).toHaveBeenCalledWith('template-1');
    expect(document.body.textContent).toContain('终端准入 · 租户管理员模板');
    expect(document.body.textContent).toContain('模板实例化时复制为角色初始终端准入');
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
    expect(document.body.textContent).toContain('创建角色');
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

    const createButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('创建角色'),
    ) as HTMLButtonElement | undefined;

    createButton?.click();
    await flushPromises();

    const instantiateAction = Array.from(
      document.body.querySelectorAll('.ant-dropdown-menu-title-content'),
    ).find((node) => node.textContent?.includes('从模板创建')) as HTMLElement | undefined;

    instantiateAction?.click();
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
    expect(document.body.textContent).toContain('当前前端导航');
    expect(document.body.textContent).not.toContain('前端差异配置');
    expect(document.body.textContent).not.toContain('管理差异');
    expect(document.body.querySelector('.role-management__navigation-list-head')).not.toBeNull();
    expect(document.body.querySelectorAll('.ant-checkbox').length).toBeGreaterThan(0);
    expect(document.body.querySelectorAll('.ant-radio').length).toBeGreaterThan(0);
    expect(document.body.textContent).toContain('Priority');
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
    expect(document.body.textContent).toContain('模板实例化时复制为初始导航');
  });

  it('renders the navigation drawer as one combined entry list instead of split visibility and landing sections', async () => {
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

    expect(document.body.textContent).toContain('当前前端导航');
    expect(document.body.textContent).toContain('可见默认导航入口');
    expect(document.body.textContent).not.toContain('默认进入');
    expect(document.body.textContent).not.toContain('配置对象');
    expect(document.body.textContent).not.toContain('生效方式');
    expect(document.body.textContent).not.toContain('一次提交当前导航配置，并在发送前完成合法性校验');

    const optionTop = document.body.querySelector(
      '.role-management__navigation-option-top',
    );
    const optionBottom = document.body.querySelector(
      '.role-management__navigation-option-bottom',
    );

    expect(optionTop?.textContent).toContain('财务驾驶舱');
    expect(optionTop?.textContent).toContain('Priority 100');
    expect(optionBottom?.textContent).toContain('finance.dashboard');
  });

  it('refreshes the current session access summary after assigning a permission to a role instance', async () => {
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

    permissionAction?.click();
    await flushPromises();
    await flushPromises();

    const addButton = document.body.querySelector(
      '[data-testid="role-permission-action-perm-delete-account-assign"]',
    ) as HTMLButtonElement | null;

    addButton?.click();
    await flushPromises();

    expect(assignRolePermissionApi).toHaveBeenCalledWith('role-1', {
      permissionId: 'perm-delete-account',
    });
    expect(refreshCurrentSessionAccess).toHaveBeenCalledTimes(1);
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

    expect(document.body.textContent).toContain('前端导航配置');
    expect(document.body.textContent).toContain('DEFAULT');
    expect(document.body.textContent).toContain('WEB');
    expect(document.body.textContent).toContain('MOBILE');
  });
});
