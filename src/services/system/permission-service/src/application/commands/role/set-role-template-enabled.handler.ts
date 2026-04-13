import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { SetRoleTemplateEnabledCommand } from './set-role-template-enabled.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ROLE_TEMPLATE_NOT_FOUND } from '../../../common/constants/exception-enums'
import { assertSystemScope } from '../../authorization/operator-scope'

@CommandHandler(SetRoleTemplateEnabledCommand)
export class SetRoleTemplateEnabledHandler
  implements ICommandHandler<SetRoleTemplateEnabledCommand>
{
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: SetRoleTemplateEnabledCommand): Promise<Role> {
    assertSystemScope(command.operatorScope, 'template enable requires system scope')

    const role = await this.roleRepo.findById(command.id)
    if (!role || role.kind !== RoleKind.SYSTEM_TEMPLATE) {
      throw ExceptionFactory.domain(ROLE_TEMPLATE_NOT_FOUND)
    }

    command.isEnabled ? role.enable() : role.disable()

    return this.roleRepo.save(role)
  }
}
