import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setBridgeClient } from '@/bridge/bridge-client';
import { sendPdaHeartbeat } from '@/services/pda-heartbeat';
import { useSessionStore } from '@/stores/session.store';

describe('pda heartbeat', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    installMemoryStorage();
    vi.unstubAllGlobals();
  });

  it('posts device, network, and session summary when network is available', async () => {
    setBridgeClient({
      getDeviceInfo: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          appVersion: '0.1.0',
          deviceId: 'device-1',
          idSource: 'MANUFACTURER_SERIAL',
          manufacturer: 'Seuic',
          model: 'Cruise Ge',
          osVersion: '9',
          webViewVersion: '66',
        },
      }),
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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              accepted: true,
              deviceStatus: 'ACTIVE',
              devicePolicy: {
                heartbeatIntervalSeconds: 300,
                idleTimeoutSeconds: 900,
                minSupportedAppVersion: '0.1.0',
                latestAppVersion: '0.1.0',
                upgradeRequired: false,
              },
              serverTime: '2026-05-14T10:00:00.000Z',
            },
          }),
      }),
    );
    const sessionStore = useSessionStore();
    sessionStore.accessToken = 'access-token';
    sessionStore.bootstrap = {
      account: {
        accountId: 'account-1',
        tenantId: null,
      },
      session: {
        sessionId: 'session-1',
        terminal: 'PDA',
        idleTimeoutSeconds: 900,
      },
    };

    const result = await sendPdaHeartbeat('FOREGROUND');

    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'http://192.168.2.33:9101/api/v1/pda/device/heartbeat',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('"deviceId":"device-1"'),
      }),
    );
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body).toEqual(
      expect.objectContaining({
        runtime: expect.objectContaining({
          networkStatus: 'ONLINE',
          appState: 'FOREGROUND',
        }),
        session: {
          accountId: 'account-1',
          tenantId: null,
          sessionId: 'session-1',
        },
      }),
    );
  });

  it('skips heartbeat without bothering the operator when the PDA is offline', async () => {
    setBridgeClient({
      getDeviceInfo: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          appVersion: '0.1.0',
          deviceId: 'device-1',
          idSource: 'MANUFACTURER_SERIAL',
          manufacturer: 'Seuic',
          model: 'Cruise Ge',
          osVersion: '9',
          webViewVersion: '66',
        },
      }),
      getNetworkStatus: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          connected: false,
          metered: false,
          type: 'NONE',
        },
      }),
      openCamera: vi.fn() as never,
      beep: vi.fn() as never,
      vibrate: vi.fn() as never,
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendPdaHeartbeat('FOREGROUND');

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
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
