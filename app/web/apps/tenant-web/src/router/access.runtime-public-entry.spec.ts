import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it, vi } from 'vitest';

const getAllMenusApiMock = vi.fn();
const localStorageMock = {
  getItem: vi.fn(() => null),
  removeItem: vi.fn(),
  setItem: vi.fn(),
};
const authContextStoreMock = {
  visibleEntries: [
    'workbench.home',
    'admin.auth-session-management',
    'admin.role-management',
    'admin.account-management',
    'admin.terminal-device-management',
    'tenant-settings.org-structure',
    'tenant-settings.employee-employment',
    'tenant-settings.login-mfa',
    'master-data.customer-management',
    'public-entry.business-cards',
    'public-entry.short-links',
  ],
};

vi.stubGlobal('localStorage', localStorageMock);

vi.mock('#/api', () => ({
  getAllMenusApi: getAllMenusApiMock,
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
  it('registers public-entry routes and legacy redirects when menu endpoint falls back to local routes', async () => {
    getAllMenusApiMock.mockRejectedValueOnce(new Error('missing menu endpoint'));
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
    expect(router.resolve('/public-entry/business-cards').matched.at(-1)?.name).toBe(
      'AdminBusinessCards',
    );
    expect(router.resolve('/admin/business-cards').matched.at(-1)?.name).toBe(
      'AdminBusinessCardsLegacyRedirect',
    );
    expect(router.resolve('/public-entry/short-links').matched.at(-1)?.name).toBe(
      'AdminPublicEntryShortLinks',
    );
    expect(router.resolve('/admin/public-entry-short-links').matched.at(-1)?.name).toBe(
      'AdminPublicEntryShortLinksLegacyRedirect',
    );
  });

  it('removes employee-scoped BusinessCard management when employee management is not visible', async () => {
    authContextStoreMock.visibleEntries = [
      'workbench.home',
    ];
    getAllMenusApiMock.mockRejectedValueOnce(new Error('missing menu endpoint'));
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
});
