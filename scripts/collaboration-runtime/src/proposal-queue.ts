import { canonicalJson, objectFingerprint, sha256 } from './canonical.ts'
import { fail } from './errors.ts'

export const PROPOSAL_RECEIPTS = [
  'TRANSPORT_ACCEPTED',
  'UD_ADMITTED',
  'PROCESSING',
  'SUPERSEDED',
  'CANCELLED',
  'TERMINAL'
] as const
export type ProposalReceiptKind = (typeof PROPOSAL_RECEIPTS)[number]

export interface ProposalEnvelope {
  schemaVersion: 1
  kind: 'OES_UD_PROPOSAL'
  proposalId: string
  proposalFingerprint: string
  scope: string
  source: { role: string; taskId: string }
  returnTaskId: string
  supersedesProposalId: string | null
}

export interface ProposalTransportEvent {
  schemaVersion: 1
  kind: 'PROPOSAL_TRANSPORT'
  envelope: ProposalEnvelope
}

export interface ProposalReceiptEvent {
  schemaVersion: 1
  kind: 'PROPOSAL_RECEIPT'
  proposalId: string
  proposalFingerprint: string
  sourceTaskId: string
  returnTaskId: string
  receipt: ProposalReceiptKind
  terminalStatus: string | null
  terminalResultDeliveryKey: string | null
  safeBoundary: boolean
}

export interface ProposalTerminalResult {
  schemaVersion: 1
  kind: 'OES_UD_PROPOSAL_TERMINAL_RESULT'
  resultFingerprint: string
  proposalId: string
  proposalFingerprint: string
  returnTaskId: string
  terminalStatus: string
  payload: unknown
  payloadFingerprint: string
}

export interface ProposalTerminalResultEvent {
  schemaVersion: 1
  kind: 'PROPOSAL_TERMINAL_RESULT'
  result: ProposalTerminalResult
}

export interface ProposalTerminalDelivery {
  schemaVersion: 1
  kind: 'OES_UD_PROPOSAL_TERMINAL_DELIVERY'
  deliveryFingerprint: string
  proposalId: string
  proposalFingerprint: string
  returnTaskId: string
  terminalStatus: string
  resultFingerprint: string
  payloadFingerprint: string
  outcome: 'DELIVERED'
}

export interface ProposalTerminalDeliveryEvent {
  schemaVersion: 1
  kind: 'PROPOSAL_TERMINAL_DELIVERY'
  delivery: ProposalTerminalDelivery
}

export type ProposalHistoryEvent =
  | ProposalTransportEvent
  | ProposalReceiptEvent
  | ProposalTerminalResultEvent
  | ProposalTerminalDeliveryEvent
export type ProposalQueueState =
  | 'DELIVERED'
  | 'ADMITTED'
  | 'PROCESSING'
  | 'SUPERSEDED'
  | 'CANCELLED'
  | 'TERMINAL'

export interface ProposalQueueItem {
  proposalId: string
  scope: string
  sourceRole: string
  sourceTaskId: string
  returnTaskId: string
  arrivalOrder: number
  state: ProposalQueueState
  terminalStatus: string | null
  terminalResultDeliveryKey: string | null
}

export interface ProposalQueueView {
  status: 'QUEUE_VISIBLE' | 'QUEUE_NOT_EXPOSED_TO_BOUNDED_HELPER'
  items: Array<
    Pick<ProposalQueueItem, 'proposalId' | 'scope' | 'sourceRole' | 'arrivalOrder' | 'state'>
  >
  nextAdmissibleProposalId: string | null
}

interface MutableProposal extends ProposalQueueItem {
  envelope: ProposalEnvelope
}

