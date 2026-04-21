import { DeviceInfo } from '../../domain/aggregates/usersession.aggregate'

export type AuthDeviceContextInput = {
  deviceId?: string
  deviceName?: string
  userAgent?: string
  ipAddress?: string
}

// normalizeAuthDeviceContext derives a stable auth-facing device snapshot from optional client hints.
export function normalizeAuthDeviceContext(input: AuthDeviceContextInput): DeviceInfo {
  const deviceId = input.deviceId?.trim()
  const deviceName = input.deviceName?.trim()
  const userAgent = input.userAgent?.trim()
  const ipAddress = input.ipAddress?.trim()
  const platform = inferPlatform(userAgent)
  const browser = inferBrowser(userAgent)

  return {
    deviceId: deviceId || 'unknown',
    deviceName: deviceName || buildDefaultDeviceName(platform, browser),
    userAgent: userAgent || 'unknown',
    ipAddress: ipAddress || 'unknown',
    platform,
    browser
  }
}

// inferPlatform maps the user-agent string into the platform label shown in auth security views.
function inferPlatform(userAgent?: string): string | undefined {
  const ua = userAgent?.toLowerCase() ?? ''
  if (!ua) return undefined
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'iOS'
  if (ua.includes('android')) return 'Android'
  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('mac os') || ua.includes('macintosh')) return 'macOS'
  if (ua.includes('linux')) return 'Linux'
  return undefined
}

// inferBrowser maps the user-agent string into the browser label shown in auth security views.
function inferBrowser(userAgent?: string): string | undefined {
  const ua = userAgent?.toLowerCase() ?? ''
  if (!ua) return undefined
  if (ua.includes('edg/')) return 'Edge'
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera'
  if (ua.includes('chrome/')) return 'Chrome'
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari'
  if (ua.includes('firefox/')) return 'Firefox'
  return undefined
}

// buildDefaultDeviceName produces a readable device label when the caller does not supply one.
function buildDefaultDeviceName(platform?: string, browser?: string): string {
  if (platform && browser) {
    return `${platform} / ${browser}`
  }

  if (platform) {
    return platform
  }

  if (browser) {
    return browser
  }

  return 'unknown'
}
