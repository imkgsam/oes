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

  it('keeps the tenant settings parent when login mfa is the only visible settings child', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'tenant-settings.login-mfa',
            },
            name: 'TenantMfaSettings',
            path: '/settings/tenant-mfa',
          },
        ],
        name: 'TenantSettings',
        path: '/settings',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'tenant-settings.login-mfa',
    ]);

    expect(filtered).toEqual(routes);
  });

  it('keeps the tenant settings parent when org structure is the only visible tenant child', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'tenant-settings.org-structure',
            },
            name: 'TenantOrgStructureManagement',
            path: '/settings/org-structure',
          },
        ],
        name: 'TenantSettings',
        path: '/settings',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'tenant-settings.org-structure',
    ]);

    expect(filtered).toEqual(routes);
  });

  it('keeps the tenant settings parent when employee management is the only visible tenant child', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'tenant-settings.organization-people',
            },
            name: 'TenantOrganizationPeople',
            path: '/settings/organization-people',
          },
        ],
        name: 'TenantSettings',
        path: '/settings',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'tenant-settings.organization-people',
    ]);

    expect(filtered).toEqual(routes);
  });

  it('removes organization-people child routes when the new entry key is absent even if legacy keys remain visible', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'tenant-settings.organization-people',
            },
            name: 'TenantOrganizationPeople',
            path: '/settings/organization-people',
          },
          {
            meta: {
              entryKey: 'tenant-settings.organization-people',
            },
            name: 'TenantOrganizationPeopleMembers',
            path: '/settings/organization-people/members',
          },
          {
            meta: {
              entryKey: 'tenant-settings.organization-people',
            },
            name: 'TenantOrganizationPeopleDepartments',
            path: '/settings/organization-people/departments',
          },
          {
            meta: {
              entryKey: 'tenant-settings.org-structure',
              hideInMenu: true,
            },
            name: 'TenantOrgStructureManagement',
            path: '/settings/org-structure',
          },
          {
            meta: {
              entryKey: 'tenant-settings.employee-employment',
              hideInMenu: true,
            },
            name: 'TenantEmployeeEmploymentManagement',
            path: '/settings/employee-employment',
          },
        ],
        name: 'TenantSettings',
        path: '/settings',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'tenant-settings.org-structure',
      'tenant-settings.employee-employment',
    ]);

    expect(filtered).toEqual([
      {
        children: [
          {
            meta: {
              entryKey: 'tenant-settings.org-structure',
              hideInMenu: true,
            },
            name: 'TenantOrgStructureManagement',
            path: '/settings/org-structure',
          },
          {
            meta: {
              entryKey: 'tenant-settings.employee-employment',
              hideInMenu: true,
            },
            name: 'TenantEmployeeEmploymentManagement',
            path: '/settings/employee-employment',
          },
        ],
        name: 'TenantSettings',
        path: '/settings',
      },
    ]);
  });

  it('keeps the admin parent when platform mfa is the only visible platform child', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'admin.platform-mfa',
            },
            name: 'AdminPlatformMfaSettings',
            path: '/admin/platform-mfa',
          },
        ],
        name: 'TenantAdminGovernance',
        path: '/admin',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'admin.platform-mfa',
    ]);

    expect(filtered).toEqual(routes);
  });

  it('keeps the admin parent when tenant management is the only visible system-admin child', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'admin.tenant-management',
            },
            name: 'AdminTenantManagement',
            path: '/admin/tenant-management',
          },
        ],
        name: 'TenantAdminGovernance',
        path: '/admin',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'admin.tenant-management',
    ]);

    expect(filtered).toEqual(routes);
  });

  it('keeps the admin parent when org management is the only visible system-admin child', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'admin.org-management',
            },
            name: 'AdminOrgManagement',
            path: '/admin/org-management',
          },
        ],
        name: 'TenantAdminGovernance',
        path: '/admin',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'admin.org-management',
    ]);

    expect(filtered).toEqual(routes);
  });
});
