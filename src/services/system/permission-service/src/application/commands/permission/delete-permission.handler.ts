import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { DeletePermissionCommand } from './delete-permission.command'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { Permission } from '../../../domain/aggregates/permission.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  PERMISSION_DELETE_FORBIDDEN,
  PERMISSION_NOT_FOUND
} from '../../../common/constants/exception-enums'

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

    const [hasAssignedRoles, hasAttachedPolicies, hasAttachedPolicyInstances] = await Promise.all([
      this.permissionRepo.hasAssignedRoles(command.id),
      this.permissionRepo.hasAttachedPolicies(existing.code),
      this.permissionRepo.hasAttachedPolicyInstances(existing.code)
    ])

    if (hasAssignedRoles || hasAttachedPolicies || hasAttachedPolicyInstances) {
      throw ExceptionFactory.domain(PERMISSION_DELETE_FORBIDDEN)
    }

    const deleted = await this.permissionRepo.delete(command.id)
    if (!deleted) {
      throw ExceptionFactory.domain(PERMISSION_NOT_FOUND)
    }
    return deleted
  }
}
