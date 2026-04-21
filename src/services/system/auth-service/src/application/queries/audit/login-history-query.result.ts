export interface LoginHistoryItemView {
  occurredAt: Date
  outcome: 'FAILED' | 'SUCCESS'
  loginMethod?: string
  ipAddress?: string
  deviceName?: string
  platform?: string
  browser?: string
  failureReason?: string
  traceId?: string
}

export interface ListLoginHistoryView {
  items: LoginHistoryItemView[]
  nextCursor?: string
}

/**
 * toLoginHistoryItemView projects auth audit records into a user-readable self-service login history shape.
 */
export function toLoginHistoryItemView(event: {
  occurredAt: Date
  eventType: string
  details: Record<string, unknown>
  traceId?: string
}): LoginHistoryItemView {
  return {
    occurredAt: event.occurredAt,
    outcome: event.eventType === 'LOGIN_FAILED' ? 'FAILED' : 'SUCCESS',
    loginMethod: readString(event.details, 'method'),
    ipAddress: readString(event.details, 'ipAddress'),
    deviceName: readString(event.details, 'deviceName'),
    platform: readString(event.details, 'platform'),
    browser: readString(event.details, 'browser'),
    failureReason: readString(event.details, 'reason'),
    traceId: event.traceId
  }
}

/**
 * readString returns a normalized optional string from the auth audit details envelope.
 */
function readString(details: Record<string, unknown>, key: string): string | undefined {
  const value = details[key]
  return typeof value === 'string' && value.trim() ? value : undefined
}
