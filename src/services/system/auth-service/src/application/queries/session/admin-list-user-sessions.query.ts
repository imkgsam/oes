import { Allow, IsNotEmpty, IsString, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class AdminListUserSessionsQuery {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly userId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(userId: string, operatorScope?: OperatorScope) {
    this.userId = userId
    this.operatorScope = operatorScope
  }
}
