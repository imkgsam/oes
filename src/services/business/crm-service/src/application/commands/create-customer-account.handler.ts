import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { CustomerAccountRecord, CustomerStatus } from '../../domain/models/crm-records'
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository'
import { assertRequiredString, normalizeOptionalString, normalizeTags } from '../support/crm-assertions'
import { CreateCustomerAccountCommand } from './create-customer-account.command'

/** CreateCustomerAccountHandler creates one CRM customer-account shell without creating or mutating Party truth. */
@Injectable()
@CommandHandler(CreateCustomerAccountCommand)
export class CreateCustomerAccountHandler implements ICommandHandler<CreateCustomerAccountCommand, CustomerAccountRecord> {
  constructor(
    @Inject(TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CustomerAccountRepository
  ) {}

  async execute(command: CreateCustomerAccountCommand): Promise<CustomerAccountRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.displayName, 'displayName')

    const account: CustomerAccountRecord = {
      id: randomUUID(),
      customerAccountNo: await this.accountRepository.nextCustomerAccountNo(command.tenantId),
      tenantId: command.tenantId,
      displayName: command.displayName.trim(),
      status: CustomerStatus.ACTIVE_CUSTOMER,
      customerCategory: normalizeOptionalString(command.customerCategory) ?? null,
      tags: normalizeTags(command.tags),
      primaryBinding: null
    }

    return this.accountRepository.save(account)
  }
}
