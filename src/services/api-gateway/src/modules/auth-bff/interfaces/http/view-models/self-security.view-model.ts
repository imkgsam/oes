import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { MfaBindingTypeDto } from '../dtos/self-security.dto'

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

// Defines the generic success payload used by self-service session mutations.
export class SessionMutationViewModel {
  @ApiProperty() success!: boolean

  @ApiPropertyOptional({
    description: 'Affected session count when the mutation targets multiple sessions.'
  })
  sessionCount?: number
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
