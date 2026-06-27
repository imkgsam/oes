import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecord,
  CrmAccountRecordStatus,
  CrmSourceRecord
} from '../../domain/models/crm-records'
import { CrmAccountRepository } from '../../domain/repositories/crm-account.repository'
import { normalizeLeadDomainEvidence } from '../support/lead-domain-normalization'
import { CreateDraftLeadCommand } from './create-draft-lead.command'

export interface CreateDraftLeadResult {
  account: CrmAccountRecord
}

/** CreateDraftLeadHandler persists a DRAFT + LEAD account with optional source evidence. */
@Injectable()
@CommandHandler(CreateDraftLeadCommand)
export class CreateDraftLeadHandler implements ICommandHandler<
  CreateDraftLeadCommand,
  CreateDraftLeadResult
> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository
  ) {}

  /** execute creates a draft lead owned by its creator but not assigned to a sales owner. */
  async execute(command: CreateDraftLeadCommand): Promise<CreateDraftLeadResult> {
    const account: CrmAccountRecord = {
      id: randomUUID(),
      tenantId: command.props.tenantId,
      tenantPartyId: null,
      recordStatus: CrmAccountRecordStatus.DRAFT,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      partyTypeHint: command.props.partyTypeHint,
      displayName: command.props.displayName,
      leadCompanyName: command.props.leadCompanyName ?? null,
      leadPersonName: command.props.leadPersonName ?? null,
      leadDomain: normalizeLeadDomainEvidence(command.props.leadDomain),
      leadEmail: command.props.leadEmail ?? null,
      leadPhone: command.props.leadPhone ?? null,
      leadWhatsapp: command.props.leadWhatsapp ?? null,
      leadCountry: command.props.leadCountry ?? null,
      leadIdentifiers: command.props.leadIdentifiers ?? [],
      ownerAccountId: null,
      priority: command.props.priority,
      lastActivityAt: null,
      nextFollowUpAt: command.props.nextFollowUpAt ?? null,
      createdBy: command.props.operatorAccountId,
      archivedAt: null
    }

    const saved = await this.accountRepository.saveAccount(account)
    if (command.props.source) {
      await this.accountRepository.addSourceRecord(
        buildSourceRecord(saved, command.props.source, command.props.operatorAccountId)
      )
    }

    return { account: saved }
  }
}

/** buildSourceRecord turns optional draft source evidence into a CRM source record. */
function buildSourceRecord(
  account: CrmAccountRecord,
  source: NonNullable<CreateDraftLeadCommand['props']['source']>,
  operatorAccountId: string
): CrmSourceRecord {
  return {
    id: randomUUID(),
    tenantId: account.tenantId,
    crmAccountId: account.id,
    sourceType: source.sourceType,
    sourceName: source.sourceName ?? null,
    capturedAt: source.capturedAt ?? new Date(),
    capturedByAccountId: source.capturedByAccountId ?? operatorAccountId,
    externalReference: source.externalReference ?? null,
    rawPayload: source.rawPayload ?? null,
    note: source.note ?? null,
    isPrimary: true
  }
}
