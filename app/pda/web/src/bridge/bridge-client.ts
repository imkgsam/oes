import { createMockBridgeClient } from './mock-bridge';
import type {
  AndroidPdaBridge,
  BridgeEventEnvelope,
  BridgeResult,
  CameraCaptureCompleted,
  CameraCaptureRequest,
  CameraCaptureResult,
  PdaBridgeClient,
  ScanResult,
} from './types';

declare global {
  interface Window {
    OesPdaBridge?: AndroidPdaBridge;
    OesPdaBridgeEvents?: {
      emit: (rawEventJson: string) => void;
    };
  }
}

let bridgeClient: PdaBridgeClient | undefined;
const eventListeners = new Set<(event: BridgeEventEnvelope) => void>();
const pendingCameraCaptures = new Map<string, (result: BridgeResult<CameraCaptureResult>) => void>();
const CAMERA_CAPTURE_TIMEOUT_MS = 5 * 60 * 1000;

/** Returns the active PDA bridge client, falling back to a browser-safe mock before Android is attached. */
export function getBridgeClient(): PdaBridgeClient {
  if (window.OesPdaBridge) {
    bridgeClient ??= createAndroidBridgeClient(window.OesPdaBridge);
    return bridgeClient;
  }

  bridgeClient ??= createMockBridgeClient();
  return bridgeClient;
}

/** Replaces the bridge client in tests or future Android JS Bridge attachment code. */
export function setBridgeClient(client: PdaBridgeClient | undefined): void {
  bridgeClient = client;
}

/** Adapts the Android synchronous JS interface into the PDA Web async bridge contract. */
function createAndroidBridgeClient(androidBridge: AndroidPdaBridge): PdaBridgeClient {
  return {
    async getDeviceInfo() {
      return parseBridgeJson(androidBridge.getDeviceInfo());
    },
    async getNetworkStatus() {
      return parseBridgeJson(androidBridge.getNetworkStatus());
    },
    async openCamera(request: CameraCaptureRequest = { maxCount: 1, quality: 'COMPRESSED' }) {
      const requestId = createRequestId();
      const accepted = parseBridgeJson<{ accepted: boolean; requestId: string }>(
        androidBridge.openCamera(JSON.stringify({ ...request, requestId })),
      );
      if (!accepted.ok) {
        return accepted;
      }

      return waitForCameraCapture(requestId);
    },
    async getSessionTokens() {
      if (!androidBridge.getSessionTokens) {
        return { ok: true, data: null };
      }

      return parseBridgeJson(androidBridge.getSessionTokens());
    },
    async saveSessionTokens(tokens) {
      if (!androidBridge.saveSessionTokens) {
        return { ok: false, error: { code: 'SESSION_STORAGE_UNAVAILABLE', message: 'Session storage unavailable' } };
      }

      return parseBridgeJson(androidBridge.saveSessionTokens(JSON.stringify(tokens)));
    },
    async clearSessionTokens() {
      if (!androidBridge.clearSessionTokens) {
        return { ok: true, data: { cleared: true } };
      }

      return parseBridgeJson(androidBridge.clearSessionTokens());
    },
    async beep() {
      return parseBridgeJson(androidBridge.beep());
    },
    async vibrate(durationMs = 120) {
      return parseBridgeJson(androidBridge.vibrate(durationMs));
    },
  };
}

/** Creates short unique ids used to match async Android camera events to Web promises. */
function createRequestId(): string {
  return `camera_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Resolves the openCamera command when Android returns a matching camera completion event. */
function waitForCameraCapture(requestId: string): Promise<BridgeResult<CameraCaptureResult>> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      pendingCameraCaptures.delete(requestId);
      resolve({
        ok: false,
        error: {
          code: 'CAMERA_CAPTURE_TIMEOUT',
          message: 'Camera capture did not complete in time',
        },
      });
    }, CAMERA_CAPTURE_TIMEOUT_MS);

    pendingCameraCaptures.set(requestId, (result) => {
      window.clearTimeout(timeout);
      resolve(result);
    });
  });
}

/** Parses native bridge JSON while preserving the stable ok/data/error envelope. */
function parseBridgeJson<T>(rawJson: string): BridgeResult<T> {
  try {
    return JSON.parse(rawJson) as BridgeResult<T>;
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'BRIDGE_PARSE_FAILED',
        message: error instanceof Error ? error.message : 'Bridge response parse failed',
      },
    };
  }
}

/** Installs the global event sink used by Android Shell to push scanner and device events into Vue. */
export function installBridgeEventSink(): void {
  window.OesPdaBridgeEvents = {
    emit(rawEventJson: string) {
      const event = parseBridgeEvent(rawEventJson);
      if (!event) {
        return;
      }
      resolveCameraCaptureEvent(event);
      eventListeners.forEach((listener) => listener(event));
    },
  };
}

/** Completes pending camera promises before broadcasting the raw bridge event to other listeners. */
function resolveCameraCaptureEvent(event: BridgeEventEnvelope): void {
  if (event.eventType !== 'cameraCaptureCompleted') {
    return;
  }

  const payload = event.payload as CameraCaptureCompleted;
  const resolve = pendingCameraCaptures.get(payload.requestId);
  if (!resolve) {
    return;
  }

  pendingCameraCaptures.delete(payload.requestId);
  resolve(payload.result);
}

/** Subscribes to all bridge events and returns an unsubscribe function. */
export function onBridgeEvent(listener: (event: BridgeEventEnvelope) => void): () => void {
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
}

/** Subscribes to normalized PDA scan events. */
export function onScanResult(listener: (event: BridgeEventEnvelope<ScanResult>) => void): () => void {
  return onBridgeEvent((event) => {
    if (event.eventType === 'scanResult') {
      listener(event as BridgeEventEnvelope<ScanResult>);
    }
  });
}

/** Parses native event JSON defensively because hardware broadcasts can arrive at any time. */
function parseBridgeEvent(rawEventJson: string): BridgeEventEnvelope | null {
  try {
    return JSON.parse(rawEventJson) as BridgeEventEnvelope;
  } catch {
    return null;
  }
}
