import { IQuery } from '@nestjs/cqrs'
import { Type } from 'class-transformer'
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { PolicySubjectType } from '../../../domain/enums/policy-subject-type.enum'

export class ListPoliciesPagedQuery implements IQuery {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly pageSize: number

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @IsOptional()
  @IsString()
  readonly permissionCode?: string

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly isEnabled?: boolean

  @IsOptional()
  @IsString()
  readonly keyword?: string

  @IsOptional()
  @IsEnum(PolicySubjectType)
  readonly subjectType?: PolicySubjectType

  @IsOptional()
  @IsString()
  readonly subjectId?: string

  constructor(input: {
    page: number
    pageSize: number
    tenantId?: string
    permissionCode?: string
    isEnabled?: boolean
    keyword?: string
    subjectType?: PolicySubjectType
    subjectId?: string
  }) {
    this.page = input.page
    this.pageSize = input.pageSize
    this.tenantId = input.tenantId
    this.permissionCode = input.permissionCode
    this.isEnabled = input.isEnabled
    this.keyword = input.keyword
    this.subjectType = input.subjectType
    this.subjectId = input.subjectId
  }
}
