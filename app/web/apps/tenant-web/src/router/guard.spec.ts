import { beforeEach, describe, expect, it, vi } from 'vitest';

const startProgressMock = vi.fn();
const stopProgressMock = vi.fn();
const fetchUserInfoMock = vi.fn();
const refreshCurrentSessionAccessMock = vi.fn();
const generateAccessMock = vi.fn();
const coreRouteNamesMock = ['Login'];

const accessStoreMock = {
  accessToken: 'access-token',
  isAccessChecked: true,
  setAccessMenus: vi.fn(),
  setAccessRoutes: vi.fn(),
  setIsAccessChecked: vi.fn(),
};

const userStoreMock = {
  userInfo: {
    homePath: '/workbench/home',
    roles: ['TENANT_ADMIN'],
  },
};

const authContextStoreMock = {
  sessionContext: {
    passwordSetupRequired: false,
  },
  visibleEntries: ['workbench.home'],
};

vi.mock('@vben/constants', () => ({
  LOGIN_PATH: '/login',
}));

vi.mock('@vben/preferences', () => ({
  preferences: {
    app: {
      defaultHomePath: '/workbench/home',
    },
    transition: {
      progress: false,
    },
  },
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => accessStoreMock,
  useUserStore: () => userStoreMock,
}));

vi.mock('@vben/utils', () => ({
  startProgress: startProgressMock,
  stopProgress: stopProgressMock,
}));

vi.mock('#/store', () => ({
  useAuthStore: () => ({
    fetchUserInfo: fetchUserInfoMock,
    refreshCurrentSessionAccess: refreshCurrentSessionAccessMock,
  }),
}));

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextStoreMock,
}));

vi.mock('#/router/access', () => ({
  generateAccess: generateAccessMock,
}));

vi.mock('#/router/routes', () => ({
  accessRoutes: [],
  coreRouteNames: coreRouteNamesMock,
}));

