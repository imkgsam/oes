import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CreateRoleTemplateCommand } from './create-role-template.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ROLE_ALREADY_EXISTS } from '../../../common/constants/exception-enums'

@CommandHandler(CreateRoleTemplateCommand)
export class CreateRoleTemplateHandler implements ICommandHandler<CreateRoleTemplateCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: CreateRoleTemplateCommand): Promise<Role> {
    const existing = await this.roleRepo.findByScopeAndCode('__SYSTEM__', command.code)
    if (existing) throw ExceptionFactory.domain(ROLE_ALREADY_EXISTS)

    const role = new Role(
      crypto.randomUUID(),
      command.name,
      command.code,
      null,
      RoleKind.SYSTEM_TEMPLATE,
      true,
      command.description,
      null
    )

    return this.roleRepo.save(role)
  }
}
