import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { CreateRoleCommand } from './create-role.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import { ROLE_ALREADY_EXISTS } from '../../../common/constants/exception-enums/permission-service.errors'

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: CreateRoleCommand): Promise<Role> {
    const existing = await this.roleRepo.findByCode(command.code)
    if (existing) {
      throw ExceptionFactory.domain(ROLE_ALREADY_EXISTS)
    }

    const role = new Role(
      crypto.randomUUID(),
      command.name,
      command.code,
      command.tenantId ?? null,
      command.isSystem ?? false,
      true, // isEnabled
      command.description
    )

    return this.roleRepo.save(role)
  }
}
