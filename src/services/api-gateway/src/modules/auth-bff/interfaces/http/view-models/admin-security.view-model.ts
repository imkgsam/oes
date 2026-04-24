import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

// Defines one online-user summary entry returned to an administrator.
export class AdminOnlineUserViewModel {
  @ApiProperty() userId!: string
  @ApiPropertyOptional() displayName?: string
  @ApiPropertyOptional() tenantId?: string
  @ApiPropertyOptional() tenantName?: string | null
  @ApiProperty({ type: String, isArray: true, required: false }) tenantNames?: string[]
  @ApiProperty() visibleTenantCount!: number
  @ApiProperty() activeAccountCount!: number
  @ApiProperty() activeSessionCount!: number
  @ApiProperty() lastActiveAt!: string
}

// Defines the list response returned by the admin online-user overview endpoint.
export class AdminOnlineUserListViewModel {
  @ApiProperty({ type: AdminOnlineUserViewModel, isArray: true })
  items!: AdminOnlineUserViewModel[]

  @ApiPropertyOptional()
  nextCursor?: string
}

// Defines one account summary entry used to help administrators confirm the correct search target.
export class AdminUserSearchAccountSummaryViewModel {
  @ApiProperty() accountId!: string
  @ApiPropertyOptional() accountDisplayName?: string
  @ApiPropertyOptional() tenantId?: string
  @ApiPropertyOptional() tenantName?: string
  @ApiProperty({ enum: ['SYSTEM', 'TENANT'] }) scopeLevel!: 'SYSTEM' | 'TENANT'
}

// Defines one user-search result row returned to the administrator.
export class AdminUserSearchItemViewModel {
  @ApiProperty() userId!: string
  @ApiPropertyOptional() displayName?: string
  @ApiPropertyOptional() emailMasked?: string
  @ApiPropertyOptional() phoneMasked?: string
  @ApiProperty({ type: AdminUserSearchAccountSummaryViewModel, isArray: true })
  accountSummaries!: AdminUserSearchAccountSummaryViewModel[]
  @ApiProperty() isOnline!: boolean
  @ApiProperty() activeSessionCount!: number
}

// Defines the list response returned by the admin user-search endpoint.
export class AdminUserSearchListViewModel {
  @ApiProperty({ type: AdminUserSearchItemViewModel, isArray: true })
  items!: AdminUserSearchItemViewModel[]
}

// Defines one account directory row returned to administrative account-management pages.
export class AdminAccountDirectoryItemViewModel {
  @ApiProperty() accountId!: string
  @ApiProperty() userId!: string
  @ApiPropertyOptional() accountDisplayName?: string
  @ApiPropertyOptional() userDisplayName?: string
  @ApiPropertyOptional() tenantId?: string
  @ApiPropertyOptional() tenantName?: string
  @ApiProperty({ enum: ['SYSTEM', 'TENANT'] }) scopeLevel!: 'SYSTEM' | 'TENANT'
  @ApiProperty() isEnabled!: boolean
}

// Defines the paged account directory response returned to administrative account-management pages.
export class AdminAccountDirectoryListViewModel {
  @ApiProperty({ type: AdminAccountDirectoryItemViewModel, isArray: true })
  items!: AdminAccountDirectoryItemViewModel[]

  @ApiProperty() page!: number
  @ApiProperty() pageSize!: number
  @ApiProperty() total!: number
}

// Defines one account basic-info snapshot returned to administrative account-management editors.
export class AdminAccountBasicInfoViewModel {
  @ApiProperty() accountId!: string
  @ApiProperty() userId!: string
  @ApiPropertyOptional() displayName?: string
  @ApiPropertyOptional() email?: string
  @ApiPropertyOptional() phone?: string
  @ApiPropertyOptional() tenantId?: string
  @ApiPropertyOptional() tenantName?: string
  @ApiProperty({ enum: ['SYSTEM', 'TENANT'] }) scopeLevel!: 'SYSTEM' | 'TENANT'
  @ApiProperty() isEnabled!: boolean
}

