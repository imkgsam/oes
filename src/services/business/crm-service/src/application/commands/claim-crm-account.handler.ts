import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecord,
  CrmAccountRecordStatus
} from '../../domain/models/crm-records'
import { CrmAccountRepository } from '../../domain/repositories/crm-account.repository'
import { ClaimCrmAccountCommand } from './claim-crm-account.command'

export interface ClaimCrmAccountResult {
  account: CrmAccountRecord
}

/** ClaimCrmAccountHandler assigns the current operator to one ownerless Pool Lead or Prospect Customer. */
@Injectable()
@CommandHandler(ClaimCrmAccountCommand)
export class ClaimCrmAccountHandler implements ICommandHandler<ClaimCrmAccountCommand, ClaimCrmAccountResult> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository
  ) {}

  /** execute claims only ACTIVE ownerless Lead or Prospect Customer records. */
  async execute(command: ClaimCrmAccountCommand): Promise<ClaimCrmAccountResult> {
    const account = await this.accountRepository.findAccountById(command.props.tenantId, command.props.crmAccountId)
    if (!account) {
      throw new NotFoundException('CrmAccount was not found')
    }
    if (!isClaimablePoolRecord(account)) {
      throw new BadRequestException('Only ownerless active leads and prospect customers can be claimed')
    }

    const saved = await this.accountRepository.saveAccount({
      ...account,
      ownerAccountId: command.props.operatorAccountId
    })

    return { account: saved }
  }
}

/** isClaimablePoolRecord identifies minimal P1 Pool records. */
function isClaimablePoolRecord(account: CrmAccountRecord): boolean {
  return (
    account.recordStatus === CrmAccountRecordStatus.ACTIVE &&
    !account.ownerAccountId &&
    (account.lifecycleStage === CrmAccountLifecycleStage.LEAD ||
      account.lifecycleStage === CrmAccountLifecycleStage.PROSPECT_CUSTOMER)
  )
}
