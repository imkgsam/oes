import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { DeletePermissionCommand } from './delete-permission.command'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { Permission } from '../../../domain/aggregates/permission.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import { PERMISSION_NOT_FOUND } from '../../../common/constants/exception-enums'

@CommandHandler(DeletePermissionCommand)
export class DeletePermissionHandler implements ICommandHandler<DeletePermissionCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(command: DeletePermissionCommand): Promise<Permission> {
    const existing = await this.permissionRepo.findById(command.id)
    if (!existing) {
      throw ExceptionFactory.domain(PERMISSION_NOT_FOUND)
    }
    const deleted = await this.permissionRepo.delete(command.id)
    if (!deleted) {
      throw ExceptionFactory.domain(PERMISSION_NOT_FOUND)
    }
    return deleted
  }
}
