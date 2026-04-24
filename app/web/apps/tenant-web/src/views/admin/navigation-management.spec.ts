/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createNavigationEntryApi = vi.fn();
const getRoleNavigationApi = vi.fn();
const listNavigationEntriesApi = vi.fn();
const listRolesApi = vi.fn();
const resolveNavigationPreviewApi = vi.fn();
const setRoleLandingPoliciesApi = vi.fn();
const setRoleNavigationVisibilityApi = vi.fn();
const updateNavigationEntryApi = vi.fn();

const authContextState = {
  actionCodes: [
    'permission.navigation.entry.create',
    'permission.navigation.entry.update',
    'permission.navigation.resolve_preview',
    'permission.role.update',
  ],
  isPlatformScope: true,
  sessionContext: {
    tenant: {
      name: '潮州市美隆陶瓷实业有限公司',
      tenantId: 'tenant-1',
    },
  },
};

vi.mock('#/api', () => ({
  createNavigationEntryApi,
  getRoleNavigationApi,
  listNavigationEntriesApi,
  listRolesApi,
  resolveNavigationPreviewApi,
  setRoleLandingPoliciesApi,
  setRoleNavigationVisibilityApi,
  updateNavigationEntryApi,
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

describe('navigation management page', () => {
  beforeEach(() => {
    createNavigationEntryApi.mockReset();
    getRoleNavigationApi.mockReset();
    listNavigationEntriesApi.mockReset();
    listRolesApi.mockReset();
    resolveNavigationPreviewApi.mockReset();
    setRoleLandingPoliciesApi.mockReset();
    setRoleNavigationVisibilityApi.mockReset();
    updateNavigationEntryApi.mockReset();

    listNavigationEntriesApi.mockResolvedValue({
      entries: [
        {
          description: '工作台',
          enabled: true,
          entryKey: 'workbench.home',
          entryType: 'page',
          featureKey: 'workbench',
          name: '工作台首页',
          registryPriority: 100,
          supportedTerminals: ['WEB'],
        },
        {
          description: '移动待办',
          enabled: true,
          entryKey: 'mobile.todo',
          entryType: 'page',
          featureKey: 'mobile',
          name: '移动待办',
          registryPriority: 90,
          supportedTerminals: ['MOBILE'],
        },
        {
          description: '桌面首页',
          enabled: true,
          entryKey: 'desktop.home',
          entryType: 'page',
          featureKey: 'desktop',
          name: '桌面首页',
          registryPriority: 80,
          supportedTerminals: ['DESKTOP'],
        },
      ],
      page: 1,
      pageSize: 50,
      total: 3,
    });
    listRolesApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      roles: [
        {
          code: 'tenant.admin',
          id: 'role-1',
          isEnabled: true,
          isSystem: false,
          name: '租户管理员',
          roleKind: 'TENANT_INSTANCE',
          tenantId: 'tenant-1',
          tenantName: '潮州市美隆陶瓷实业有限公司',
        },
      ],
      total: 1,
    });
    getRoleNavigationApi.mockResolvedValue({
      landingPolicies: [],
      roleId: 'role-1',
      visibility: [],
    });
  });

  it('clears stale preview results when the preview terminal changes', async () => {
    const view = await import('./navigation-management.vue');
    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const vm = wrapper.vm as any;
    vm.roleForm.previewRoleIds = ['role-1'];
    vm.previewResult = {
      defaultEntry: 'workbench.home',
      visibleEntries: ['workbench.home'],
    };
    vm.previewLoading = true;

    await flushPromises();

    vm.roleForm.terminal = 'MOBILE';
    await flushPromises();

    expect(vm.previewLoading).toBe(false);
    expect(vm.previewResult).toBeNull();
    expect(
      document.body.querySelector('.navigation-management__preview-surface'),
    ).toBeNull();
  });
});
