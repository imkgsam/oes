import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
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
import { CreateLeadCommand } from './create-lead.command'

export interface CreateLeadResult {
  resultType: CrmLeadCreateResultType
  account: CrmAccountRecord | null
  duplicateResult: CheckLeadDuplicateResult
}

/** CreateLeadHandler creates active lead accounts after CRM-local duplicate blocking checks. */
@Injectable()
@CommandHandler(CreateLeadCommand)
export class CreateLeadHandler implements ICommandHandler<CreateLeadCommand, CreateLeadResult> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository,
    private readonly checkLeadDuplicateHandler: CheckLeadDuplicateHandler
  ) {}

  /** execute persists an ACTIVE + LEAD account and its primary source when duplicate policy allows it. */
  async execute(command: CreateLeadCommand): Promise<CreateLeadResult> {
    const duplicateResult = await this.checkLeadDuplicateHandler.execute(
      new CheckLeadDuplicateQuery({
        tenantId: command.props.tenantId,
        operatorAccountId: command.props.operatorAccountId,
        displayName: command.props.displayName,
        leadCompanyName: command.props.leadCompanyName,
        leadPersonName: command.props.leadPersonName,
        leadDomain: command.props.leadDomain,
        leadEmail: command.props.leadEmail,
        leadPhone: command.props.leadPhone,
        leadWhatsapp: command.props.leadWhatsapp,
        leadCountry: command.props.leadCountry,
        leadIdentifiers: command.props.leadIdentifiers ?? []
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

    const ownerAccountId = resolveLeadOwnerAccountId(
      command.props.ownerAccountId,
      command.props.assignmentIntent,
      command.props.operatorAccountId
    )

    const account: CrmAccountRecord = {
      id: randomUUID(),
      tenantId: command.props.tenantId,
      tenantPartyId: null,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
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
      ownerAccountId,
      priority: command.props.priority,
      lastActivityAt: null,
      nextFollowUpAt: command.props.nextFollowUpAt ?? null,
      createdBy: command.props.operatorAccountId
    }
    const source: CrmSourceRecord = {
      id: randomUUID(),
      tenantId: command.props.tenantId,
      crmAccountId: account.id,
      sourceType: command.props.source.sourceType,
      sourceName: command.props.source.sourceName ?? null,
      capturedAt: command.props.source.capturedAt ?? new Date(),
      capturedByAccountId: command.props.source.capturedByAccountId ?? command.props.operatorAccountId,
      externalReference: command.props.source.externalReference ?? null,
      rawPayload: command.props.source.rawPayload ?? null,
      note: command.props.source.note ?? null,
      isPrimary: true
    }

    const saved = await this.accountRepository.saveAccount(account)
    await this.accountRepository.addSourceRecord(source)

    return {
      resultType: CrmLeadCreateResultType.CREATED,
      account: saved,
      duplicateResult
    }
  }
}

/** resolveLeadOwnerAccountId applies CRM entry-context ownership instead of treating Pool as the default. */
function resolveLeadOwnerAccountId(
  explicitOwnerAccountId: string | null | undefined,
  assignmentIntent: CrmLeadAssignmentIntent | undefined,
  operatorAccountId: string
): string | null {
  if (explicitOwnerAccountId !== undefined) {
    return explicitOwnerAccountId
  }
  if (assignmentIntent === CrmLeadAssignmentIntent.POOL) {
    return null
  }

  return operatorAccountId
}

/** toBlockedCreateResult maps duplicate result states into create result states. */
function toBlockedCreateResult(resultType: CrmLeadDuplicateResultType): CrmLeadCreateResultType | null {
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
