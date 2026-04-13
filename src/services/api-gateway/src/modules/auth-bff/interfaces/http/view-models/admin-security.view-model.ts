import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

// Defines one session entry returned to an administrator when inspecting another user's sessions.
export class AdminSessionViewModel {
  @ApiProperty() sessionId!: string
  @ApiProperty() userId!: string
  @ApiPropertyOptional() accountId?: string
  @ApiPropertyOptional() tenantId?: string
  @ApiProperty() status!: string
  @ApiProperty() loginMethod!: string
  @ApiPropertyOptional() deviceId?: string
  @ApiPropertyOptional() deviceName?: string
  @ApiPropertyOptional() userAgent?: string
  @ApiPropertyOptional() ipAddress?: string
  @ApiPropertyOptional() platform?: string
  @ApiPropertyOptional() browser?: string
  @ApiProperty() createdAt!: string
  @ApiProperty() lastActiveAt!: string
  @ApiProperty() expiresAt!: string
  @ApiProperty() refreshExpiresAt!: string
  @ApiProperty() accessRemainingSeconds!: number
  @ApiProperty() refreshRemainingSeconds!: number
  @ApiProperty() sessionAgeSeconds!: number
  @ApiProperty() idleSeconds!: number
  @ApiProperty() isAccessExpired!: boolean
  @ApiProperty() isRefreshExpired!: boolean
  @ApiProperty() isRevoked!: boolean
  @ApiProperty() isAdminControlled!: boolean
  @ApiPropertyOptional() adminRevokeReason?: string
  @ApiPropertyOptional() adminRevokeAt?: string
  @ApiPropertyOptional() adminRevokeBy?: string
}

// Defines the list response returned when an administrator inspects another user's sessions.
export class AdminSessionListViewModel {
  @ApiProperty({ type: AdminSessionViewModel, isArray: true })
  sessions!: AdminSessionViewModel[]
}

// Defines the mutation response returned when an administrator revokes one concrete session.
export class AdminSessionMutationViewModel {
  @ApiProperty() success!: boolean
  @ApiProperty() sessionId!: string
}

// Defines one auth audit event entry returned to administrative callers.
export class AdminAuditEventViewModel {
  @ApiProperty() eventId!: string
  @ApiPropertyOptional() service?: string
  @ApiPropertyOptional() module?: string
  @ApiPropertyOptional() eventType?: string
  @ApiPropertyOptional() occurredAt?: string
  @ApiPropertyOptional() result?: string
  @ApiPropertyOptional() operatorId?: string
  @ApiPropertyOptional() operatorType?: string
  @ApiPropertyOptional() tenantId?: string
  @ApiPropertyOptional() orgId?: string
  @ApiPropertyOptional() traceId?: string
  @ApiPropertyOptional() resourceType?: string
  @ApiPropertyOptional() resourceId?: string
  @ApiPropertyOptional() detailsJson?: string
}

// Defines the paged audit event response returned by the admin auth audit endpoint.
export class AdminAuditEventListViewModel {
  @ApiProperty({ type: AdminAuditEventViewModel, isArray: true })
  items!: AdminAuditEventViewModel[]

  @ApiPropertyOptional()
  nextCursor?: string
}
