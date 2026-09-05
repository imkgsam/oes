import { canonicalJson, objectFingerprint } from './canonical.ts'
import { fail } from './errors.ts'

export const ACTIVE_TASK_ROLES = ['DA', 'UD', 'DO', 'CO', 'RV'] as const
export type ActiveTaskRole = (typeof ACTIVE_TASK_ROLES)[number]

export interface DeliveryWorkstream {
  key: string
  independentlyOwnable: boolean
  independentlyReleasable: boolean
  acceptance: string[]
  writeSet: string[]
  dependencies: string[]
}

export interface RoutingDecisionInput {
  stateful: boolean
  executionMode: 'REPOSITORY' | 'HOST_LOCAL'
  repositoryModification: boolean
  stableDesignChange: boolean
  designProposalConfirmed: boolean
  deliveryActivationConfirmed: boolean
  realParallelism: boolean
  crossDeliveryIntegration: boolean
  requestedPrTopology: 'DEFAULT' | 'INDEPENDENT'
  independentPrExceptionConfirmed: boolean
  workstreams: DeliveryWorkstream[]
}

export interface RoutingDecision {
  schemaVersion: 2
  kind: 'OES_V2_ROUTING_DECISION'
  route: 'DISCUSSION' | 'DA_UD' | 'DO' | 'CO'
  executionMode: 'NONE' | 'REPOSITORY' | 'HOST_LOCAL'
  activeRoles: ActiveTaskRole[]
  deliveryOwnerCount: number
  prTopology: 'NONE' | 'ONE_DO_PR' | 'ONE_AGGREGATE_CO_PR' | 'INDEPENDENT_DO_PRS'
  nextGate:
    | 'NONE'
    | 'PROPOSAL_CONFIRMATION'
    | 'DELIVERY_ACTIVATION_CONFIRMATION'
    | 'INITIAL_EXECUTION_CONFIRMATION'
  reason: string
  decisionFingerprint: string
}

