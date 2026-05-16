import { defineStore } from 'pinia';
import {
  fetchPdaBootstrap,
  logoutPda,
  PdaBffError,
  refreshPdaSession,
  type BootstrapResponse,
  type PdaRefreshSessionResponse,
} from '@/api/pda-bff.client';
import {
  clearSessionTokens,
  loadSessionTokens,
  saveSessionTokens,
  type PersistedSessionTokens,
} from './session-token-store';

type SessionState = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  bootstrap: BootstrapResponse | null;
  operatorName: string | null;
  restoring: boolean;
};

/** Owns PDA session lifecycle across login, restart restore, refresh, and logout. */
export const useSessionStore = defineStore('pda-session', {
  state: (): SessionState => ({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    bootstrap: null,
    operatorName: null,
    restoring: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken),
  },
  actions: {
    async signIn(session: PdaRefreshSessionResponse, operatorName: string) {
      await this.applyTokenPair(session);
      this.operatorName = operatorName;
    },
    applyBootstrap(bootstrap: BootstrapResponse) {
      this.bootstrap = bootstrap;
      this.operatorName = bootstrap.account?.displayName || this.operatorName;
    },
    async restoreSession(): Promise<boolean> {
      if (this.restoring || this.isAuthenticated) {
        return this.isAuthenticated;
      }

      this.restoring = true;
      try {
        const tokens = await loadSessionTokens();
        if (!tokens?.refreshToken) {
          return false;
        }

        const refreshed = await refreshPdaSession(tokens.refreshToken);
        if (!refreshed.accessToken || !refreshed.refreshToken) {
          await this.clearSession();
          return false;
        }

        await this.applyTokenPair(refreshed);
        const bootstrap = await fetchPdaBootstrap(refreshed.accessToken);
        this.applyBootstrap(bootstrap);
        return true;
      } catch (error) {
        if (isAuthRejected(error)) {
          await this.clearSession();
          return false;
        }

        await this.clearSession();
        return false;
      } finally {
        this.restoring = false;
      }
    },
    async refreshSession(): Promise<boolean> {
      if (!this.refreshToken) {
        await this.clearSession();
        return false;
      }

      try {
        const refreshed = await refreshPdaSession(this.refreshToken);
        await this.applyTokenPair(refreshed);
        return true;
      } catch (error) {
        if (isAuthRejected(error)) {
          await this.clearSession();
        }
        return false;
      }
    },
    async logout(): Promise<void> {
      const token = this.accessToken;
      await this.clearSession();

      if (!token) {
        return;
      }

      try {
        await logoutPda(token);
      } catch {
        // Local cleanup wins for PDA operators; server-side revocation can fail when the LAN is down.
      }
    },
    async clearSession() {
      this.accessToken = null;
      this.refreshToken = null;
      this.expiresAt = null;
      this.bootstrap = null;
      this.operatorName = null;
      await clearSessionTokens();
    },
    async applyTokenPair(session: PdaRefreshSessionResponse): Promise<void> {
      this.accessToken = session.accessToken;
      this.refreshToken = session.refreshToken;
      this.expiresAt = calculateExpiresAt(session.expiresIn);
      await saveSessionTokens(this.toPersistedTokens());
    },
    toPersistedTokens(): PersistedSessionTokens {
      return {
        accessToken: this.accessToken || '',
        refreshToken: this.refreshToken || '',
        expiresAt: this.expiresAt || new Date(0).toISOString(),
      };
    },
  },
});

function calculateExpiresAt(expiresIn: number): string {
  const safeExpiresIn = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 900;
  return new Date(Date.now() + safeExpiresIn * 1000).toISOString();
}

function isAuthRejected(error: unknown): boolean {
  return error instanceof PdaBffError && (error.status === 401 || error.status === 403);
}
