import test from 'node:test'
import assert from 'node:assert/strict'
import { sha256 } from '../src/canonical.ts'
import {
  deriveProposalQueue,
  proposalQueueView,
  type ProposalEnvelope,
  type ProposalHistoryEvent,
  type ProposalReceiptKind
} from '../src/proposal-queue.ts'

/** Builds one immutable Proposal fixture with exact source and return bindings. */
function proposal(id: string, supersedesProposalId: string | null = null): ProposalEnvelope {
  return {
    schemaVersion: 1,
    kind: 'OES_UD_PROPOSAL',
    proposalId: id,
    proposalFingerprint: sha256(id),
    scope: `Scope ${id}`,
    source: { role: 'Design Owner', taskId: `/root/design/${id}` },
    returnTaskId: `/root/fl/${id}`,
    supersedesProposalId
  }
}

/** Builds one exact receipt fixture for an immutable Proposal. */
function receipt(
  envelope: ProposalEnvelope,
  kind: ProposalReceiptKind,
  overrides: Partial<Extract<ProposalHistoryEvent, { kind: 'PROPOSAL_RECEIPT' }>> = {}
): Extract<ProposalHistoryEvent, { kind: 'PROPOSAL_RECEIPT' }> {
  return {
    schemaVersion: 1,
    kind: 'PROPOSAL_RECEIPT',
    proposalId: envelope.proposalId,
    proposalFingerprint: envelope.proposalFingerprint,
    sourceTaskId: envelope.source.taskId,
    returnTaskId: envelope.returnTaskId,
    receipt: kind,
    terminalStatus: null,
    terminalResultDeliveryKey: null,
    safeBoundary: false,
    ...overrides
  }
}

test('strict FIFO holds the UD critical section until terminal exact return', () => {
  const first = proposal('proposal-a')
  const second = proposal('proposal-b')
  const base: ProposalHistoryEvent[] = [
    { schemaVersion: 1, kind: 'PROPOSAL_TRANSPORT', envelope: first },
    { schemaVersion: 1, kind: 'PROPOSAL_TRANSPORT', envelope: second }
  ]
  assert.throws(
    () => deriveProposalQueue([...base, receipt(second, 'UD_ADMITTED')]),
    /PROPOSAL_FIFO_ADMISSION_VIOLATION/
  )

  const processing = [...base, receipt(first, 'UD_ADMITTED'), receipt(first, 'PROCESSING')]
  assert.throws(
    () => deriveProposalQueue([...processing, receipt(second, 'UD_ADMITTED')]),
    /UD_CRITICAL_SECTION_BUSY/
  )
  assert.throws(
    () =>
      deriveProposalQueue([
        ...processing,
        receipt(first, 'TERMINAL', { returnTaskId: '/root/fl/wrong' })
      ]),
    /PROPOSAL_RECEIPT_BINDING_MISMATCH/
  )

  const terminal = receipt(first, 'TERMINAL', {
    terminalStatus: 'CANONICAL_MERGED_MAIN_CI_PASSED',
    terminalResultDeliveryKey: `${first.returnTaskId}:${first.proposalId}:terminal`
  })
  const queue = deriveProposalQueue([
    ...processing,
    terminal,
    terminal,
    receipt(second, 'UD_ADMITTED')
  ])
  assert.deepEqual(
    queue.map(({ proposalId, state }) => ({ proposalId, state })),
    [
      { proposalId: first.proposalId, state: 'TERMINAL' },
      { proposalId: second.proposalId, state: 'ADMITTED' }
    ]
  )
})

test('duplicate delivery is idempotent and a changed revision supersedes only at FIFO tail', () => {
  const original = proposal('proposal-a')
  const revision = proposal('proposal-b', original.proposalId)
  const queue = deriveProposalQueue([
    { schemaVersion: 1, kind: 'PROPOSAL_TRANSPORT', envelope: original },
    { schemaVersion: 1, kind: 'PROPOSAL_TRANSPORT', envelope: structuredClone(original) },
    { schemaVersion: 1, kind: 'PROPOSAL_TRANSPORT', envelope: revision },
    receipt(original, 'SUPERSEDED')
  ])
  assert.equal(queue.length, 2)
  assert.equal(queue[0]?.state, 'SUPERSEDED')
  assert.equal(queue[1]?.arrivalOrder, 2)

  const changed = { ...original, scope: 'Changed without a new proposal ID' }
  assert.throws(
    () =>
      deriveProposalQueue([
        { schemaVersion: 1, kind: 'PROPOSAL_TRANSPORT', envelope: original },
        { schemaVersion: 1, kind: 'PROPOSAL_TRANSPORT', envelope: changed }
      ]),
    /PROPOSAL_ID_REUSED_WITH_CHANGED_CONTENT/
  )
})

test('queue visibility is on-demand for project roles and bounded helpers receive no full queue', () => {
  const first = proposal('proposal-a')
  const history: ProposalHistoryEvent[] = [
    { schemaVersion: 1, kind: 'PROPOSAL_TRANSPORT', envelope: first }
  ]
  assert.equal(
    proposalQueueView(history, 'PROJECT_ROLE').nextAdmissibleProposalId,
    first.proposalId
  )
  assert.deepEqual(proposalQueueView(history, 'BOUNDED_HELPER'), {
    status: 'QUEUE_NOT_EXPOSED_TO_BOUNDED_HELPER',
    items: [],
    nextAdmissibleProposalId: null
  })
})
