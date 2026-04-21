import { IQuery } from '@nestjs/cqrs'
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator'

export type LoginHistoryResultFilter = 'FAILED' | 'SUCCESS'

/**
 * ListLoginHistoryQuery carries the self-service filters for one user's login attempt history.
 */
export class ListLoginHistoryQuery implements IQuery {
  @IsUUID()
  readonly userId: string

  @IsOptional()
  @IsEnum(['FAILED', 'SUCCESS'])
  readonly result?: LoginHistoryResultFilter

  @IsOptional()
  @IsDateString()
  readonly occurredAtFrom?: string

  @IsOptional()
  @IsDateString()
  readonly occurredAtTo?: string

  @IsOptional()
  @IsString()
  readonly cursor?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  readonly pageSize?: number

  constructor(input: {
    userId: string
    result?: LoginHistoryResultFilter
    occurredAtFrom?: string
    occurredAtTo?: string
    cursor?: string
    pageSize?: number
  }) {
    this.userId = input.userId
    this.result = input.result
    this.occurredAtFrom = input.occurredAtFrom
    this.occurredAtTo = input.occurredAtTo
    this.cursor = input.cursor
    this.pageSize = input.pageSize
  }
}