/** Validates the immutable identity and exact source/return binding of one Proposal. */
function validateEnvelope(envelope: ProposalEnvelope): void {
  if (!envelope || typeof envelope !== 'object') fail('PROPOSAL_ENVELOPE_REQUIRED', 'NONE')
  if (envelope.schemaVersion !== 1 || envelope.kind !== 'OES_UD_PROPOSAL')
    fail('PROPOSAL_ENVELOPE_KIND_INVALID', String(envelope.proposalId))
  if (
    typeof envelope.proposalId !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u.test(envelope.proposalId)
  )
    fail('PROPOSAL_ID_INVALID', String(envelope.proposalId))
  if (
    typeof envelope.proposalFingerprint !== 'string' ||
    !/^[0-9a-f]{64}$/u.test(envelope.proposalFingerprint)
  )
    fail('PROPOSAL_FINGERPRINT_INVALID', envelope.proposalId)
  if (typeof envelope.scope !== 'string' || !envelope.scope.trim() || envelope.scope.length > 240)
    fail('PROPOSAL_SCOPE_INVALID', envelope.proposalId)
  if (
    !envelope.source ||
    typeof envelope.source.role !== 'string' ||
    envelope.source.role !== 'DA' ||
    typeof envelope.source.taskId !== 'string' ||
    !envelope.source.taskId.trim() ||
    typeof envelope.returnTaskId !== 'string' ||
    !envelope.returnTaskId.trim()
  )
    fail('PROPOSAL_EXACT_BINDING_REQUIRED', envelope.proposalId)
  if (envelope.supersedesProposalId === envelope.proposalId)
    fail('PROPOSAL_SELF_SUPERSEDE', envelope.proposalId)
}

