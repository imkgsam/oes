import { ICommand } from '@nestjs/cqrs'
import { MfaType } from '@oes/common/constants'
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator'
import { TenantMfaFactor } from '../../../domain/entities/tenant-mfa-policy.entity'

// Completes one protected step-up MFA flow and exchanges it for a short-lived scenario grant token.
export class CompleteStepUpMfaChallengeCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  readonly challengeId: string

  @IsEnum(MfaType)
  readonly factor: TenantMfaFactor

  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  readonly code: string

  @IsOptional()
  @IsString()
  readonly factorChallengeId?: string

  constructor(
    challengeId: string,
    factor: TenantMfaFactor,
    code: string,
    factorChallengeId?: string
  ) {
    this.challengeId = challengeId
    this.factor = factor
    this.code = code
    this.factorChallengeId = factorChallengeId
  }
}
