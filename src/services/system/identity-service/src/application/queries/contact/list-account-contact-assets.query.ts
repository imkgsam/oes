import { IQuery } from '@nestjs/cqrs'
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator'

// ListAccountContactAssetsQuery lists Contact Asset candidates for an account-scoped management flow.
export class ListAccountContactAssetsQuery implements IQuery {
  @IsString()
  @IsNotEmpty()
  readonly tenantId: string

  @IsString()
  @IsNotEmpty()
  readonly accountId: string

  @IsOptional()
  @IsString()
  readonly employeeId?: string | null

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly types?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly statuses?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly ownership?: string[]

  constructor(input: {
    tenantId: string
    accountId: string
    employeeId?: string | null
    types?: string[]
    statuses?: string[]
    ownership?: string[]
  }) {
    this.tenantId = input.tenantId
    this.accountId = input.accountId
    this.employeeId = input.employeeId ?? null
    this.types = input.types
    this.statuses = input.statuses
    this.ownership = input.ownership
  }
}
