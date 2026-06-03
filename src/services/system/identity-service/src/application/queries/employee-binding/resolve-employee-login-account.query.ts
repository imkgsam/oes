import { IQuery } from '@nestjs/cqrs'
import { IsString, IsUUID } from 'class-validator'

type ResolveEmployeeLoginAccountInput = {
  tenantId: string
  employeeId: string
}

/** ResolveEmployeeLoginAccountQuery carries the tenant-scoped employee account lookup request. */
export class ResolveEmployeeLoginAccountQuery implements IQuery {
  @IsString()
  readonly tenantId: string

  @IsUUID()
  readonly employeeId: string

  constructor(input: ResolveEmployeeLoginAccountInput) {
    this.tenantId = input.tenantId
    this.employeeId = input.employeeId
  }
}
