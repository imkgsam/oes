import { IQuery } from '@nestjs/cqrs'
import { Allow, IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class ContactActionTargetRefQueryInput {
  @IsString()
  @IsNotEmpty()
  readonly contactActionType: string

  @IsString()
  @IsNotEmpty()
  readonly targetRefType: string

  @IsOptional()
  @IsString()
  readonly targetRefId?: string | null

  constructor(input: { contactActionType: string; targetRefType: string; targetRefId?: string | null }) {
    this.contactActionType = input.contactActionType
    this.targetRefType = input.targetRefType
    this.targetRefId = input.targetRefId ?? null
  }
}

// ResolveContactActionTargetsQuery asks identity to resolve BusinessCard Contact Asset refs into public-safe values.
export class ResolveContactActionTargetsQuery implements IQuery {
  @IsString()
  @IsNotEmpty()
  readonly tenantId: string

  @IsString()
  @IsNotEmpty()
  readonly accountId: string

  @IsOptional()
  @IsString()
  readonly employeeId?: string | null

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactActionTargetRefQueryInput)
  readonly targetRefs: ContactActionTargetRefQueryInput[]

  @Allow()
  readonly traceId?: string

  constructor(input: {
    tenantId: string
    accountId: string
    employeeId?: string | null
    targetRefs: Array<{
      contactActionType: string
      targetRefType: string
      targetRefId?: string | null
    }>
    traceId?: string
  }) {
    this.tenantId = input.tenantId
    this.accountId = input.accountId
    this.employeeId = input.employeeId ?? null
    this.targetRefs = input.targetRefs.map((ref) => new ContactActionTargetRefQueryInput(ref))
    this.traceId = input.traceId
  }
}
