import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { DeleteRoleTemplateCommand } from './delete-role-template.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { SYMBOLS } from '../../../common/constants/symbols'
import {
  ROLE_DELETE_FORBIDDEN,
  ROLE_TEMPLATE_NOT_FOUND
} from '../../../common/constants/exception-enums'
import { assertSystemScope } from '../../authorization/operator-scope'

@CommandHandler(DeleteRoleTemplateCommand)
export class DeleteRoleTemplateHandler implements ICommandHandler<DeleteRoleTemplateCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: DeleteRoleTemplateCommand): Promise<void> {
    assertSystemScope(command.operatorScope, 'template delete requires system scope')

    const role = await this.roleRepo.findById(command.id)
    if (!role || role.kind !== RoleKind.SYSTEM_TEMPLATE) {
      throw ExceptionFactory.domain(ROLE_TEMPLATE_NOT_FOUND)
    }

    const [hasAssignedPermissions, hasTemplateInstances] = await Promise.all([
      this.roleRepo.hasAssignedPermissions(command.id),
      this.roleRepo.hasTemplateInstances(command.id)
    ])

    if (hasAssignedPermissions || hasTemplateInstances) {
      throw ExceptionFactory.domain(ROLE_DELETE_FORBIDDEN)
    }

    const deleted = await this.roleRepo.delete(command.id)
    if (!deleted) throw ExceptionFactory.domain(ROLE_TEMPLATE_NOT_FOUND)
  }
}
