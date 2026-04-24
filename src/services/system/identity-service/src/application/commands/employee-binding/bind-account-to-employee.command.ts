import { ICommand } from '@nestjs/cqrs'
import { IsString, IsUUID } from 'class-validator'

type BindAccountToEmployeeInput = {
  tenantId: string
  accountId: string
  employeeId: string
}

/** BindAccountToEmployeeCommand carries one identity-owned employee binding request. */
export class BindAccountToEmployeeCommand implements ICommand {
  @IsString()
  readonly tenantId: string

  @IsUUID()
  readonly accountId: string

  @IsUUID()
  readonly employeeId: string

  constructor(input: BindAccountToEmployeeInput) {
    this.tenantId = input.tenantId
    this.accountId = input.accountId
    this.employeeId = input.employeeId
  }
}
