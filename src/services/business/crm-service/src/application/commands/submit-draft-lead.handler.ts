import { randomUUID } from 'node:crypto'
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecord,
  CrmAccountRecordStatus,
  CrmLeadAssignmentIntent,
  CrmLeadCreateResultType,
  CrmLeadDuplicateResultType,
  CrmSourceRecord
} from '../../domain/models/crm-records'
import { CrmAccountRepository } from '../../domain/repositories/crm-account.repository'
import {
  CheckLeadDuplicateHandler,
  CheckLeadDuplicateResult
} from '../queries/check-lead-duplicate.handler'
import { CheckLeadDuplicateQuery } from '../queries/check-lead-duplicate.query'
import { SubmitDraftLeadCommand } from './submit-draft-lead.command'

export interface SubmitDraftLeadResult {
  resultType: CrmLeadCreateResultType
  account: CrmAccountRecord | null
  duplicateResult: CheckLeadDuplicateResult
}

/** SubmitDraftLeadHandler promotes drafts after formal duplicate checks while preserving source history. */
@Injectable()
@CommandHandler(SubmitDraftLeadCommand)
export class SubmitDraftLeadHandler implements ICommandHandler<
  SubmitDraftLeadCommand,
  SubmitDraftLeadResult
> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository,
    private readonly checkLeadDuplicateHandler: CheckLeadDuplicateHandler
  ) {}

  /** execute turns a draft into an active lead without duplicating existing source records. */
  async execute(command: SubmitDraftLeadCommand): Promise<SubmitDraftLeadResult> {
    const account = await this.accountRepository.findAccountById(
      command.props.tenantId,
      command.props.crmAccountId
    )
    if (!account) {
      throw new NotFoundException('CrmAccount draft was not found')
    }
    if (
      account.recordStatus !== CrmAccountRecordStatus.DRAFT ||
      account.lifecycleStage !== CrmAccountLifecycleStage.LEAD
    ) {
      throw new BadRequestException('Only draft leads can be submitted')
    }

    const profileItems = await this.accountRepository.listAccountProfileItems(
      account.tenantId,
      account.id
    )
    const duplicateResult = await this.checkLeadDuplicateHandler.execute(
      new CheckLeadDuplicateQuery({
        tenantId: account.tenantId,
        operatorAccountId: command.props.operatorAccountId,
        displayName: account.displayName,
        leadLegalName: account.leadLegalName,
        leadCompanyName: account.leadCompanyName,
        leadPersonName: account.leadPersonName,
        leadDomain: account.leadDomain,
        leadEmail: account.leadEmail,
        leadPhone: account.leadPhone,
        leadWhatsapp: account.leadWhatsapp,
        leadCountry: account.leadCountry,
        leadIdentifiers: account.leadIdentifiers,
        profileItems
      })
    )
    const blockedResult = toBlockedCreateResult(duplicateResult.resultType)

    if (blockedResult) {
      return {
        resultType: blockedResult,
        account: null,
        duplicateResult
      }
    }

    const existingSources = await this.accountRepository.listSourceRecords(
      account.tenantId,
      account.id
    )
    if (existingSources.length === 0 && command.props.source) {
      await this.accountRepository.addSourceRecord(
        buildSourceRecord(account, command.props.source, command.props.operatorAccountId)
      )
    } else if (existingSources.length === 0) {
      throw new BadRequestException('Submitting an active lead requires at least one source record')
    }

    const saved = await this.accountRepository.saveAccount({
      ...account,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      ownerAccountId: resolveSubmittedLeadOwnerAccountId(
        command.props.assignmentIntent,
        command.props.operatorAccountId
      ),
      archivedAt: null
    })

    return {
      resultType: CrmLeadCreateResultType.CREATED,
      account: { ...saved, profileItems },
      duplicateResult
    }
  }
}

/** resolveSubmittedLeadOwnerAccountId keeps manual draft submit owned unless the caller targets Pool. */
function resolveSubmittedLeadOwnerAccountId(
  assignmentIntent: CrmLeadAssignmentIntent | undefined,
  operatorAccountId: string
): string | null {
  if (assignmentIntent === CrmLeadAssignmentIntent.POOL) {
    return null
  }

  return operatorAccountId
}

/** toBlockedCreateResult maps duplicate result states into submit result states. */
function toBlockedCreateResult(
  resultType: CrmLeadDuplicateResultType
): CrmLeadCreateResultType | null {
  if (resultType === CrmLeadDuplicateResultType.CLAIMABLE_EXISTING) {
    return CrmLeadCreateResultType.BLOCKED_BY_CLAIMABLE_EXISTING
  }
  if (resultType === CrmLeadDuplicateResultType.OWNED_DUPLICATE) {
    return CrmLeadCreateResultType.BLOCKED_BY_OWNED_DUPLICATE
  }
  if (resultType === CrmLeadDuplicateResultType.RESTRICTED_DUPLICATE) {
    return CrmLeadCreateResultType.BLOCKED_BY_RESTRICTED_DUPLICATE
  }

  return null
}

/** buildSourceRecord creates one source record only when a draft has no existing source history. */
function buildSourceRecord(
  account: CrmAccountRecord,
  source: NonNullable<SubmitDraftLeadCommand['props']['source']>,
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
