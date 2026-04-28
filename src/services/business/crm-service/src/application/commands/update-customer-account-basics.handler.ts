import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { CRM_NOT_FOUND } from '../../common/errors/crm.errors'
import { CustomerAccountRecord } from '../../domain/models/crm-records'
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository'
import { assertRequiredString, normalizeOptionalString, normalizeTags } from '../support/crm-assertions'
import { UpdateCustomerAccountBasicsCommand } from './update-customer-account-basics.command'

/** UpdateCustomerAccountBasicsHandler updates phase 1 CRM account-shell basics without touching status or binding. */
@Injectable()
@CommandHandler(UpdateCustomerAccountBasicsCommand)
export class UpdateCustomerAccountBasicsHandler
  implements ICommandHandler<UpdateCustomerAccountBasicsCommand, CustomerAccountRecord>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CustomerAccountRepository
  ) {}

  async execute(command: UpdateCustomerAccountBasicsCommand): Promise<CustomerAccountRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.customerAccountId, 'customerAccountId')

    const existing = await this.accountRepository.findById(command.tenantId, command.customerAccountId)
    if (!existing) {
      throw ExceptionFactory.application(CRM_NOT_FOUND, {
        resource: 'customerAccount',
        customerAccountId: command.customerAccountId
      })
    }

    const displayName = normalizeOptionalString(command.displayName)
    if (displayName) {
      existing.displayName = displayName
    }

    if (command.customerCategory !== undefined) {
      existing.customerCategory = normalizeOptionalString(command.customerCategory) ?? null
    }

    if (command.tags !== undefined) {
      existing.tags = normalizeTags(command.tags)
    }

    return this.accountRepository.save(existing)
  }
}
