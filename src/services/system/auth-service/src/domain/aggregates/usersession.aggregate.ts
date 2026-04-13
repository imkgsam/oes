import { randomUUID } from 'crypto'
import { SessionStatus } from '@oes/common/constants'

export interface DeviceInfo {
  deviceId: string
  deviceName: string
  userAgent: string
  ipAddress: string
  location?: string
  platform?: string
  browser?: string
}

export interface SessionConfig {
  accessTokenExpiry: number
  refreshTokenExpiry: number
  maxSessionsPerUser: number
  enableAutoRenewal: boolean
  enableDeviceTracking: boolean
}

type SessionProps = {
  id: string
  userId: string
  accountId: string
  scopeLevel?: 'SYSTEM' | 'TENANT'
  tenantId?: string
  orgId?: string
  refreshToken: string
  status: SessionStatus
  deviceInfo: DeviceInfo
  createdAt: Date
  lastActiveAt: Date
  expiresAt: Date
  refreshExpiresAt: Date
  metadata?: Record<string, any>
  isAdminControlled?: boolean
  adminRevokeReason?: string
  adminRevokeAt?: Date
  adminRevokeBy?: string
}

export class Session {
  constructor(private props: SessionProps) {
    this.props.isAdminControlled ??= false
    this.props.deviceInfo = Session.normalizeDeviceInfo(this.props.deviceInfo)
    this.props.scopeLevel = Session.normalizeScopeLevel(this.props.scopeLevel, this.props.tenantId)
    this.props.tenantId = Session.normalizeOptionalText(this.props.tenantId)
    this.props.orgId = Session.normalizeOptionalText(this.props.orgId)
  }

  static createSession(params: {
    userId: string
    accountId: string
    scopeLevel?: 'SYSTEM' | 'TENANT'
    tenantId?: string
    orgId?: string
    deviceInfo: DeviceInfo
    config: SessionConfig
    metadata?: Record<string, any>
  }): Session {
    const now = new Date()

    return new Session({
      id: randomUUID(),
      userId: params.userId,
      accountId: params.accountId,
      scopeLevel: params.scopeLevel,
      tenantId: params.tenantId,
      orgId: params.orgId,
      refreshToken: randomUUID(),
      status: SessionStatus.ACTIVE,
      deviceInfo: params.deviceInfo,
      createdAt: now,
      lastActiveAt: now,
      expiresAt: new Date(now.getTime() + params.config.accessTokenExpiry * 1000),
      refreshExpiresAt: new Date(now.getTime() + params.config.refreshTokenExpiry * 1000),
      metadata: params.metadata,
      isAdminControlled: false
    })
  }

  static fromRedis(data: Record<string, any>): Session {
    return new Session({
      id: data.id,
      userId: data.userId,
      accountId: data.accountId,
      scopeLevel: data.scopeLevel ?? data.metadata?.scopeLevel,
      tenantId: data.tenantId ?? data.metadata?.tenantId,
      orgId: data.orgId ?? data.metadata?.orgId,
      refreshToken: data.refreshToken,
      status: data.status as SessionStatus,
      deviceInfo: data.deviceInfo as DeviceInfo,
      createdAt: new Date(data.createdAt),
      lastActiveAt: new Date(data.lastActiveAt),
      expiresAt: new Date(data.expiresAt),
      refreshExpiresAt: new Date(data.refreshExpiresAt),
      metadata: data.metadata,
      isAdminControlled: Boolean(data.isAdminControlled),
      adminRevokeReason: data.adminRevokeReason,
      adminRevokeAt: data.adminRevokeAt ? new Date(data.adminRevokeAt) : undefined,
      adminRevokeBy: data.adminRevokeBy
    })
  }

  private static normalizeDeviceInfo(deviceInfo: Partial<DeviceInfo> | undefined): DeviceInfo {
    return {
      deviceId: String(deviceInfo?.deviceId ?? '').trim() || 'unknown',
      deviceName: String(deviceInfo?.deviceName ?? '').trim() || 'unknown',
      userAgent: String(deviceInfo?.userAgent ?? '').trim() || 'unknown',
      ipAddress: String(deviceInfo?.ipAddress ?? '').trim() || 'unknown',
      location: String(deviceInfo?.location ?? '').trim() || undefined,
      platform: String(deviceInfo?.platform ?? '').trim() || undefined,
      browser: String(deviceInfo?.browser ?? '').trim() || undefined
    }
  }

