import { ICommand } from '@nestjs/cqrs'
import { MfaType } from '@oes/common/constants'
import { IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { TenantMfaFactor } from '../../../domain/entities/tenant-mfa-policy.entity'

// Requests one factor-specific MFA challenge while continuing a login MFA flow after account selection.
export class RequestLoginMfaFactorChallengeCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  readonly challengeId: string

  @IsEnum(MfaType)
  readonly factor: TenantMfaFactor

  constructor(challengeId: string, factor: TenantMfaFactor) {
    this.challengeId = challengeId
    this.factor = factor
  }
}
