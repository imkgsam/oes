import { getBridgeClient } from '@/bridge/bridge-client';
import type { DeviceInfo } from '@/bridge/types';

export type TerminalDeviceStatus =
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'DISABLED'
  | 'LOST'
  | 'MAINTENANCE'
  | 'DECOMMISSIONED';

export type DeviceAccessDecisionCode =
  | 'ALLOW'
  | 'ENROLLMENT_REQUIRED'
  | 'DEVICE_PENDING_APPROVAL'
  | 'DEVICE_DISABLED'
  | 'DEVICE_LOST'
  | 'DEVICE_MAINTENANCE'
  | 'DEVICE_DECOMMISSIONED'
  | 'APP_VERSION_UNSUPPORTED'
  | 'DEVICE_IDENTITY_CONFLICT'
  | 'ENROLLMENT_EXPIRED'
  | 'ENROLLMENT_USED'
  | 'ENROLLMENT_REVOKED'
  | 'ENROLLMENT_INVALID';

export type DeviceRequiredAction =
  | 'NONE'
  | 'ENROLL_DEVICE'
  | 'CONTACT_ADMIN'
  | 'CLEAR_LOCAL_SESSION'
  | 'CLEAR_LOCAL_DEVICE_AND_SESSION'
  | 'UPGRADE_APP';

export type PdaVersionPolicy = {
  minSupportedAppVersion: string;
  latestAppVersion: string;
  upgradeRequired: boolean;
  upgradeRecommended?: boolean;
  apkDownloadUrl?: string | null;
  releaseNotesUrl?: string | null;
};

export type PdaDeviceAccessDecision = {
  allowed: boolean;
  decisionCode: DeviceAccessDecisionCode;
  deviceStatus?: TerminalDeviceStatus | null;
  presenceStatus?: 'ONLINE' | 'OFFLINE' | 'UNKNOWN' | null;
  requiredAction: DeviceRequiredAction;
  messageKey?: string | null;
  shouldClearLocalSession: boolean;
  shouldClearLocalTerminalDeviceId: boolean;
  versionPolicy?: PdaVersionPolicy | null;
};

export type PdaManagedDeviceDescriptor = {
  terminalDeviceId?: string | null;
  terminalDeviceType: 'PDA';
  identity: {
    manufacturerSerial?: string | null;
    androidId?: string | null;
    appInstallationId?: string | null;
    manufacturer?: string | null;
    model?: string | null;
  };
  software: {
    androidVersion?: string | null;
    webViewVersion?: string | null;
    appVersion: string;
  };
};

export type PdaEnrollmentResponse = {
  enrolled: boolean;
  terminalDeviceId: string | null;
  tenantId?: string | null;
  terminalDeviceType?: 'PDA';
  displayName?: string | null;
  deviceStatus?: TerminalDeviceStatus | null;
  decision: PdaDeviceAccessDecision;
  serverTime?: string;
};

export type BootstrapResponse = {
  account?: {
    accountId: string;
    tenantId?: string | null;
    scopeLevel?: string;
    displayName?: string;
  };
  session?: {
    sessionId?: string;
    terminal: 'PDA';
    terminalDeviceId?: string;
    expiresAt?: string;
    idleTimeoutSeconds: number;
  };
  access?: {
    roles: string[];
    actionCodes: string[];
  };
  devicePolicy?: {
    heartbeatIntervalSeconds: number;
    idleTimeoutSeconds: number;
    minSupportedAppVersion: string;
    latestAppVersion: string;
    upgradeRequired: boolean;
  };
  device?: {
    terminalDeviceId: string;
    terminalDeviceType: 'PDA';
    tenantId?: string | null;
    displayName?: string | null;
    deviceStatus: TerminalDeviceStatus;
  };
  decision?: PdaDeviceAccessDecision;
  serverTime?: string;
};

export type PdaLoginRequest = {
  identifier: string;
  credential: string;
  deviceName?: string;
  terminalDeviceId: string;
  device: PdaManagedDeviceDescriptor;
};

export type PdaAccountSelectionRequest = {
  userId: string;
  accountId: string;
  loginMethod?: string;
  deviceName?: string;
};

