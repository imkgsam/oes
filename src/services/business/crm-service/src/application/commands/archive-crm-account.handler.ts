import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecord,
  CrmAccountRecordStatus
} from '../../domain/models/crm-records'
import { CrmAccountRepository } from '../../domain/repositories/crm-account.repository'
import { ArchiveCrmAccountCommand } from './archive-crm-account.command'

export interface ArchiveCrmAccountResult {
  account: CrmAccountRecord
}

/** ArchiveCrmAccountHandler moves active Lead or Prospect Customer records out of active follow-up with a required reason. */
@Injectable()
@CommandHandler(ArchiveCrmAccountCommand)
export class ArchiveCrmAccountHandler implements ICommandHandler<ArchiveCrmAccountCommand, ArchiveCrmAccountResult> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository
  ) {}

  /** execute archives only active Lead or Prospect Customer records and preserves ownership/lifecycle facts. */
  async execute(command: ArchiveCrmAccountCommand): Promise<ArchiveCrmAccountResult> {
    const account = await this.accountRepository.findAccountById(command.props.tenantId, command.props.crmAccountId)
    if (!account) {
      throw new NotFoundException('CrmAccount was not found')
    }
    if (!isArchivable(account)) {
      throw new BadRequestException('Only active leads and prospect customers can be archived')
    }

    const saved = await this.accountRepository.saveAccount({
      ...account,
      recordStatus: CrmAccountRecordStatus.ARCHIVED,
      archivedAt: new Date(),
      archiveReason: command.props.archiveReason
    })

    return { account: saved }
  }
}

/** isArchivable identifies CRM records included in the Lead / Prospect Customer archive-reason slice. */
function isArchivable(account: CrmAccountRecord): boolean {
  return (
    account.recordStatus === CrmAccountRecordStatus.ACTIVE &&
    (account.lifecycleStage === CrmAccountLifecycleStage.LEAD ||
      account.lifecycleStage === CrmAccountLifecycleStage.PROSPECT_CUSTOMER)
  )
}
