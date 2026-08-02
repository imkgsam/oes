import { randomUUID } from 'node:crypto'
import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import {
  PrincipalRoleBindingRevokeResult,
  RoleRepository
} from '../../../domain/repositories/role.repository'
import { RevokePrincipalRoleBindingCommand } from './revoke-principal-role-binding.command'

/** RevokePrincipalRoleBindingHandler closes one binding while preserving the first revoke facts on retries. */
@CommandHandler(RevokePrincipalRoleBindingCommand)
export class RevokePrincipalRoleBindingHandler implements ICommandHandler<
  RevokePrincipalRoleBindingCommand,
  PrincipalRoleBindingRevokeResult
> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepository: RoleRepository
  ) {}

  async execute(
    command: RevokePrincipalRoleBindingCommand
  ): Promise<PrincipalRoleBindingRevokeResult> {
    return this.roleRepository.revokePrincipalRoleBinding({
      bindingId: command.bindingId,
      revokedAt: new Date(),
      revokedByOperatorId: command.operatorScope?.operatorId ?? 'system',
      reason: command.reason ?? '',
      auditEventId: randomUUID()
    })
  }
}