export type PdaLoginResponse = {
  status: 'SUCCESS' | 'MFA_REQUIRED' | 'ACCOUNT_SELECTION_REQUIRED' | 'CHALLENGE_REQUIRED' | 'DENIED';
  nextStep: string;
  loginMethod?: string;
  session?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    terminal?: string;
    terminalDeviceId?: string;
  } | null;
  operator?: {
    userId?: string;
    accountId?: string;
    tenantId?: string | null;
    displayName?: string;
  } | null;
  accountOptions: Array<{
    accountId: string;
    tenantId?: string | null;
    tenantName?: string | null;
    displayName?: string;
    scopeLevel: string;
  }>;
  reasonCode?: string;
  message?: string;
  terminal?: 'PDA';
  terminalDeviceId?: string;
  deviceBoundTenantId?: string;
};

export type PdaRefreshSessionResponse = {
  sessionId?: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  terminal?: string;
  allowedTerminals?: string[];
  reasonCode?: string;
  message?: string;
  terminalDeviceId?: string;
  deviceBoundTenantId?: string;
};

export type PdaLogoutResponse = {
  success: boolean;
};

export type PdaHeartbeatRequest = {
  device: PdaManagedDeviceDescriptor;
  runtime: {
    networkStatus: 'ONLINE' | 'OFFLINE';
    networkType?: string;
    batteryLevel?: number;
    appState: 'FOREGROUND' | 'BACKGROUND' | 'LOGIN' | 'LOGOUT' | 'SESSION_RESTORED';
  };
  session: {
    accountId: string;
    tenantId?: string | null;
    sessionId: string;
  } | null;
  clientTime: string;
};

export type PdaHeartbeatResponse = {
  accepted: boolean;
  decision: PdaDeviceAccessDecision;
  heartbeatIntervalSeconds?: number;
  serverTime: string;
};

export type PdaDiagnosticLogEntry = {
  clientTime: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  eventType: string;
  message: string;
  traceId?: string | null;
  requestId?: string | null;
  errorCode?: string | null;
  diagnosticMode: boolean;
  details?: Record<string, unknown>;
};

export type PdaDeviceLogsRequest = {
  device: PdaHeartbeatRequest['device'];
  session: PdaHeartbeatRequest['session'];
  logs: PdaDiagnosticLogEntry[];
};

export type PdaDeviceLogsResponse = {
  accepted: boolean;
  receivedCount?: number;
  logBatchId?: string;
  decision?: PdaDeviceAccessDecision;
  serverTime: string;
};

type GatewayEnvelope<T> = {
  data?: T;
};

type GatewayErrorPayload = {
  message?: string | string[];
  error?: string;
  reasonCode?: string;
  messageKey?: string;
};

declare global {
  interface Window {
    __OES_PDA_CONFIG__?: {
      bffBaseUrl?: string;
      bffBaseUrls?: string[];
    };
  }
}

const DEFAULT_BFF_BASE_URLS = [
  'http://192.168.2.33:9101/api/v1',
  'http://192.168.100.44:9101/api/v1',
];
const LAST_WORKING_BFF_BASE_URL_KEY = 'oes:pda:last-bff-base-url';
const PDA_OFFLINE_MESSAGE = 'PDA 当前没有网络，请连接 Wi-Fi 或公司局域网后重试。';

/** Carries PDA BFF HTTP status so session code can distinguish auth expiry from network failures. */
export class PdaBffError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'PdaBffError';
  }
}

/** Activates a managed PDA device using an administrator-issued enrollment code. */
export async function enrollPdaDevice(
  enrollmentCode: string,
  device: PdaManagedDeviceDescriptor,
): Promise<PdaEnrollmentResponse> {
  return requestPdaBff<PdaEnrollmentResponse>('/pda/device/enroll', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      enrollmentCode,
      device,
      clientTime: new Date().toISOString(),
    }),
  });
}

