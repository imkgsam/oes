import type { AuthApi } from '#/api'

const AUTH_DEVICE_ID_STORAGE_KEY = 'tenant-web-auth-device-id'

// resolveAuthDeviceHints returns the stable and user-readable device hints attached to auth requests.
export function resolveAuthDeviceHints(): AuthApi.LoginParams['device'] {
  return {
    deviceId: resolveDeviceId(),
    deviceName: buildDeviceName(resolveUserAgent()),
  }
}

// resolveDeviceId reuses the locally persisted auth device id or creates a new stable browser id.
function resolveDeviceId(): string {
  if (typeof localStorage === 'undefined') {
    return 'browser-unknown'
  }

  const existing = localStorage.getItem(AUTH_DEVICE_ID_STORAGE_KEY)?.trim()
  if (existing) {
    return existing
  }

  const created = createDeviceId()
  localStorage.setItem(AUTH_DEVICE_ID_STORAGE_KEY, created)
  return created
}

// createDeviceId generates a stable browser-side identifier without depending on backend state.
function createDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `browser-${Math.random().toString(36).slice(2, 12)}`
}

// resolveUserAgent reads the current browser user-agent when the runtime provides one.
function resolveUserAgent(): string {
  if (typeof navigator === 'undefined') {
    return ''
  }

  return navigator.userAgent ?? ''
}

// buildDeviceName derives a readable browser label for auth and session-management views.
function buildDeviceName(userAgent: string): string {
  const platform = inferPlatform(userAgent)
  const browser = inferBrowser(userAgent)

  if (browser && platform) {
    return `${browser} on ${platform}`
  }

  if (browser) {
    return browser
  }

  if (platform) {
    return platform
  }

  return 'Web Browser'
}

// inferPlatform maps the browser user-agent into a simplified platform label.
function inferPlatform(userAgent: string): string | undefined {
  const ua = userAgent.toLowerCase()
  if (!ua) return undefined
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'iOS'
  if (ua.includes('android')) return 'Android'
  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('mac os') || ua.includes('macintosh')) return 'macOS'
  if (ua.includes('linux')) return 'Linux'
  return undefined
}

// inferBrowser maps the browser user-agent into a simplified browser label.
function inferBrowser(userAgent: string): string | undefined {
  const ua = userAgent.toLowerCase()
  if (!ua) return undefined
  if (ua.includes('edg/')) return 'Edge'
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera'
  if (ua.includes('chrome/')) return 'Chrome'
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari'
  if (ua.includes('firefox/')) return 'Firefox'
  return undefined
}
