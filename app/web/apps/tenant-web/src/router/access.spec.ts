import { describe, expect, it, vi } from 'vitest';

vi.mock('@vben/access', () => ({
  generateAccessible: vi.fn(),
}));

vi.mock('@vben/preferences', () => ({
  preferences: {
    app: {
      accessMode: 'mixed',
    },
  },
}));

vi.mock('ant-design-vue', () => ({
  message: {
    loading: vi.fn(),
  },
}));

vi.mock('#/api', () => ({
  getAllMenusApi: vi.fn(),
}));

vi.mock('#/layouts', () => ({
  BasicLayout: {},
  IFrameView: {},
}));

vi.mock('#/locales', () => ({
  $t: (value: string) => value,
}));

vi.mock('#/store', () => ({
  useAuthContextStore: () => ({
    visibleEntries: [],
  }),
}));

// Verifies visible-entry filtering removes unauthorized governance parents from both route and menu trees.
describe('router access visible-entry filtering', () => {
  it('resolves a default entry path from route meta instead of a fixed entry list', async () => {
    const { resolveEntryPathFromRoutes } = await import('./entry-path');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'finance.dashboard',
            },
            name: 'FinanceDashboard',
            path: '/finance/dashboard',
          },
        ],
        name: 'Finance',
        path: '/finance',
      },
    ];

    expect(resolveEntryPathFromRoutes(routes, 'finance.dashboard')).toBe(
      '/finance/dashboard',
    );
    expect(resolveEntryPathFromRoutes(routes, 'admin.role-management')).toBeUndefined();
  });

  it('removes the tenant-admin governance parent when none of its children are visible', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'admin.permission-management',
            },
            name: 'AdminPermissionManagement',
            path: '/admin/permission-management',
          },
          {
            meta: {
              entryKey: 'admin.navigation-management',
            },
            name: 'AdminNavigationManagement',
            path: '/admin/navigation-management',
          },
        ],
        name: 'TenantAdminGovernance',
        path: '/admin',
      },
      {
        children: [
          {
            meta: {
              entryKey: 'workbench.home',
            },
            name: 'TenantWorkbenchHome',
            path: '/workbench/home',
          },
        ],
        name: 'TenantWorkbench',
        path: '/workbench',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, ['workbench.home']);

    expect(filtered).toEqual([
      {
        children: [
          {
            meta: {
              entryKey: 'workbench.home',
            },
            name: 'TenantWorkbenchHome',
            path: '/workbench/home',
          },
        ],
        name: 'TenantWorkbench',
        path: '/workbench',
      },
    ]);
  });

  it('keeps the governance parent when at least one child entry remains visible', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'admin.permission-management',
            },
            name: 'AdminPermissionManagement',
            path: '/admin/permission-management',
          },
        ],
        name: 'TenantAdminGovernance',
        path: '/admin',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'admin.permission-management',
    ]);

    expect(filtered).toEqual(routes);
  });

  it('keeps the governance parent when policy governance is the only visible admin child', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'admin.policy-governance',
            },
            name: 'AdminPolicyGovernance',
            path: '/admin/policy-governance',
          },
        ],
        name: 'TenantAdminGovernance',
        path: '/admin',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'admin.policy-governance',
    ]);

    expect(filtered).toEqual(routes);
  });
});
