import { ICommand } from '@nestjs/cqrs'
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min
} from 'class-validator'
import { PolicyEffect } from '../../../domain/enums/policy-effect.enum'
import { PolicySubjectType } from '../../../domain/enums/policy-subject-type.enum'

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
  @IsString()
  readonly conditionAstJson?: string

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
    conditionAstJson?: string
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
    this.conditionAstJson = params.conditionAstJson
  }
}
