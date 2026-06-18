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

/** ArchiveCrmAccountHandler soft-archives active leads and prospect customers without changing their lifecycle stage. */
@Injectable()
@CommandHandler(ArchiveCrmAccountCommand)
export class ArchiveCrmAccountHandler implements ICommandHandler<ArchiveCrmAccountCommand, ArchiveCrmAccountResult> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository
  ) {}

  /** execute marks a CRM account archived while preserving its sales lifecycle and audit-readable history. */
  async execute(command: ArchiveCrmAccountCommand): Promise<ArchiveCrmAccountResult> {
    const account = await this.accountRepository.findAccountById(
      command.props.tenantId,
      command.props.crmAccountId
    )

    if (!account) {
      throw new NotFoundException('CRM account not found')
    }

    if (account.recordStatus === CrmAccountRecordStatus.ARCHIVED) {
      return { account }
    }

    if (
      account.lifecycleStage !== CrmAccountLifecycleStage.LEAD &&
      account.lifecycleStage !== CrmAccountLifecycleStage.PROSPECT_CUSTOMER
    ) {
      throw new BadRequestException('Only leads and prospect customers can be archived in CRM P1')
    }

    const archived: CrmAccountRecord = {
      ...account,
      recordStatus: CrmAccountRecordStatus.ARCHIVED,
      archivedAt: new Date()
    }

    return {
      account: await this.accountRepository.saveAccount(archived)
    }
  }
}
