import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { DeletePermissionCommand } from './delete-permission.command'
import { PermissionRepository } from 'src/domain/repositories/permission.repository'
import { Permission } from 'src/domain/aggregates/permission.aggregate'
import { SYMBOLS } from 'src/common/constants/symbols'
import { createBusinessException } from '@oes/common/exceptions/exception.factory'
import { PERMISSION_SERVICE_ERRORS } from '@oes/common/constants/res-codes/permission-service.errors'

@CommandHandler(DeletePermissionCommand)
export class DeletePermissionHandler implements ICommandHandler<DeletePermissionCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(command: DeletePermissionCommand): Promise<Permission> {
    const existing = await this.permissionRepo.findById(command.id)
    if (!existing) {
      throw createBusinessException(PERMISSION_SERVICE_ERRORS.PERMISSION_NOT_FOUND)
    }

    const deleted = await this.permissionRepo.delete(command.id)
    if (!deleted) {
      throw createBusinessException(PERMISSION_SERVICE_ERRORS.PERMISSION_NOT_FOUND)
    }

    return deleted
  }
}
