export type ShortLinkTargetKind = 'INTERNAL_REF' | 'EXTERNAL_URL'
export type ShortLinkStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED'
export type VisitResultStatus =
  | 'REDIRECTED'
  | 'DISABLED'
  | 'EXPIRED'
  | 'ARCHIVED'
  | 'INVALID_TARGET'
export type DetectedChannel = 'WECHAT' | 'BROWSER' | 'UNKNOWN'
export type DeviceType = 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN'

export type OperatorContext = {
  operatorAccountId: string
  operatorOrgId?: string
  traceId?: string
}

export type ShortLinkTarget =
  | {
      targetKind: 'INTERNAL_REF'
      targetType: string
      targetResourceId: string
    }
  | {
      targetKind: 'EXTERNAL_URL'
      targetUrl: string
    }

export type ShortLinkRecord = {
  id: string
  tenantId: string
  displayName: string
  shortCode: string
  publicUrl: string
  targetKind: ShortLinkTargetKind
  targetType?: string | null
  targetResourceId?: string | null
  targetUrl?: string | null
  entryPurpose: string
  sourcePlacement: string
  campaignRef?: string | null
  status: ShortLinkStatus
  expiresAt?: Date | null
  createdBy: string
  createdAt: Date
  updatedBy: string
  updatedAt: Date
}

export type VisitEventRecord = {
  id: string
  tenantId: string
  shortLinkId: string
  visitedAt: Date
  userAgent: string
  ipAddress: string
  detectedChannel: DetectedChannel
  deviceType: DeviceType
  locale: string
  referrer: string
  resultStatus: VisitResultStatus
}

export type AuditEventRecord = {
  id: string
  tenantId: string
  shortLinkId: string
  action: string
  before?: unknown
  after?: unknown
  reason?: string
  operatorAccountId: string
  operatorOrgId?: string
  traceId?: string
  createdAt: Date
}

export type ResolvedTargetResult =
  | {
      result: 'REDIRECT'
      redirectUrl: string
      resultTarget?: string
    }
  | {
      result: 'UNAVAILABLE' | 'NOT_FOUND'
      redirectUrl?: string | null
      resultTarget?: string
    }

export type TargetResolverRequest = {
  tenantId: string
  targetType: string
  targetResourceId: string
  requestContext: {
    userAgent?: string
    detectedChannel?: DetectedChannel
    deviceType?: DeviceType
    locale?: string
    referrer?: string
    traceId?: string
  }
}

export type ShortLinkTargetResolver = {
  resolve(request: TargetResolverRequest): Promise<ResolvedTargetResult>
}
