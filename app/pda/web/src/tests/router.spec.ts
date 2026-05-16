import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolvePdaSessionRoute } from '@/router';
import { setBridgeClient } from '@/bridge/bridge-client';
import { useSessionStore } from '@/stores/session.store';

describe('pda router session restore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setBridgeClient({
      getDeviceInfo: vi.fn() as never,
      getNetworkStatus: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          connected: true,
          metered: false,
          type: 'WIFI',
        },
      }),
      openCamera: vi.fn() as never,
      beep: vi.fn() as never,
      vibrate: vi.fn() as never,
    });
    installMemoryStorage();
    vi.unstubAllGlobals();
  });

  it('restores a persisted PDA session before staying on the login route', async () => {
    window.localStorage.setItem(
      'oes:pda:session-tokens',
      JSON.stringify({
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    );
    vi.stubGlobal(
      'fetch',
      vi
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
        }),
    );

    const redirect = await resolvePdaSessionRoute('/login');

    expect(redirect).toBe('/workbench');
    expect(useSessionStore().operatorName).toBe('Operator One');
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
