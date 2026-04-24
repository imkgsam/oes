import { ICommand } from '@nestjs/cqrs'
import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsObject, IsString, Min, ValidateNested } from 'class-validator'
import { MfaType } from '@oes/common/constants'
import {
  TenantMfaFactor,
  TenantMfaScenarioRequirementSnapshot
} from '../../../domain/entities/tenant-mfa-policy.entity'

export class UpdateTenantMfaFactorPolicyInput {
  @IsEnum(MfaType)
  factor!: TenantMfaFactor

  @IsBoolean()
  enabled!: boolean

  @IsInt()
  @Min(1)
  priority!: number
}

// Updates one tenant-scoped login MFA policy using a complete factor ordering snapshot.
export class UpdateTenantMfaPolicyCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  readonly tenantId: string

  @IsBoolean()
  readonly loginRequired: boolean

  @IsObject()
  readonly scenarioRequirements: TenantMfaScenarioRequirementSnapshot

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTenantMfaFactorPolicyInput)
  readonly factors: UpdateTenantMfaFactorPolicyInput[]

  @IsString()
  @IsNotEmpty()
  readonly updatedBy: string

  constructor(input: {
    factors: UpdateTenantMfaFactorPolicyInput[]
    loginRequired?: boolean
    scenarioRequirements?: Partial<TenantMfaScenarioRequirementSnapshot>
    tenantId: string
    updatedBy: string
  }) {
    this.tenantId = input.tenantId
    this.scenarioRequirements = {
      LOGIN: Boolean(input.scenarioRequirements?.LOGIN ?? input.loginRequired),
      NEW_DEVICE_LOGIN: Boolean(input.scenarioRequirements?.NEW_DEVICE_LOGIN),
      CHANGE_PASSWORD: Boolean(input.scenarioRequirements?.CHANGE_PASSWORD),
      CHANGE_CONTACT: Boolean(input.scenarioRequirements?.CHANGE_CONTACT)
    }
    this.loginRequired = this.scenarioRequirements.LOGIN
    this.factors = input.factors.map((factor) =>
      Object.assign(new UpdateTenantMfaFactorPolicyInput(), factor)
    )
    this.updatedBy = input.updatedBy
  }
}
