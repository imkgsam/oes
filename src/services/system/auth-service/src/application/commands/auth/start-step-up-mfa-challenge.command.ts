import { ICommand } from '@nestjs/cqrs'
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { TenantMfaScenario } from '../../../domain/entities/tenant-mfa-policy.entity'

export type StepUpMfaScenario = Exclude<TenantMfaScenario, 'LOGIN'>

// Starts one scope-aware step-up MFA flow for a protected in-session scenario.
export class StartStepUpMfaChallengeCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  readonly userId: string

  @IsString()
  @IsNotEmpty()
  readonly accountId: string

  @IsString()
  @IsOptional()
  readonly tenantId?: string

  @IsString()
  @IsIn(['SYSTEM', 'TENANT'])
  readonly scopeLevel: 'SYSTEM' | 'TENANT'

  @IsString()
  @IsIn(['CHANGE_PASSWORD', 'CHANGE_CONTACT', 'NEW_DEVICE_LOGIN'])
  readonly scenario: StepUpMfaScenario

  constructor(
    userId: string,
    accountId: string,
    tenantId: string | undefined,
    scopeLevel: 'SYSTEM' | 'TENANT',
    scenario: StepUpMfaScenario
  ) {
    this.userId = userId
    this.accountId = accountId
    this.tenantId = tenantId
    this.scopeLevel = scopeLevel
    this.scenario = scenario
  }
}