/** Derives the only queue view from exact UD native history without persisting another queue. */
export function deriveProposalQueue(history: ProposalHistoryEvent[]): ProposalQueueItem[] {
  if (!Array.isArray(history)) fail('PROPOSAL_HISTORY_ARRAY_REQUIRED', typeof history)
  const proposals = new Map<string, MutableProposal>()
  const terminalResults = new Map<string, ProposalTerminalResult>()
  const terminalDeliveries = new Map<string, ProposalTerminalDelivery>()
  const ordered: MutableProposal[] = []
  for (const event of history) {
    if (!event || typeof event !== 'object') fail('PROPOSAL_HISTORY_EVENT_INVALID', String(event))
    if (event.schemaVersion !== 1)
      fail('PROPOSAL_HISTORY_VERSION_INVALID', String(event.schemaVersion))
    if (event.kind === 'PROPOSAL_TRANSPORT') {
      validateEnvelope(event.envelope)
      const existing = proposals.get(event.envelope.proposalId)
      if (existing) {
        if (canonicalJson(existing.envelope) !== canonicalJson(event.envelope))
          fail('PROPOSAL_ID_REUSED_WITH_CHANGED_CONTENT', event.envelope.proposalId)
        continue
      }
      if (event.envelope.supersedesProposalId) {
        const superseded = proposals.get(event.envelope.supersedesProposalId)
        if (!superseded)
          fail('PROPOSAL_SUPERSEDE_TARGET_ABSENT', event.envelope.supersedesProposalId)
        if (!['DELIVERED'].includes(superseded.state))
          fail('PROPOSAL_SUPERSEDE_TARGET_ALREADY_STARTED', superseded.proposalId)
        if (superseded.envelope.proposalFingerprint === event.envelope.proposalFingerprint)
          fail('PROPOSAL_SUPERSEDE_FINGERPRINT_UNCHANGED', event.envelope.proposalId)
        superseded.state = 'SUPERSEDED'
      }
      const item: MutableProposal = {
        envelope: structuredClone(event.envelope),
        proposalId: event.envelope.proposalId,
        scope: event.envelope.scope,
        sourceRole: event.envelope.source.role,
        sourceTaskId: event.envelope.source.taskId,
        returnTaskId: event.envelope.returnTaskId,
        arrivalOrder: ordered.length + 1,
        state: 'DELIVERED',
        terminalStatus: null,
        terminalResultDeliveryKey: null
      }
      proposals.set(item.proposalId, item)
      ordered.push(item)
      continue
    }

    if (event.kind === 'PROPOSAL_TERMINAL_RESULT') {
      const result = event.result
      if (
        !result ||
        result.schemaVersion !== 1 ||
        result.kind !== 'OES_UD_PROPOSAL_TERMINAL_RESULT'
      )
        fail('PROPOSAL_TERMINAL_RESULT_KIND_INVALID', String(result?.proposalId))
      const item = proposals.get(result.proposalId)
      if (!item) fail('PROPOSAL_TERMINAL_RESULT_WITHOUT_TRANSPORT', result.proposalId)
      if (
        result.proposalFingerprint !== item.envelope.proposalFingerprint ||
        result.returnTaskId !== item.returnTaskId ||
        typeof result.terminalStatus !== 'string' ||
        !result.terminalStatus.trim()
      )
        fail('PROPOSAL_TERMINAL_RESULT_BINDING_MISMATCH', result.proposalId)
      if (sha256(canonicalJson(result.payload)) !== result.payloadFingerprint)
        fail('PROPOSAL_TERMINAL_RESULT_PAYLOAD_DRIFT', result.proposalId)
      if (
        objectFingerprint(result as unknown as Record<string, unknown>, 'resultFingerprint') !==
        result.resultFingerprint
      )
        fail('PROPOSAL_TERMINAL_RESULT_FINGERPRINT_MISMATCH', result.proposalId)
      const existing = terminalResults.get(result.proposalId)
      if (existing && canonicalJson(existing) !== canonicalJson(result))
        fail('PROPOSAL_TERMINAL_RESULT_REPLAY_MISMATCH', result.proposalId)
      terminalResults.set(result.proposalId, structuredClone(result))
      continue
    }

    if (event.kind === 'PROPOSAL_TERMINAL_DELIVERY') {
      const delivery = event.delivery
      if (
        !delivery ||
        delivery.schemaVersion !== 1 ||
        delivery.kind !== 'OES_UD_PROPOSAL_TERMINAL_DELIVERY' ||
        delivery.outcome !== 'DELIVERED'
      )
        fail('PROPOSAL_TERMINAL_DELIVERY_KIND_INVALID', String(delivery?.proposalId))
      const item = proposals.get(delivery.proposalId)
      const result = terminalResults.get(delivery.proposalId)
      if (!item || !result) fail('PROPOSAL_TERMINAL_DELIVERY_WITHOUT_RESULT', delivery.proposalId)
      if (
        delivery.proposalFingerprint !== item.envelope.proposalFingerprint ||
        delivery.returnTaskId !== item.returnTaskId ||
        delivery.terminalStatus !== result.terminalStatus ||
        delivery.resultFingerprint !== result.resultFingerprint ||
        delivery.payloadFingerprint !== result.payloadFingerprint
      )
        fail('PROPOSAL_TERMINAL_DELIVERY_BINDING_MISMATCH', delivery.proposalId)
      if (
        objectFingerprint(delivery as unknown as Record<string, unknown>, 'deliveryFingerprint') !==
        delivery.deliveryFingerprint
      )
        fail('PROPOSAL_TERMINAL_DELIVERY_FINGERPRINT_MISMATCH', delivery.proposalId)
      const existing = terminalDeliveries.get(delivery.proposalId)
      if (existing && canonicalJson(existing) !== canonicalJson(delivery))
        fail('PROPOSAL_TERMINAL_DELIVERY_REPLAY_MISMATCH', delivery.proposalId)
      terminalDeliveries.set(delivery.proposalId, structuredClone(delivery))
      continue
    }

    if (event.kind !== 'PROPOSAL_RECEIPT')
      fail('PROPOSAL_HISTORY_KIND_INVALID', String((event as { kind?: unknown }).kind))
    if (!PROPOSAL_RECEIPTS.includes(event.receipt))
      fail('PROPOSAL_RECEIPT_KIND_INVALID', String(event.receipt))
    if (
      typeof event.proposalId !== 'string' ||
      typeof event.proposalFingerprint !== 'string' ||
      typeof event.sourceTaskId !== 'string' ||
      typeof event.returnTaskId !== 'string' ||
      typeof event.safeBoundary !== 'boolean'
    )
      fail('PROPOSAL_RECEIPT_FIELDS_INVALID', String(event.proposalId))

    const item = proposals.get(event.proposalId)
    if (!item) fail('PROPOSAL_RECEIPT_WITHOUT_TRANSPORT', event.proposalId)
    if (
      item.envelope.proposalFingerprint !== event.proposalFingerprint ||
      item.sourceTaskId !== event.sourceTaskId ||
      item.returnTaskId !== event.returnTaskId
    )
      fail('PROPOSAL_RECEIPT_BINDING_MISMATCH', event.proposalId)

    if (event.receipt === 'TRANSPORT_ACCEPTED') {
      continue
    }
    if (event.receipt === 'SUPERSEDED') {
      if (item.state !== 'SUPERSEDED') fail('PROPOSAL_SUPERSEDE_RECEIPT_MISMATCH', item.proposalId)
      continue
    }
    if (event.receipt === 'UD_ADMITTED') {
      if (['ADMITTED', 'PROCESSING', 'TERMINAL', 'CANCELLED'].includes(item.state)) continue
      if (item.state !== 'DELIVERED') fail('PROPOSAL_ADMISSION_STATE_INVALID', item.proposalId)
      const active = ordered.find((candidate) =>
        ['ADMITTED', 'PROCESSING'].includes(candidate.state)
      )
      if (active) fail('UD_CRITICAL_SECTION_BUSY', active.proposalId)
      const next = ordered.find((candidate) => candidate.state === 'DELIVERED')
      if (next?.proposalId !== item.proposalId)
        fail(
          'PROPOSAL_FIFO_ADMISSION_VIOLATION',
          `${item.proposalId}:${next?.proposalId ?? 'NONE'}`
        )
      item.state = 'ADMITTED'
      continue
    }
    if (event.receipt === 'PROCESSING') {
      if (['PROCESSING', 'TERMINAL', 'CANCELLED'].includes(item.state)) continue
      if (item.state !== 'ADMITTED') fail('PROPOSAL_PROCESSING_STATE_INVALID', item.proposalId)
      item.state = 'PROCESSING'
      continue
    }
    if (event.receipt === 'CANCELLED') {
      if (item.state === 'CANCELLED') continue
      if (['TERMINAL', 'SUPERSEDED'].includes(item.state))
        fail('PROPOSAL_CANCEL_STATE_INVALID', item.proposalId)
      if (['ADMITTED', 'PROCESSING'].includes(item.state) && !event.safeBoundary)
        fail('PROPOSAL_ACTIVE_CANCEL_REQUIRES_SAFE_BOUNDARY', item.proposalId)
      item.state = 'CANCELLED'
      continue
    }
    if (event.receipt === 'TERMINAL') {
      if (item.state === 'TERMINAL') {
        if (
          item.terminalStatus !== event.terminalStatus ||
          item.terminalResultDeliveryKey !== event.terminalResultDeliveryKey
        )
          fail('PROPOSAL_TERMINAL_REPLAY_MISMATCH', item.proposalId)
        continue
      }
      if (!['ADMITTED', 'PROCESSING'].includes(item.state))
        fail('PROPOSAL_TERMINAL_STATE_INVALID', item.proposalId)
      if (
        typeof event.terminalStatus !== 'string' ||
        !event.terminalStatus.trim() ||
        typeof event.terminalResultDeliveryKey !== 'string' ||
        !event.terminalResultDeliveryKey.trim()
      )
        fail('PROPOSAL_TERMINAL_EXACT_RETURN_UNPROVEN', item.proposalId)
      const result = terminalResults.get(item.proposalId)
      const delivery = terminalDeliveries.get(item.proposalId)
      if (
        !result ||
        !delivery ||
        result.terminalStatus !== event.terminalStatus ||
        delivery.terminalStatus !== event.terminalStatus ||
        delivery.deliveryFingerprint !== event.terminalResultDeliveryKey ||
        delivery.returnTaskId !== item.returnTaskId
      )
        fail('PROPOSAL_TERMINAL_EXACT_RETURN_UNPROVEN', item.proposalId)
      item.state = 'TERMINAL'
      item.terminalStatus = event.terminalStatus
      item.terminalResultDeliveryKey = event.terminalResultDeliveryKey
    }
  }
  return ordered.map(({ envelope: _envelope, ...item }) => structuredClone(item))
}

