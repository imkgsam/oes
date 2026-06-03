import { useSessionStore } from '@/stores/session.store';

type PdaSessionLifecycleOptions = {
  idleTimeoutMs?: number;
  refreshLeadMs?: number;
  refreshCheckIntervalMs?: number;
  onIdleLogout?: () => void | Promise<void>;
};

const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const DEFAULT_REFRESH_LEAD_MS = 2 * 60 * 1000;
const DEFAULT_REFRESH_CHECK_INTERVAL_MS = 30 * 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'touchstart', 'keydown', 'click'] as const;

let lifecycleOptions: Required<PdaSessionLifecycleOptions>;
let idleTimer: number | undefined;
let refreshTimer: number | undefined;
let lastActivityAt = Date.now();
let refreshing = false;
let installed = false;

/** Starts PDA-only user session expiry and token rotation while the authenticated workbench is mounted. */
export function startPdaSessionLifecycle(options: PdaSessionLifecycleOptions = {}): void {
  stopPdaSessionLifecycle();
  lifecycleOptions = {
    idleTimeoutMs: options.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS,
    refreshLeadMs: options.refreshLeadMs ?? DEFAULT_REFRESH_LEAD_MS,
    refreshCheckIntervalMs: options.refreshCheckIntervalMs ?? DEFAULT_REFRESH_CHECK_INTERVAL_MS,
    onIdleLogout: options.onIdleLogout ?? (() => undefined),
  };
  installed = true;
  markPdaUserActivity();
  installActivityListeners();
  refreshTimer = window.setInterval(() => {
    void refreshIfNeeded();
  }, lifecycleOptions.refreshCheckIntervalMs);
}

/** Stops PDA session lifecycle timers when the authenticated workbench unmounts. */
export function stopPdaSessionLifecycle(): void {
  if (idleTimer !== undefined) {
    window.clearTimeout(idleTimer);
    idleTimer = undefined;
  }
  if (refreshTimer !== undefined) {
    window.clearInterval(refreshTimer);
    refreshTimer = undefined;
  }
  if (installed) {
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, markPdaUserActivity);
    });
  }
  installed = false;
  refreshing = false;
}

/** Records operator activity so active PDA work can refresh tokens while idle sessions expire quickly. */
export function markPdaUserActivity(): void {
  lastActivityAt = Date.now();
  scheduleIdleLogout();
}

function installActivityListeners(): void {
  ACTIVITY_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, markPdaUserActivity, { passive: true });
  });
}

function scheduleIdleLogout(): void {
  if (!installed || !lifecycleOptions) {
    return;
  }
  if (idleTimer !== undefined) {
    window.clearTimeout(idleTimer);
  }
  idleTimer = window.setTimeout(() => {
    void logoutIdleSession();
  }, lifecycleOptions.idleTimeoutMs);
}

async function logoutIdleSession(): Promise<void> {
  const sessionStore = useSessionStore();
  if (!sessionStore.isAuthenticated) {
    return;
  }

  await sessionStore.logout();
  await lifecycleOptions.onIdleLogout();
}

async function refreshIfNeeded(): Promise<void> {
  const sessionStore = useSessionStore();
  if (refreshing || !sessionStore.isAuthenticated || !sessionStore.expiresAt) {
    return;
  }

  const remainingMs = new Date(sessionStore.expiresAt).getTime() - Date.now();
  const idleMs = Date.now() - lastActivityAt;
  if (idleMs >= lifecycleOptions.idleTimeoutMs || remainingMs > lifecycleOptions.refreshLeadMs) {
    return;
  }

  refreshing = true;
  try {
    const refreshed = await sessionStore.refreshSession();
    if (!refreshed) {
      await lifecycleOptions.onIdleLogout();
    }
  } finally {
    refreshing = false;
  }
}