  private static normalizeOptionalText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined
  }

  private static normalizeScopeLevel(
    scopeLevel: unknown,
    tenantId: unknown
  ): 'SYSTEM' | 'TENANT' {
    return scopeLevel === 'SYSTEM' && !Session.normalizeOptionalText(tenantId) ? 'SYSTEM' : 'TENANT'
  }

  toRedis(): Record<string, any> {
    return {
      id: this.props.id,
      userId: this.props.userId,
      accountId: this.props.accountId,
      scopeLevel: this.props.scopeLevel,
      tenantId: this.props.tenantId,
      orgId: this.props.orgId,
      refreshToken: this.props.refreshToken,
      status: this.props.status,
      deviceInfo: this.props.deviceInfo,
      createdAt: this.props.createdAt.toISOString(),
      lastActiveAt: this.props.lastActiveAt.toISOString(),
      expiresAt: this.props.expiresAt.toISOString(),
      refreshExpiresAt: this.props.refreshExpiresAt.toISOString(),
      metadata: this.props.metadata,
      isAdminControlled: this.props.isAdminControlled,
      adminRevokeReason: this.props.adminRevokeReason,
      adminRevokeAt: this.props.adminRevokeAt?.toISOString(),
      adminRevokeBy: this.props.adminRevokeBy
    }
  }

  validateRefreshToken(token: string): boolean {
    return this.props.refreshToken === token && this.isActive() && !this.isRefreshExpired()
  }

  isExpired(): boolean {
    return Date.now() > this.props.expiresAt.getTime()
  }

  isRefreshExpired(): boolean {
    return Date.now() > this.props.refreshExpiresAt.getTime()
  }

  isAdminRevoked(): boolean {
    return this.props.status === SessionStatus.REVOKED && Boolean(this.props.isAdminControlled)
  }

  touch(): void {
    this.props.lastActiveAt = new Date()
  }

  renewAccessToken(expirySeconds: number): void {
    this.props.expiresAt = new Date(Date.now() + expirySeconds * 1000)
    this.touch()
  }

  renewRefreshToken(expirySeconds: number): void {
    this.props.refreshExpiresAt = new Date(Date.now() + expirySeconds * 1000)
    this.touch()
  }

  renameDevice(deviceName: string): void {
    this.props.deviceInfo = {
      ...this.props.deviceInfo,
      deviceName
    }
  }

  activateTokenWindow(refreshToken: string, accessExpiry: number, refreshExpiry: number): void {
    this.props.refreshToken = refreshToken
    this.props.expiresAt = new Date(Date.now() + accessExpiry * 1000)
    this.props.refreshExpiresAt = new Date(Date.now() + refreshExpiry * 1000)
    this.touch()
  }

  adminRevoke(reason: string, adminId: string): void {
    this.props.status = SessionStatus.REVOKED
    this.props.isAdminControlled = true
    this.props.adminRevokeReason = reason
    this.props.adminRevokeAt = new Date()
    this.props.adminRevokeBy = adminId
  }

  adminSuspend(reason: string, adminId: string): void {
    this.props.status = SessionStatus.SUSPENDED
    this.props.isAdminControlled = true
    this.props.adminRevokeReason = reason
    this.props.adminRevokeAt = new Date()
    this.props.adminRevokeBy = adminId
  }

  restore(): void {
    this.props.status = SessionStatus.ACTIVE
    this.props.isAdminControlled = false
    this.props.adminRevokeReason = undefined
    this.props.adminRevokeAt = undefined
    this.props.adminRevokeBy = undefined
  }

  getRemainingTime(): number {
    const remaining = this.props.expiresAt.getTime() - Date.now()
    return Math.max(0, Math.floor(remaining / 1000))
  }

  getRefreshRemainingTime(): number {
    const remaining = this.props.refreshExpiresAt.getTime() - Date.now()
    return Math.max(0, Math.floor(remaining / 1000))
  }

  getSessionAgeSeconds(): number {
    const age = Date.now() - this.props.createdAt.getTime()
    return Math.max(0, Math.floor(age / 1000))
  }

  getIdleSeconds(): number {
    const idle = Date.now() - this.props.lastActiveAt.getTime()
    return Math.max(0, Math.floor(idle / 1000))
  }

  getId(): string {
    return this.props.id
  }

  getUserId(): string {
    return this.props.userId
  }

  getAccountId(): string {
    return this.props.accountId
  }

  // Returns the account scope selected for this session.
  getScopeLevel(): 'SYSTEM' | 'TENANT' {
    return this.props.scopeLevel ?? 'TENANT'
  }

  getRefreshToken(): string {
    return this.props.refreshToken
  }

  getStatus(): SessionStatus {
    return this.props.status
  }

  getDeviceInfo(): DeviceInfo {
    return this.props.deviceInfo
  }

  getCreatedAt(): Date {
    return this.props.createdAt
  }

  getLastActiveAt(): Date {
    return this.props.lastActiveAt
  }

  getExpiresAt(): Date {
    return this.props.expiresAt
  }

  getRefreshExpiresAt(): Date {
    return this.props.refreshExpiresAt
  }

  getMetadata(): Record<string, any> | undefined {
    return this.props.metadata
  }

  // Returns the tenant boundary carried by the session metadata when the session belongs to a tenant scope.
  getTenantId(): string | undefined {
    return this.props.tenantId
  }

  getOrgId(): string | undefined {
    return this.props.orgId
  }

  getLoginMethod(): string {
    return String(this.props.metadata?.loginMethod ?? '')
  }

  isActive(): boolean {
    return this.props.status === SessionStatus.ACTIVE
  }

  isAdminControlled(): boolean {
    return Boolean(this.props.isAdminControlled)
  }

  getAdminRevokeInfo(): {
    reason?: string
    revokedAt?: Date
    revokedBy?: string
  } {
    return {
      reason: this.props.adminRevokeReason,
      revokedAt: this.props.adminRevokeAt,
      revokedBy: this.props.adminRevokeBy
    }
  }
}
