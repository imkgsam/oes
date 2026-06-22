import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecord,
  CrmAccountRecordStatus
} from '../../domain/models/crm-records'
import { CrmAccountRepository } from '../../domain/repositories/crm-account.repository'
import { ReleaseCrmAccountCommand } from './release-crm-account.command'

export interface ReleaseCrmAccountResult {
  account: CrmAccountRecord
}

/** ReleaseCrmAccountHandler clears ownership so an active Lead or Prospect Customer returns to Pool. */
@Injectable()
@CommandHandler(ReleaseCrmAccountCommand)
export class ReleaseCrmAccountHandler implements ICommandHandler<ReleaseCrmAccountCommand, ReleaseCrmAccountResult> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository
  ) {}

  /** execute releases only ownerful ACTIVE Lead or Prospect Customer records. */
  async execute(command: ReleaseCrmAccountCommand): Promise<ReleaseCrmAccountResult> {
    const account = await this.accountRepository.findAccountById(command.props.tenantId, command.props.crmAccountId)
    if (!account) {
      throw new NotFoundException('CrmAccount was not found')
    }
    if (!isReleasablePoolRecord(account)) {
      throw new BadRequestException('Only owned active leads and prospect customers can be released to Pool')
    }

    const saved = await this.accountRepository.saveAccount({
      ...account,
      ownerAccountId: null
    })

    return { account: saved }
  }
}

/** isReleasablePoolRecord identifies ownerful CRM records that may become Pool records. */
function isReleasablePoolRecord(account: CrmAccountRecord): boolean {
  return (
    account.recordStatus === CrmAccountRecordStatus.ACTIVE &&
    Boolean(account.ownerAccountId) &&
    (account.lifecycleStage === CrmAccountLifecycleStage.LEAD ||
      account.lifecycleStage === CrmAccountLifecycleStage.PROSPECT_CUSTOMER)
  )
}
