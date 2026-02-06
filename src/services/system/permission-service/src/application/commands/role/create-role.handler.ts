import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { CreateRoleCommand } from './create-role.command'
import { RoleRepository } from 'src/domain/repositories/role.repository'
import { Role } from 'src/domain/aggregates/role.aggregate'
import { SYMBOLS } from 'src/common/constants/symbols'
import { ExceptionFactory } from '@oes/common/core/exceptions/exception.factory'
import { ROLE_ALREADY_EXISTS } from 'src/common/constants/exception-enums/permission-service.errors'

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreateRoleCommand): Promise<Role> {
    // Business rule validation: check if role code already exists
    const existing = await this.roleRepo.findByCode(command.code)
    if (existing) {
      throw ExceptionFactory.domain(ROLE_ALREADY_EXISTS)
    }
    const role = new Role(crypto.randomUUID(), command.name, command.code, command.description)
    const saved = await this.roleRepo.save(role)
    // Publish domain event (optional)
    // this.eventBus.publish(new RoleCreatedEvent(saved.id, saved.name, saved.code))

    return saved
  }
}
