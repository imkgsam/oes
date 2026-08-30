import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateAccessibleMock = vi.fn();
const listNavigationEntriesApiMock = vi.fn();
const authContextStoreMock = {
  visibleEntries: [] as string[],
};

vi.mock('@vben/access', () => ({
  generateAccessible: generateAccessibleMock,
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
  listNavigationEntriesApi: listNavigationEntriesApiMock,
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

// Verifies visible-entry filtering removes unauthorized governance parents from both route and menu trees.
describe('router access visible-entry filtering', () => {
  beforeEach(() => {
    authContextStoreMock.visibleEntries = [];
    generateAccessibleMock.mockReset();
    listNavigationEntriesApiMock.mockReset();
  });

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
    expect(
      resolveEntryPathFromRoutes(routes, 'admin.role-management'),
    ).toBeUndefined();
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

  it('keeps the public touchpoint parent when BusinessCard or ShortLink entries are visible', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'public-entry.business-cards',
            },
            name: 'AdminBusinessCards',
            path: '/public-entry/business-cards',
          },
          {
            meta: {
              entryKey: 'public-entry.short-links',
            },
            name: 'AdminPublicEntryShortLinks',
            path: '/public-entry/short-links',
          },
        ],
        name: 'TenantPublicEntry',
        path: '/public-entry',
      },
      {
        meta: {
          hideInMenu: true,
        },
        name: 'EmployeeBusinessCardSelfView',
        path: '/profile/business-card',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'public-entry.business-cards',
    ]);

    expect(filtered).toEqual([
      {
        children: [
          {
            meta: {
              entryKey: 'public-entry.business-cards',
            },
            name: 'AdminBusinessCards',
            path: '/public-entry/business-cards',
          },
        ],
        name: 'TenantPublicEntry',
        path: '/public-entry',
      },
      {
        meta: {
          hideInMenu: true,
        },
        name: 'EmployeeBusinessCardSelfView',
        path: '/profile/business-card',
      },
    ]);
  });

  it('keeps the finance parent when the finance dashboard entry is visible', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'finance.dashboard',
            },
            name: 'TenantFinanceDashboard',
            path: '/finance/dashboard',
          },
        ],
        name: 'TenantFinance',
        path: '/finance',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'finance.dashboard',
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
              entryKey: 'tenant-settings.employee-employment',
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
      'tenant-settings.employee-employment',
    ]);

    expect(filtered).toEqual(routes);
  });

  it('removes tenant settings when employee-only hidden children are not authorized', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'tenant-settings.employee-employment',
            },
            name: 'TenantEmployeeEmploymentManagement',
            path: '/settings/employee-employment',
          },
          {
            meta: {
              activePath: '/settings/employee-employment',
              entryKey: 'tenant-settings.employee-employment',
              hideInMenu: true,
            },
            name: 'TenantEmployeeBusinessCards',
            path: '/settings/employee-employment/business-cards',
          },
        ],
        name: 'TenantSettings',
        path: '/settings',
      },
    ];

    expect(filterRoutesByVisibleEntries(routes, ['workbench.home'])).toEqual(
      [],
    );
    expect(
      filterRoutesByVisibleEntries(routes, [
        'tenant-settings.employee-employment',
      ]),
    ).toEqual(routes);
  });

  it('removes the master-data parent when none of its children remain visible', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'master-data.item-management',
            },
            name: 'TenantItemManagement',
            path: '/master-data/items',
          },
        ],
        name: 'TenantMasterData',
        path: '/master-data',
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

  it('keeps the master-data parent when item management is the only visible child', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'master-data.item-management',
            },
            name: 'TenantItemManagement',
            path: '/master-data/items',
          },
        ],
        name: 'TenantMasterData',
        path: '/master-data',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'master-data.item-management',
    ]);

    expect(filtered).toEqual(routes);
  });

  it('keeps the master-data parent when customer management is the only visible child', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'master-data.customer-management',
            },
            name: 'TenantCustomerManagement',
            path: '/master-data/customers',
          },
        ],
        name: 'TenantMasterData',
        path: '/master-data',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'master-data.customer-management',
    ]);

    expect(filtered).toEqual(routes);
  });

  it('keeps the master-data parent when supplier management is the only visible child', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'master-data.supplier-management',
            },
            name: 'TenantSupplierManagement',
            path: '/master-data/suppliers',
          },
        ],
        name: 'TenantMasterData',
        path: '/master-data',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'master-data.supplier-management',
    ]);

    expect(filtered).toEqual(routes);
  });

  it('removes the MES parent when mold management is not visible', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'mes.mold-management',
            },
            name: 'TenantMesMoldManagement',
            path: '/mes/mold-management',
          },
        ],
        name: 'TenantMes',
        path: '/mes',
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

  it('keeps the MES parent when mold management is visible', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'mes.mold-management',
            },
            name: 'TenantMesMoldManagement',
            path: '/mes/mold-management',
          },
        ],
        name: 'TenantMes',
        path: '/mes',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'mes.mold-management',
    ]);

    expect(filtered).toEqual(routes);
  });

  it('keeps split organization and employee settings routes as sibling tenant settings entries', async () => {
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
          {
            meta: {
              entryKey: 'tenant-settings.employee-employment',
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
            },
            name: 'TenantOrgStructureManagement',
            path: '/settings/org-structure',
          },
          {
            meta: {
              entryKey: 'tenant-settings.employee-employment',
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

  it('removes the sales parent when the governed sales entry is not visible', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'sales.quote-orders',
            },
            name: 'TenantSalesQuoteOrderWorkspace',
            path: '/sales/quote-orders',
          },
        ],
        name: 'TenantSales',
        path: '/sales',
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

  it('maps canonical registry entries onto visible SYSTEM and TENANT local routes', async () => {
    authContextStoreMock.visibleEntries = [
      'admin.permission-management',
      'tenant-settings.org-structure',
    ];
    listNavigationEntriesApiMock.mockResolvedValueOnce({
      entries: [
        {
          enabled: true,
          entryKey: 'admin.permission-management',
          supportedTerminals: ['WEB'],
        },
        {
          enabled: true,
          entryKey: 'tenant-settings.org-structure',
          supportedTerminals: ['WEB'],
        },
        {
          enabled: true,
          entryKey: 'unknown.unmapped',
          supportedTerminals: ['WEB'],
        },
      ],
      page: 1,
      pageSize: 100,
      total: 3,
    });
    generateAccessibleMock.mockImplementationOnce(async (_mode, input) => {
      return {
        accessibleMenus: input.routes,
        accessibleRoutes: input.routes,
      };
    });

    const { generateAccess } = await import('./access');
    const routes = [
      {
        children: [
          {
            component: () => Promise.resolve({}),
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
      {
        children: [
          {
            component: () => Promise.resolve({}),
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
    ] as any;

    const result = await generateAccess({
      roles: ['SYSTEM_ADMIN', 'TENANT_ADMIN'],
      router: {} as never,
      routes,
    });

    expect(listNavigationEntriesApiMock).toHaveBeenCalledWith({
      enabled: true,
      page: 1,
      pageSize: 100,
      terminal: 'WEB',
    });
    expect(generateAccessibleMock).toHaveBeenCalledWith(
      'frontend',
      expect.objectContaining({ routes }),
    );
    expect(result.accessibleMenus).toEqual(routes);
    expect(result.accessibleRoutes).toEqual(routes);
  });

  it('reads every canonical registry page before mapping local routes', async () => {
    authContextStoreMock.visibleEntries = [
      'admin.permission-management',
      'tenant-settings.org-structure',
    ];
    listNavigationEntriesApiMock
      .mockResolvedValueOnce({
        entries: [{ entryKey: 'admin.permission-management' }],
        page: 1,
        pageSize: 100,
        total: 2,
      })
      .mockResolvedValueOnce({
        entries: [{ entryKey: 'tenant-settings.org-structure' }],
        page: 2,
        pageSize: 100,
        total: 2,
      });
    generateAccessibleMock.mockImplementationOnce(async (_mode, input) => ({
      accessibleMenus: input.routes,
      accessibleRoutes: input.routes,
    }));

    const { generateAccess } = await import('./access');
    const routes = [
      {
        meta: { entryKey: 'admin.permission-management' },
        name: 'AdminPermissionManagement',
        path: '/admin/permission-management',
      },
      {
        meta: { entryKey: 'tenant-settings.org-structure' },
        name: 'TenantOrgStructureManagement',
        path: '/settings/org-structure',
      },
    ] as any;

    const result = await generateAccess({
      roles: ['SYSTEM_ADMIN', 'TENANT_ADMIN'],
      router: {} as never,
      routes,
    });

    expect(listNavigationEntriesApiMock).toHaveBeenNthCalledWith(2, {
      enabled: true,
      page: 2,
      pageSize: 100,
      terminal: 'WEB',
    });
    expect(result.accessibleMenus).toEqual(routes);
  });

  it('returns no governed routes for an empty canonical registry result', async () => {
    authContextStoreMock.visibleEntries = ['admin.permission-management'];
    listNavigationEntriesApiMock.mockResolvedValueOnce({
      entries: [],
      page: 1,
      pageSize: 100,
      total: 0,
    });
    generateAccessibleMock.mockImplementationOnce(async (_mode, input) => ({
      accessibleMenus: input.routes,
      accessibleRoutes: input.routes,
    }));

    const { generateAccess } = await import('./access');
    const result = await generateAccess({
      roles: ['SYSTEM_ADMIN'],
      router: {} as never,
      routes: [
        {
          meta: { entryKey: 'admin.permission-management' },
          name: 'AdminPermissionManagement',
          path: '/admin/permission-management',
        },
      ] as any,
    });

    expect(result.accessibleMenus).toEqual([]);
    expect(result.accessibleRoutes).toEqual([]);
  });

  it.each([
    [
      'permission denial',
      Object.assign(new Error('forbidden'), { status: 403 }),
    ],
    [
      'service failure',
      Object.assign(new Error('unavailable'), { status: 503 }),
    ],
  ])('propagates %s without restoring local routes', async (_label, error) => {
    authContextStoreMock.visibleEntries = ['admin.permission-management'];
    listNavigationEntriesApiMock.mockRejectedValueOnce(error);
    generateAccessibleMock.mockImplementationOnce(async (_mode, input) => ({
      accessibleMenus: await input.fetchMenuListAsync(),
      accessibleRoutes: input.routes,
    }));

    const { generateAccess } = await import('./access');

    await expect(
      generateAccess({
        roles: ['SYSTEM_ADMIN'],
        router: {} as never,
        routes: [
          {
            meta: { entryKey: 'admin.permission-management' },
            name: 'AdminPermissionManagement',
            path: '/admin/permission-management',
          },
        ] as any,
      }),
    ).rejects.toBe(error);
  });

  it('removes the procurement parent when the procurement entry is not visible', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'procurement.management',
            },
            name: 'TenantPurchaseRequestWorkspace',
            path: '/procurement/purchase-requests',
          },
        ],
        name: 'TenantProcurement',
        path: '/procurement',
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

  it('keeps the procurement parent when the procurement entry remains visible', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'procurement.management',
            },
            name: 'TenantPurchaseRequestWorkspace',
            path: '/procurement/purchase-requests',
          },
        ],
        name: 'TenantProcurement',
        path: '/procurement',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, [
      'procurement.management',
    ]);

    expect(filtered).toEqual(routes);
  });
});
