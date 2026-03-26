import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  IDENTITY_SERVICE_ACCOUNT_NOT_FOUND,
  MACHINE_PRINCIPAL_STATUSES,
  SYMBOLS
} from '../../../common/constants'
import { ServiceAccountEntity } from '../../../domain/entities/service-account.entity'
import { ServiceAccountRepository } from '../../../domain/repositories/service-account.repository'
import { SetServiceAccountEnabledCommand } from './set-service-account-enabled.command'

@CommandHandler(SetServiceAccountEnabledCommand)
export class SetServiceAccountEnabledHandler
  implements ICommandHandler<SetServiceAccountEnabledCommand, ServiceAccountEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.SERVICE_ACCOUNT)
    private readonly serviceAccountRepository: ServiceAccountRepository
  ) {}

  async execute(command: SetServiceAccountEnabledCommand): Promise<ServiceAccountEntity> {
    const serviceAccount = await this.serviceAccountRepository.findById(command.serviceAccountId)
    if (!serviceAccount) {
      throw ExceptionFactory.domain(IDENTITY_SERVICE_ACCOUNT_NOT_FOUND, {
        serviceAccountId: command.serviceAccountId
      })
    }

    return this.serviceAccountRepository.setStatus({
      serviceAccountId: command.serviceAccountId,
      status: command.enabled
        ? MACHINE_PRINCIPAL_STATUSES.ACTIVE
        : MACHINE_PRINCIPAL_STATUSES.DISABLED,
      operatorId: command.operatorId
    })
  }
}
