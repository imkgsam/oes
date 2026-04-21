import { ICommand } from '@nestjs/cqrs'
import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from 'class-validator'
import { MfaType } from '@oes/common/constants'
import { TenantMfaFactor } from '../../../domain/entities/tenant-mfa-policy.entity'

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTenantMfaFactorPolicyInput)
  readonly factors: UpdateTenantMfaFactorPolicyInput[]

  @IsString()
  @IsNotEmpty()
  readonly updatedBy: string

  constructor(input: {
    factors: UpdateTenantMfaFactorPolicyInput[]
    loginRequired: boolean
    tenantId: string
    updatedBy: string
  }) {
    this.tenantId = input.tenantId
    this.loginRequired = input.loginRequired
    this.factors = input.factors
    this.updatedBy = input.updatedBy
  }
}
