import assert from 'node:assert/strict'
import test from 'node:test'
import { decideRouting, validateRoutingDecision } from '../routing.ts'

const stream = (key: string) => ({
  key,
  independentlyOwnable: true,
  independentlyReleasable: true,
  acceptance: ['accepted'],
  writeSet: [`src/${key}/**`],
  dependencies: [] as string[]
})
const base = {
  stateful: true,
  stableDesignChange: false,
  designProposalConfirmed: false,
  deliveryActivationConfirmed: false,
  realParallelism: false,
  crossDeliveryIntegration: false,
  requestedPrTopology: 'DEFAULT' as const,
  independentPrExceptionConfirmed: false,
  workstreams: [stream('one')]
}

test('read-only discussion creates no role or Git topology', () => {
  const result = validateRoutingDecision(
    decideRouting({ ...base, stateful: false, workstreams: [] })
  )
  assert.equal(result.route, 'DISCUSSION')
  assert.deepEqual(result.activeRoles, [])
})

test('one cohesive delivery routes to one DO regardless of size', () => {
  const result = decideRouting({
    ...base,
    workstreams: [stream('one'), { ...stream('two'), independentlyOwnable: false }],
    realParallelism: true
  })
  assert.equal(result.route, 'DO')
  assert.equal(result.prTopology, 'ONE_DO_PR')
})

test('CO requires independent workstreams and defaults to one aggregate PR', () => {
  const result = decideRouting({
    ...base,
    workstreams: [stream('one'), stream('two')],
    realParallelism: true
  })
  assert.equal(result.route, 'CO')
  assert.equal(result.prTopology, 'ONE_AGGREGATE_CO_PR')
})

test('design impact routes DA to UD before delivery activation', () => {
  const result = decideRouting({ ...base, stableDesignChange: true })
  assert.equal(result.route, 'DA_UD')
  assert.deepEqual(result.activeRoles, ['DA', 'UD'])
  assert.equal(result.nextGate, 'PROPOSAL_CONFIRMATION')
})
