import { IQuery } from '@nestjs/cqrs'
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class ListNavigationEntriesQuery implements IQuery {
  @IsInt()
  @Min(1)
  readonly page: number

  @IsInt()
  @Min(1)
  readonly pageSize: number

  @IsOptional()
  @IsString()
  readonly keyword?: string

  @IsOptional()
  @IsString()
  readonly featureKey?: string

  @IsOptional()
  @IsString()
  readonly terminal?: string

  @IsOptional()
  @IsBoolean()
  readonly enabled?: boolean

  constructor(params: {
    page: number
    pageSize: number
    keyword?: string
    featureKey?: string
    terminal?: string
    enabled?: boolean
  }) {
    this.page = params.page
    this.pageSize = params.pageSize
    this.keyword = params.keyword
    this.featureKey = params.featureKey
    this.terminal = params.terminal
    this.enabled = params.enabled
  }
}
