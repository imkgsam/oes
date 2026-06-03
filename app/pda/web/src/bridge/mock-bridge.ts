import type { PdaBridgeClient } from './types';

/** Provides deterministic WebView capability responses when running PDA Web in a desktop browser. */
export function createMockBridgeClient(): PdaBridgeClient {
  return {
    async getDeviceInfo() {
      return {
        ok: true,
        data: {
          appVersion: '0.1.0-dev',
          deviceId: 'mock-pda-device',
          idSource: 'APP_GENERATED',
          manufacturer: 'Mock',
          model: 'Desktop Browser',
          osVersion: 'Web',
          sdkInt: undefined,
          webViewPackage: 'browser',
          webViewVersion: navigator.userAgent,
        },
      };
    },
    async getNetworkStatus() {
      return {
        ok: true,
        data: {
          connected: navigator.onLine,
          metered: false,
          type: navigator.onLine ? 'WIFI' : 'NONE',
        },
      };
    },
    async openCamera() {
      return {
        ok: true,
        data: {
          localUri:
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="%23eef2ec"/><text x="80" y="250" font-size="42" fill="%231e5b4f">Mock PDA Photo</text></svg>',
          fileName: 'mock-pda-photo.svg',
          mimeType: 'image/svg+xml',
          sizeBytes: 2048,
          width: 640,
          height: 480,
        },
      };
    },
    async openCameraScanner() {
      return { ok: false, error: { code: 'CAMERA_SCANNER_UNAVAILABLE', message: 'Camera scanner is unavailable' } };
    },
    async beep() {
      return { ok: true, data: { played: true } };
    },
    async vibrate() {
      return { ok: true, data: { vibrated: true } };
    },
  };
}
