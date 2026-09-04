import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  startPdaSessionLifecycle,
  stopPdaSessionLifecycle,
  markPdaUserActivity,
} from '@/services/pda-session-lifecycle';
import { setBridgeClient } from '@/bridge/bridge-client';
import { useSessionStore } from '@/stores/session.store';

describe('pda session lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-18T08:00:00.000Z'));
    setActivePinia(createPinia());
    setBridgeClient(undefined);
    installMemoryStorage();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { success: true } }),
      }),
    );
  });

  afterEach(() => {
    stopPdaSessionLifecycle();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('logs out the PDA operator after the configured idle window', async () => {
    const sessionStore = useSessionStore();
    await sessionStore.signIn(
      {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        terminal: 'PDA',
      },
      'operator-a',
    );
    const onIdleLogout = vi.fn();

    startPdaSessionLifecycle({
      idleTimeoutMs: 1_000,
      refreshLeadMs: 120_000,
      refreshCheckIntervalMs: 30_000,
      onIdleLogout,
    });

    await vi.advanceTimersByTimeAsync(999);
    expect(sessionStore.isAuthenticated).toBe(true);

    await vi.advanceTimersByTimeAsync(1);

    expect(sessionStore.isAuthenticated).toBe(false);
    expect(onIdleLogout).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('oes:pda:session-tokens')).toBe(null);
  });

  it('refreshes the PDA token pair before access expiry while the operator remains active', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            accessToken: 'next-access-token',
            refreshToken: 'next-refresh-token',
            expiresIn: 900,
            terminal: 'PDA',
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const sessionStore = useSessionStore();
    await sessionStore.signIn(
      {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        terminal: 'PDA',
      },
      'operator-a',
    );

    startPdaSessionLifecycle({
      idleTimeoutMs: 1_800_000,
      refreshLeadMs: 120_000,
      refreshCheckIntervalMs: 30_000,
      onIdleLogout: vi.fn(),
    });
    markPdaUserActivity();

    await vi.advanceTimersByTimeAsync(780_000);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/pda/auth/session/refresh'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'refresh-token' }),
      }),
    );
    expect(sessionStore.accessToken).toBe('next-access-token');
    expect(sessionStore.refreshToken).toBe('next-refresh-token');
  });

  it('clears the PDA session and asks the shell to leave workbench when automatic refresh is rejected', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () =>
        Promise.resolve({
          message: 'Session revoked',
        }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const sessionStore = useSessionStore();
    await sessionStore.signIn(
      {
        accessToken: 'access-token',
        refreshToken: 'revoked-refresh-token',
        expiresIn: 150,
        terminal: 'PDA',
      },
      'operator-a',
    );
    const onIdleLogout = vi.fn();

    startPdaSessionLifecycle({
      idleTimeoutMs: 1_800_000,
      refreshLeadMs: 120_000,
      refreshCheckIntervalMs: 30_000,
      onIdleLogout,
    });
    markPdaUserActivity();

    await vi.advanceTimersByTimeAsync(30_000);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/pda/auth/session/refresh'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'revoked-refresh-token' }),
      }),
    );
    expect(sessionStore.isAuthenticated).toBe(false);
    expect(localStorage.getItem('oes:pda:session-tokens')).toBe(null);
    expect(onIdleLogout).toHaveBeenCalledTimes(1);
  });
});

function installMemoryStorage(): void {
  const values = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
}
