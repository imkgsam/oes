import { IQuery } from '@nestjs/cqrs'
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator'

// This query carries the minimal cross-service audit filters for permission audit event listing.
export class ListAuditEventsQuery implements IQuery {
  @IsOptional()
  @IsString()
  readonly service?: string

  @IsOptional()
  @IsString()
  readonly module?: string

  @IsOptional()
  @IsString()
  readonly eventType?: string

  @IsOptional()
  @IsString()
  readonly result?: string

  @IsOptional()
  @IsUUID()
  readonly operatorId?: string

  @IsOptional()
  @IsUUID()
  readonly tenantId?: string

  @IsOptional()
  @IsUUID()
  readonly orgId?: string

  @IsOptional()
  @IsString()
  readonly resourceType?: string

  @IsOptional()
  @IsUUID()
  readonly resourceId?: string

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

  constructor(input?: {
    service?: string
    module?: string
    eventType?: string
    result?: string
    operatorId?: string
    tenantId?: string
    orgId?: string
    resourceType?: string
    resourceId?: string
    occurredAtFrom?: string
    occurredAtTo?: string
    cursor?: string
    pageSize?: number
  }) {
    this.service = input?.service
    this.module = input?.module
    this.eventType = input?.eventType
    this.result = input?.result
    this.operatorId = input?.operatorId
    this.tenantId = input?.tenantId
    this.orgId = input?.orgId
    this.resourceType = input?.resourceType
    this.resourceId = input?.resourceId
    this.occurredAtFrom = input?.occurredAtFrom
    this.occurredAtTo = input?.occurredAtTo
    this.cursor = input?.cursor
    this.pageSize = input?.pageSize
  }
}
