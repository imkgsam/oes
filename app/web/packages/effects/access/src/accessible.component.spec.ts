import type { RouteRecordRaw } from 'vue-router';

import { describe, expect, it } from 'vitest';

import { generateAccessible } from './accessible';

interface RouterStub {
  addRoute: (route: RouteRecordRaw) => void;
  getRoutes: () => RouteRecordRaw[];
  removeRoute: (name: string) => void;
}

// Builds one minimal router stub that is sufficient for generateAccessible route merging and menu generation tests.
function createRouterStub(): RouterStub {
  const rootRoute: RouteRecordRaw = {
    children: [],
    name: 'Root',
    path: '/',
  };

  return {
    addRoute(route: RouteRecordRaw) {
      if (route.path === '/') {
        rootRoute.children = route.children ?? [];
        return;
      }

      rootRoute.children = [...(rootRoute.children ?? []), route];
    },
    getRoutes() {
      return [rootRoute, ...(rootRoute.children ?? [])];
    },
    removeRoute(name: string) {
      if (name === rootRoute.name) {
        return;
      }

      rootRoute.children =
        rootRoute.children?.filter((route) => route.name !== name) ?? [];
    },
  };
}

describe('generateAccessible', () => {
  it('keeps frontend-only tenant settings routes in mixed mode when backend menus omit that parent', async () => {
    const router = createRouterStub();
    const frontendRoutes: RouteRecordRaw[] = [
      {
        children: [
          {
            meta: {
              entryKey: 'admin.policy-governance',
              title: '策略治理',
            },
            name: 'AdminPolicyGovernance',
            path: '/admin/policy-governance',
          },
        ],
        meta: {
          title: '权限治理',
        },
        name: 'TenantAdminGovernance',
        path: '/admin',
      },
      {
        children: [
          {
            meta: {
              entryKey: 'tenant-settings.login-mfa',
              title: '登录 MFA',
            },
            name: 'TenantLoginMfaSettings',
            path: '/settings/login-mfa',
          },
        ],
        meta: {
          title: '租户设置',
        },
        name: 'TenantSettings',
        path: '/settings',
      },
    ];

    const backendMenus = [
      {
        children: [
          {
            meta: {
              entryKey: 'admin.policy-governance',
              title: '策略治理',
            },
            name: 'AdminPolicyGovernance',
            path: '/admin/policy-governance',
          },
        ],
        meta: {
          title: '权限治理',
        },
        name: 'TenantAdminGovernance',
        path: '/admin',
      },
    ];

    const result = await generateAccessible('mixed', {
      fetchMenuListAsync: async () => backendMenus as any,
      pageMap: {},
      roles: [],
      router: router as any,
      routes: frontendRoutes,
    });

    expect(result.accessibleRoutes.map((route) => route.name)).toEqual(
      expect.arrayContaining(['TenantAdminGovernance', 'TenantSettings']),
    );
    expect(result.accessibleMenus).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '租户设置',
          path: '/settings',
        }),
      ]),
    );
    const tenantSettingsMenu = result.accessibleMenus.find(
      (menu) => menu.name === '租户设置',
    );
    expect(tenantSettingsMenu?.children).toEqual([
      expect.objectContaining({
        name: '登录 MFA',
        path: '/settings/login-mfa',
      }),
    ]);
  });
});
