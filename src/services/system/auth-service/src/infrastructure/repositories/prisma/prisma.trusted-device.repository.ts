import { Injectable } from '@nestjs/common'
import {
  TrustedDeviceRecord,
  TrustedDeviceRepository,
  TrustedDeviceSeenInput,
  TrustedDeviceUpsertInput
} from '../../../domain/repositories/trusted-device.repository'
import { PrismaService } from '../../prisma/prisma.service'

const TRUSTED_DEVICE_ACTIVITY_WRITE_THROTTLE_MS = 60 * 1000

@Injectable()
// Persists scope-aware trusted devices so login can distinguish a recognized browser from a newly seen one.
export class PrismaTrustedDeviceRepository implements TrustedDeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserScopeDevice(input: {
    deviceId: string
    scopeKey: string
    userId: string
  }): Promise<null | TrustedDeviceRecord> {
    const trustedDevice = this.prisma.trustedDevice as any
    const record = (await trustedDevice.findUnique({
      where: {
        userId_scopeKey_deviceId: {
          userId: input.userId,
          scopeKey: input.scopeKey,
          deviceId: input.deviceId
        }
      }
    })) as null | Record<string, any>

    if (!record) {
      return null
    }

    return {
      id: record.id,
      userId: record.userId,
      scopeLevel: record.scopeLevel,
      scopeKey: record.scopeKey,
      tenantId: record.tenantId ?? undefined,
      deviceId: record.deviceId,
      deviceName: record.deviceName ?? undefined,
      browser: record.browser ?? undefined,
      platform: record.platform ?? undefined,
      userAgent: record.userAgent ?? undefined,
      lastIpAddress: record.lastIpAddress ?? undefined,
      trustedAt: record.trustedAt,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt ?? null,
      lastSeenAt: record.lastSeenAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }

  async listActiveByUserScope(input: {
    scopeKey: string
    userId: string
  }): Promise<TrustedDeviceRecord[]> {
    const now = new Date()
    const trustedDevice = this.prisma.trustedDevice as any
    const records = (await trustedDevice.findMany({
      where: {
        scopeKey: input.scopeKey,
        userId: input.userId,
        revokedAt: null,
        expiresAt: {
          gt: now
        }
      },
      orderBy: [{ lastSeenAt: 'desc' }, { trustedAt: 'desc' }]
    })) as Array<Record<string, any>>

    return records.map((record) => ({
      id: record.id,
      userId: record.userId,
      scopeLevel: record.scopeLevel,
      scopeKey: record.scopeKey,
      tenantId: record.tenantId ?? undefined,
      deviceId: record.deviceId,
      deviceName: record.deviceName ?? undefined,
      browser: record.browser ?? undefined,
      platform: record.platform ?? undefined,
      userAgent: record.userAgent ?? undefined,
      lastIpAddress: record.lastIpAddress ?? undefined,
      trustedAt: record.trustedAt,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt ?? null,
      lastSeenAt: record.lastSeenAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }))
  }

  async revokeById(input: {
    id: string
    scopeKey: string
    userId: string
  }): Promise<number> {
    const trustedDevice = this.prisma.trustedDevice as any
    const result = await trustedDevice.updateMany({
      where: {
        id: input.id,
        scopeKey: input.scopeKey,
        userId: input.userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    })

    return result.count
  }

  async revokeOtherDevices(input: {
    currentDeviceId?: string
    scopeKey: string
    userId: string
  }): Promise<number> {
    const trustedDevice = this.prisma.trustedDevice as any
    const result = await trustedDevice.updateMany({
      where: {
        scopeKey: input.scopeKey,
        userId: input.userId,
        revokedAt: null,
        ...(input.currentDeviceId
          ? {
              deviceId: {
                not: input.currentDeviceId
              }
            }
          : {})
      },
      data: {
        revokedAt: new Date()
      }
    })

    return result.count
  }

  // Persists a throttled last-seen snapshot so trusted-device activity follows live session activity without writing every request.
  async markDeviceSeen(input: TrustedDeviceSeenInput): Promise<void> {
    const trustedDevice = this.prisma.trustedDevice as any
    await trustedDevice.updateMany({
      where: {
        scopeKey: input.scopeKey,
        userId: input.userId,
        deviceId: input.deviceId,
        revokedAt: null,
        lastSeenAt: {
          lt: new Date(input.lastSeenAt.getTime() - TRUSTED_DEVICE_ACTIVITY_WRITE_THROTTLE_MS)
        }
      },
      data: {
        deviceName: input.deviceName ?? null,
        browser: input.browser ?? null,
        platform: input.platform ?? null,
        userAgent: input.userAgent ?? null,
        lastIpAddress: input.lastIpAddress ?? null,
        lastSeenAt: input.lastSeenAt
      }
    })
  }

  async saveTrustedDevice(device: TrustedDeviceUpsertInput): Promise<void> {
    const now = new Date()
    const trustedDevice = this.prisma.trustedDevice as any
    await trustedDevice.upsert({
      where: {
        userId_scopeKey_deviceId: {
          userId: device.userId,
          scopeKey: device.scopeKey,
          deviceId: device.deviceId
        }
      },
      update: {
        scopeLevel: device.scopeLevel,
        scopeKey: device.scopeKey,
        tenantId: device.tenantId ?? null,
        deviceName: device.deviceName ?? null,
        browser: device.browser ?? null,
        platform: device.platform ?? null,
        userAgent: device.userAgent ?? null,
        lastIpAddress: device.lastIpAddress ?? null,
        expiresAt: device.expiresAt ?? now,
        revokedAt: null,
        lastSeenAt: device.lastSeenAt ?? now
      },
      create: {
        userId: device.userId,
        scopeLevel: device.scopeLevel,
        scopeKey: device.scopeKey,
        tenantId: device.tenantId ?? null,
        deviceId: device.deviceId,
        deviceName: device.deviceName ?? null,
        browser: device.browser ?? null,
        platform: device.platform ?? null,
        userAgent: device.userAgent ?? null,
        lastIpAddress: device.lastIpAddress ?? null,
        trustedAt: device.trustedAt ?? now,
        expiresAt: device.expiresAt ?? now,
        revokedAt: device.revokedAt ?? null,
        lastSeenAt: device.lastSeenAt ?? now
      }
    })
  }
}
