import { beforeEach, describe, expect, it, vi } from 'vitest';

const startProgressMock = vi.fn();
const stopProgressMock = vi.fn();
const fetchUserInfoMock = vi.fn();
const refreshCurrentSessionAccessMock = vi.fn();
const generateAccessMock = vi.fn();

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
  coreRouteNames: ['Login'],
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
  });

  it('refreshes the authenticated session once before reusing a persisted access snapshot', async () => {
    const beforeEachHandlers: Array<(to: any, from: any) => Promise<any>> = [];
    const afterEachHandlers: Array<(to: any) => void> = [];
    const routerMock = {
      beforeEach: (handler: (to: any, from: any) => Promise<any>) => {
        beforeEachHandlers.push(handler);
      },
      afterEach: (handler: (to: any) => void) => {
        afterEachHandlers.push(handler);
      },
    };

    const { createRouterGuard } = await import('./guard');
    createRouterGuard(routerMock as any);

    const handler = beforeEachHandlers[1];
    expect(handler).toBeTypeOf('function');

    const targetRoute = {
      fullPath: '/workbench/home',
      meta: {},
      name: 'WorkbenchHome',
      path: '/workbench/home',
    };

    await expect(handler!(targetRoute, { query: {} })).resolves.toBe(true);
    await expect(handler!(targetRoute, { query: {} })).resolves.toBe(true);

    expect(refreshCurrentSessionAccessMock).toHaveBeenCalledTimes(1);
    expect(fetchUserInfoMock).not.toHaveBeenCalled();
    expect(generateAccessMock).not.toHaveBeenCalled();
    expect(afterEachHandlers).toHaveLength(1);
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
    const targetRoute = {
      fullPath: '/crm/accounts/account-1',
      meta: {},
      name: 'TenantCrmAccountDetail',
      path: '/crm/accounts/account-1',
    };

    await expect(handler!(targetRoute, { query: {} })).resolves.toMatchObject({
      path: '/crm/accounts/account-1',
      replace: true,
    });

    expect(fetchUserInfoMock).toHaveBeenCalledWith(true);
    expect(generateAccessMock).toHaveBeenCalledTimes(1);
    expect(accessStoreMock.setIsAccessChecked).toHaveBeenCalledWith(true);
  });
});
