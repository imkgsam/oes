import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecordStatus
} from '../../domain/models/crm-records'
import { CrmAccountRepository } from '../../domain/repositories/crm-account.repository'
import { DeleteDraftLeadCommand } from './delete-draft-lead.command'

export interface DeleteDraftLeadResult {
  deleted: boolean
  crmAccountId: string
}

/** DeleteDraftLeadHandler hard-deletes only DRAFT + LEAD accounts and their cascaded source records. */
@Injectable()
@CommandHandler(DeleteDraftLeadCommand)
export class DeleteDraftLeadHandler implements ICommandHandler<DeleteDraftLeadCommand, DeleteDraftLeadResult> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository
  ) {}

  /** execute validates draft state before delegating the hard delete to persistence. */
  async execute(command: DeleteDraftLeadCommand): Promise<DeleteDraftLeadResult> {
    const account = await this.accountRepository.findAccountById(command.props.tenantId, command.props.crmAccountId)
    if (!account) {
      throw new NotFoundException('CrmAccount draft was not found')
    }
    if (account.recordStatus !== CrmAccountRecordStatus.DRAFT || account.lifecycleStage !== CrmAccountLifecycleStage.LEAD) {
      throw new BadRequestException('Only draft leads can be hard-deleted')
    }

    return {
      deleted: await this.accountRepository.deleteDraftAccount(command.props.tenantId, command.props.crmAccountId),
      crmAccountId: command.props.crmAccountId
    }
  }
}
