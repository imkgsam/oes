import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { UpdatePermissionCommand } from './update-permission.command'
import { Permission } from '../../../domain/aggregates/permission.aggregate'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { SYMBOLS } from '../../../common/constants/symbols'
import { PERMISSION_NOT_FOUND } from '../../../common/constants/exception-enums'

@CommandHandler(UpdatePermissionCommand)
export class UpdatePermissionHandler implements ICommandHandler<UpdatePermissionCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(command: UpdatePermissionCommand): Promise<Permission> {
    const permission = await this.permissionRepo.findById(command.id)
    if (!permission) {
      throw ExceptionFactory.domain(PERMISSION_NOT_FOUND)
    }

    permission.moveToModule(command.module)
    permission.updateDescription(command.description)

    return this.permissionRepo.save(permission)
  }
}
