import { ICommand } from '@nestjs/cqrs'
import { Allow, IsOptional, IsString } from 'class-validator'
import { OperatorScope } from '../../authorization'

type UpdateUserBasicInfoInput = {
  accountId: string
  userId: string
  email?: string
  phone?: string
  operatorId?: string
  operatorScope?: OperatorScope
}

// Carries one account-scoped user basic-info edit request through the identity command bus.
export class UpdateUserBasicInfoCommand implements ICommand {
  @IsString()
  readonly accountId: string

  @IsString()
  readonly userId: string

  @IsOptional()
  @IsString()
  readonly email?: string

  @IsOptional()
  @IsString()
  readonly phone?: string

  @IsOptional()
  @IsString()
  readonly operatorId?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(input: UpdateUserBasicInfoInput) {
    this.accountId = input.accountId
    this.userId = input.userId
    this.email = input.email
    this.phone = input.phone
    this.operatorId = input.operatorId
    this.operatorScope = input.operatorScope
  }
}
