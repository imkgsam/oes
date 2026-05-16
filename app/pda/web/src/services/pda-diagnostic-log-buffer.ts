import { getBridgeClient } from '@/bridge/bridge-client';
import { postPdaDiagnosticLogs, type PdaDeviceLogsRequest, type PdaDiagnosticLogEntry } from '@/api/pda-bff.client';
import { useSessionStore } from '@/stores/session.store';

export type PdaDiagnosticLogInput = Omit<PdaDiagnosticLogEntry, 'clientTime'> & {
  clientTime?: string;
};

export type PdaDiagnosticUploadResult = {
  uploadedCount: number;
  remainingCount: number;
  serverTime?: string;
};

const STORAGE_KEY = 'oes:pda:diagnostic-logs';
const MAX_LOCAL_LOGS = 50;
const REDACTED_VALUE = '[REDACTED]';
const SENSITIVE_KEY_PATTERN = /(authorization|credential|password|secret|token)/i;

const listeners = new Set<(logs: PdaDiagnosticLogEntry[]) => void>();

/** Records and uploads operator-triggered PDA diagnostic logs without becoming an automatic log pipeline. */
export function recordPdaDiagnosticLog(input: PdaDiagnosticLogInput): PdaDiagnosticLogEntry {
  const log: PdaDiagnosticLogEntry = {
    clientTime: input.clientTime || new Date().toISOString(),
    level: input.level,
    eventType: input.eventType,
    message: input.message,
    traceId: input.traceId ?? null,
    requestId: input.requestId ?? null,
    errorCode: input.errorCode ?? null,
    diagnosticMode: input.diagnosticMode,
    details: sanitizeDetails(input.details ?? {}) as Record<string, unknown>,
  };
  const logs = [log, ...getPdaDiagnosticLogs()].slice(0, MAX_LOCAL_LOGS);
  saveLogs(logs);
  return log;
}

/** Returns newest-first PDA diagnostic logs from local storage. */
export function getPdaDiagnosticLogs(): PdaDiagnosticLogEntry[] {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Clears the local PDA diagnostic buffer after a successful manual upload or operator action. */
export function clearPdaDiagnosticLogs(): void {
  saveLogs([]);
}

/** Subscribes a Vue component to local diagnostic log buffer changes. */
export function subscribePdaDiagnosticLogs(listener: (logs: PdaDiagnosticLogEntry[]) => void): () => void {
  listeners.add(listener);
  listener(getPdaDiagnosticLogs());
  return () => {
    listeners.delete(listener);
  };
}

/** Uploads the current local diagnostic buffer with device and session context, then clears accepted logs. */
export async function uploadPdaDiagnosticLogs(): Promise<PdaDiagnosticUploadResult> {
  const logs = getPdaDiagnosticLogs();
  if (!logs.length) {
    return {
      uploadedCount: 0,
      remainingCount: 0,
    };
  }

  const sessionStore = useSessionStore();
  const request: PdaDeviceLogsRequest = {
    device: await resolveDeviceMetadata(),
    session: buildSessionSummary(sessionStore),
    logs,
  };
  const response = await postPdaDiagnosticLogs(request, sessionStore.accessToken);

  if (response.accepted) {
    clearPdaDiagnosticLogs();
  }

  return {
    uploadedCount: response.receivedCount,
    remainingCount: getPdaDiagnosticLogs().length,
    serverTime: response.serverTime,
  };
}

function saveLogs(logs: PdaDiagnosticLogEntry[]): void {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // If the shell blocks storage, diagnostics remain best-effort and should not block PDA work.
  }
  notifyListeners(logs);
}

function notifyListeners(logs: PdaDiagnosticLogEntry[]): void {
  listeners.forEach((listener) => listener([...logs]));
}

async function resolveDeviceMetadata(): Promise<PdaDeviceLogsRequest['device']> {
  const result = await getBridgeClient().getDeviceInfo();
  if (!result.ok) {
    throw new Error('无法读取 PDA 设备信息，暂不能上传诊断日志。');
  }

  return {
    deviceId: result.data.deviceId,
    idSource: result.data.idSource,
    manufacturer: result.data.manufacturer,
    deviceModel: result.data.model,
    androidVersion: result.data.osVersion,
    appVersion: result.data.appVersion,
  };
}

function buildSessionSummary(sessionStore: ReturnType<typeof useSessionStore>): PdaDeviceLogsRequest['session'] {
  const accountId = sessionStore.bootstrap?.account?.accountId;
  const sessionId = sessionStore.bootstrap?.session?.sessionId;
  if (!accountId || !sessionId) {
    return null;
  }

  return {
    accountId,
    tenantId: sessionStore.bootstrap?.account?.tenantId ?? null,
    sessionId,
  };
}

function sanitizeDetails(value: unknown, key = ''): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return REDACTED_VALUE;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDetails(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
    (sanitized, [entryKey, entryValue]) => {
      sanitized[entryKey] = sanitizeDetails(entryValue, entryKey);
      return sanitized;
    },
    {},
  );
}
