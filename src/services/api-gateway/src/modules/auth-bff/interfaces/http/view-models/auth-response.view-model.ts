import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum AuthResultStatus {
  SUCCESS = 'SUCCESS',
  MFA_REQUIRED = 'MFA_REQUIRED',
  ACCOUNT_SELECTION_REQUIRED = 'ACCOUNT_SELECTION_REQUIRED',
  CHALLENGE_REQUIRED = 'CHALLENGE_REQUIRED',
  DENIED = 'DENIED'
}

export enum AuthNextStep {
  NONE = 'NONE',
  COMPLETE_MFA = 'COMPLETE_MFA',
  SELECT_ACCOUNT = 'SELECT_ACCOUNT',
  COMPLETE_CHALLENGE = 'COMPLETE_CHALLENGE'
}

// Defines the session token payload returned when authentication fully succeeds.
export class SessionViewModel {
  @ApiProperty({ description: 'Issued access token when login completes successfully.' })
  accessToken!: string

  @ApiProperty({ description: 'Issued refresh token when login completes successfully.' })
  refreshToken!: string

  @ApiProperty({ description: 'Access token lifetime in seconds.' })
  expiresIn!: number
}

// Defines the operator context that becomes available as the auth flow progresses.
export class OperatorViewModel {
  @ApiPropertyOptional({ description: 'Authenticated user identifier.' })
  userId?: string

  @ApiPropertyOptional({ description: 'Selected account identifier when account selection is complete.' })
  accountId?: string

  @ApiPropertyOptional({
    description: 'Tenant identifier bound to the selected account; omitted for system-scope accounts.',
    nullable: true
  })
  tenantId?: string | null

  @ApiPropertyOptional({ description: 'Scope level bound to the selected account.' })
  scopeLevel?: string

  @ApiPropertyOptional({ description: 'Display name resolved for the selected account.' })
  displayName?: string
}

// Defines the challenge context returned when the next auth step must resume a pending challenge.
export class ChallengeViewModel {
  @ApiProperty({ description: 'Challenge identifier used by the next login step, such as MFA completion.' })
  challengeId!: string
}

// Defines one account candidate shown during multi-account selection.
export class AccountOptionViewModel {
  @ApiProperty({ description: 'Candidate account identifier available to the authenticated user.' })
  accountId!: string

  @ApiPropertyOptional({
    description: 'Tenant identifier associated with the candidate account; absent for system accounts.',
    nullable: true
  })
  tenantId?: string | null

  @ApiProperty({ description: 'Scope level associated with the candidate account.' })
  scopeLevel!: string

  @ApiPropertyOptional({ description: 'Optional display name shown to the user during account selection.' })
  displayName?: string
}

// Defines the normalized login flow response consumed by front-end clients.
export class AuthResponseViewModel {
  @ApiProperty({
    enum: AuthResultStatus,
    enumName: 'AuthResultStatus',
    description: 'High-level authentication result returned by the login orchestration.'
  })
  status!: AuthResultStatus

  @ApiProperty({
    enum: AuthNextStep,
    enumName: 'AuthNextStep',
    description: 'Next client action required to complete authentication.'
  })
  nextStep!: AuthNextStep

  @ApiPropertyOptional({
    description: 'Original login method carried forward for MFA completion or account selection steps.'
  })
  loginMethod?: string

  @ApiPropertyOptional({
    type: SessionViewModel,
    nullable: true,
    description: 'Session tokens returned only when authentication is fully complete.'
  })
  session?: SessionViewModel | null

  @ApiPropertyOptional({
    type: OperatorViewModel,
    nullable: true,
    description: 'Resolved operator/account context when available.'
  })
  operator?: OperatorViewModel | null

  @ApiPropertyOptional({
    type: ChallengeViewModel,
    nullable: true,
    description: 'Challenge payload returned when the caller must complete MFA or another challenge step.'
  })
  challenge?: ChallengeViewModel | null

  @ApiProperty({
    type: AccountOptionViewModel,
    isArray: true,
    description: 'Candidate accounts returned when account selection is required.'
  })
  accountOptions!: AccountOptionViewModel[]
}

// Defines the OTP challenge payload returned when the caller requests a login code.
export class OtpChallengeViewModel {
  @ApiProperty({ description: 'Challenge identifier used by the subsequent OTP login call.' })
  challengeId!: string

  @ApiPropertyOptional({ description: 'Expiration timestamp for the challenge when supplied downstream.' })
  expiresAt?: string

  @ApiPropertyOptional({ description: 'Masked destination that received the OTP challenge.' })
  destination?: string
}

// Defines the refresh response returned when a session token pair is renewed.
export class RefreshSessionViewModel {
  @ApiProperty({ description: 'Current session identifier associated with the refreshed tokens.' })
  sessionId!: string

  @ApiProperty({ description: 'Newly issued access token.' })
  accessToken!: string

  @ApiProperty({ description: 'Newly issued refresh token.' })
  refreshToken!: string

  @ApiProperty({ description: 'Access token lifetime in seconds.' })
  expiresIn!: number
}
