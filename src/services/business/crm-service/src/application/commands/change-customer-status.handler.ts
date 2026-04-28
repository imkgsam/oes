import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { CRM_NOT_FOUND } from '../../common/errors/crm.errors'
import { CustomerAccountRecord } from '../../domain/models/crm-records'
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository'
import { assertKnownCustomerStatus, assertRequiredString } from '../support/crm-assertions'
import { ChangeCustomerStatusCommand } from './change-customer-status.command'

/** ChangeCustomerStatusHandler updates only the CRM customer status while keeping binding ownership unchanged. */
@Injectable()
@CommandHandler(ChangeCustomerStatusCommand)
export class ChangeCustomerStatusHandler
  implements ICommandHandler<ChangeCustomerStatusCommand, CustomerAccountRecord>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CustomerAccountRepository
  ) {}

  async execute(command: ChangeCustomerStatusCommand): Promise<CustomerAccountRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.customerAccountId, 'customerAccountId')
    assertKnownCustomerStatus(command.targetStatus)

    const account = await this.accountRepository.findById(command.tenantId, command.customerAccountId)
    if (!account) {
      throw ExceptionFactory.application(CRM_NOT_FOUND, {
        resource: 'customerAccount',
        customerAccountId: command.customerAccountId
      })
    }

    account.status = command.targetStatus
    return this.accountRepository.save(account)
  }
}
