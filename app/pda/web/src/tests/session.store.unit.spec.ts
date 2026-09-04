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

  it('does not restore a persisted user session across PDA app restart', async () => {
    localStorage.setItem(
      'oes:pda:terminal-device-binding',
      JSON.stringify({
        terminalDeviceId: 'terminal-device-1',
        displayName: 'PDA-01',
        deviceStatus: 'ACTIVE',
      }),
    );
    localStorage.setItem(
      'oes:pda:session-tokens',
      JSON.stringify({
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const sessionStore = useSessionStore();
    const restored = await sessionStore.restoreSession();

    expect(restored).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sessionStore.accessToken).toBe(null);
    expect(sessionStore.terminalDeviceId).toBe('terminal-device-1');
    expect(localStorage.getItem('oes:pda:session-tokens')).toBe(null);
  });

  it('restores a valid token pair across a WebView reload while the app session is still active', async () => {
    localStorage.setItem(
      'oes:pda:terminal-device-binding',
      JSON.stringify({
        terminalDeviceId: 'terminal-device-1',
        displayName: 'PDA-01',
        deviceStatus: 'ACTIVE',
      }),
    );
    sessionStorage.setItem('oes:pda:webview-session-active', '1');
    localStorage.setItem(
      'oes:pda:session-tokens',
      JSON.stringify({
        accessToken: 'active-access-token',
        refreshToken: 'active-refresh-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              account: { displayName: 'Operator A' },
              device: {
                terminalDeviceId: 'terminal-device-1',
                displayName: 'PDA-01',
                deviceStatus: 'ACTIVE',
              },
              decision: {
                allowed: true,
                decisionCode: 'ALLOW',
                requiredAction: 'NONE',
                shouldClearLocalSession: false,
                shouldClearLocalTerminalDeviceId: false,
              },
            },
          }),
      }),
    );

    const sessionStore = useSessionStore();
    const restored = await sessionStore.restoreSession();

    expect(restored).toBe(true);
    expect(sessionStore.isAuthenticated).toBe(true);
    expect(sessionStore.accessToken).toBe('active-access-token');
    expect(sessionStore.operatorName).toBe('Operator A');
  });

  it('does not restore expired tokens during a background reload', async () => {
    localStorage.setItem(
      'oes:pda:terminal-device-binding',
      JSON.stringify({
        terminalDeviceId: 'terminal-device-1',
        displayName: 'PDA-01',
        deviceStatus: 'ACTIVE',
      }),
    );
    sessionStorage.setItem('oes:pda:webview-session-active', '1');
    localStorage.setItem(
      'oes:pda:session-tokens',
      JSON.stringify({
        accessToken: 'expired-access-token',
        refreshToken: 'expired-refresh-token',
        expiresAt: new Date(Date.now() - 1_000).toISOString(),
      }),
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const sessionStore = useSessionStore();
    const restored = await sessionStore.restoreSession();

    expect(restored).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sessionStore.isAuthenticated).toBe(false);
    expect(localStorage.getItem('oes:pda:session-tokens')).toBe(null);
  });

  it('restores a restricted device decision from persisted device status', () => {
    localStorage.setItem(
      'oes:pda:terminal-device-binding',
      JSON.stringify({
        terminalDeviceId: 'terminal-device-1',
        displayName: 'PDA-01',
        deviceStatus: 'DISABLED',
      }),
    );

    const sessionStore = useSessionStore();
    const binding = sessionStore.loadTerminalDeviceBinding();

    expect(binding?.terminalDeviceId).toBe('terminal-device-1');
    expect(sessionStore.deviceStatus).toBe('DISABLED');
    expect(sessionStore.decisionCode).toBe('DEVICE_DISABLED');
  });

  it('does not restore a restricted decision for active persisted device status', () => {
    localStorage.setItem(
      'oes:pda:terminal-device-binding',
      JSON.stringify({
        terminalDeviceId: 'terminal-device-1',
        displayName: 'PDA-01',
        deviceStatus: 'ACTIVE',
      }),
    );

    const sessionStore = useSessionStore();
    sessionStore.loadTerminalDeviceBinding();

    expect(sessionStore.deviceStatus).toBe('ACTIVE');
    expect(sessionStore.decisionCode).toBe(null);
  });

  it('clears token and device binding when a device decision requires local cleanup', async () => {
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
    await sessionStore.setTerminalDeviceBinding({
      terminalDeviceId: 'terminal-device-1',
      deviceStatus: 'ACTIVE',
    });

    await sessionStore.applyDeviceDecision({
      allowed: false,
      decisionCode: 'DEVICE_DECOMMISSIONED',
      deviceStatus: 'DECOMMISSIONED',
      requiredAction: 'CLEAR_LOCAL_DEVICE_AND_SESSION',
      shouldClearLocalSession: true,
      shouldClearLocalTerminalDeviceId: true,
    });

    expect(sessionStore.isAuthenticated).toBe(false);
    expect(sessionStore.terminalDeviceId).toBe(null);
    expect(localStorage.getItem('oes:pda:terminal-device-binding')).toBe(null);
  });

  it('clears local session state when refresh is rejected', async () => {
    localStorage.setItem(
      'oes:pda:terminal-device-binding',
      JSON.stringify({
        terminalDeviceId: 'terminal-device-1',
      }),
    );
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
  const localValues = new Map<string, string>();
  const sessionValues = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => localValues.get(key) ?? null,
      setItem: (key: string, value: string) => localValues.set(key, value),
      removeItem: (key: string) => localValues.delete(key),
    },
  });
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => sessionValues.get(key) ?? null,
      setItem: (key: string, value: string) => sessionValues.set(key, value),
      removeItem: (key: string) => sessionValues.delete(key),
    },
  });
}
