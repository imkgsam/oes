export interface TrustedDeviceRecord {
  browser?: string
  createdAt: Date
  deviceId: string
  deviceName?: string
  expiresAt: Date
  lastIpAddress?: string
  lastSeenAt: Date
  platform?: string
  revokedAt: Date | null
  scopeKey: string
  scopeLevel: 'SYSTEM' | 'TENANT'
  tenantId?: string
  trustedAt: Date
  updatedAt: Date
  userAgent?: string
  userId: string
  id: string
}

export type TrustedDeviceUpsertInput = Omit<TrustedDeviceRecord, 'createdAt' | 'id' | 'updatedAt'>
export type TrustedDeviceSeenInput = {
  browser?: string
  deviceId: string
  deviceName?: string
  lastIpAddress?: string
  lastSeenAt: Date
  platform?: string
  scopeKey: string
  userAgent?: string
  userId: string
}

// Defines the explicit trusted-device persistence boundary used by tenant new-device MFA decisions.
export interface TrustedDeviceRepository {
  findByUserScopeDevice(input: {
    deviceId: string
    scopeKey: string
    userId: string
  }): Promise<null | TrustedDeviceRecord>

  listActiveByUserScope(input: {
    scopeKey: string
    userId: string
  }): Promise<TrustedDeviceRecord[]>

  revokeById(input: {
    id: string
    scopeKey: string
    userId: string
  }): Promise<number>

  revokeOtherDevices(input: {
    currentDeviceId?: string
    scopeKey: string
    userId: string
  }): Promise<number>

  markDeviceSeen(input: TrustedDeviceSeenInput): Promise<void>

  saveTrustedDevice(device: TrustedDeviceUpsertInput): Promise<void>
}
