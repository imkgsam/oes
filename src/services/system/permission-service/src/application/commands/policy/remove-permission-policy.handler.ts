import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { RemovePermissionPolicyCommand } from './remove-permission-policy.command'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { PolicyRepository } from '../../../domain/repositories/policy.repository'
import { SYMBOLS } from '../../../common/constants/symbols'
import {
  PERMISSION_NOT_FOUND,
  POLICY_NOT_BOUND_TO_PERMISSION,
  POLICY_NOT_FOUND
} from '../../../common/constants/exception-enums'

@CommandHandler(RemovePermissionPolicyCommand)
export class RemovePermissionPolicyHandler
  implements ICommandHandler<RemovePermissionPolicyCommand>
{
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository,
    @Inject(SYMBOLS.REPO.POLICY)
    private readonly policyRepo: PolicyRepository
  ) {}

  async execute(command: RemovePermissionPolicyCommand): Promise<void> {
    const permission = await this.permissionRepo.findByCode(command.permissionCode)
    if (!permission) throw ExceptionFactory.domain(PERMISSION_NOT_FOUND)

    const policy = await this.policyRepo.findById(command.policyId)
    if (!policy) throw ExceptionFactory.domain(POLICY_NOT_FOUND)

    if (policy.permissionCode !== command.permissionCode) {
      throw ExceptionFactory.domain(POLICY_NOT_BOUND_TO_PERMISSION)
    }

    await this.policyRepo.delete(command.policyId)
  }
}
