import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecord,
  CrmAccountRecordStatus
} from '../../domain/models/crm-records'
import { CrmAccountRepository } from '../../domain/repositories/crm-account.repository'
import { UpdateCrmAccountIdentifiersCommand } from './update-crm-account-identifiers.command'

export interface UpdateCrmAccountIdentifiersResult {
  account: CrmAccountRecord
}

/** UpdateCrmAccountIdentifiersHandler owns CRM strong identifier mutation rules for active Leads and Prospect Customers. */
@Injectable()
@CommandHandler(UpdateCrmAccountIdentifiersCommand)
export class UpdateCrmAccountIdentifiersHandler implements ICommandHandler<
  UpdateCrmAccountIdentifiersCommand,
  UpdateCrmAccountIdentifiersResult
> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository
  ) {}

  /** execute replaces CRM-side identifier evidence unless a bound PC already carries identifier-based Party facts. */
  async execute(
    command: UpdateCrmAccountIdentifiersCommand
  ): Promise<UpdateCrmAccountIdentifiersResult> {
    const account = await this.accountRepository.findAccountById(
      command.props.tenantId,
      command.props.crmAccountId
    )
    if (!account) {
      throw new NotFoundException('CrmAccount was not found')
    }
    if (!isIdentifierEditableAccount(account)) {
      throw new BadRequestException('Only active leads and prospect customers can update identifiers')
    }
    if (isIdentifierBoundProspectCustomer(account)) {
      throw new BadRequestException('Identifier-bound prospect customer identifiers are immutable')
    }

    const saved = await this.accountRepository.saveAccount({
      ...account,
      leadIdentifiers: command.props.leadIdentifiers
    })

    return { account: saved }
  }
}

/** isIdentifierEditableAccount keeps identifier mutation limited to CRM Lead and Prospect Customer lifecycle states. */
function isIdentifierEditableAccount(account: CrmAccountRecord): boolean {
  return (
    account.recordStatus === CrmAccountRecordStatus.ACTIVE &&
    (account.lifecycleStage === CrmAccountLifecycleStage.LEAD ||
      account.lifecycleStage === CrmAccountLifecycleStage.PROSPECT_CUSTOMER)
  )
}

/** isIdentifierBoundProspectCustomer infers identifier-based Party binding from current CRM facts. */
function isIdentifierBoundProspectCustomer(account: CrmAccountRecord): boolean {
  return (
    account.lifecycleStage === CrmAccountLifecycleStage.PROSPECT_CUSTOMER &&
    Boolean(account.tenantPartyId) &&
    account.leadIdentifiers.length > 0
  )
}
