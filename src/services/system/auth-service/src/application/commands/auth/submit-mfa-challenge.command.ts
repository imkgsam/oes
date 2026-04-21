import { ICommand } from '@nestjs/cqrs'
import { LoginMethodEnum, MfaType } from '@oes/common/constants'
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator'
import { TenantMfaFactor } from '../../../domain/entities/tenant-mfa-policy.entity'

export class SubmitMfaChallengeCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  public readonly challengeId: string

  @IsEnum(MfaType)
  public readonly factor: TenantMfaFactor

  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  public readonly code: string

  @IsEnum(LoginMethodEnum)
  public readonly loginMethod: LoginMethodEnum

  @IsOptional()
  @IsString()
  public readonly factorChallengeId?: string

  constructor(
    challengeId: string,
    factor: TenantMfaFactor,
    code: string,
    loginMethod: LoginMethodEnum,
    factorChallengeId?: string
  ) {
    this.challengeId = challengeId
    this.factor = factor
    this.code = code
    this.loginMethod = loginMethod
    this.factorChallengeId = factorChallengeId
  }
}
