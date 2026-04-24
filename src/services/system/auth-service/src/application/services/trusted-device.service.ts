import { Inject, Injectable } from '@nestjs/common'
import { REPO } from '../../common/constants'
import {
  TrustedDeviceRecord,
  TrustedDeviceSeenInput as TrustedDeviceSeenRepositoryInput,
  TrustedDeviceRepository
} from '../../domain/repositories/trusted-device.repository'
import { normalizeAuthDeviceContext } from './auth-device-context'

export interface TrustedTenantDeviceInput {
  browser?: string
  deviceId?: string
  deviceName?: string
  ipAddress?: string
  tenantId?: string
  platform?: string
  userAgent?: string
  userId: string
}

export interface TrustedDeviceScopeInput {
  deviceId?: string
  scopeLevel: 'SYSTEM' | 'TENANT'
  tenantId?: string
  userId: string
}

export interface TrustedDeviceSeenInput {
  deviceId?: string
  deviceName?: string
  ipAddress?: string
  observedAt: Date
  scopeLevel: 'SYSTEM' | 'TENANT'
  tenantId?: string
  userAgent?: string
  userId: string
}

// Encapsulates scope-aware trusted-device rules so login MFA never falls back to raw IP or raw user-agent equality.
@Injectable()
export class TrustedDeviceService {
  constructor(
    @Inject(REPO.TRUSTED_DEVICE)
    private readonly trustedDeviceRepository: TrustedDeviceRepository
  ) {}

  async isTrustedDevice(input: TrustedDeviceScopeInput): Promise<boolean> {
    const scope = normalizeScope(input.scopeLevel, input.tenantId)
    const deviceId = normalizeDeviceId(input.deviceId)

    if (!scope || !deviceId) {
      return false
    }

    const device = await this.trustedDeviceRepository.findByUserScopeDevice({
      userId: input.userId,
      scopeKey: scope.scopeKey,
      deviceId
    })

    return this.isActiveTrustedDevice(device)
  }

  async rememberTrustedDevice(
    input: TrustedTenantDeviceInput & { scopeLevel: 'SYSTEM' | 'TENANT' }
  ): Promise<void> {
    const scope = normalizeScope(input.scopeLevel, input.tenantId)
    const deviceId = normalizeDeviceId(input.deviceId)

    if (!scope || !deviceId) {
      return
    }

    const now = new Date(Date.now())
    const inferredContext = normalizeAuthDeviceContext({
      deviceName: input.deviceName,
      userAgent: input.userAgent
    })

    await this.trustedDeviceRepository.saveTrustedDevice({
      userId: input.userId,
      scopeLevel: scope.scopeLevel,
      scopeKey: scope.scopeKey,
      tenantId: scope.tenantId,
      deviceId,
      deviceName: normalizeOptional(input.deviceName) ?? inferredContext.deviceName,
      browser: normalizeOptional(input.browser) ?? inferredContext.browser,
      platform: normalizeOptional(input.platform) ?? inferredContext.platform,
      userAgent: normalizeOptional(input.userAgent),
      lastIpAddress: normalizeOptional(input.ipAddress),
      trustedAt: now,
      expiresAt: addDays(now, 30),
      revokedAt: null,
      lastSeenAt: now
    })
  }

  // Synchronizes the persisted trusted-device activity snapshot from live session activity within one account scope.
  async markTrustedDeviceSeen(input: TrustedDeviceSeenInput): Promise<void> {
    const scope = normalizeScope(input.scopeLevel, input.tenantId)
    const deviceId = normalizeDeviceId(input.deviceId)

    if (!scope || !deviceId) {
      return
    }

    const inferredContext = normalizeAuthDeviceContext({
      deviceId,
      deviceName: input.deviceName,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    })

    await this.trustedDeviceRepository.markDeviceSeen({
      userId: input.userId,
      scopeKey: scope.scopeKey,
      deviceId,
      deviceName: inferredContext.deviceName,
      browser: inferredContext.browser,
      platform: inferredContext.platform,
      userAgent: normalizeOptional(input.userAgent),
      lastIpAddress: normalizeOptional(input.ipAddress),
      lastSeenAt: normalizeObservedAt(input.observedAt)
    } satisfies TrustedDeviceSeenRepositoryInput)
  }

  async listTrustedDevices(input: {
    scopeLevel: 'SYSTEM' | 'TENANT'
    tenantId?: string
    userId: string
  }): Promise<TrustedDeviceRecord[]> {
    const scope = normalizeScope(input.scopeLevel, input.tenantId)

    if (!scope) {
      return []
    }

    return this.trustedDeviceRepository.listActiveByUserScope({
      userId: input.userId,
      scopeKey: scope.scopeKey
    })
  }

  async revokeTrustedDevice(input: {
    id: string
    scopeLevel: 'SYSTEM' | 'TENANT'
    tenantId?: string
    userId: string
  }): Promise<number> {
    const scope = normalizeScope(input.scopeLevel, input.tenantId)

    if (!scope) {
      return 0
    }

    return this.trustedDeviceRepository.revokeById({
      id: input.id,
      scopeKey: scope.scopeKey,
      userId: input.userId
    })
  }

  async revokeOtherTrustedDevices(input: {
    currentDeviceId?: string
    scopeLevel: 'SYSTEM' | 'TENANT'
    tenantId?: string
    userId: string
  }): Promise<number> {
    const scope = normalizeScope(input.scopeLevel, input.tenantId)

    if (!scope) {
      return 0
    }

    return this.trustedDeviceRepository.revokeOtherDevices({
      currentDeviceId: normalizeDeviceId(input.currentDeviceId),
      scopeKey: scope.scopeKey,
      userId: input.userId
    })
  }

  private isActiveTrustedDevice(device: null | TrustedDeviceRecord): boolean {
    if (!device || device.revokedAt) {
      return false
    }

    return device.expiresAt.getTime() > Date.now()
  }
}

function normalizeOptional(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function normalizeDeviceId(deviceId?: string): string | undefined {
  const normalized = normalizeOptional(deviceId)
  return normalized && normalized !== 'unknown' ? normalized : undefined
}

function normalizeObservedAt(value: Date): Date {
  return Number.isNaN(value.getTime()) ? new Date(Date.now()) : value
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function normalizeScope(
  scopeLevel: 'SYSTEM' | 'TENANT',
  tenantId?: string
): { scopeKey: string; scopeLevel: 'SYSTEM' | 'TENANT'; tenantId?: string } | undefined {
  if (scopeLevel === 'SYSTEM') {
    return {
      scopeKey: '__SYSTEM__',
      scopeLevel: 'SYSTEM'
    }
  }

  const normalizedTenantId = normalizeOptional(tenantId)
  if (!normalizedTenantId) {
    return undefined
  }

  return {
    scopeKey: normalizedTenantId,
    scopeLevel: 'TENANT',
    tenantId: normalizedTenantId
  }
}
