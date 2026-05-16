import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@/stores/session.store';
import { setBridgeClient } from '@/bridge/bridge-client';

describe('session store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setBridgeClient(undefined);
    installMemoryStorage();
    vi.restoreAllMocks();
  });

  it('persists token pair and clears it on logout', async () => {
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
    expect(sessionStore.isAuthenticated).toBe(true);
    expect(sessionStore.operatorName).toBe('operator-a');
    expect(JSON.parse(localStorage.getItem('oes:pda:session-tokens') || '{}')).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    await sessionStore.clearSession();
    expect(sessionStore.isAuthenticated).toBe(false);
    expect(sessionStore.operatorName).toBe(null);
    expect(localStorage.getItem('oes:pda:session-tokens')).toBe(null);
  });

  it('restores a persisted session by refreshing the token pair and loading bootstrap', async () => {
    localStorage.setItem(
      'oes:pda:session-tokens',
      JSON.stringify({
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
              expiresIn: 900,
              terminal: 'PDA',
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              account: {
                accountId: 'account-1',
                displayName: 'Operator One',
              },
              session: {
                terminal: 'PDA',
                idleTimeoutSeconds: 900,
              },
            },
          }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const sessionStore = useSessionStore();
    const restored = await sessionStore.restoreSession();

    expect(restored).toBe(true);
    expect(sessionStore.accessToken).toBe('new-access-token');
    expect(sessionStore.operatorName).toBe('Operator One');
  });

  it('clears local session state when refresh is rejected', async () => {
    localStorage.setItem(
      'oes:pda:session-tokens',
      JSON.stringify({
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      }),
    );

    const sessionStore = useSessionStore();
    const restored = await sessionStore.restoreSession();

    expect(restored).toBe(false);
    expect(sessionStore.isAuthenticated).toBe(false);
    expect(localStorage.getItem('oes:pda:session-tokens')).toBe(null);
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
