import type { UserApi } from '#/api';

import { defineStore } from 'pinia';

import { resolveEntryPathFromRoutes } from '#/router/entry-path';
import { accessRoutes } from '#/router/routes';

interface AuthContextState {
  accessSummary: null | UserApi.SessionAccessSummary;
  homePath: string;
  sessionContext: null | UserApi.SessionContext;
  visibleEntries: string[];
}

// Stores the authenticated OES context returned by auth-bff separately from Vben's basic user profile.
export const useAuthContextStore = defineStore('auth-context', {
  actions: {
    resolveEntryPath(entry?: string) {
      return resolveEntryPathFromRoutes(accessRoutes, entry);
    },
    setAuthContext(
      sessionContext: UserApi.SessionContext,
      accessSummary: UserApi.SessionAccessSummary,
    ) {
      const defaultEntryPath = this.resolveEntryPath(
        sessionContext.navigation?.defaultEntry,
      );
      this.sessionContext = sessionContext;
      this.accessSummary = accessSummary;
      this.visibleEntries = sessionContext.navigation?.visibleEntries ?? [];
      this.homePath =
        defaultEntryPath ||
        sessionContext.navigation?.defaultHomePath ||
        '/workbench/home';
    },
  },
  getters: {
    accountName: (state) => state.sessionContext?.account?.name ?? '',
    actionCodes: (state) => state.accessSummary?.actionCodes ?? [],
    isPlatformScope: (state) => state.sessionContext?.scopeLevel === 'SYSTEM',
    operatorName: (state) => state.sessionContext?.operator?.displayName ?? '',
    roleCodes: (state) =>
      state.accessSummary?.roles?.map((role) => role.code).filter(Boolean) ??
      [],
    scopeLabel: (state) =>
      state.sessionContext?.scopeLevel === 'SYSTEM' ? 'Platform' : 'Tenant',
    tenantName: (state) => state.sessionContext?.tenant?.name ?? '',
  },
  persist: {
    pick: ['accessSummary', 'homePath', 'sessionContext', 'visibleEntries'],
  },
  state: (): AuthContextState => ({
    accessSummary: null,
    homePath: '/workbench/home',
    sessionContext: null,
    visibleEntries: [],
  }),
});
