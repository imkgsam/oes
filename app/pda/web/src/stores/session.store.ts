import { defineStore } from 'pinia';
import {
  fetchPdaBootstrap,
  logoutPda,
  PdaBffError,
  refreshPdaSession,
  type BootstrapResponse,
  type PdaDeviceAccessDecision,
  type PdaRefreshSessionResponse,
  type PdaVersionPolicy,
  type TerminalDeviceStatus,
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
  terminalDeviceId: string | null;
  terminalDeviceDisplayName: string | null;
  deviceStatus: TerminalDeviceStatus | null;
  decisionCode: string | null;
  versionPolicy: PdaVersionPolicy | null;
  shouldClearLocalSession: boolean;
  shouldClearLocalTerminalDeviceId: boolean;
  bootstrap: BootstrapResponse | null;
  operatorName: string | null;
  restoring: boolean;
};

type PersistedTerminalDeviceBinding = {
  terminalDeviceId: string;
  displayName?: string | null;
  tenantId?: string | null;
  deviceStatus?: TerminalDeviceStatus | null;
};

const TERMINAL_DEVICE_BINDING_STORAGE_KEY = 'oes:pda:terminal-device-binding';
const WEBVIEW_SESSION_ACTIVE_STORAGE_KEY = 'oes:pda:webview-session-active';

