import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecord,
  CrmAccountRecordStatus
} from '../../domain/models/crm-records'
import { CrmAccountRepository } from '../../domain/repositories/crm-account.repository'
import { UpdateDraftLeadCommand } from './update-draft-lead.command'

export interface UpdateDraftLeadResult {
  account: CrmAccountRecord
}

/** UpdateDraftLeadHandler updates only unfinished DRAFT + LEAD accounts. */
@Injectable()
@CommandHandler(UpdateDraftLeadCommand)
export class UpdateDraftLeadHandler implements ICommandHandler<UpdateDraftLeadCommand, UpdateDraftLeadResult> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository
  ) {}

  /** execute rewrites draft lead fields without assigning an owner or binding TenantParty. */
  async execute(command: UpdateDraftLeadCommand): Promise<UpdateDraftLeadResult> {
    const account = await this.accountRepository.findAccountById(command.props.tenantId, command.props.crmAccountId)
    if (!account) {
      throw new NotFoundException('CrmAccount draft was not found')
    }
    if (account.recordStatus !== CrmAccountRecordStatus.DRAFT || account.lifecycleStage !== CrmAccountLifecycleStage.LEAD) {
      throw new BadRequestException('Only draft leads can be updated through UpdateDraftLead')
    }

    const saved = await this.accountRepository.saveAccount({
      ...account,
      tenantPartyId: null,
      recordStatus: CrmAccountRecordStatus.DRAFT,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      partyTypeHint: command.props.partyTypeHint,
      displayName: command.props.displayName,
      leadCompanyName: command.props.leadCompanyName ?? null,
      leadPersonName: command.props.leadPersonName ?? null,
      leadDomain: command.props.leadDomain ?? null,
      leadEmail: command.props.leadEmail ?? null,
      leadPhone: command.props.leadPhone ?? null,
      leadWhatsapp: command.props.leadWhatsapp ?? null,
      leadCountry: command.props.leadCountry ?? null,
      leadIdentifiers: command.props.leadIdentifiers ?? [],
      ownerAccountId: null,
      priority: command.props.priority,
      nextFollowUpAt: command.props.nextFollowUpAt ?? null,
      archivedAt: null
    })

    return { account: saved }
  }
}
