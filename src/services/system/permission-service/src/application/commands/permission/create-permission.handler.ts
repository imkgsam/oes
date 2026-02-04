import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { CreatePermissionCommand } from './create-permission.command'
import { PermissionRepository } from 'src/domain/repositories/permission.repository'
import { Permission } from 'src/domain/aggregates/permission.aggregate'
import { SYMBOLS } from 'src/common/constants/symbols'
import { createBusinessException } from '@oes/common/exceptions/exception.factory'
import { PERMISSION_SERVICE_ERRORS } from '@oes/common/constants/res-codes/permission-service.errors'

@CommandHandler(CreatePermissionCommand)
export class CreatePermissionHandler implements ICommandHandler<CreatePermissionCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreatePermissionCommand): Promise<Permission> {
    // Business rule validation: check if permission code already exists
    const existing = await this.permissionRepo.findByCode(command.code)
    if (existing) {
      throw createBusinessException(PERMISSION_SERVICE_ERRORS.PERMISSION_ALREADY_EXISTS)
    }

    const permission = new Permission(
      crypto.randomUUID(),
      command.code,
      command.module,
      command.description
    )

    const saved = await this.permissionRepo.save(permission)

    // Publish domain event (optional, can be added later)
    // this.eventBus.publish(new PermissionCreatedEvent(saved.id, saved.code, saved.module))

    return saved
  }
}