/** Owns PDA session lifecycle across login, foreground refresh, app restart cleanup, and logout. */
export const useSessionStore = defineStore('pda-session', {
  state: (): SessionState => ({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    terminalDeviceId: null,
    terminalDeviceDisplayName: null,
    deviceStatus: null,
    decisionCode: null,
    versionPolicy: null,
    shouldClearLocalSession: false,
    shouldClearLocalTerminalDeviceId: false,
    bootstrap: null,
    operatorName: null,
    restoring: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken),
    hasTerminalDeviceBinding: (state) => Boolean(state.terminalDeviceId),
  },
  actions: {
    async signIn(session: PdaRefreshSessionResponse, operatorName: string) {
      await this.applyTokenPair(session);
      this.operatorName = operatorName;
    },
    async applyBootstrap(bootstrap: BootstrapResponse): Promise<void> {
      this.bootstrap = bootstrap;
      this.operatorName = bootstrap.account?.displayName || this.operatorName;
      if (bootstrap.device?.terminalDeviceId) {
        await this.setTerminalDeviceBinding({
          terminalDeviceId: bootstrap.device.terminalDeviceId,
          displayName: bootstrap.device.displayName,
          tenantId: bootstrap.device.tenantId,
          deviceStatus: bootstrap.device.deviceStatus,
        });
      }
      if (bootstrap.decision) {
        await this.applyDeviceDecision(bootstrap.decision);
      }
    },
    loadTerminalDeviceBinding(): PersistedTerminalDeviceBinding | null {
      if (this.terminalDeviceId) {
        return {
          terminalDeviceId: this.terminalDeviceId,
          displayName: this.terminalDeviceDisplayName,
          deviceStatus: this.deviceStatus,
        };
      }

      const binding = loadPersistedTerminalDeviceBinding();
      if (!binding?.terminalDeviceId) {
        return null;
      }

      this.terminalDeviceId = binding.terminalDeviceId;
      this.terminalDeviceDisplayName = binding.displayName ?? null;
      this.deviceStatus = binding.deviceStatus ?? null;
      this.decisionCode = resolveDecisionCodeForDeviceStatus(this.deviceStatus);
      return binding;
    },
    async setTerminalDeviceBinding(binding: PersistedTerminalDeviceBinding): Promise<void> {
      this.terminalDeviceId = binding.terminalDeviceId;
      this.terminalDeviceDisplayName = binding.displayName ?? this.terminalDeviceDisplayName;
      this.deviceStatus = binding.deviceStatus ?? this.deviceStatus;
      persistTerminalDeviceBinding(binding);
    },
    async clearTerminalDeviceBinding(): Promise<void> {
      this.terminalDeviceId = null;
      this.terminalDeviceDisplayName = null;
      this.deviceStatus = null;
      this.decisionCode = null;
      this.versionPolicy = null;
      clearPersistedTerminalDeviceBinding();
    },
    async applyDeviceDecision(decision: PdaDeviceAccessDecision): Promise<void> {
      this.decisionCode = decision.decisionCode;
      this.deviceStatus = decision.deviceStatus ?? this.deviceStatus;
      this.versionPolicy = decision.versionPolicy ?? this.versionPolicy;
      this.shouldClearLocalSession = decision.shouldClearLocalSession;
      this.shouldClearLocalTerminalDeviceId = decision.shouldClearLocalTerminalDeviceId;

      if (decision.shouldClearLocalSession) {
        await this.clearSession();
      }
      if (decision.shouldClearLocalTerminalDeviceId) {
        await this.clearTerminalDeviceBinding();
      }
    },
    async restoreSession(): Promise<boolean> {
      if (this.restoring || this.isAuthenticated) {
        return this.isAuthenticated;
      }

      this.restoring = true;
      try {
        const terminalDeviceBinding = this.loadTerminalDeviceBinding();
        if (!terminalDeviceBinding?.terminalDeviceId) {
          return false;
        }

        if (!hasActiveWebViewSession()) {
          await this.clearSession();
          return false;
        }

        const tokens = await loadSessionTokens();
        if (!tokens?.accessToken || !tokens.refreshToken || !isFutureIsoDate(tokens.expiresAt)) {
          await this.clearSession();
          return false;
        }

        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        this.expiresAt = tokens.expiresAt;

        const bootstrap = await fetchPdaBootstrap(tokens.accessToken, terminalDeviceBinding.terminalDeviceId);
        await this.applyBootstrap(bootstrap);
        return true;
      } catch {
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
      clearActiveWebViewSession();
      await clearSessionTokens();
    },
    async applyTokenPair(session: PdaRefreshSessionResponse): Promise<void> {
      this.accessToken = session.accessToken;
      this.refreshToken = session.refreshToken;
      this.expiresAt = calculateExpiresAt(session.expiresIn);
      markActiveWebViewSession();
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

/** Loads the local pointer to the server-owned terminal device record. */
function loadPersistedTerminalDeviceBinding(): PersistedTerminalDeviceBinding | null {
  const rawValue = getBrowserStorage()?.getItem(TERMINAL_DEVICE_BINDING_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as PersistedTerminalDeviceBinding;
  } catch {
    clearPersistedTerminalDeviceBinding();
    return null;
  }
}

/** Persists only the local terminal device pointer and display metadata. */
function persistTerminalDeviceBinding(binding: PersistedTerminalDeviceBinding): void {
  getBrowserStorage()?.setItem(TERMINAL_DEVICE_BINDING_STORAGE_KEY, JSON.stringify(binding));
}

/** Removes the local terminal device pointer after unenrollment or identity reset. */
function clearPersistedTerminalDeviceBinding(): void {
  getBrowserStorage()?.removeItem(TERMINAL_DEVICE_BINDING_STORAGE_KEY);
}

/** Returns browser storage when WebView privacy settings allow local persistence. */
function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function calculateExpiresAt(expiresIn: number): string {
  const safeExpiresIn = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 900;
  return new Date(Date.now() + safeExpiresIn * 1000).toISOString();
}

function isFutureIsoDate(value: string): boolean {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function markActiveWebViewSession(): void {
  getBrowserSessionStorage()?.setItem(WEBVIEW_SESSION_ACTIVE_STORAGE_KEY, '1');
}

function hasActiveWebViewSession(): boolean {
  return getBrowserSessionStorage()?.getItem(WEBVIEW_SESSION_ACTIVE_STORAGE_KEY) === '1';
}

function clearActiveWebViewSession(): void {
  getBrowserSessionStorage()?.removeItem(WEBVIEW_SESSION_ACTIVE_STORAGE_KEY);
}

function getBrowserSessionStorage(): Storage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

function isAuthRejected(error: unknown): boolean {
  return error instanceof PdaBffError && (error.status === 401 || error.status === 403);
}

/** Converts persisted terminal device status back into the local route decision after app restart. */
function resolveDecisionCodeForDeviceStatus(status: TerminalDeviceStatus | null): string | null {
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'DEVICE_PENDING_APPROVAL';
    case 'DISABLED':
      return 'DEVICE_DISABLED';
    case 'LOST':
      return 'DEVICE_LOST';
    case 'MAINTENANCE':
      return 'DEVICE_MAINTENANCE';
    case 'DECOMMISSIONED':
      return 'DEVICE_DECOMMISSIONED';
    default:
      return null;
  }
}
