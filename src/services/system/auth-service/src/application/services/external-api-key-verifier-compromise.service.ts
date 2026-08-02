import { Injectable } from '@nestjs/common'
import {
  ExternalApiKeyVerifierPort,
  type CompromisedDisabledExternalApiKeyVerifierVersionStatus
} from '../ports/external-api-key-verifier.port'

export interface ExternalApiKeyVerifierCompromiseResult {
  incidentReference: string
  matchedCredentialCount: number
  newlyRevokedCredentialCount: number
  alreadyRevokedCredentialCount: number
  completedAt: Date
}

export interface ExternalApiKeyVerifierCompromiseStore {
  record(input: {
    verifierKeyVersion: string
    incidentReference: string
    occurredAt: Date
    processedAt: Date
    stateRevision: string
    workloadSubject: string
    workloadClientId: string
    requestId?: string
    traceId?: string
  }): Promise<ExternalApiKeyVerifierCompromiseResult>
}

/** Enforces provider-confirmed terminal compromise evidence before Auth mutates any credential row. */
@Injectable()
export class ExternalApiKeyVerifierCompromiseService {
  constructor(
    private readonly verifier: ExternalApiKeyVerifierPort | undefined,
    private readonly store: ExternalApiKeyVerifierCompromiseStore,
    private readonly now: () => Date = () => new Date()
  ) {}

  /** Records one exact verifier-version compromise only after provider status proves irreversible disablement. */
  async compromise(input: {
    verifierKeyVersion: string
    incidentReference: string
    occurredAt: Date
    workloadSubject: string
    workloadClientId: string
    requestId?: string
    traceId?: string
  }): Promise<ExternalApiKeyVerifierCompromiseResult> {
    const status = await this.verifier?.getStatus()
    const version = status?.versions.find(
      (candidate) => candidate.verifierKeyVersion === input.verifierKeyVersion
    )
    const compromised = isCompromisedDisabledVersion(version) ? version : undefined
    if (
      !compromised ||
      compromised.incidentReference !== input.incidentReference ||
      compromised.occurredAt.getTime() !== input.occurredAt.getTime() ||
      !compromised.stateRevision
    ) {
      throw new Error('EXTERNAL_API_KEY_VERIFIER_COMPROMISE_PRECONDITION_FAILED')
    }
    return this.store.record({
      verifierKeyVersion: input.verifierKeyVersion,
      incidentReference: input.incidentReference,
      occurredAt: input.occurredAt,
      processedAt: this.now(),
      stateRevision: compromised.stateRevision,
      workloadSubject: input.workloadSubject,
      workloadClientId: input.workloadClientId,
      requestId: input.requestId,
      traceId: input.traceId
    })
  }
}

/** Narrows one provider version response to the terminal compromised-disabled shape required by Auth. */
function isCompromisedDisabledVersion(
  value: unknown
): value is CompromisedDisabledExternalApiKeyVerifierVersionStatus {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as { state?: unknown }).state === 'COMPROMISED_DISABLED' &&
    typeof (value as { incidentReference?: unknown }).incidentReference === 'string' &&
    (value as { incidentReference?: string }).incidentReference!.length > 0 &&
    (value as { occurredAt?: unknown }).occurredAt instanceof Date &&
    typeof (value as { stateRevision?: unknown }).stateRevision === 'string' &&
    (value as { stateRevision?: string }).stateRevision!.length > 0
  )
}