describe('createRouterGuard', () => {
  beforeEach(() => {
    startProgressMock.mockReset();
    stopProgressMock.mockReset();
    fetchUserInfoMock.mockReset();
    refreshCurrentSessionAccessMock.mockReset();
    generateAccessMock.mockReset();
    accessStoreMock.accessToken = 'access-token';
    accessStoreMock.isAccessChecked = true;
    accessStoreMock.setAccessMenus.mockReset();
    accessStoreMock.setAccessRoutes.mockReset();
    accessStoreMock.setIsAccessChecked.mockReset();
    userStoreMock.userInfo = {
      homePath: '/workbench/home',
      roles: ['TENANT_ADMIN'],
    };
    authContextStoreMock.sessionContext = {
      passwordSetupRequired: false,
    };
    authContextStoreMock.visibleEntries = ['workbench.home'];
    coreRouteNamesMock.splice(0, coreRouteNamesMock.length, 'Login');
  });

  it('keeps direct and refreshed public BusinessCard routes anonymous without a login redirect', async () => {
    const beforeEachHandlers: Array<(to: any, from: any) => Promise<any>> = [];
    const routerMock = {
      beforeEach: (handler: (to: any, from: any) => Promise<any>) => {
        beforeEachHandlers.push(handler);
      },
      afterEach: vi.fn(),
    };
    accessStoreMock.accessToken = '';
    coreRouteNamesMock.push('PublicBusinessCard');

    const { createRouterGuard } = await import('./guard');
    createRouterGuard(routerMock as any);

    const handler = beforeEachHandlers[1];
    expect(handler).toBeTypeOf('function');
    if (!handler)
      throw new Error('Public Business Card guard was not registered');
    const publicTarget = {
      fullPath: '/public/business-cards/00000000-0000-4000-8000-000000000701',
      meta: {},
      name: 'PublicBusinessCard',
      params: { businessCardId: '00000000-0000-4000-8000-000000000701' },
      path: '/public/business-cards/00000000-0000-4000-8000-000000000701',
      query: {},
    };

    await expect(handler(publicTarget, { query: {} })).resolves.toBe(true);
    await expect(handler(publicTarget, { query: {} })).resolves.toBe(true);
    expect(fetchUserInfoMock).not.toHaveBeenCalled();
    expect(refreshCurrentSessionAccessMock).not.toHaveBeenCalled();
    expect(generateAccessMock).not.toHaveBeenCalled();
  });

  it('refreshes the authenticated session once before reusing a persisted access snapshot', async () => {
    const beforeEachHandlers: Array<(to: any, from: any) => Promise<any>> = [];
    const afterEachHandlers: Array<(to: any) => void> = [];
    const workbenchRecord = { name: 'WorkbenchHome' };
    const targetRoute = {
      fullPath: '/workbench/home',
      matched: [workbenchRecord],
      meta: {},
      name: 'WorkbenchHome',
      path: '/workbench/home',
    };
    const routerMock = {
      beforeEach: (handler: (to: any, from: any) => Promise<any>) => {
        beforeEachHandlers.push(handler);
      },
      afterEach: (handler: (to: any) => void) => {
        afterEachHandlers.push(handler);
      },
      resolve: vi.fn(() => targetRoute),
    };

    const { createRouterGuard } = await import('./guard');
    createRouterGuard(routerMock as any);

    const handler = beforeEachHandlers[1];
    expect(handler).toBeTypeOf('function');
    if (!handler)
      throw new Error('Authenticated session guard was not registered');

    await expect(handler(targetRoute, { query: {} })).resolves.toBe(true);
    await expect(handler(targetRoute, { query: {} })).resolves.toBe(true);

    expect(refreshCurrentSessionAccessMock).toHaveBeenCalledTimes(1);
    expect(fetchUserInfoMock).not.toHaveBeenCalled();
    expect(generateAccessMock).not.toHaveBeenCalled();
    expect(afterEachHandlers).toHaveLength(1);
  });

  it('rematches a fallback target after persisted access refresh installs its dynamic route', async () => {
    const beforeEachHandlers: Array<(to: any, from: any) => Promise<any>> = [];
    const fallbackRecord = { name: 'FallbackNotFound' };
    const rootRecord = { name: 'Root' };
    const itemRecord = { name: 'TenantItemManagement' };
    const refreshedTarget = {
      fullPath: '/master-data/items',
      matched: [rootRecord, itemRecord],
      meta: { entryKey: 'master-data.item-management' },
      name: 'TenantItemManagement',
      path: '/master-data/items',
    };
    const routerMock = {
      beforeEach: (handler: (to: any, from: any) => Promise<any>) => {
        beforeEachHandlers.push(handler);
      },
      afterEach: vi.fn(),
      resolve: vi.fn(() => refreshedTarget),
    };

    const { createRouterGuard } = await import('./guard');
    createRouterGuard(routerMock as any);

    const handler = beforeEachHandlers[1];
    expect(handler).toBeTypeOf('function');
    if (!handler) throw new Error('Access refresh guard was not registered');
    const fallbackTarget = {
      fullPath: '/master-data/items',
      matched: [fallbackRecord],
      meta: {},
      name: 'FallbackNotFound',
      path: '/master-data/items',
    };

    await expect(handler(fallbackTarget, { query: {} })).resolves.toMatchObject({
      name: 'TenantItemManagement',
      path: '/master-data/items',
      replace: true,
    });
    await expect(handler(refreshedTarget, { query: {} })).resolves.toBe(true);

    expect(refreshCurrentSessionAccessMock).toHaveBeenCalledTimes(1);
    expect(routerMock.resolve).toHaveBeenCalledTimes(1);
    expect(routerMock.resolve).toHaveBeenCalledWith('/master-data/items');
  });

  it('rematches a visible target when access refresh replaces its matched route records', async () => {
    const beforeEachHandlers: Array<(to: any, from: any) => Promise<any>> = [];
    const targetBeforeRefresh = {
      fullPath: '/master-data/items',
      matched: [{ name: 'Root' }, { name: 'TenantItemManagement' }],
      meta: { entryKey: 'master-data.item-management' },
      name: 'TenantItemManagement',
      path: '/master-data/items',
    };
    const targetAfterRefresh = {
      ...targetBeforeRefresh,
      matched: [{ name: 'Root' }, { name: 'TenantItemManagement' }],
    };
    const routerMock = {
      beforeEach: (handler: (to: any, from: any) => Promise<any>) => {
        beforeEachHandlers.push(handler);
      },
      afterEach: vi.fn(),
      resolve: vi.fn(() => targetAfterRefresh),
    };

    const { createRouterGuard } = await import('./guard');
    createRouterGuard(routerMock as any);

    const handler = beforeEachHandlers[1];
    expect(handler).toBeTypeOf('function');
    if (!handler) throw new Error('Access refresh guard was not registered');

    await expect(handler(targetBeforeRefresh, { query: {} })).resolves.toMatchObject({
      name: 'TenantItemManagement',
      path: '/master-data/items',
      replace: true,
    });
    await expect(handler(targetAfterRefresh, { query: {} })).resolves.toBe(true);

    expect(refreshCurrentSessionAccessMock).toHaveBeenCalledTimes(1);
    expect(routerMock.resolve).toHaveBeenCalledTimes(1);
  });

  it('keeps an invisible dynamic target on the fallback route after access refresh', async () => {
    const beforeEachHandlers: Array<(to: any, from: any) => Promise<any>> = [];
    const fallbackRecord = { name: 'FallbackNotFound' };
    const fallbackTarget = {
      fullPath: '/master-data/suppliers',
      matched: [fallbackRecord],
      meta: {},
      name: 'FallbackNotFound',
      path: '/master-data/suppliers',
    };
    const routerMock = {
      beforeEach: (handler: (to: any, from: any) => Promise<any>) => {
        beforeEachHandlers.push(handler);
      },
      afterEach: vi.fn(),
      resolve: vi.fn(() => fallbackTarget),
    };

    const { createRouterGuard } = await import('./guard');
    createRouterGuard(routerMock as any);

    const handler = beforeEachHandlers[1];
    expect(handler).toBeTypeOf('function');
    if (!handler) throw new Error('Access refresh guard was not registered');

    await expect(handler(fallbackTarget, { query: {} })).resolves.toBe(true);

    expect(refreshCurrentSessionAccessMock).toHaveBeenCalledTimes(1);
    expect(routerMock.resolve).toHaveBeenCalledWith('/master-data/suppliers');
  });

  it('refreshes persisted user info before rebuilding access routes', async () => {
    const beforeEachHandlers: Array<(to: any, from: any) => Promise<any>> = [];
    const routerMock = {
      beforeEach: (handler: (to: any, from: any) => Promise<any>) => {
        beforeEachHandlers.push(handler);
      },
      afterEach: vi.fn(),
      resolve: vi.fn((path: string) => ({ fullPath: path, path })),
    };
    accessStoreMock.isAccessChecked = false;
    fetchUserInfoMock.mockResolvedValue({
      homePath: '/workbench/home',
      roles: ['TENANT_ADMIN'],
    });
    generateAccessMock.mockResolvedValue({
      accessibleMenus: [{ name: 'WorkbenchHome' }],
      accessibleRoutes: [{ name: 'WorkbenchHome' }],
    });

    const { createRouterGuard } = await import('./guard');
    createRouterGuard(routerMock as any);

    const handler = beforeEachHandlers[1];
    expect(handler).toBeTypeOf('function');
    if (!handler) throw new Error('Access rebuild guard was not registered');
    const targetRoute = {
      fullPath: '/crm/accounts/account-1',
      meta: {},
      name: 'TenantCrmAccountDetail',
      path: '/crm/accounts/account-1',
    };

    await expect(handler(targetRoute, { query: {} })).resolves.toMatchObject({
      path: '/crm/accounts/account-1',
      replace: true,
    });

    expect(fetchUserInfoMock).toHaveBeenCalledWith(true);
    expect(generateAccessMock).toHaveBeenCalledTimes(1);
    expect(accessStoreMock.setIsAccessChecked).toHaveBeenCalledWith(true);
  });
});