export class AdminAccountDeletionCleanupPlanViewModel {
  @ApiProperty() willDeleteSessions!: boolean
  @ApiProperty() willClearRoles!: boolean
  @ApiProperty() willDeleteOrgMemberships!: boolean
  @ApiProperty() willDeleteContactAssets!: boolean
}

export class AdminAccountDeletionBlockingReasonViewModel {
  @ApiProperty() resourceType!: string
  @ApiProperty() resourceCount!: number
  @ApiProperty() message!: string
}

export class AdminAccountDeletionImpactViewModel {
  @ApiProperty() accountId!: string
  @ApiProperty() canDelete!: boolean
  @ApiProperty() userRetained!: boolean
  @ApiProperty({ type: AdminAccountDeletionCleanupPlanViewModel })
  cleanupPlan!: AdminAccountDeletionCleanupPlanViewModel
  @ApiProperty({ type: AdminAccountDeletionBlockingReasonViewModel, isArray: true })
  blockingReasons!: AdminAccountDeletionBlockingReasonViewModel[]
  @ApiProperty() orgMembershipCount!: number
  @ApiProperty() contactAssetCount!: number
}

export class AdminAccountDeletionResultViewModel {
  @ApiProperty() accountId!: string
  @ApiProperty() success!: boolean
  @ApiProperty() deletedSessionCount!: number
  @ApiProperty() clearedRoleCount!: number
  @ApiProperty() deletedPolicyCount!: number
  @ApiProperty() deletedOrgMembershipCount!: number
  @ApiProperty() deletedContactAssetCount!: number
  @ApiProperty() userRetained!: boolean
}

// Defines one tenant option returned to account creation selectors.
export class AdminTenantOptionViewModel {
  @ApiProperty() id!: string
  @ApiProperty() code!: string
  @ApiProperty() name!: string
  @ApiProperty() isActive!: boolean
}

// Defines the tenant-option response returned by administrative account creation selectors.
export class AdminTenantOptionListViewModel {
  @ApiProperty({ type: AdminTenantOptionViewModel, isArray: true })
  items!: AdminTenantOptionViewModel[]
}

// Defines one session entry returned to an administrator when inspecting another user's sessions.
export class AdminSessionViewModel {
  @ApiProperty() sessionId!: string
  @ApiProperty() userId!: string
  @ApiPropertyOptional() accountId?: string
  @ApiPropertyOptional() accountName?: string
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

export class AdminTenantMfaFactorPolicyViewModel {
  @ApiProperty({ enum: ['EMAIL_OTP', 'SMS_OTP', 'TOTP', 'BACKUP_CODE'] })
  factor!: 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'

  @ApiProperty()
  enabled!: boolean

  @ApiProperty()
  priority!: number
}

export class AdminTenantMfaScenarioRequirementViewModel {
  @ApiProperty({ enum: ['LOGIN', 'CHANGE_PASSWORD', 'CHANGE_CONTACT', 'NEW_DEVICE_LOGIN'] })
  scenario!: 'CHANGE_CONTACT' | 'CHANGE_PASSWORD' | 'LOGIN' | 'NEW_DEVICE_LOGIN'

  @ApiProperty()
  required!: boolean
}

export class AdminTenantMfaPolicyViewModel {
  @ApiProperty()
  tenantId!: string

  @ApiProperty()
  loginRequired!: boolean

  @ApiProperty({ type: AdminTenantMfaScenarioRequirementViewModel, isArray: true })
  scenarioRequirements!: AdminTenantMfaScenarioRequirementViewModel[]

  @ApiProperty({ type: AdminTenantMfaFactorPolicyViewModel, isArray: true })
  factors!: AdminTenantMfaFactorPolicyViewModel[]
}

export class AdminPlatformMfaPolicyViewModel {
  @ApiProperty()
  loginRequired!: boolean

  @ApiProperty({ type: AdminTenantMfaScenarioRequirementViewModel, isArray: true })
  scenarioRequirements!: AdminTenantMfaScenarioRequirementViewModel[]

  @ApiProperty({ type: AdminTenantMfaFactorPolicyViewModel, isArray: true })
  factors!: AdminTenantMfaFactorPolicyViewModel[]
}
