import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { UpdateRoleTemplateCommand } from './update-role-template.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ROLE_TEMPLATE_NOT_FOUND } from '../../../common/constants/exception-enums'
import { assertSystemScope } from '../../authorization/operator-scope'

@CommandHandler(UpdateRoleTemplateCommand)
export class UpdateRoleTemplateHandler implements ICommandHandler<UpdateRoleTemplateCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: UpdateRoleTemplateCommand): Promise<Role> {
    assertSystemScope(command.operatorScope, 'template update requires system scope')

    const role = await this.roleRepo.findById(command.id)
    if (!role || role.kind !== RoleKind.SYSTEM_TEMPLATE) {
      throw ExceptionFactory.domain(ROLE_TEMPLATE_NOT_FOUND)
    }

    if (command.name !== undefined) role.rename(command.name)
    if (command.description !== undefined) role.updateDescription(command.description)

    return this.roleRepo.save(role)
  }
}
