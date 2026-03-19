import { ICommand } from '@nestjs/cqrs'
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'
import { PolicyEffect } from '../../../domain/enums/policy-effect.enum'
import { PolicySubjectType } from '../../../domain/enums/policy-subject-type.enum'
import { PolicyConditionInput } from './create-policy.command'

export class AddPermissionPolicyCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  readonly permissionCode: string

  @IsString()
  @IsNotEmpty()
  readonly name: string

  @IsEnum(PolicyEffect)
  readonly effect: PolicyEffect

  @IsOptional()
  @IsString()
  readonly description?: string

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @IsEnum(PolicySubjectType)
  readonly subjectType: PolicySubjectType

  @IsOptional()
  @IsString()
  readonly subjectId?: string

  @IsOptional()
  @IsString()
  readonly resourceType?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  readonly priority?: number

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicyConditionInput)
  readonly conditions?: PolicyConditionInput[]

  constructor(params: {
    permissionCode: string
    name: string
    effect: PolicyEffect
    description?: string
    tenantId?: string
    subjectType: PolicySubjectType
    subjectId?: string
    resourceType?: string
    priority?: number
    conditions?: PolicyConditionInput[]
  }) {
    this.permissionCode = params.permissionCode
    this.name = params.name
    this.effect = params.effect
    this.description = params.description
    this.tenantId = params.tenantId
    this.subjectType = params.subjectType
    this.subjectId = params.subjectId
    this.resourceType = params.resourceType
    this.priority = params.priority
    this.conditions = params.conditions
  }
}
