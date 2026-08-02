import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { RevokeAccountRoleCommand } from './revoke-account-role.command'
import { PRINCIPAL_ROLE_BINDING_ID_REQUIRED } from '../../../common/constants/exception-enums'

@CommandHandler(RevokeAccountRoleCommand)
export class RevokeAccountRoleHandler implements ICommandHandler<RevokeAccountRoleCommand> {
  /** execute rejects the deprecated account/role selector after canonical cutover. */
  async execute(command: RevokeAccountRoleCommand): Promise<void> {
    throw ExceptionFactory.application(PRINCIPAL_ROLE_BINDING_ID_REQUIRED, {
      accountId: command.accountId,
      roleId: command.roleId,
      compatibilityWindow: 'closed'
    })
  }
}
