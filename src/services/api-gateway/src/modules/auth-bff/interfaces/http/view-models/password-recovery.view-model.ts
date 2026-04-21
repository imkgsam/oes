import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

// Defines one verified recovery destination that can be chosen for forgot-password OTP delivery.
export class PasswordRecoveryChannelOptionViewModel {
  @ApiProperty({ enum: ['EMAIL', 'PHONE'] })
  channel!: 'EMAIL' | 'PHONE'

  @ApiProperty({ description: 'Masked recovery destination displayed to the end user.' })
  maskedDestination!: string
}

// Defines the verified recovery destinations available for one submitted identifier.
export class PasswordRecoveryOptionsViewModel {
  @ApiProperty({
    type: PasswordRecoveryChannelOptionViewModel,
    isArray: true,
    description: 'Verified recovery destinations that can receive the OTP.'
  })
  channels!: PasswordRecoveryChannelOptionViewModel[]

  @ApiPropertyOptional({
    enum: ['EMAIL', 'PHONE'],
    description: 'Default channel when only one verified recovery destination is available.'
  })
  defaultChannel?: 'EMAIL' | 'PHONE'
}

// Defines the public forgot-password challenge payload returned after the first step.
export class PasswordRecoveryChallengeViewModel {
  @ApiProperty({ description: 'Whether the recovery request was accepted with neutral anti-enumeration semantics.' })
  accepted!: boolean

  @ApiProperty({ description: 'Challenge identifier used by the OTP verification step.' })
  challengeId!: string

  @ApiPropertyOptional({ description: 'Expiration timestamp for the OTP challenge.' })
  expiresAt?: string

  @ApiPropertyOptional({ description: 'Masked destination used by the selected recovery channel.' })
  maskedDestination?: string
}

// Defines the public forgot-password verification payload returned after OTP success.
export class PasswordRecoveryVerificationViewModel {
  @ApiProperty({ description: 'Whether the supplied OTP has been verified successfully.' })
  verified!: boolean

  @ApiProperty({ description: 'Short-lived reset token used by the final password reset step.' })
  resetToken!: string
}

// Defines the public forgot-password completion payload returned after password reset succeeds.
export class PasswordRecoveryCompletionViewModel {
  @ApiProperty({ description: 'Whether the password reset completed successfully.' })
  success!: boolean

  @ApiProperty({ description: 'Whether all previous sessions were revoked as part of the reset.' })
  sessionsRevoked!: boolean
}
