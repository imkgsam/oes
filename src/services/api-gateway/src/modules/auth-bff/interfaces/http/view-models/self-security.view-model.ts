import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { MfaBindingTypeDto } from '../dtos/self-security.dto'
import {
  ChallengeViewModel,
  MfaScenarioViewModel
} from './auth-response.view-model'

// Defines one self-service session entry returned to the authenticated user.
export class SelfSessionViewModel {
  @ApiProperty() sessionId!: string
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
  @ApiProperty() isCurrent!: boolean
  @ApiProperty() isAdminControlled!: boolean
}

// Defines the list response for the authenticated user's visible sessions.
export class SelfSessionListViewModel {
  @ApiProperty({ type: SelfSessionViewModel, isArray: true })
  sessions!: SelfSessionViewModel[]
}

// Defines one self-service login-history record returned to the authenticated user.
export class SelfLoginHistoryItemViewModel {
  @ApiProperty() occurredAt!: string
  @ApiProperty() outcome!: string
  @ApiPropertyOptional() loginMethod?: string
  @ApiPropertyOptional() ipAddress?: string
  @ApiPropertyOptional() deviceName?: string
  @ApiPropertyOptional() platform?: string
  @ApiPropertyOptional() browser?: string
  @ApiPropertyOptional() failureReason?: string
  @ApiPropertyOptional() traceId?: string
}

// Defines the paged response for the authenticated user's login attempt history.
export class SelfLoginHistoryListViewModel {
  @ApiProperty({ type: SelfLoginHistoryItemViewModel, isArray: true })
  items!: SelfLoginHistoryItemViewModel[]

  @ApiPropertyOptional()
  nextCursor?: string
}

// Defines one login-method status row returned by personal or admin account security pages.
export class LoginMethodViewModel {
  @ApiProperty() methodId!: string
  @ApiProperty() userId!: string
  @ApiProperty() type!: string
  @ApiPropertyOptional() identifier?: string
  @ApiPropertyOptional() maskedIdentifier?: string
  @ApiProperty() verified!: boolean
  @ApiProperty() enabled!: boolean
  @ApiProperty() hasPassword!: boolean
  @ApiPropertyOptional() createdAt?: string
  @ApiPropertyOptional() updatedAt?: string
}

// Defines the login-method list response together with password-setup state.
export class LoginMethodListViewModel {
  @ApiProperty({ type: LoginMethodViewModel, isArray: true })
  loginMethods!: LoginMethodViewModel[]

  @ApiProperty()
  passwordSetupRequired!: boolean
}

// Defines a password mutation response without exposing credential material.
export class PasswordMutationViewModel {
  @ApiProperty() success!: boolean
  @ApiProperty() passwordSetupRequired!: boolean
}

// Defines the OTP challenge payload returned when the authenticated user starts a contact-binding flow.
export class ContactBindingMutationViewModel {
  @ApiProperty() challengeId!: string
  @ApiProperty() destination!: string
  @ApiProperty() expiresAt!: string
}

// Defines the verification payload returned when the authenticated user confirms a contact binding.
export class ContactBindingVerificationViewModel {
  @ApiProperty() success!: boolean
  @ApiProperty() type!: string
  @ApiProperty() identifier!: string
}

// Defines a login-method mutation response for enablement changes.
export class LoginMethodMutationViewModel {
  @ApiProperty() success!: boolean
  @ApiProperty({ type: LoginMethodViewModel }) loginMethod!: LoginMethodViewModel
}

// Defines the generic success payload used by self-service session mutations.
export class SessionMutationViewModel {
  @ApiProperty() success!: boolean

  @ApiPropertyOptional({
    description: 'Affected session count when the mutation targets multiple sessions.'
  })
  sessionCount?: number
}

// Defines one trusted-device entry returned by the authenticated user's self-security page.
export class TrustedDeviceViewModel {
  @ApiProperty() id!: string
  @ApiProperty() deviceId!: string
  @ApiPropertyOptional() deviceName?: string
  @ApiPropertyOptional() browser?: string
  @ApiPropertyOptional() platform?: string
  @ApiProperty() trustedAt!: string
  @ApiProperty() lastActiveAt!: string
  @ApiProperty() expiresAt!: string
  @ApiProperty() isCurrentDevice!: boolean
}

// Defines the list response for the authenticated user's trusted devices.
export class TrustedDeviceListViewModel {
  @ApiProperty({ type: TrustedDeviceViewModel, isArray: true })
  devices!: TrustedDeviceViewModel[]
}

// Defines the mutation response returned by trusted-device self-service operations.
export class TrustedDeviceMutationViewModel {
  @ApiProperty() success!: boolean

  @ApiPropertyOptional({
    description: 'Affected trusted-device count when the mutation targets one or more devices.'
  })
  deviceCount?: number
}

// Defines one MFA binding entry returned to the authenticated user.
export class MfaBindingViewModel {
  @ApiProperty() bindingId!: string
  @ApiProperty({ enum: MfaBindingTypeDto, enumName: 'MfaBindingType' }) type!: MfaBindingTypeDto
  @ApiProperty() enabled!: boolean
  @ApiProperty() available!: boolean
  @ApiPropertyOptional() destination?: string
  @ApiPropertyOptional() updatedAt?: string
}

// Defines the list response for self-service MFA bindings.
export class MfaBindingListViewModel {
  @ApiProperty({ type: MfaBindingViewModel, isArray: true })
  bindings!: MfaBindingViewModel[]
}

// Defines the mutation response returned by MFA binding enable/disable/activate operations.
export class MfaBindingMutationViewModel {
  @ApiProperty() success!: boolean
  @ApiProperty({ type: MfaBindingViewModel }) binding!: MfaBindingViewModel
}

// Defines the response returned when the user initializes a TOTP binding.
export class InitializeTotpViewModel {
  @ApiProperty({ type: MfaBindingViewModel }) binding!: MfaBindingViewModel
  @ApiProperty() secret!: string
  @ApiProperty() qrCodeUrl!: string
}

// Defines the response returned when the user initializes or regenerates recovery codes.
export class RecoveryCodesViewModel {
  @ApiProperty({ type: MfaBindingViewModel }) binding!: MfaBindingViewModel
  @ApiProperty({ type: String, isArray: true }) recoveryCodes!: string[]
}

export class StepUpMfaChallengeViewModel {
  @ApiProperty()
  required!: boolean

  @ApiPropertyOptional({ type: ChallengeViewModel, nullable: true })
  challenge?: ChallengeViewModel | null
}

export class StepUpMfaGrantViewModel {
  @ApiProperty()
  success!: boolean

  @ApiPropertyOptional({
    enum: MfaScenarioViewModel,
    enumName: 'MfaScenario'
  })
  scenario?: MfaScenarioViewModel

  @ApiPropertyOptional()
  mfaGrantToken?: string

  @ApiPropertyOptional()
  expiresAt?: string
}
