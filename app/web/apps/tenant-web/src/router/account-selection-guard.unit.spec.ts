import { createMemoryHistory, createRouter } from 'vue-router';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const authStoreMock = {
  authBlockReason: null as 'MFA_FACTOR_UNAVAILABLE' | null,
  fetchUserInfo: vi.fn(),
  hasPendingAccountSelection: false,
  refreshCurrentSessionAccess: vi.fn(),
  resetPendingAuthFlow: vi.fn(),
};

const accessStoreMock = {
  accessToken: '',
  isAccessChecked: false,
};

const userStoreMock = {
  userInfo: null as null | { homePath?: string },
};

vi.mock('@vben/constants', () => ({
  LOGIN_PATH: '/auth/login',
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
  startProgress: vi.fn(),
  stopProgress: vi.fn(),
}));

vi.mock('#/store', () => ({
  useAuthStore: () => authStoreMock,
}));

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => ({
    sessionContext: null,
  }),
}));

vi.mock('#/router/access', () => ({
  generateAccess: vi.fn(),
}));

vi.mock('#/router/routes', () => ({
  accessRoutes: [],
  coreRouteNames: [
    'Login',
    'AccountSelection',
    'MfaFactorUnavailable',
  ],
}));

function createGuardedRouter() {
  const accountSelectionComponentLoad = vi.fn(async () => ({
    template: '<div class="account-selection-shell" />',
  }));
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        component: { template: '<div class="login-page" />' },
        name: 'Login',
        path: '/auth/login',
      },
      {
        component: accountSelectionComponentLoad,
        name: 'AccountSelection',
        path: '/auth/account-selection',
      },
      {
        component: { template: '<div class="mfa-unavailable-page" />' },
        name: 'MfaFactorUnavailable',
        path: '/auth/mfa-factor-unavailable',
      },
      {
        component: { template: '<div class="workbench-page" />' },
        name: 'WorkbenchHome',
        path: '/workbench/home',
      },
    ],
  });

  return { accountSelectionComponentLoad, router };
}

// Verifies account-selection state is decided before Vue Router resolves the lazy page component.
describe('account-selection route guard', () => {
  beforeEach(() => {
    authStoreMock.authBlockReason = null;
    authStoreMock.hasPendingAccountSelection = false;
    authStoreMock.fetchUserInfo.mockReset();
    authStoreMock.refreshCurrentSessionAccess.mockReset();
    authStoreMock.resetPendingAuthFlow.mockReset();
    accessStoreMock.accessToken = '';
    accessStoreMock.isAccessChecked = false;
    userStoreMock.userInfo = null;
  });

  it('redirects a direct or reloaded route before loading the account-selection shell', async () => {
    const { accountSelectionComponentLoad, router } = createGuardedRouter();
    const { createRouterGuard } = await import('./guard');
    createRouterGuard(router);

    await router.push({ name: 'AccountSelection' });

    expect(router.currentRoute.value.name).toBe('Login');
    expect(accountSelectionComponentLoad).not.toHaveBeenCalled();
    expect(authStoreMock.resetPendingAuthFlow).toHaveBeenCalledTimes(1);
  });

  it('loads the route when a complete pending selection exists', async () => {
    authStoreMock.hasPendingAccountSelection = true;
    const { accountSelectionComponentLoad, router } = createGuardedRouter();
    const { createRouterGuard } = await import('./guard');
    createRouterGuard(router);

    await router.push({ name: 'AccountSelection' });

    expect(router.currentRoute.value.name).toBe('AccountSelection');
    expect(accountSelectionComponentLoad).toHaveBeenCalledTimes(1);
    expect(authStoreMock.resetPendingAuthFlow).not.toHaveBeenCalled();
  });

  it('preserves the dedicated unavailable-MFA boundary without loading the selection shell', async () => {
    authStoreMock.authBlockReason = 'MFA_FACTOR_UNAVAILABLE';
    const { accountSelectionComponentLoad, router } = createGuardedRouter();
    const { createRouterGuard } = await import('./guard');
    createRouterGuard(router);

    await router.push({ name: 'AccountSelection' });

    expect(router.currentRoute.value.name).toBe('MfaFactorUnavailable');
    expect(accountSelectionComponentLoad).not.toHaveBeenCalled();
    expect(authStoreMock.resetPendingAuthFlow).not.toHaveBeenCalled();
  });

  it('returns a consumed back-navigation entry to the signed-in home without loading the shell', async () => {
    authStoreMock.hasPendingAccountSelection = true;
    const { accountSelectionComponentLoad, router } = createGuardedRouter();
    const { createRouterGuard } = await import('./guard');
    createRouterGuard(router);
    await router.push({ name: 'AccountSelection' });

    authStoreMock.hasPendingAccountSelection = false;
    accessStoreMock.accessToken = 'access-token';
    accessStoreMock.isAccessChecked = true;
    userStoreMock.userInfo = { homePath: '/workbench/home' };
    await router.push({ name: 'WorkbenchHome' });
    await router.push({ name: 'AccountSelection' });

    expect(router.currentRoute.value.name).toBe('WorkbenchHome');
    expect(accountSelectionComponentLoad).toHaveBeenCalledTimes(1);
    expect(authStoreMock.resetPendingAuthFlow).toHaveBeenCalledTimes(1);
  });
});
