import { TrustedDeviceService } from './trusted-device.service'

describe('TrustedDeviceService', () => {
  it('treats browser devices with the same user, tenant, and deviceId as trusted once recorded', async () => {
    const repository = {
      findByUserScopeDevice: jest.fn().mockResolvedValue({
        scopeLevel: 'TENANT',
        scopeKey: 'tenant-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        deviceId: 'browser-1',
        expiresAt: new Date('2026-05-21T00:00:00.000Z'),
        revokedAt: null
      }),
      saveTrustedDevice: jest.fn(),
      listActiveByUserScope: jest.fn(),
      revokeById: jest.fn(),
      revokeOtherDevices: jest.fn()
    }
    const service = new TrustedDeviceService(repository as any)

    await expect(
      service.isTrustedDevice({
        userId: 'user-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        deviceId: 'browser-1'
      })
    ).resolves.toBe(true)
  })

  it('treats expired trusted devices as not trusted', async () => {
    const repository = {
      findByUserScopeDevice: jest.fn().mockResolvedValue({
        scopeLevel: 'TENANT',
        scopeKey: 'tenant-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        deviceId: 'browser-1',
        expiresAt: new Date('2026-04-20T00:00:00.000Z'),
        revokedAt: null
      }),
      saveTrustedDevice: jest.fn(),
      listActiveByUserScope: jest.fn(),
      revokeById: jest.fn(),
      revokeOtherDevices: jest.fn()
    }
    const service = new TrustedDeviceService(repository as any)

    await expect(
      service.isTrustedDevice({
        userId: 'user-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        deviceId: 'browser-1'
      })
    ).resolves.toBe(false)
  })

  it('treats revoked trusted devices as not trusted', async () => {
    const repository = {
      findByUserScopeDevice: jest.fn().mockResolvedValue({
        scopeLevel: 'TENANT',
        scopeKey: 'tenant-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        deviceId: 'browser-1',
        expiresAt: new Date('2026-05-21T00:00:00.000Z'),
        revokedAt: new Date('2026-04-21T00:00:00.000Z')
      }),
      saveTrustedDevice: jest.fn(),
      listActiveByUserScope: jest.fn(),
      revokeById: jest.fn(),
      revokeOtherDevices: jest.fn()
    }
    const service = new TrustedDeviceService(repository as any)

    await expect(
      service.isTrustedDevice({
        userId: 'user-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        deviceId: 'browser-1'
      })
    ).resolves.toBe(false)
  })

  it('lists active trusted devices for one tenant user', async () => {
    const repository = {
      findByUserScopeDevice: jest.fn(),
      saveTrustedDevice: jest.fn(),
      listActiveByUserScope: jest.fn().mockResolvedValue([
        {
          id: 'trusted-device-1',
          scopeLevel: 'TENANT',
          scopeKey: 'tenant-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          deviceId: 'browser-1',
          deviceName: 'Firefox on macOS',
          browser: 'Firefox',
          platform: 'macOS',
          trustedAt: new Date('2026-04-21T00:00:00.000Z'),
          expiresAt: new Date('2026-05-21T00:00:00.000Z'),
          revokedAt: null
        }
      ]),
      revokeById: jest.fn(),
      revokeOtherDevices: jest.fn()
    }
    const service = new TrustedDeviceService(repository as any)

    await expect(
      service.listTrustedDevices({
        userId: 'user-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual([
      expect.objectContaining({
        id: 'trusted-device-1',
        browser: 'Firefox',
        platform: 'macOS'
      })
    ])
  })

  it('writes a 30-day trusted-device expiry when remembering one device', async () => {
    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 3, 21, 12, 0, 0))
    const repository = {
      findByUserScopeDevice: jest.fn(),
      saveTrustedDevice: jest.fn(),
      listActiveByUserScope: jest.fn(),
      revokeById: jest.fn(),
      revokeOtherDevices: jest.fn()
    }
    const service = new TrustedDeviceService(repository as any)

    await service.rememberTrustedDevice({
      userId: 'user-1',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      deviceId: 'browser-1',
      deviceName: ' Firefox on macOS ',
      userAgent: ' Mozilla/5.0 ',
      ipAddress: ' 127.0.0.1 ',
      browser: ' Firefox ',
      platform: ' macOS '
    } as any)

    expect(repository.saveTrustedDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        scopeLevel: 'TENANT',
        scopeKey: 'tenant-1',
        tenantId: 'tenant-1',
        deviceId: 'browser-1',
        deviceName: 'Firefox on macOS',
        userAgent: 'Mozilla/5.0',
        lastIpAddress: '127.0.0.1',
        browser: 'Firefox',
        platform: 'macOS',
        trustedAt: new Date('2026-04-21T12:00:00.000Z'),
        expiresAt: new Date('2026-05-21T12:00:00.000Z'),
        revokedAt: null
      })
    )

    dateNowSpy.mockRestore()
  })

  it('syncs trusted-device recent activity from session activity without changing trust scope', async () => {
    const repository = {
      findByUserScopeDevice: jest.fn(),
      saveTrustedDevice: jest.fn(),
      listActiveByUserScope: jest.fn(),
      revokeById: jest.fn(),
      revokeOtherDevices: jest.fn(),
      markDeviceSeen: jest.fn().mockResolvedValue(undefined)
    }
    const service = new TrustedDeviceService(repository as any)

    await service.markTrustedDeviceSeen({
      userId: 'user-1',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      deviceId: ' browser-1 ',
      deviceName: ' Firefox on macOS ',
      userAgent: ' Mozilla/5.0 Firefox/149.0 ',
      ipAddress: ' 127.0.0.1 ',
      observedAt: new Date('2026-04-21T12:30:00.000Z')
    })

    expect(repository.markDeviceSeen).toHaveBeenCalledWith({
      userId: 'user-1',
      scopeKey: 'tenant-1',
      deviceId: 'browser-1',
      deviceName: 'Firefox on macOS',
      browser: 'Firefox',
      platform: undefined,
      userAgent: 'Mozilla/5.0 Firefox/149.0',
      lastIpAddress: '127.0.0.1',
      lastSeenAt: new Date('2026-04-21T12:30:00.000Z')
    })
  })

  it('revokes one trusted device through the repository', async () => {
    const repository = {
      findByUserScopeDevice: jest.fn(),
      saveTrustedDevice: jest.fn(),
      listActiveByUserScope: jest.fn(),
      revokeById: jest.fn().mockResolvedValue(1),
      revokeOtherDevices: jest.fn()
    }
    const service = new TrustedDeviceService(repository as any)

    await expect(
      service.revokeTrustedDevice({
        userId: 'user-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        id: 'trusted-device-1'
      } as any)
    ).resolves.toBe(1)

    expect(repository.revokeById).toHaveBeenCalledWith({
      userId: 'user-1',
      scopeKey: 'tenant-1',
      id: 'trusted-device-1'
    })
  })

  it('revokes other trusted devices through the repository', async () => {
    const repository = {
      findByUserScopeDevice: jest.fn(),
      saveTrustedDevice: jest.fn(),
      listActiveByUserScope: jest.fn(),
      revokeById: jest.fn(),
      revokeOtherDevices: jest.fn().mockResolvedValue(3)
    }
    const service = new TrustedDeviceService(repository as any)

    await expect(
      service.revokeOtherTrustedDevices({
        userId: 'user-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        currentDeviceId: 'browser-1'
      } as any)
    ).resolves.toBe(3)

    expect(repository.revokeOtherDevices).toHaveBeenCalledWith({
      userId: 'user-1',
      scopeKey: 'tenant-1',
      currentDeviceId: 'browser-1'
    })
  })

  it('ignores trusted-device activity updates when the device id is not usable', async () => {
    const repository = {
      findByUserScopeDevice: jest.fn(),
      saveTrustedDevice: jest.fn(),
      listActiveByUserScope: jest.fn(),
      revokeById: jest.fn(),
      revokeOtherDevices: jest.fn(),
      markDeviceSeen: jest.fn()
    }
    const service = new TrustedDeviceService(repository as any)

    await service.markTrustedDeviceSeen({
      userId: 'user-1',
      scopeLevel: 'SYSTEM',
      deviceId: ' unknown ',
      observedAt: new Date('2026-04-21T12:30:00.000Z')
    })

    expect(repository.markDeviceSeen).not.toHaveBeenCalled()
  })
})
