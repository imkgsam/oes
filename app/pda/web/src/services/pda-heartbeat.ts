import { getBridgeClient } from '@/bridge/bridge-client';
import { postPdaHeartbeat, type PdaHeartbeatRequest } from '@/api/pda-bff.client';
import { useSessionStore } from '@/stores/session.store';

export type PdaHeartbeatAppState = 'FOREGROUND' | 'BACKGROUND' | 'LOGIN' | 'LOGOUT' | 'SESSION_RESTORED';

let heartbeatTimer: number | undefined;
let visibilityListenerInstalled = false;

/** Sends one PDA heartbeat, silently skipping it when the device is offline or bridge data is unavailable. */
export async function sendPdaHeartbeat(appState: PdaHeartbeatAppState): Promise<boolean> {
  const bridge = getBridgeClient();
  let deviceResult: Awaited<ReturnType<typeof bridge.getDeviceInfo>>;
  let networkResult: Awaited<ReturnType<typeof bridge.getNetworkStatus>>;

  try {
    [deviceResult, networkResult] = await Promise.all([
      bridge.getDeviceInfo(),
      bridge.getNetworkStatus(),
    ]);
  } catch {
    return false;
  }

  if (!deviceResult?.ok || !networkResult?.ok || !networkResult.data.connected) {
    return false;
  }

  const sessionStore = useSessionStore();
  const request: PdaHeartbeatRequest = {
    device: {
      deviceId: deviceResult.data.deviceId,
      idSource: deviceResult.data.idSource,
      manufacturer: deviceResult.data.manufacturer,
      deviceModel: deviceResult.data.model,
      androidVersion: deviceResult.data.osVersion,
      appVersion: deviceResult.data.appVersion,
    },
    runtime: {
      networkStatus: 'ONLINE',
      appState,
    },
    session: buildSessionSummary(sessionStore),
    clientTime: new Date().toISOString(),
  };

  try {
    await postPdaHeartbeat(request, sessionStore.accessToken);
    return true;
  } catch {
    return false;
  }
}

/** Starts foreground heartbeat using the server-provided device policy interval when available. */
export function startPdaHeartbeat(): void {
  stopPdaHeartbeat();
  void sendPdaHeartbeat('FOREGROUND');

  const intervalSeconds = useSessionStore().bootstrap?.devicePolicy?.heartbeatIntervalSeconds ?? 300;
  heartbeatTimer = window.setInterval(() => {
    void sendPdaHeartbeat('FOREGROUND');
  }, intervalSeconds * 1000);

  installVisibilityHeartbeat();
}

/** Stops scheduled heartbeat when leaving the authenticated PDA workbench. */
export function stopPdaHeartbeat(): void {
  if (heartbeatTimer === undefined) {
    return;
  }

  window.clearInterval(heartbeatTimer);
  heartbeatTimer = undefined;
}

function buildSessionSummary(sessionStore: ReturnType<typeof useSessionStore>): PdaHeartbeatRequest['session'] {
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

function installVisibilityHeartbeat(): void {
  if (visibilityListenerInstalled) {
    return;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void sendPdaHeartbeat('FOREGROUND');
    }
  });
  visibilityListenerInstalled = true;
}
