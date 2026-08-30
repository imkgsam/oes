import { createMemoryHistory, createRouter } from 'vue-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listNavigationEntriesApiMock = vi.fn();

const localStorageMock = {
  getItem: vi.fn(() => null),
  removeItem: vi.fn(),
  setItem: vi.fn(),
};
const defaultVisibleEntries = [
  'workbench.home',
  'admin.auth-session-management',
  'admin.role-management',
  'admin.account-management',
  'admin.permission-management',
  'admin.terminal-device-management',
  'tenant-settings.org-structure',
  'tenant-settings.employee-employment',
  'tenant-settings.login-mfa',
  'master-data.customer-management',
  'public-entry.business-cards',
  'public-entry.short-links',
];
const authContextStoreMock = {
  visibleEntries: [...defaultVisibleEntries],
};
const preferencesMock = {
  app: {
    accessMode: 'frontend',
  },
};

vi.stubGlobal('localStorage', localStorageMock);

vi.mock('@vben/preferences', () => ({
  preferences: preferencesMock,
}));

vi.mock('#/api', () => ({
  listNavigationEntriesApi: listNavigationEntriesApiMock,
}));

vi.mock('ant-design-vue', () => ({
  message: {
    loading: vi.fn(),
  },
}));

vi.mock('#/layouts', () => ({
  BasicLayout: {},
  IFrameView: {},
}));

vi.mock('#/locales', () => ({
  $t: (value: string) => value,
}));

vi.mock('#/store', () => ({
  useAuthContextStore: () => authContextStoreMock,
}));

// Verifies the real access generator keeps public touchpoint menus on canonical paths while preserving legacy redirects.
describe('runtime public-entry route generation', () => {
  beforeEach(() => {
    authContextStoreMock.visibleEntries = [...defaultVisibleEntries];
    listNavigationEntriesApiMock.mockReset();
    preferencesMock.app.accessMode = 'frontend';
  });

  it('registers public-entry routes and legacy redirects from local Web mappings', async () => {
    const { generateAccess } = await import('./access');
    const { accessRoutes, routes } = await import('./routes');
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    const result = await generateAccess({
      roles: ['tenant.admin'],
      router,
      routes: accessRoutes,
    });

    const serializedMenus = JSON.stringify(result.accessibleMenus);

    expect(serializedMenus).toContain('公开触点');
    expect(serializedMenus).toContain('/public-entry/business-cards');
    expect(serializedMenus).toContain('/public-entry/short-links');
    expect(serializedMenus).not.toContain('/admin/business-cards');
    expect(serializedMenus).not.toContain('/admin/public-entry-short-links');
    expect(
      router.resolve('/public-entry/business-cards').matched.at(-1)?.name,
    ).toBe('AdminBusinessCards');
    expect(router.resolve('/admin/business-cards').matched.at(-1)?.name).toBe(
      'AdminBusinessCardsLegacyRedirect',
    );
    const businessCardLegacyRoute = accessRoutes.find(
      (route) => route.name === 'AdminBusinessCardsLegacyRedirect',
    );
    expect(businessCardLegacyRoute?.redirect).toBe(
      '/settings/employee-employment/business-cards',
    );
    expect(businessCardLegacyRoute?.meta?.entryKey).toBe(
      'tenant-settings.employee-employment',
    );
    expect(
      router.resolve('/public-entry/short-links').matched.at(-1)?.name,
    ).toBe('AdminPublicEntryShortLinks');
    expect(
      router.resolve('/admin/public-entry-short-links').matched.at(-1)?.name,
    ).toBe('AdminPublicEntryShortLinksLegacyRedirect');
  });

  it('removes employee-scoped BusinessCard management when employee management is not visible', async () => {
    authContextStoreMock.visibleEntries = ['workbench.home'];
    const { generateAccess } = await import('./access');
    const { accessRoutes, routes } = await import('./routes');
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    const result = await generateAccess({
      roles: ['tenant.admin'],
      router,
      routes: accessRoutes,
    });

    const serializedMenus = JSON.stringify(result.accessibleMenus);
    const serializedRoutes = JSON.stringify(result.accessibleRoutes);

    expect(serializedMenus).not.toContain('租户设置');
    expect(serializedMenus).not.toContain('TenantSettings');
    expect(serializedMenus).not.toContain('TenantEmployeeBusinessCards');
    expect(serializedRoutes).not.toContain('TenantSettings');
    expect(serializedRoutes).not.toContain('TenantEmployeeBusinessCards');
    expect(serializedRoutes).not.toContain('AdminBusinessCardsLegacyRedirect');
  });

  it.each(['frontend', 'mixed', 'backend'])(
    'keeps SYSTEM and TENANT local route components in %s preference mode',
    async (accessMode) => {
      preferencesMock.app.accessMode = accessMode;
      authContextStoreMock.visibleEntries = [
        'admin.permission-management',
        'tenant-settings.org-structure',
      ];
      listNavigationEntriesApiMock.mockResolvedValue({
        entries: [
          { entryKey: 'admin.permission-management' },
          { entryKey: 'tenant-settings.org-structure' },
        ],
        page: 1,
        pageSize: 100,
        total: 2,
      });
      const { generateAccess } = await import('./access');
      const { accessRoutes, routes } = await import('./routes');
      const router = createRouter({
        history: createMemoryHistory(),
        routes,
      });

      const result = await generateAccess({
        roles: ['system.admin', 'tenant.admin'],
        router,
        routes: accessRoutes,
      });
      const generatedRoutes = router.getRoutes();
      const systemRoute = generatedRoutes.find(
        (route) => route.name === 'AdminPermissionManagement',
      );
      const tenantRoute = generatedRoutes.find(
        (route) => route.name === 'TenantOrgStructureManagement',
      );

      expect(result.accessibleRoutes.length).toBeGreaterThan(0);
      expect(systemRoute?.components?.default).toBeTypeOf('function');
      expect(tenantRoute?.components?.default).toBeTypeOf('function');
      expect(listNavigationEntriesApiMock).toHaveBeenCalledTimes(
        accessMode === 'frontend' ? 0 : 1,
      );
    },
  );
});