/** Logs into the PDA terminal through the terminal-scoped auth BFF endpoint. */
export async function loginPda(request: PdaLoginRequest): Promise<PdaLoginResponse> {
  return requestPdaBff<PdaLoginResponse>('/pda/auth/login', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      method: resolvePasswordLoginMethod(request.identifier),
      identifier: request.identifier,
      credential: request.credential,
      terminalDeviceId: request.terminalDeviceId,
      device: {
        ...request.device,
        deviceId: request.terminalDeviceId,
        deviceName: request.deviceName || 'OES PDA',
      },
    }),
  });
}

/** Selects a single PDA account candidate and continues the terminal-scoped login flow. */
export async function selectPdaAccount(request: PdaAccountSelectionRequest): Promise<PdaLoginResponse> {
  return requestPdaBff<PdaLoginResponse>('/pda/auth/account-selection', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      userId: request.userId,
      accountId: request.accountId,
      loginMethod: normalizeLoginMethod(request.loginMethod),
      device: {
        deviceName: request.deviceName || 'OES PDA',
      },
    }),
  });
}

/** Rotates the PDA terminal token pair through the terminal-scoped refresh endpoint. */
export async function refreshPdaSession(refreshToken: string): Promise<PdaRefreshSessionResponse> {
  return requestPdaBff<PdaRefreshSessionResponse>('/pda/auth/session/refresh', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ refreshToken }),
  });
}

