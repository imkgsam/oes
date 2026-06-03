import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  enrollPdaDevice,
  fetchPdaBootstrap,
  confirmPdaInstalledMoldReady,
  confirmPdaProductionMoldArrival,
  installPdaProductionMold,
  loginPdaWithEmployeeCodePin,
  markPdaProductionMoldForScrap,
  movePdaProductionMold,
  preflightPdaEmployeeCodePin,
  logoutPda,
  loginPda,
  PdaBffError,
  recordPdaMoldUsageBatch,
  refreshPdaSession,
  selectPdaAccount,
  toManagedPdaDeviceDescriptor,
  unmountPdaProductionMold,
} from '@/api/pda-bff.client';
import { setBridgeClient } from '@/bridge/bridge-client';

describe('pda bff client', () => {
  beforeEach(() => {
    installMemoryStorage();
    setBridgeClient(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
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
      terminalDeviceId: 'terminal-device-1',
      device: toManagedPdaDeviceDescriptor(createDeviceInfo(), 'terminal-device-1'),
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
            deviceId: 'terminal-device-1',
            deviceName: 'CRUISE Ge',
            identity: {
              manufacturerSerial: 'SEUIC-SN-123',
              androidId: null,
              appInstallationId: null,
              manufacturer: 'Seuic',
              model: 'Cruise Ge',
            },
            software: {
              androidVersion: '9',
              webViewVersion: '66.0.3359.158',
              appVersion: '2.0.0',
            },
          },
        }),
      }),
    );
    expect(result.session?.accessToken).toBe('access-token-1');
  });

  it('posts PDA employee code PIN login without placing the PIN in diagnostic fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
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

    await loginPdaWithEmployeeCodePin({
      employeeCode: 'EMP001',
      pin: '123456',
      deviceName: 'CRUISE Ge',
      terminalDeviceId: 'terminal-device-1',
      device: toManagedPdaDeviceDescriptor(createDeviceInfo(), 'terminal-device-1'),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://192.168.2.33:9101/api/v1/pda/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          method: 'EMPLOYEE_CODE_PIN',
          employeeCode: 'EMP001',
          pin: '123456',
          device: {
            deviceId: 'terminal-device-1',
            deviceName: 'CRUISE Ge',
            identity: {
              manufacturerSerial: 'SEUIC-SN-123',
              androidId: null,
              appInstallationId: null,
              manufacturer: 'Seuic',
              model: 'Cruise Ge',
            },
            software: {
              androidVersion: '9',
              webViewVersion: '66.0.3359.158',
              appVersion: '2.0.0',
            },
          },
        }),
      }),
    );
  });

  it('preflights PDA employee code login without sending a PIN', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            allowed: true,
            reasonCode: 'READY_FOR_PIN',
            message: 'READY_FOR_PIN',
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await preflightPdaEmployeeCodePin({
      employeeCode: 'EMP-0AF-0001',
      deviceName: 'CRUISE Ge',
      terminalDeviceId: 'terminal-device-1',
      device: toManagedPdaDeviceDescriptor(createDeviceInfo(), 'terminal-device-1'),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://192.168.2.33:9101/api/v1/pda/auth/employee-code/preflight',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          employeeCode: 'EMP-0AF-0001',
          device: {
            deviceId: 'terminal-device-1',
            deviceName: 'CRUISE Ge',
            identity: {
              manufacturerSerial: 'SEUIC-SN-123',
              androidId: null,
              appInstallationId: null,
              manufacturer: 'Seuic',
              model: 'Cruise Ge',
            },
            software: {
              androidVersion: '9',
              webViewVersion: '66.0.3359.158',
              appVersion: '2.0.0',
            },
          },
        }),
      }),
    );
    expect(result.allowed).toBe(true);
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

    await fetchPdaBootstrap('access-token-1', 'terminal-device-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://10.0.0.2:9101/api/v1/pda/session/bootstrap?terminalDeviceId=terminal-device-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token-1',
        }),
      }),
    );
  });

  it('prefers the Android-injected gateway over a remembered gateway from an older APK run', async () => {
    window.localStorage.setItem('oes:pda:last-bff-base-url', 'http://192.168.100.48:9101/api/v1');
    window.__OES_PDA_CONFIG__ = {
      bffBaseUrl: 'http://192.168.2.33:9101/api/v1',
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { account: { accountId: 'acc-1' } } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchPdaBootstrap('access-token-1', 'terminal-device-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://192.168.2.33:9101/api/v1/pda/session/bootstrap?terminalDeviceId=terminal-device-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token-1',
        }),
      }),
    );
  });

  it('posts enrollment code with normalized device metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            enrolled: true,
            terminalDeviceId: 'terminal-device-1',
            decision: {
              allowed: true,
              decisionCode: 'ALLOW',
              requiredAction: 'NONE',
              shouldClearLocalSession: false,
              shouldClearLocalTerminalDeviceId: false,
            },
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await enrollPdaDevice('ENR-123456', toManagedPdaDeviceDescriptor(createDeviceInfo()));

    expect(fetchMock).toHaveBeenCalledWith(
      'http://192.168.2.33:9101/api/v1/pda/device/enroll',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"enrollmentCode":"ENR-123456"'),
      }),
    );
    expect(result.terminalDeviceId).toBe('terminal-device-1');
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

    await expect(fetchPdaBootstrap('access-token-1', 'terminal-device-1')).rejects.toMatchObject({
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

  it('sends PDA mold execution commands through the tenant MES BFF surface', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { accepted: true } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await confirmPdaProductionMoldArrival('access-token-1', 'tenant-1', 'mold-1');
    await movePdaProductionMold('access-token-1', 'tenant-1', 'mold-1', { storageResourceId: 'storage-1' });
    await installPdaProductionMold('access-token-1', 'tenant-1', 'mold-1', {
      workCenterRef: { workCenterId: 'wc-1' },
      moldPositionIndex: 2,
    });
    await confirmPdaInstalledMoldReady('access-token-1', 'tenant-1', 'mold-1', 'install-1');
    await recordPdaMoldUsageBatch(
      'access-token-1',
      'tenant-1',
      { workCenterId: 'wc-1' },
      [{ checked: true, productionMoldId: 'mold-1', toolingInstallationId: 'install-1', usageQuantity: '12' }],
    );
    await markPdaProductionMoldForScrap('access-token-1', 'tenant-1', 'mold-1');
    await unmountPdaProductionMold('access-token-1', 'tenant-1', 'install-1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://192.168.2.33:9101/api/v1/mes/tenants/tenant-1/production-molds/mold-1/confirm-arrival',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer access-token-1' }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://192.168.2.33:9101/api/v1/mes/tenants/tenant-1/tooling/mold-1/move',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reason: 'pda move production mold',
          toolingType: 'MOLD',
          toStorageResourceRef: { storageResourceId: 'storage-1' },
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://192.168.2.33:9101/api/v1/mes/tenants/tenant-1/tooling/mold-1/install',
      expect.objectContaining({
        body: JSON.stringify({
          reason: 'pda install production mold',
          toolingType: 'MOLD',
          workCenterRef: { workCenterId: 'wc-1' },
          moldPositionIndex: 2,
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'http://192.168.2.33:9101/api/v1/mes/tenants/tenant-1/production-molds/mold-1/confirm-ready',
      expect.objectContaining({
        body: JSON.stringify({
          reason: 'pda confirm installed mold ready',
          toolingInstallationId: 'install-1',
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('/mes/tenants/tenant-1/daily-mold-checklists/'),
      expect.objectContaining({
        body: expect.stringContaining('"captureSource":"PDA_MOLD_USAGE"'),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      'http://192.168.2.33:9101/api/v1/mes/tenants/tenant-1/production-molds/mold-1/mark-for-scrap',
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      7,
      'http://192.168.2.33:9101/api/v1/mes/tenants/tenant-1/tooling-installations/install-1/unmount',
      expect.any(Object),
    );
  });

  it('throws typed auth errors for 401 and 403 responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPdaBootstrap('expired-token', 'terminal-device-1')).rejects.toBeInstanceOf(PdaBffError);
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

    await fetchPdaBootstrap('access-token-1', 'terminal-device-1');
    await fetchPdaBootstrap('access-token-1', 'terminal-device-1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://192.168.2.33:9101/api/v1/pda/session/bootstrap?terminalDeviceId=terminal-device-1',
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://192.168.100.48:9101/api/v1/pda/session/bootstrap?terminalDeviceId=terminal-device-1',
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://192.168.100.48:9101/api/v1/pda/session/bootstrap?terminalDeviceId=terminal-device-1',
      expect.any(Object),
    );
  });

  it('times out one stalled LAN gateway quickly before trying the fallback gateway', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(new Promise(() => undefined))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { account: { accountId: 'account-1' } } }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const resultPromise = fetchPdaBootstrap('access-token-1', 'terminal-device-1');
    await vi.advanceTimersByTimeAsync(1200);
    const result = await resultPromise;

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://192.168.2.33:9101/api/v1/pda/session/bootstrap?terminalDeviceId=terminal-device-1',
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://192.168.100.48:9101/api/v1/pda/session/bootstrap?terminalDeviceId=terminal-device-1',
      expect.any(Object),
    );
    expect(result.account?.accountId).toBe('account-1');
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
      openCameraScanner: vi.fn() as never,
      beep: vi.fn() as never,
      vibrate: vi.fn() as never,
    });

    await expect(
      loginPda({
        identifier: 'worker@example.com',
        credential: 'secret',
        terminalDeviceId: 'terminal-device-1',
        device: toManagedPdaDeviceDescriptor(createDeviceInfo(), 'terminal-device-1'),
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

function createDeviceInfo() {
  return {
    appVersion: '2.0.0',
    deviceId: 'SEUIC-SN-123',
    idSource: 'MANUFACTURER_SERIAL' as const,
    manufacturer: 'Seuic',
    model: 'Cruise Ge',
    osVersion: '9',
    webViewVersion: '66.0.3359.158',
  };
}
