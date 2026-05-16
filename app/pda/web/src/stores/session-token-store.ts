import { getBridgeClient } from '@/bridge/bridge-client';

export type PersistedSessionTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

const STORAGE_KEY = 'oes:pda:session-tokens';

/** Persists PDA session tokens through Android Shell storage with browser fallback for local debugging. */
export async function saveSessionTokens(tokens: PersistedSessionTokens): Promise<void> {
  const bridgeResult = await getBridgeClient().saveSessionTokens?.(tokens);
  if (bridgeResult?.ok) {
    return;
  }

  getBrowserStorage()?.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

/** Loads the last PDA token pair so the app can rotate it after WebView or process restart. */
export async function loadSessionTokens(): Promise<PersistedSessionTokens | null> {
  const bridgeResult = await getBridgeClient().getSessionTokens?.();
  if (bridgeResult?.ok && bridgeResult.data?.refreshToken) {
    return bridgeResult.data;
  }

  const rawTokens = getBrowserStorage()?.getItem(STORAGE_KEY);
  if (!rawTokens) {
    return null;
  }

  try {
    return JSON.parse(rawTokens) as PersistedSessionTokens;
  } catch {
    await clearSessionTokens();
    return null;
  }
}

/** Removes persisted PDA token material during logout or rejected refresh recovery. */
export async function clearSessionTokens(): Promise<void> {
  await getBridgeClient().clearSessionTokens?.();
  getBrowserStorage()?.removeItem(STORAGE_KEY);
}

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
