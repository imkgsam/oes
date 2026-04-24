import { ICommand } from '@nestjs/cqrs'
import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsObject, IsString, Min, ValidateNested } from 'class-validator'
import { MfaType } from '@oes/common/constants'
import {
  PlatformMfaFactor,
  PlatformMfaScenarioRequirementSnapshot
} from '../../../domain/entities/platform-mfa-policy.entity'

export class UpdatePlatformMfaFactorPolicyInput {
  @IsEnum(MfaType)
  factor!: PlatformMfaFactor

  @IsBoolean()
  enabled!: boolean

  @IsInt()
  @Min(1)
  priority!: number
}

// Updates the platform-owned MFA policy using a complete factor ordering snapshot.
export class UpdatePlatformMfaPolicyCommand implements ICommand {
  @IsBoolean()
  readonly loginRequired: boolean

  @IsObject()
  readonly scenarioRequirements: PlatformMfaScenarioRequirementSnapshot

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePlatformMfaFactorPolicyInput)
  readonly factors: UpdatePlatformMfaFactorPolicyInput[]

  @IsString()
  @IsNotEmpty()
  readonly updatedBy: string

  constructor(input: {
    factors: UpdatePlatformMfaFactorPolicyInput[]
    loginRequired?: boolean
    scenarioRequirements?: Partial<PlatformMfaScenarioRequirementSnapshot>
    updatedBy: string
  }) {
    this.scenarioRequirements = {
      LOGIN: Boolean(input.scenarioRequirements?.LOGIN ?? input.loginRequired),
      NEW_DEVICE_LOGIN: Boolean(input.scenarioRequirements?.NEW_DEVICE_LOGIN),
      CHANGE_PASSWORD: Boolean(input.scenarioRequirements?.CHANGE_PASSWORD),
      CHANGE_CONTACT: Boolean(input.scenarioRequirements?.CHANGE_CONTACT)
    }
    this.loginRequired = this.scenarioRequirements.LOGIN
    this.factors = input.factors.map((factor) =>
      Object.assign(new UpdatePlatformMfaFactorPolicyInput(), factor)
    )
    this.updatedBy = input.updatedBy
  }
}