/** Projects a bounded on-demand queue view for exact UD or a visible project role. */
export function proposalQueueView(
  history: ProposalHistoryEvent[],
  audience: 'EXACT_UD' | 'PROJECT_ROLE' | 'BOUNDED_HELPER'
): ProposalQueueView {
  if (!['EXACT_UD', 'PROJECT_ROLE', 'BOUNDED_HELPER'].includes(audience))
    fail('PROPOSAL_QUEUE_AUDIENCE_INVALID', String(audience))
  if (audience === 'BOUNDED_HELPER')
    return {
      status: 'QUEUE_NOT_EXPOSED_TO_BOUNDED_HELPER',
      items: [],
      nextAdmissibleProposalId: null
    }
  const queue = deriveProposalQueue(history)
  const visible =
    audience === 'EXACT_UD'
      ? queue
      : queue.filter((item) => !['TERMINAL', 'CANCELLED'].includes(item.state))
  return {
    status: 'QUEUE_VISIBLE',
    items: visible.map(({ proposalId, scope, sourceRole, arrivalOrder, state }) => ({
      proposalId,
      scope,
      sourceRole,
      arrivalOrder,
      state
    })),
    nextAdmissibleProposalId: queue.some((item) => ['ADMITTED', 'PROCESSING'].includes(item.state))
      ? null
      : (queue.find((item) => item.state === 'DELIVERED')?.proposalId ?? null)
  }
}
