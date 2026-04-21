import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Verifies tenant-web derives stable and readable auth-device hints from the browser environment.
describe('resolveAuthDeviceHints', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reuses the stored device id and derives a readable browser label', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Gecko/20100101 Firefox/149.0',
    })
    localStorage.getItem = vi.fn(() => 'device-existing')

    const { resolveAuthDeviceHints } = await import('./auth-device')

    expect(resolveAuthDeviceHints()).toEqual({
      deviceId: 'device-existing',
      deviceName: 'Firefox on macOS',
    })
    expect(localStorage.setItem).not.toHaveBeenCalled()
  })

  it('creates and persists a device id when the browser does not have one yet', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36',
    })
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'device-new'),
    })
    localStorage.getItem = vi.fn(() => null)
    localStorage.setItem = vi.fn()

    const { resolveAuthDeviceHints } = await import('./auth-device')

    expect(resolveAuthDeviceHints()).toEqual({
      deviceId: 'device-new',
      deviceName: 'Chrome on Windows',
    })
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'tenant-web-auth-device-id',
      'device-new',
    )
  })
})
