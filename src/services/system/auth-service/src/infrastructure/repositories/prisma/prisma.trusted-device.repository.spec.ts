import { PrismaTrustedDeviceRepository } from './prisma.trusted-device.repository'

describe('PrismaTrustedDeviceRepository', () => {
  it('lists only active trusted devices for one tenant user', async () => {
    const prisma = {
      trustedDevice: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'trusted-device-1',
            userId: 'user-1',
            tenantId: 'tenant-1',
            deviceId: 'browser-1',
            deviceName: 'Firefox on macOS',
            browser: 'Firefox',
            platform: 'macOS',
            userAgent: 'Mozilla/5.0 Firefox/149.0',
            lastIpAddress: '127.0.0.1',
            trustedAt: new Date('2026-04-21T12:00:00.000Z'),
            expiresAt: new Date('2026-05-21T12:00:00.000Z'),
            revokedAt: null,
            lastSeenAt: new Date('2026-04-21T12:30:00.000Z'),
            createdAt: new Date('2026-04-21T12:00:00.000Z'),
            updatedAt: new Date('2026-04-21T12:30:00.000Z')
          }
        ])
      }
    } as any
    const repository = new PrismaTrustedDeviceRepository(prisma)

    await expect(
      repository.listActiveByUserScope({
        userId: 'user-1',
        scopeKey: 'tenant-1'
      })
    ).resolves.toEqual([
      expect.objectContaining({
        id: 'trusted-device-1',
        browser: 'Firefox',
        platform: 'macOS'
      })
    ])
    expect(prisma.trustedDevice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          scopeKey: 'tenant-1',
          revokedAt: null,
          expiresAt: {
            gt: expect.any(Date)
          }
        },
        orderBy: [{ lastSeenAt: 'desc' }, { trustedAt: 'desc' }]
      })
    )
  })

  it('revokes one trusted device with user and tenant scope', async () => {
    const prisma = {
      trustedDevice: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      }
    } as any
    const repository = new PrismaTrustedDeviceRepository(prisma)

    await expect(
      repository.revokeById({
        id: 'trusted-device-1',
        userId: 'user-1',
        scopeKey: 'tenant-1'
      })
    ).resolves.toBe(1)

    expect(prisma.trustedDevice.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'trusted-device-1',
          userId: 'user-1',
          scopeKey: 'tenant-1',
          revokedAt: null
        },
        data: {
          revokedAt: expect.any(Date)
        }
      })
    )
  })

  it('revokes other trusted devices and can keep the current device active', async () => {
    const prisma = {
      trustedDevice: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 })
      }
    } as any
    const repository = new PrismaTrustedDeviceRepository(prisma)

    await expect(
      repository.revokeOtherDevices({
        userId: 'user-1',
        scopeKey: 'tenant-1',
        currentDeviceId: 'browser-1'
      })
    ).resolves.toBe(2)

    expect(prisma.trustedDevice.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          scopeKey: 'tenant-1',
          revokedAt: null,
          deviceId: {
            not: 'browser-1'
          }
        },
        data: {
          revokedAt: expect.any(Date)
        }
      })
    )
  })

  it('refreshes trusted-device lifecycle fields when saving one device again', async () => {
    const prisma = {
      trustedDevice: {
        upsert: jest.fn().mockResolvedValue({
          id: 'trusted-device-1',
          scopeLevel: 'TENANT',
          scopeKey: 'tenant-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          deviceId: 'browser-1'
        })
      }
    } as any
    const repository = new PrismaTrustedDeviceRepository(prisma)

    await repository.saveTrustedDevice({
      userId: 'user-1',
      scopeLevel: 'TENANT',
      scopeKey: 'tenant-1',
      tenantId: 'tenant-1',
      deviceId: 'browser-1',
      deviceName: 'Firefox on macOS',
      browser: 'Firefox',
      platform: 'macOS',
      userAgent: 'Mozilla/5.0 Firefox/149.0',
      lastIpAddress: '127.0.0.1',
      trustedAt: new Date('2026-04-21T12:00:00.000Z'),
      lastSeenAt: new Date('2026-04-21T12:00:00.000Z'),
      expiresAt: new Date('2026-05-21T12:00:00.000Z'),
      revokedAt: null
    } as any)

    expect(prisma.trustedDevice.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_scopeKey_deviceId: {
            userId: 'user-1',
            scopeKey: 'tenant-1',
            deviceId: 'browser-1'
          }
        },
        create: expect.objectContaining({
          browser: 'Firefox',
          platform: 'macOS',
          trustedAt: new Date('2026-04-21T12:00:00.000Z'),
          expiresAt: new Date('2026-05-21T12:00:00.000Z'),
          revokedAt: null,
          lastSeenAt: expect.any(Date)
        }),
        update: expect.objectContaining({
          browser: 'Firefox',
          platform: 'macOS',
          expiresAt: new Date('2026-05-21T12:00:00.000Z'),
          revokedAt: null,
          lastSeenAt: expect.any(Date)
        })
      })
    )

    expect(prisma.trustedDevice.upsert.mock.calls[0][0].update).not.toHaveProperty('trustedAt')
  })

  it('throttles trusted-device activity writes to avoid updating the snapshot on every request', async () => {
    const prisma = {
      trustedDevice: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      }
    } as any
    const repository = new PrismaTrustedDeviceRepository(prisma)
    const lastSeenAt = new Date('2026-04-21T12:30:00.000Z')

    await repository.markDeviceSeen({
      userId: 'user-1',
      scopeKey: 'tenant-1',
      deviceId: 'browser-1',
      deviceName: 'Firefox on macOS',
      browser: 'Firefox',
      platform: 'macOS',
      userAgent: 'Mozilla/5.0 Firefox/149.0',
      lastIpAddress: '127.0.0.1',
      lastSeenAt
    })

    expect(prisma.trustedDevice.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        scopeKey: 'tenant-1',
        deviceId: 'browser-1',
        revokedAt: null,
        lastSeenAt: {
          lt: new Date('2026-04-21T12:29:00.000Z')
        }
      },
      data: {
        deviceName: 'Firefox on macOS',
        browser: 'Firefox',
        platform: 'macOS',
        userAgent: 'Mozilla/5.0 Firefox/149.0',
        lastIpAddress: '127.0.0.1',
        lastSeenAt
      }
    })
  })
})
