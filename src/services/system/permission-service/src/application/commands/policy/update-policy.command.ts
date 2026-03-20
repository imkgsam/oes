import { ICommand } from '@nestjs/cqrs'
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min
} from 'class-validator'
import { PolicyEffect } from '../../../domain/enums/policy-effect.enum'
import { PolicySubjectType } from '../../../domain/enums/policy-subject-type.enum'

export class UpdatePolicyCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly id: string

  @IsOptional()
  @IsString()
  readonly name?: string

  @IsOptional()
  @IsEnum(PolicyEffect)
  readonly effect?: PolicyEffect

  @IsOptional()
  @IsString()
  readonly description?: string

  @IsOptional()
  @IsEnum(PolicySubjectType)
  readonly subjectType?: PolicySubjectType

  @IsOptional()
  @IsString()
  readonly subjectId?: string

  @IsOptional()
  @IsString()
  readonly permissionCode?: string

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
    id: string
    name?: string
    effect?: PolicyEffect
    description?: string
    subjectType?: PolicySubjectType
    subjectId?: string
    permissionCode?: string
    resourceType?: string
    priority?: number
    conditionAstJson?: string
  }) {
    this.id = params.id
    this.name = params.name
    this.effect = params.effect
    this.description = params.description
    this.subjectType = params.subjectType
    this.subjectId = params.subjectId
    this.permissionCode = params.permissionCode
    this.resourceType = params.resourceType
    this.priority = params.priority
    this.conditionAstJson = params.conditionAstJson
  }
}
