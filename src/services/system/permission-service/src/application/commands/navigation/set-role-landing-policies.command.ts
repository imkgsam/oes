import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator'
import { ICommand } from '@nestjs/cqrs'

/** RoleLandingPolicyInputCommand carries one role default-entry policy update. */
export class RoleLandingPolicyInputCommand {
  @IsString()
  @IsNotEmpty()
  readonly terminal!: string

  @IsString()
  @IsNotEmpty()
  readonly defaultEntryKey!: string

  @IsInt()
  readonly priority!: number

  @IsBoolean()
  readonly enabled!: boolean
}

/** SetRoleLandingPoliciesCommand replaces a role's managed landing policies. */
export class SetRoleLandingPoliciesCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  readonly roleId: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleLandingPolicyInputCommand)
  readonly landingPolicies: RoleLandingPolicyInputCommand[]

  constructor(params: { roleId: string; landingPolicies: RoleLandingPolicyInputCommand[] }) {
    this.roleId = params.roleId
    this.landingPolicies = params.landingPolicies
  }
}
