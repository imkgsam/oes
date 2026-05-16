import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setBridgeClient } from '@/bridge/bridge-client';
import {
  clearPdaDiagnosticLogs,
  getPdaDiagnosticLogs,
  recordPdaDiagnosticLog,
  uploadPdaDiagnosticLogs,
} from '@/services/pda-diagnostic-log-buffer';
import { useSessionStore } from '@/stores/session.store';

describe('pda diagnostic log buffer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    installMemoryStorage();
    setBridgeClient(undefined);
    vi.unstubAllGlobals();
  });

  it('records local diagnostic logs while redacting sensitive detail fields', () => {
    recordPdaDiagnosticLog({
      level: 'INFO',
      eventType: 'SCAN_RECEIVED',
      message: 'Scan result received',
      diagnosticMode: true,
      details: {
        scanValue: 'PB202605140001',
        scanLength: 14,
        refreshToken: 'refresh-token-must-not-survive',
        nested: {
          password: 'password-must-not-survive',
        },
      },
    });

    expect(getPdaDiagnosticLogs()).toEqual([
      expect.objectContaining({
        level: 'INFO',
        eventType: 'SCAN_RECEIVED',
        diagnosticMode: true,
        details: {
          scanValue: 'PB202605140001',
          scanLength: 14,
          refreshToken: '[REDACTED]',
          nested: {
            password: '[REDACTED]',
          },
        },
      }),
    ]);
  });

  it('records logs on Android WebView 66 where Object.fromEntries is unavailable', () => {
    const originalFromEntries = Object.fromEntries;
    Object.defineProperty(Object, 'fromEntries', {
      configurable: true,
      value: undefined,
    });

    try {
      expect(() =>
        recordPdaDiagnosticLog({
          level: 'INFO',
          eventType: 'CAMERA_CAPTURE_COMPLETED',
          message: 'Camera capture completed',
          diagnosticMode: true,
          details: {
            fileName: 'photo.jpg',
            nested: {
              password: 'password-must-not-survive',
            },
          },
        }),
      ).not.toThrow();

      expect(getPdaDiagnosticLogs()[0]).toEqual(
        expect.objectContaining({
          eventType: 'CAMERA_CAPTURE_COMPLETED',
          details: {
            fileName: 'photo.jpg',
            nested: {
              password: '[REDACTED]',
            },
          },
        }),
      );
    } finally {
      Object.defineProperty(Object, 'fromEntries', {
        configurable: true,
        value: originalFromEntries,
      });
    }
  });

  it('manually uploads buffered logs with device and session context, then clears accepted logs', async () => {
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
              receivedCount: 1,
              serverTime: '2026-05-14T10:20:00.000Z',
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
    recordPdaDiagnosticLog({
      level: 'INFO',
      eventType: 'SCAN_RECEIVED',
      message: 'Scan result received',
      diagnosticMode: true,
      details: {
        scanValue: 'PB202605140001',
        scanLength: 14,
      },
    });

    const result = await uploadPdaDiagnosticLogs();

    expect(result).toEqual({
      uploadedCount: 1,
      remainingCount: 0,
      serverTime: '2026-05-14T10:20:00.000Z',
    });
    expect(fetch).toHaveBeenCalledWith(
      'http://192.168.2.33:9101/api/v1/pda/device/logs',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
          'Content-Type': 'application/json',
        }),
      }),
    );
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body).toEqual(
      expect.objectContaining({
        device: expect.objectContaining({
          deviceId: 'device-1',
          deviceModel: 'Cruise Ge',
        }),
        session: {
          accountId: 'account-1',
          tenantId: null,
          sessionId: 'session-1',
        },
        logs: [
          expect.objectContaining({
            eventType: 'SCAN_RECEIVED',
            diagnosticMode: true,
            details: {
              scanValue: 'PB202605140001',
              scanLength: 14,
            },
          }),
        ],
      }),
    );
    expect(getPdaDiagnosticLogs()).toEqual([]);
  });

  it('keeps local logs when manual upload fails so the operator can retry', async () => {
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
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network request failed')));
    recordPdaDiagnosticLog({
      level: 'ERROR',
      eventType: 'CAMERA_CAPTURE_FAILED',
      message: 'Camera failed',
      diagnosticMode: true,
    });

    await expect(uploadPdaDiagnosticLogs()).rejects.toThrow('PDA BFF network request failed');

    expect(getPdaDiagnosticLogs()).toEqual([
      expect.objectContaining({
        eventType: 'CAMERA_CAPTURE_FAILED',
      }),
    ]);
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