const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Selects the smallest V2 owner topology from scope, design impact, coupling, and explicit PR choice. */
export function decideRouting(input: RoutingDecisionInput): RoutingDecision {
  if (!['REPOSITORY', 'HOST_LOCAL'].includes(input.executionMode))
    fail('ROUTING_EXECUTION_MODE_INVALID', String(input.executionMode))
  if (input.executionMode === 'HOST_LOCAL' && input.repositoryModification)
    fail('HOST_LOCAL_REPOSITORY_MODIFICATION_REQUIRES_REROUTE', 'REPOSITORY')
  if (!Array.isArray(input.workstreams)) fail('ROUTING_WORKSTREAMS_INVALID', 'not an array')
  const keys = new Set<string>()
  for (const stream of input.workstreams) {
    if (!KEY.test(stream.key) || keys.has(stream.key))
      fail('ROUTING_WORKSTREAM_KEY_INVALID', stream.key)
    keys.add(stream.key)
    if (!stream.acceptance.length || !stream.writeSet.length)
      fail('ROUTING_WORKSTREAM_UNBOUNDED', stream.key)
    for (const dependency of stream.dependencies)
      if (dependency === stream.key || !KEY.test(dependency))
        fail('ROUTING_DEPENDENCY_INVALID', `${stream.key}:${dependency}`)
  }
  for (const stream of input.workstreams)
    for (const dependency of stream.dependencies)
      if (!keys.has(dependency)) fail('ROUTING_DEPENDENCY_UNKNOWN', `${stream.key}:${dependency}`)

  if (!input.stateful)
    return seal({
      route: 'DISCUSSION',
      executionMode: 'NONE',
      activeRoles: [],
      deliveryOwnerCount: 0,
      prTopology: 'NONE',
      nextGate: 'NONE',
      reason: 'read-only discussion creates no task, branch, worktree, candidate, or pull request'
    })
  if (input.stableDesignChange) {
    const nextGate = !input.designProposalConfirmed
      ? 'PROPOSAL_CONFIRMATION'
      : !input.deliveryActivationConfirmed
        ? 'DELIVERY_ACTIVATION_CONFIRMATION'
        : 'INITIAL_EXECUTION_CONFIRMATION'
    return seal({
      route: 'DA_UD',
      executionMode: 'NONE',
      activeRoles: ['DA', 'UD'],
      deliveryOwnerCount: 0,
      prTopology: 'NONE',
      nextGate,
      reason:
        'stable design changes require a DA Proposal and independent UD canonical audit before delivery'
    })
  }
  if (!input.workstreams.length) fail('ROUTING_STATEFUL_SCOPE_EMPTY', 'workstreams')
  const multipleIndependent =
    input.workstreams.length > 1 && input.workstreams.every((item) => item.independentlyOwnable)
  const coordinationJustified =
    multipleIndependent && (input.realParallelism || input.crossDeliveryIntegration)
  if (!coordinationJustified)
    return seal({
      route: 'DO',
      executionMode: input.executionMode,
      activeRoles: ['DO'],
      deliveryOwnerCount: 1,
      prTopology: input.executionMode === 'REPOSITORY' ? 'ONE_DO_PR' : 'NONE',
      nextGate: 'INITIAL_EXECUTION_CONFIRMATION',
      reason:
        input.workstreams.length > 1
          ? 'size or multiple atomic slices alone does not justify CO; one DO owns the cohesive delivery'
          : input.executionMode === 'REPOSITORY'
            ? 'one cohesive repository delivery has one DO and one pull request'
            : 'one cohesive host-local operation has one DO, local verification, and no Git resources'
    })
  const independentAllowed =
    input.requestedPrTopology === 'INDEPENDENT' &&
    input.independentPrExceptionConfirmed &&
    input.workstreams.every((item) => item.independentlyReleasable)
  return seal({
    route: 'CO',
    executionMode: input.executionMode,
    activeRoles: ['CO', 'DO'],
    deliveryOwnerCount: input.workstreams.length,
    prTopology:
      input.executionMode === 'HOST_LOCAL'
        ? 'NONE'
        : independentAllowed
          ? 'INDEPENDENT_DO_PRS'
          : 'ONE_AGGREGATE_CO_PR',
    nextGate: 'INITIAL_EXECUTION_CONFIRMATION',
    reason:
      input.executionMode === 'HOST_LOCAL'
        ? 'CO coordinates at least two independently ownable host-local workstreams with real parallelism or cross-operation integration and no Git resources'
        : independentAllowed
          ? 'the Human-confirmed exception uses independently releasable DO pull requests'
          : 'CO integrates independently ownable deliveries into one aggregate candidate and pull request'
  })
}

/** Adds the immutable V2 envelope and fingerprint to a routing decision. */
function seal(
  value: Omit<RoutingDecision, 'schemaVersion' | 'kind' | 'decisionFingerprint'>
): RoutingDecision {
  const base = { schemaVersion: 2 as const, kind: 'OES_V2_ROUTING_DECISION' as const, ...value }
  return {
    ...base,
    decisionFingerprint: objectFingerprint(base as unknown as Record<string, unknown>, '__none__')
  }
}

/** Verifies a persisted decision is canonical and unchanged. */
export function validateRoutingDecision(value: RoutingDecision): RoutingDecision {
  if (value.schemaVersion !== 2 || value.kind !== 'OES_V2_ROUTING_DECISION')
    fail('ROUTING_DECISION_KIND_INVALID', String(value.schemaVersion))
  if (canonicalJson(value.activeRoles) !== canonicalJson([...new Set(value.activeRoles)]))
    fail('ROUTING_ROLE_SET_INVALID', value.activeRoles.join(','))
  if (value.activeRoles.some((role) => !ACTIVE_TASK_ROLES.includes(role)))
    fail('ROUTING_ROLE_INVALID', value.activeRoles.join(','))
  const expected = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'decisionFingerprint'
  )
  if (expected !== value.decisionFingerprint)
    fail('ROUTING_DECISION_FINGERPRINT_MISMATCH', expected)
  return value
}
