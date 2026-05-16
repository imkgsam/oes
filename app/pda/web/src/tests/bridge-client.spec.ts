import { afterEach, describe, expect, it, vi } from 'vitest';
import { getBridgeClient, installBridgeEventSink, onScanResult, setBridgeClient } from '@/bridge/bridge-client';
import type { BridgeResult, CameraCaptureResult, DeviceInfo, NetworkStatus } from '@/bridge/types';

describe('bridge client', () => {
  afterEach(() => {
    setBridgeClient(undefined);
    delete window.OesPdaBridge;
    delete window.OesPdaBridgeEvents;
  });

  it('falls back to a browser-safe mock bridge client', async () => {
    const result = await getBridgeClient().getDeviceInfo();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.deviceId).toBe('mock-pda-device');
    }
  });

  it('uses the Android JS Bridge when it is attached to the WebView window', async () => {
    const deviceResult: BridgeResult<DeviceInfo> = {
      ok: true,
      data: {
        appVersion: '0.1.0',
        deviceId: 'C80221204985',
        idSource: 'MANUFACTURER_SERIAL',
        manufacturer: 'SEUIC',
        model: 'CRUISE Ge',
        osVersion: '9',
        webViewVersion: '66.0.3359.158',
      },
    };
    const networkResult: BridgeResult<NetworkStatus> = {
      ok: true,
      data: {
        connected: true,
        metered: false,
        type: 'WIFI',
      },
    };
    const vibrate = vi.fn(() => JSON.stringify({ ok: true, data: { vibrated: true } }));
    const openCamera = vi.fn(() => JSON.stringify({ ok: true, data: { accepted: true, requestId: 'camera_001' } }));

    window.OesPdaBridge = {
      getDeviceInfo: () => JSON.stringify(deviceResult),
      getNetworkStatus: () => JSON.stringify(networkResult),
      openCamera,
      beep: () => JSON.stringify({ ok: true, data: { played: true } }),
      vibrate,
    };

    const bridgeClient = getBridgeClient();

    await expect(bridgeClient.getDeviceInfo()).resolves.toEqual(deviceResult);
    await expect(bridgeClient.getNetworkStatus()).resolves.toEqual(networkResult);
    await expect(bridgeClient.beep()).resolves.toEqual({ ok: true, data: { played: true } });
    await expect(bridgeClient.vibrate(180)).resolves.toEqual({ ok: true, data: { vibrated: true } });
    expect(vibrate).toHaveBeenCalledWith(180);
  });

  it('resolves async Android camera completion events', async () => {
    const photoResult: BridgeResult<CameraCaptureResult> = {
      ok: true,
      data: {
        localUri: 'content://oes-pda/photos/photo_001.jpg',
        fileName: 'photo_001.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1024,
        width: 1280,
        height: 960,
      },
    };
    let requestId = '';

    installBridgeEventSink();
    window.OesPdaBridge = {
      getDeviceInfo: () => JSON.stringify({ ok: true, data: {} }),
      getNetworkStatus: () => JSON.stringify({ ok: true, data: {} }),
      openCamera: (requestJson: string) => {
        requestId = JSON.parse(requestJson).requestId;
        return JSON.stringify({ ok: true, data: { accepted: true, requestId } });
      },
      beep: () => JSON.stringify({ ok: true, data: { played: true } }),
      vibrate: () => JSON.stringify({ ok: true, data: { vibrated: true } }),
    };

    const capture = getBridgeClient().openCamera();

    window.OesPdaBridgeEvents?.emit(
      JSON.stringify({
        eventId: 'evt_camera_001',
        eventType: 'cameraCaptureCompleted',
        occurredAt: '2026-05-13T10:20:00.000Z',
        payload: {
          requestId,
          result: photoResult,
        },
      }),
    );

    await expect(capture).resolves.toEqual(photoResult);
  });

  it('dispatches scanResult events pushed by Android Shell', () => {
    const received: string[] = [];
    installBridgeEventSink();
    const unsubscribe = onScanResult((event) => {
      received.push(event.payload.scanValue);
    });

    window.OesPdaBridgeEvents?.emit(
      JSON.stringify({
        eventId: 'evt_001',
        eventType: 'scanResult',
        occurredAt: '2026-05-13T10:20:00.000Z',
        payload: {
          scanValue: 'PB202605130001',
          scanSource: 'BROADCAST',
          scannerProvider: 'MANUFACTURER_BROADCAST',
          rawLength: 14,
          occurredAt: '2026-05-13T10:20:00.000Z',
        },
      }),
    );
    unsubscribe();

    expect(received).toEqual(['PB202605130001']);
  });
});
