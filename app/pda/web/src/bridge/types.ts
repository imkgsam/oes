export type BridgeError = {
  code: string;
  message: string;
};

export type BridgeResult<T> =
  | { ok: true; data: T; error?: never }
  | { ok: false; data?: never; error: BridgeError };

export type DeviceInfo = {
  appVersion: string;
  deviceId: string;
  idSource: 'MANUFACTURER_SERIAL' | 'ANDROID_ID' | 'APP_GENERATED';
  manufacturer: string;
  model: string;
  osVersion: string;
  sdkInt?: number;
  webViewPackage?: string;
  webViewVersion: string;
};

export type NetworkStatus = {
  batteryLevel?: number;
  connected: boolean;
  metered: boolean;
  type: 'WIFI' | 'CELLULAR' | 'ETHERNET' | 'UNKNOWN' | 'NONE';
};

export type ScanResult = {
  scanValue: string;
  scanSource: 'BROADCAST' | 'SDK' | 'KEYBOARD' | 'CAMERA' | 'UNKNOWN';
  scannerProvider: 'MANUFACTURER_BROADCAST' | 'MANUFACTURER_SDK' | 'WEB_FALLBACK' | 'UNKNOWN';
  symbology?: string;
  rawLength: number;
  occurredAt: string;
};

export type CameraCaptureRequest = {
  maxCount?: 1;
  quality?: 'ORIGINAL' | 'COMPRESSED';
};

export type CameraCaptureResult = {
  localUri: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
};

export type CameraCaptureCompleted = {
  requestId: string;
  result: BridgeResult<CameraCaptureResult>;
};

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

export type BridgeEventEnvelope<TPayload = unknown> = {
  eventId: string;
  eventType: 'scanResult' | 'networkChanged' | 'sessionCleared' | 'cameraCaptureCompleted';
  occurredAt: string;
  payload: TPayload;
};

export type PdaBridgeClient = {
  getDeviceInfo: () => Promise<BridgeResult<DeviceInfo>>;
  getNetworkStatus: () => Promise<BridgeResult<NetworkStatus>>;
  openCamera: (request?: CameraCaptureRequest) => Promise<BridgeResult<CameraCaptureResult>>;
  getSessionTokens?: () => Promise<BridgeResult<SessionTokens | null>>;
  saveSessionTokens?: (tokens: SessionTokens) => Promise<BridgeResult<{ saved: boolean }>>;
  clearSessionTokens?: () => Promise<BridgeResult<{ cleared: boolean }>>;
  beep: () => Promise<BridgeResult<{ played: boolean }>>;
  vibrate: (durationMs?: number) => Promise<BridgeResult<{ vibrated: boolean }>>;
};

export type AndroidPdaBridge = {
  getDeviceInfo: () => string;
  getNetworkStatus: () => string;
  openCamera: (requestJson: string) => string;
  getSessionTokens?: () => string;
  saveSessionTokens?: (tokensJson: string) => string;
  clearSessionTokens?: () => string;
  beep: () => string;
  vibrate: (durationMs: number) => string;
};
