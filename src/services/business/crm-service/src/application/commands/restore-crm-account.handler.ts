import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecord,
  CrmAccountRecordStatus
} from '../../domain/models/crm-records'
import { CrmAccountRepository } from '../../domain/repositories/crm-account.repository'
import { RestoreCrmAccountCommand } from './restore-crm-account.command'

export interface RestoreCrmAccountResult {
  account: CrmAccountRecord
}

/** RestoreCrmAccountHandler reactivates archived P1 leads and prospect customers without changing lifecycle stage. */
@Injectable()
@CommandHandler(RestoreCrmAccountCommand)
export class RestoreCrmAccountHandler implements ICommandHandler<RestoreCrmAccountCommand, RestoreCrmAccountResult> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository
  ) {}

  /** execute restores a soft-archived CRM account into the default active list while preserving history. */
  async execute(command: RestoreCrmAccountCommand): Promise<RestoreCrmAccountResult> {
    const account = await this.accountRepository.findAccountById(
      command.props.tenantId,
      command.props.crmAccountId
    )

    if (!account) {
      throw new NotFoundException('CRM account not found')
    }

    if (account.recordStatus === CrmAccountRecordStatus.ACTIVE) {
      return { account }
    }

    if (
      account.lifecycleStage !== CrmAccountLifecycleStage.LEAD &&
      account.lifecycleStage !== CrmAccountLifecycleStage.PROSPECT_CUSTOMER
    ) {
      throw new BadRequestException('Only leads and prospect customers can be restored in CRM P1')
    }

    const restored: CrmAccountRecord = {
      ...account,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      archivedAt: null
    }

    return {
      account: await this.accountRepository.saveAccount(restored)
    }
  }
}
