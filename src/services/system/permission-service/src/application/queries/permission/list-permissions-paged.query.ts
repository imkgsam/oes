import { IQuery } from '@nestjs/cqrs'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { PermissionModule } from '../../../domain/enums/permission-module.enum'

export class ListPermissionsPagedQuery implements IQuery {
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
  @IsEnum(PermissionModule, { message: 'Invalid permission module' })
  readonly module?: PermissionModule

  @IsOptional()
  @IsString()
  readonly keyword?: string

  constructor(input: {
    page: number
    pageSize: number
    module?: PermissionModule
    keyword?: string
  }) {
    this.page = input.page
    this.pageSize = input.pageSize
    this.module = input.module
    this.keyword = input.keyword
  }
}
