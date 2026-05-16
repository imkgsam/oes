import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchPdaBootstrap,
  logoutPda,
  loginPda,
  PdaBffError,
  refreshPdaSession,
  selectPdaAccount,
} from '@/api/pda-bff.client';
import { setBridgeClient } from '@/bridge/bridge-client';

describe('pda bff client', () => {
  beforeEach(() => {
    installMemoryStorage();
    setBridgeClient(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setBridgeClient(undefined);
    delete window.__OES_PDA_CONFIG__;
  });

  it('posts PDA password login to the LAN gateway base URL and unwraps the response envelope', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          code: 'SUCCESS',
          data: {
            status: 'SUCCESS',
            nextStep: 'NONE',
            session: {
              accessToken: 'access-token-1',
              refreshToken: 'refresh-token-1',
              expiresIn: 900,
              terminal: 'PDA',
            },
            operator: {
              displayName: 'PDA Operator',
            },
            accountOptions: [],
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await loginPda({
      identifier: 'worker@example.com',
      credential: 'secret',
      deviceName: 'CRUISE Ge',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://192.168.2.33:9101/api/v1/pda/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          method: 'EMAIL_PASSWORD',
          identifier: 'worker@example.com',
          credential: 'secret',
          device: {
            deviceName: 'CRUISE Ge',
          },
        }),
      }),
    );
    expect(result.session?.accessToken).toBe('access-token-1');
  });

  it('uses Android-injected config when the APK shell provides a BFF base URL', async () => {
    window.__OES_PDA_CONFIG__ = {
      bffBaseUrl: 'http://10.0.0.2:9101/api/v1',
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { account: { accountId: 'acc-1' } } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchPdaBootstrap('access-token-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://10.0.0.2:9101/api/v1/pda/session/bootstrap',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token-1',
        }),
      }),
    );
  });

  it('normalizes login method casing when selecting one PDA account', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            status: 'DENIED',
            nextStep: 'NONE',
            session: null,
            message: 'Terminal access denied',
            accountOptions: [],
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await selectPdaAccount({
      userId: 'user-1',
      accountId: 'account-1',
      loginMethod: 'email-password',
      deviceName: 'CRUISE Ge',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://192.168.2.33:9101/api/v1/pda/auth/account-selection',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          accountId: 'account-1',
          loginMethod: 'EMAIL_PASSWORD',
          device: {
            deviceName: 'CRUISE Ge',
          },
        }),
      }),
    );
    expect(result.message).toBe('Terminal access denied');
  });

  it('surfaces gateway error messages instead of only showing the HTTP status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          message: 'managed navigation resolver returned incomplete navigation',
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPdaBootstrap('access-token-1')).rejects.toMatchObject({
      status: 500,
      message: 'managed navigation resolver returned incomplete navigation',
    });
  });

  it('refreshes and logs out PDA terminal sessions through terminal-scoped auth routes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              accessToken: 'access-token-2',
              refreshToken: 'refresh-token-2',
              expiresIn: 900,
              terminal: 'PDA',
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { success: true } }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const refreshed = await refreshPdaSession('refresh-token-1');
    const loggedOut = await logoutPda('access-token-2');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://192.168.2.33:9101/api/v1/pda/auth/session/refresh',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'refresh-token-1' }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://192.168.2.33:9101/api/v1/pda/auth/logout',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token-2',
        }),
      }),
    );
    expect(refreshed.accessToken).toBe('access-token-2');
    expect(loggedOut.success).toBe(true);
  });

  it('throws typed auth errors for 401 and 403 responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPdaBootstrap('expired-token')).rejects.toBeInstanceOf(PdaBffError);
  });

  it('falls back from the company LAN gateway to the alternate LAN gateway and remembers the working one', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { account: { accountId: 'account-1' } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { account: { accountId: 'account-1' } } }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await fetchPdaBootstrap('access-token-1');
    await fetchPdaBootstrap('access-token-1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://192.168.2.33:9101/api/v1/pda/session/bootstrap',
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://192.168.100.44:9101/api/v1/pda/session/bootstrap',
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://192.168.100.44:9101/api/v1/pda/session/bootstrap',
      expect.any(Object),
    );
  });

  it('shows a clear offline message before attempting BFF requests when Android reports no network', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    setBridgeClient({
      getDeviceInfo: vi.fn() as never,
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

    await expect(
      loginPda({
        identifier: 'worker@example.com',
        credential: 'secret',
      }),
    ).rejects.toMatchObject({
      status: 0,
      message: 'PDA 当前没有网络，请连接 Wi-Fi 或公司局域网后重试。',
    });
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