/** Revokes the currently authenticated PDA terminal session through the BFF. */
export async function logoutPda(accessToken: string): Promise<PdaLogoutResponse> {
  return requestPdaBff<PdaLogoutResponse>('/pda/auth/logout', {
    method: 'POST',
    headers: {
      ...jsonHeaders(),
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/** Calls PDA BFF bootstrap with the managed terminal device binding. */
export async function fetchPdaBootstrap(accessToken: string, terminalDeviceId: string): Promise<BootstrapResponse> {
  const searchParams = new URLSearchParams({ terminalDeviceId });
  return requestPdaBff<BootstrapResponse>(`/pda/session/bootstrap?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/** Sends PDA device/app runtime heartbeat without making it the source of login truth. */
export async function postPdaHeartbeat(
  request: PdaHeartbeatRequest,
  accessToken?: string | null,
): Promise<PdaHeartbeatResponse> {
  return requestPdaBff<PdaHeartbeatResponse>('/pda/device/heartbeat', {
    method: 'POST',
    headers: {
      ...jsonHeaders(),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(request),
  });
}

/** Manually uploads local PDA diagnostic logs for Phase 1 field troubleshooting. */
export async function postPdaDiagnosticLogs(
  request: PdaDeviceLogsRequest,
  accessToken?: string | null,
): Promise<PdaDeviceLogsResponse> {
  return requestPdaBff<PdaDeviceLogsResponse>('/pda/device/logs', {
    method: 'POST',
    headers: {
      ...jsonHeaders(),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(request),
  });
}

/** Maps Android bridge device facts into the managed PDA metadata contract. */
export function toManagedPdaDeviceDescriptor(
  deviceInfo: DeviceInfo,
  terminalDeviceId?: string | null,
): PdaManagedDeviceDescriptor {
  return {
    terminalDeviceId: terminalDeviceId || undefined,
    terminalDeviceType: 'PDA',
    identity: {
      manufacturerSerial: deviceInfo.idSource === 'MANUFACTURER_SERIAL' ? deviceInfo.deviceId : null,
      androidId: deviceInfo.idSource === 'ANDROID_ID' ? deviceInfo.deviceId : null,
      appInstallationId: deviceInfo.idSource === 'APP_GENERATED' ? deviceInfo.deviceId : null,
      manufacturer: deviceInfo.manufacturer,
      model: deviceInfo.model,
    },
    software: {
      androidVersion: deviceInfo.osVersion,
      webViewVersion: deviceInfo.webViewVersion,
      appVersion: deviceInfo.appVersion,
    },
  };
}

/** Sends one PDA BFF request and unwraps the API Gateway success envelope. */
async function requestPdaBff<T>(path: string, init: RequestInit): Promise<T> {
  await assertNetworkAvailable();
  let lastNetworkError: unknown;

  for (const baseUrl of getPdaBffBaseUrls()) {
    let response: Response;

    try {
      response = await fetch(`${baseUrl}${path}`, init);
    } catch (error) {
      lastNetworkError = error;
      continue;
    }

    if (!response) {
      lastNetworkError = new Error('empty fetch response');
      continue;
    }

    rememberWorkingBffBaseUrl(baseUrl);

    if (!response.ok) {
      throw new PdaBffError(await resolvePdaBffErrorMessage(response), response.status);
    }

    const payload = (await response.json()) as GatewayEnvelope<T> | T;
    return unwrapGatewayEnvelope(payload);
  }

  throw new PdaBffError(resolveNetworkFailureMessage(lastNetworkError), 0);
}

/** Uses Android connectivity state to avoid showing browser-internal fetch errors to operators. */
async function assertNetworkAvailable(): Promise<void> {
  const result = await getBridgeClient().getNetworkStatus();
  if (result.ok && !result.data.connected) {
    throw new PdaBffError(PDA_OFFLINE_MESSAGE, 0);
  }
}

/** Extracts gateway error details so PDA operators see the actionable denial or failure reason. */
async function resolvePdaBffErrorMessage(response: Response): Promise<string> {
  const fallback = `PDA BFF request failed with status ${response.status}`;

  try {
    const payload = (await response.json()) as GatewayErrorPayload;
    const message = normalizeGatewayErrorMessage(payload);
    return message || fallback;
  } catch {
    return fallback;
  }
}

function normalizeGatewayErrorMessage(payload?: GatewayErrorPayload): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  if (Array.isArray(payload.message)) {
    return payload.message.filter(Boolean).join('; ');
  }

  return payload.message || payload.reasonCode || payload.messageKey || payload.error;
}

function getPdaBffBaseUrls(): string[] {
  return uniqueStrings([
    getStoredWorkingBffBaseUrl(),
    ...(window.__OES_PDA_CONFIG__?.bffBaseUrls || []),
    window.__OES_PDA_CONFIG__?.bffBaseUrl,
    ...DEFAULT_BFF_BASE_URLS,
  ])
    .map((baseUrl) => baseUrl.replace(/\/$/, ''))
    .filter(Boolean);
}

function getStoredWorkingBffBaseUrl(): string | undefined {
  try {
    return window.localStorage?.getItem(LAST_WORKING_BFF_BASE_URL_KEY) || undefined;
  } catch {
    return undefined;
  }
}

function rememberWorkingBffBaseUrl(baseUrl: string): void {
  try {
    window.localStorage?.setItem(LAST_WORKING_BFF_BASE_URL_KEY, baseUrl);
  } catch {
    // The Android shell can run with storage restrictions; fallback probing still works in memory.
  }
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const normalized = value?.trim();
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

function resolveNetworkFailureMessage(error: unknown): string {
  return error instanceof Error
    ? `PDA BFF network request failed: ${error.message}`
    : 'PDA BFF network request failed';
}

function jsonHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
  };
}

function resolvePasswordLoginMethod(identifier: string): 'EMAIL_PASSWORD' | 'PHONE_PASSWORD' {
  return identifier.includes('@') ? 'EMAIL_PASSWORD' : 'PHONE_PASSWORD';
}

function normalizeLoginMethod(loginMethod?: string): 'EMAIL_PASSWORD' | 'EMAIL_OTP' | 'PHONE_PASSWORD' | 'PHONE_OTP' {
  switch (loginMethod) {
    case 'email-password':
    case 'EMAIL_PASSWORD':
      return 'EMAIL_PASSWORD';
    case 'email-otp':
    case 'EMAIL_OTP':
      return 'EMAIL_OTP';
    case 'phone-password':
    case 'PHONE_PASSWORD':
      return 'PHONE_PASSWORD';
    case 'phone-otp':
    case 'PHONE_OTP':
      return 'PHONE_OTP';
    default:
      return 'EMAIL_PASSWORD';
  }
}

function unwrapGatewayEnvelope<T>(payload: GatewayEnvelope<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as GatewayEnvelope<T>).data as T;
  }

  return payload as T;
}
