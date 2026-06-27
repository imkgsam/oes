import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { CrmLeadDuplicateResultType } from '../../domain/models/crm-records'
import {
  CrmAccountDuplicateCandidate,
  CrmAccountRepository
} from '../../domain/repositories/crm-account.repository'
import { normalizeLeadDomainEvidence } from '../support/lead-domain-normalization'
import { CheckLeadDuplicateQuery } from './check-lead-duplicate.query'

export interface CheckLeadDuplicateResult {
  resultType: CrmLeadDuplicateResultType
  candidates: CrmAccountDuplicateCandidate[]
}

/** CheckLeadDuplicateHandler classifies CRM-local duplicate candidates without consulting party-service. */
@Injectable()
@QueryHandler(CheckLeadDuplicateQuery)
export class CheckLeadDuplicateHandler implements IQueryHandler<
  CheckLeadDuplicateQuery,
  CheckLeadDuplicateResult
> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository
  ) {}

  /** execute returns the strongest duplicate state visible for the current operator. */
  async execute(query: CheckLeadDuplicateQuery): Promise<CheckLeadDuplicateResult> {
    const candidates = await this.accountRepository.findDuplicateCandidates({
      tenantId: query.props.tenantId,
      displayName: query.props.displayName,
      leadCompanyName: query.props.leadCompanyName,
      leadPersonName: query.props.leadPersonName,
      leadDomain: normalizeLeadDomainEvidence(query.props.leadDomain),
      leadEmail: query.props.leadEmail,
      leadPhone: query.props.leadPhone,
      leadWhatsapp: query.props.leadWhatsapp,
      leadCountry: query.props.leadCountry,
      leadIdentifiers: query.props.leadIdentifiers
    })

    return {
      resultType: classifyDuplicateResult(candidates, query.props.operatorAccountId),
      candidates
    }
  }
}

/** classifyDuplicateResult reduces candidate owner states into one user-facing duplicate result. */
function classifyDuplicateResult(
  candidates: CrmAccountDuplicateCandidate[],
  operatorAccountId: string
): CrmLeadDuplicateResultType {
  if (candidates.length === 0) {
    return CrmLeadDuplicateResultType.NO_DUPLICATE
  }

  const highConfidenceCandidates = candidates.filter((candidate) => candidate.confidence === 'HIGH')
  if (highConfidenceCandidates.length === 0) {
    return CrmLeadDuplicateResultType.POSSIBLE_DUPLICATE
  }

  if (
    highConfidenceCandidates.some(
      (candidate) => candidate.ownerAccountId && candidate.ownerAccountId !== operatorAccountId
    )
  ) {
    return CrmLeadDuplicateResultType.RESTRICTED_DUPLICATE
  }

  if (
    highConfidenceCandidates.some((candidate) => candidate.ownerAccountId === operatorAccountId)
  ) {
    return CrmLeadDuplicateResultType.OWNED_DUPLICATE
  }

  return CrmLeadDuplicateResultType.CLAIMABLE_EXISTING
}
