import { ICommand } from '@nestjs/cqrs'
import { Allow, IsNotEmpty, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

/** SyncRoleNavigationFromTemplateCommand copies the linked template navigation snapshot onto a role instance. */
export class SyncRoleNavigationFromTemplateCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly roleId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(params: { roleId: string; operatorScope?: OperatorScope }) {
    this.roleId = params.roleId
    this.operatorScope = params.operatorScope
  }
}
