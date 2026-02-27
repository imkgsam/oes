import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator'

export class CheckPermissionWithContextQuery implements IQuery {
  @IsUUID()
  @IsNotEmpty()
  readonly accountId: string

  @IsString()
  @IsNotEmpty()
  readonly permissionCode: string

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @IsObject()
  readonly subject: Record<string, any>

  @IsObject()
  readonly resource: Record<string, any>

  @IsObject()
  readonly environment: Record<string, any>

  @IsObject()
  readonly action: Record<string, any>

  constructor(params: {
    accountId: string
    permissionCode: string
    tenantId?: string
    subject: Record<string, any>
    resource: Record<string, any>
    environment: Record<string, any>
    action: Record<string, any>
  }) {
    this.accountId = params.accountId
    this.permissionCode = params.permissionCode
    this.tenantId = params.tenantId
    this.subject = params.subject
    this.resource = params.resource
    this.environment = params.environment
    this.action = params.action
  }
}
