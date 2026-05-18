import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolvePdaSessionRoute } from '@/router';
import { setBridgeClient } from '@/bridge/bridge-client';
import { useSessionStore } from '@/stores/session.store';

describe('pda router session guard', () => {
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

  it('keeps a bound PDA on login after app restart instead of restoring a user session', async () => {
    window.localStorage.setItem(
      'oes:pda:terminal-device-binding',
      JSON.stringify({
        terminalDeviceId: 'terminal-device-1',
        displayName: 'PDA-01',
      }),
    );
    window.localStorage.setItem(
      'oes:pda:session-tokens',
      JSON.stringify({
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const redirect = await resolvePdaSessionRoute('/login');

    expect(redirect).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(useSessionStore().operatorName).toBe(null);
    expect(window.localStorage.getItem('oes:pda:session-tokens')).toBe(null);
  });

  it('routes unbound PDA launches to enrollment before login', async () => {
    const redirect = await resolvePdaSessionRoute('/login');

    expect(redirect).toBe('/enrollment');
  });

  it('routes a persisted disabled device binding to the restricted page after app restart', async () => {
    window.localStorage.setItem(
      'oes:pda:terminal-device-binding',
      JSON.stringify({
        terminalDeviceId: 'terminal-device-1',
        displayName: 'PDA-01',
        deviceStatus: 'DISABLED',
      }),
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const redirect = await resolvePdaSessionRoute('/login');

    expect(redirect).toBe('/device-restricted');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('routes denied managed devices to their restricted pages', async () => {
    const sessionStore = useSessionStore();
    await sessionStore.setTerminalDeviceBinding({ terminalDeviceId: 'terminal-device-1' });
    await sessionStore.applyDeviceDecision({
      allowed: false,
      decisionCode: 'DEVICE_IDENTITY_CONFLICT',
      requiredAction: 'CONTACT_ADMIN',
      shouldClearLocalSession: false,
      shouldClearLocalTerminalDeviceId: false,
    });

    expect(await resolvePdaSessionRoute('/login')).toBe('/identity-conflict');

    await sessionStore.applyDeviceDecision({
      allowed: false,
      decisionCode: 'APP_VERSION_UNSUPPORTED',
      requiredAction: 'UPGRADE_APP',
      shouldClearLocalSession: false,
      shouldClearLocalTerminalDeviceId: false,
      versionPolicy: {
        minSupportedAppVersion: '2.0.0',
        latestAppVersion: '2.1.0',
        upgradeRequired: true,
      },
    });

    expect(await resolvePdaSessionRoute('/login')).toBe('/version-blocked');
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
