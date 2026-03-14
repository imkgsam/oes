import { ICommand } from '@nestjs/cqrs'
import {
  IsArray,
  IsBoolean,
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
import { AttributeSource } from '../../../domain/enums/attribute-source.enum'
import { ConditionOperator } from '../../../domain/enums/condition-operator.enum'

export class PolicyConditionInput {
  @IsEnum(AttributeSource)
  readonly attributeSource: AttributeSource

  @IsString()
  @IsNotEmpty()
  readonly attributeKey: string

  @IsEnum(ConditionOperator)
  readonly operator: ConditionOperator

  @IsString()
  @IsNotEmpty()
  readonly value: string // JSON-encoded
}

export class CreatePolicyCommand implements ICommand {
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

  @IsString()
  @IsNotEmpty()
  readonly permissionCode: string

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
    name: string
    effect: PolicyEffect
    description?: string
    tenantId?: string
    subjectType: PolicySubjectType
    subjectId?: string
    permissionCode: string
    resourceType?: string
    priority?: number
    conditions?: PolicyConditionInput[]
  }) {
    this.name = params.name
    this.effect = params.effect
    this.description = params.description
    this.tenantId = params.tenantId
    this.subjectType = params.subjectType
    this.subjectId = params.subjectId
    this.permissionCode = params.permissionCode
    this.resourceType = params.resourceType
    this.priority = params.priority
    this.conditions = params.conditions
  }
}
