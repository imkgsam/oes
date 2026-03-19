import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class RemovePermissionPolicyCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  readonly permissionCode: string

  @IsUUID()
  @IsNotEmpty()
  readonly policyId: string

  constructor(permissionCode: string, policyId: string) {
    this.permissionCode = permissionCode
    this.policyId = policyId
  }
}
