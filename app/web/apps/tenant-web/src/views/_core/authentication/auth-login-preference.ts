type AuthLoginMode = 'email' | 'phone';
type AuthLoginScene = 'otp' | 'password';

interface AuthLoginScenePreference {
  email?: string;
  mode: AuthLoginMode;
  phoneNumber?: string;
}

interface AuthLoginPreference {
  otp?: AuthLoginScenePreference;
  password?: AuthLoginScenePreference;
}

const AUTH_LOGIN_PREFERENCE_STORAGE_KEY = 'tenant-web.auth.login-preference.v1';

// Persists and restores the last successful-looking login entry point so auth screens reopen on the user's previous mode and identifier.
export function resolveAuthLoginScenePreference(
  scene: AuthLoginScene,
): AuthLoginScenePreference | null {
  const stored = readAuthLoginPreference();
  return stored?.[scene] ?? null;
}

// Stores one login-scene preference without overwriting the other scene's remembered identifier.
export function saveAuthLoginScenePreference(
  scene: AuthLoginScene,
  preference: AuthLoginScenePreference,
): void {
  const nextState: AuthLoginPreference = {
    ...(readAuthLoginPreference() ?? {}),
    [scene]: sanitizeScenePreference(preference),
  };

  writeAuthLoginPreference(nextState);
}

function sanitizeScenePreference(
  preference: AuthLoginScenePreference,
): AuthLoginScenePreference {
  if (preference.mode === 'phone') {
    return {
      mode: 'phone',
      phoneNumber: `${preference.phoneNumber ?? ''}`.trim(),
    };
  }

  return {
    mode: 'email',
    email: `${preference.email ?? ''}`.trim(),
  };
}

function readAuthLoginPreference(): AuthLoginPreference | null {
  const storage = resolveStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(AUTH_LOGIN_PREFERENCE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthLoginPreference;
    return typeof parsed === 'object' && parsed ? parsed : null;
  } catch {
    return null;
  }
}

function writeAuthLoginPreference(preference: AuthLoginPreference): void {
  const storage = resolveStorage();
  if (!storage) {
    return;
  }

  storage.setItem(AUTH_LOGIN_PREFERENCE_STORAGE_KEY, JSON.stringify(preference));
}

function resolveStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage ?? null;
}
