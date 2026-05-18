import { Session } from '../../../domain/aggregates/usersession.aggregate'

export interface AdminSessionViewResult {
  sessionId: string
  userId: string
  accountId: string
  tenantId: string
  terminal: string
  loginFlow: string
  terminalDeviceId: string
  deviceBoundTenantId: string
  status: string
  loginMethod: string
  deviceId: string
  deviceName: string
  userAgent: string
  ipAddress: string
  platform: string
  browser: string
  createdAt: Date
  lastActiveAt: Date
  expiresAt: Date
  refreshExpiresAt: Date
  accessRemainingSeconds: number
  refreshRemainingSeconds: number
  sessionAgeSeconds: number
  idleSeconds: number
  isAccessExpired: boolean
  isRefreshExpired: boolean
  isRevoked: boolean
  isAdminControlled: boolean
  adminRevokeReason: string
  adminRevokeAt: Date | null
  adminRevokeBy: string
}

// Maps a session aggregate into the administrator-facing session projection.
export function toAdminSessionView(session: Session): AdminSessionViewResult {
  const adminInfo = session.getAdminRevokeInfo()

  return {
    sessionId: session.getId(),
    userId: session.getUserId(),
    accountId: session.getAccountId(),
    tenantId: session.getTenantId() ?? '',
    terminal: session.getTerminal(),
    loginFlow: session.getLoginFlow(),
    terminalDeviceId: session.getTerminalDeviceId() ?? '',
    deviceBoundTenantId: session.getDeviceBoundTenantId() ?? '',
    status: String(session.getStatus()),
    loginMethod: session.getLoginMethod(),
    deviceId: session.getDeviceInfo().deviceId,
    deviceName: session.getDeviceInfo().deviceName,
    userAgent: session.getDeviceInfo().userAgent,
    ipAddress: session.getDeviceInfo().ipAddress,
    platform: session.getDeviceInfo().platform ?? '',
    browser: session.getDeviceInfo().browser ?? '',
    createdAt: session.getCreatedAt(),
    lastActiveAt: session.getLastActiveAt(),
    expiresAt: session.getExpiresAt(),
    refreshExpiresAt: session.getRefreshExpiresAt(),
    accessRemainingSeconds: session.getRemainingTime(),
    refreshRemainingSeconds: session.getRefreshRemainingTime(),
    sessionAgeSeconds: session.getSessionAgeSeconds(),
    idleSeconds: session.getIdleSeconds(),
    isAccessExpired: session.isExpired(),
    isRefreshExpired: session.isRefreshExpired(),
    isRevoked: !session.isActive(),
    isAdminControlled: session.isAdminControlled(),
    adminRevokeReason: adminInfo.reason ?? '',
    adminRevokeAt: adminInfo.revokedAt ?? null,
    adminRevokeBy: adminInfo.revokedBy ?? ''
  }
}
