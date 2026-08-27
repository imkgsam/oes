import test, { after, type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import {
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import {
  AssignmentRuntimeStore,
  createAssignmentResult,
  createAssignmentResultArtifact,
  createFeatureReplanRequest,
  createFeatureReplanSibling,
  createStageWipAuthorityBinding,
  decideFeatureReplan as decideFeatureReplanWithStage,
  validateAssignmentRuntimeState,
  validateFeatureReplanDecision as validateFeatureReplanDecisionWithStage
} from '../src/assignment-runtime.ts'
import type {
  ActiveChildAssignment,
  AssignmentResult,
  AssignmentResultArtifactPayload,
  AssignmentRuntimeInitialization,
  AssignmentRuntimeState,
  ChildAssignmentRequest,
  FeatureReplanRequest,
  FeatureReplanSibling,
  StageWipAuthorityBinding
} from '../src/assignment-runtime.types.ts'
import { canonicalJson, objectFingerprint, sha256 } from '../src/canonical.ts'
import { validateJsonSchema } from '../src/schema-validation.ts'

const FP = {
  scope: 'a'.repeat(64),
  childScope: 'b'.repeat(64),
  root: 'c'.repeat(64),
  capability: 'd'.repeat(64)
}

const exactStageStates = new Map<string, AssignmentRuntimeState>()
const defaultResultArtifactRoot = realpathSync(
  mkdtempSync(join(tmpdir(), 'oes-assignment-result-artifacts-'))
)
after(() => rmSync(defaultResultArtifactRoot, { recursive: true, force: true }))

const schema = (name: string) =>
  JSON.parse(readFileSync(join(import.meta.dirname, '..', 'schemas', name), 'utf8')) as Record<
    string,
    unknown
  >

/** Creates one task-owned state root and removes it after the test. */
function runtime(t: TestContext, role: 'FEATURE_LEAD' | 'STAGE_LEAD' = 'FEATURE_LEAD') {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'oes-assignment-runtime-')))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const store = new AssignmentRuntimeStore(root, 'feature-alpha')
  const initialization: AssignmentRuntimeInitialization = {
    owner: {
      role,
      taskId: role === 'FEATURE_LEAD' ? 'task-fl-alpha' : 'task-sl-alpha',
      directExecutionParentTaskId: 'task-parent'
    },
    stageKey: 'stage-alpha',
    featureKey: 'feature-alpha',
    transitionId: 'transition:alpha',
    scopeFingerprint: FP.scope,
    ceiling: {
      maxActiveFeatureLeads: 3,
      maxActiveImplementationTasksPerFeature: 3,
      maxActiveFeatureReviewsPerFeature: 1
    },
    nextLegalAction: 'DISPATCH_CHILD'
  }
  return { root, store, initialization, state: store.initialize(initialization) }
}

/** Creates one exact child dispatch request at a bound state version. */
function child(
  stateVersion: number,
  childTaskId: string,
  childRole: ChildAssignmentRequest['childRole'] = 'IMPLEMENTATION_TASK',
  overrides: Partial<ChildAssignmentRequest> = {}
): ChildAssignmentRequest {
  return {
    expectedStateVersion: stateVersion,
    childTaskId,
    childRole,
    featureKey: 'feature-alpha',
    expectedTypedResult: childRole === 'FEATURE_REVIEW' ? 'FEATURE_RI_ACCEPTED' : 'SLICE_ACCEPTED',
    nextLegalActionOnResult:
      childRole === 'FEATURE_REVIEW' ? 'PREPARE_STAGE_REVIEW' : 'REVIEW_SLICE',
    scopeFingerprint: FP.childScope,
    resultArtifactRoot: defaultResultArtifactRoot,
    ...overrides
  }
}

/** Creates the exact self-hashed payload bound to one active assignment. */
function artifact(
  assignment: ActiveChildAssignment,
  overrides: Partial<AssignmentResultArtifactPayload> = {}
): AssignmentResultArtifactPayload {
  return createAssignmentResultArtifact({
    assignmentId: assignment.assignmentId,
    directExecutionParentTaskId: assignment.directExecutionParentTaskId,
    childTaskId: assignment.childTaskId,
    transitionId: assignment.transitionId,
    dispatchStateVersion: assignment.dispatchStateVersion,
    typedResult: assignment.expectedTypedResult,
    scopeFingerprint: assignment.scopeFingerprint,
    ...overrides
  })
}

/** Writes one canonical result artifact and returns its exact outer reference. */
function writeArtifact(
  assignment: ActiveChildAssignment,
  payload = artifact(assignment),
  path = join(assignment.resultArtifactRoot, `${assignment.assignmentId}.json`)
) {
  const bytes = `${canonicalJson(payload)}\n`
  writeFileSync(path, bytes)
  return { path, sha256: sha256(bytes), fingerprint: payload.artifactFingerprint }
}

/** Creates a self-hashed result whose artifact already exists under the bound physical root. */
function result(
  assignment: ActiveChildAssignment,
  overrides: Partial<Omit<AssignmentResult, 'schemaVersion' | 'kind' | 'resultFingerprint'>> = {}
): AssignmentResult {
  return createAssignmentResult({
    assignmentId: assignment.assignmentId,
    directExecutionParentTaskId: assignment.directExecutionParentTaskId,
    childTaskId: assignment.childTaskId,
    transitionId: assignment.transitionId,
    dispatchStateVersion: assignment.dispatchStateVersion,
    typedResult: assignment.expectedTypedResult,
    resultArtifact: writeArtifact(assignment),
    ...overrides
  })
}

/** Creates one complete independent sibling extraction binding. */
function sibling(
  featureKey = 'feature-beta',
  writeSet = [`scripts/${featureKey}/**`],
  independent = true
): FeatureReplanSibling {
  return createFeatureReplanSibling({
    featureKey,
    objective: `Deliver ${featureKey}`,
    scope: [`scope:${featureKey}`],
    protectedScope: ['preserve:owners'],
    writeSet,
    dependencies: [],
    acceptance: [`accept:${featureKey}`],
    requiredCapabilityFingerprint: FP.capability,
    independenceProof: {
      independentCandidate: independent,
      independentFeatureReview: independent,
      independentPullRequest: independent,
      safeIndependentMainMerge: independent
    }
  })
}

/** Creates one exact Stage-owned WIP authority and deletes its scratch store. */
function stageAuthority(activeFeatureLeads = 1): StageWipAuthorityBinding {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'oes-assignment-stage-authority-')))
  try {
    const store = new AssignmentRuntimeStore(root, 'stage-authority')
    let state = store.initialize({
      owner: {
        role: 'STAGE_LEAD',
        taskId: 'task-parent',
        directExecutionParentTaskId: 'task-root'
      },
      stageKey: 'stage-alpha',
      featureKey: 'stage-authority',
      transitionId: 'transition:alpha',
      scopeFingerprint: FP.scope,
      ceiling: {
        maxActiveFeatureLeads: 3,
        maxActiveImplementationTasksPerFeature: 3,
        maxActiveFeatureReviewsPerFeature: 1
      },
      nextLegalAction: 'DISPATCH_CHILD'
    })
    for (let index = 0; index < activeFeatureLeads; index += 1) {
      const featureKey = index === 0 ? 'feature-alpha' : `feature-active-${index + 1}`
      state = store.dispatchChild(
        child(state.stateVersion, `task-fl-authority-${index + 1}`, 'FEATURE_LEAD', {
          featureKey
        })
      )
    }
    const authority = createStageWipAuthorityBinding(state)
    exactStageStates.set(authority.authorityFingerprint, state)
    return authority
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

/** Returns the separately transported exact Stage state for one request. */
function exactStageState(request: FeatureReplanRequest): AssignmentRuntimeState {
  const state = exactStageStates.get(request.stageWipAuthority.authorityFingerprint)
  if (!state) throw new Error('exact Stage state fixture absent')
  return state
}

/** Decides a fixture request only after authenticating its exact Stage state. */
function decideFeatureReplan(request: FeatureReplanRequest) {
  return decideFeatureReplanWithStage(request, exactStageState(request))
}

/** Revalidates a fixture decision against its separately transported Stage state. */
function validateFeatureReplanDecision(
  decision: Parameters<typeof validateFeatureReplanDecisionWithStage>[0],
  request: FeatureReplanRequest
) {
  return validateFeatureReplanDecisionWithStage(decision, request, exactStageState(request))
}

/** Creates a request containing every canonical replan binding. */
function replanRequest(
  stateVersion: number,
  proposedSiblings: FeatureReplanSibling[],
  overrides: Partial<Parameters<typeof createFeatureReplanRequest>[0]> = {}
): FeatureReplanRequest {
  const activeFeatureLeads = overrides.oldTopology?.activeFeatureLeads ?? 1
  return createFeatureReplanRequest({
    stageLeadTaskId: 'task-parent',
    featureLeadTaskId: 'task-fl-alpha',
    stageKey: 'stage-alpha',
    featureKey: 'feature-alpha',
    transitionId: 'transition:alpha',
    stateVersion,
    scopeFingerprint: FP.scope,
    rootAuthorizationFingerprint: FP.root,
    stageWipAuthority: stageAuthority(activeFeatureLeads),
    oldTopology: { activeFeatureLeads: 1, features: [] },
    delegationCeiling: {
      maxActiveFeatureLeads: 3,
      maxActiveImplementationTasksPerFeature: 3,
      maxActiveFeatureReviewsPerFeature: 1
    },
    retainedWriteSet: ['scripts/feature-alpha/**'],
    currentResources: {
      ownerRef: 'refs/heads/codex/feature/feature-alpha',
      ownerClone: '/private/tmp/oes-fl-feature-alpha',
      taskTemp: '/private/tmp/oes-fl-feature-alpha-artifacts',
      featurePacket: 'docs/plans/features/feature-alpha.md'
    },
    completedSlices: [
      {
        sliceId: 'slice-alpha',
        commitSha: '1'.repeat(40),
        candidateSha: '2'.repeat(40),
        evidenceFingerprints: ['3'.repeat(64)]
      }
    ],
    proposedSiblings,
    ...overrides
  })
}

test('initialization is exact, atomic, schema-valid, and idempotent', (t) => {
  const { store, initialization, state } = runtime(t)
  assert.equal(state.stateVersion, 1)
  assert.equal(state.status, 'ACTIVE')
  assert.deepEqual(state.wip, { activeFeatureLeads: 0, features: [] })
  assert.equal(store.initialize(initialization).recordFingerprint, state.recordFingerprint)
  validateJsonSchema(schema('assignment-runtime-state.schema.json'), state)
  assert.throws(
    () => store.initialize({ ...initialization, scopeFingerprint: '9'.repeat(64) }),
    /ASSIGNMENT_STATE_BINDING_CONFLICT/
  )
})

test('WAITING_ON_CHILD survives a fresh store instance with exact route fields', (t) => {
  const { root, store, state } = runtime(t)
  const waiting = store.dispatchChild(child(state.stateVersion, 'task-it-one'))
  assert.equal(waiting.status, 'WAITING_ON_CHILD')
  assert.equal(waiting.nextLegalAction, 'CONSUME_DIRECT_ASSIGNMENT_RESULT')
  assert.deepEqual(waiting.wip.features, [
    { featureKey: 'feature-alpha', activeImplementationTasks: 1, activeFeatureReviews: 0 }
  ])
  assert.deepEqual(
    {
      directParent: waiting.activeAssignments[0].directExecutionParentTaskId,
      child: waiting.activeAssignments[0].childTaskId,
      expected: waiting.activeAssignments[0].expectedTypedResult,
      next: waiting.activeAssignments[0].nextLegalActionOnResult
    },
    {
      directParent: 'task-fl-alpha',
      child: 'task-it-one',
      expected: 'SLICE_ACCEPTED',
      next: 'REVIEW_SLICE'
    }
  )
  const reopened = new AssignmentRuntimeStore(root, 'feature-alpha').load()
  assert.deepEqual(reopened, waiting)
  validateJsonSchema(schema('assignment-runtime-state.schema.json'), reopened)
})

test('exact duplicate dispatch is idempotent and a conflicting active child fails closed', (t) => {
  const { store, state } = runtime(t)
  const request = child(state.stateVersion, 'task-it-one')
  const first = store.dispatchChild(request)
  const bytes = readFileSync(store.statePath)
  assert.deepEqual(store.dispatchChild(request), first)
  assert.deepEqual(readFileSync(store.statePath), bytes)
  assert.throws(
    () =>
      store.dispatchChild(
        child(first.stateVersion, 'task-it-one', 'IMPLEMENTATION_TASK', {
          scopeFingerprint: '7'.repeat(64)
        })
      ),
    /ASSIGNMENT_CHILD_ALREADY_ACTIVE/
  )
  assert.deepEqual(readFileSync(store.statePath), bytes)
})

test('direct result applies once and exact replay after restart returns the original receipt', (t) => {
  const { root, store, state } = runtime(t)
  const waiting = store.dispatchChild(child(state.stateVersion, 'task-it-one'))
  const value = result(waiting.activeAssignments[0])
  validateJsonSchema(schema('assignment-result.schema.json'), value)
  validateJsonSchema(
    schema('assignment-result-artifact.schema.json'),
    JSON.parse(readFileSync(value.resultArtifact.path, 'utf8'))
  )
  const receipt = store.consumeResult(value)
  const after = store.load()
  assert.equal(after.status, 'ACTIVE')
  assert.equal(after.activeAssignments.length, 0)
  assert.equal(after.resultTombstones.length, 1)
  assert.equal(receipt.nextLegalAction, 'REVIEW_SLICE')
  validateJsonSchema(schema('assignment-runtime-state.schema.json'), after)
  const bytes = readFileSync(store.statePath)
  const replayed = new AssignmentRuntimeStore(root, 'feature-alpha').consumeResult(value)
  assert.deepEqual(replayed, receipt)
  assert.deepEqual(readFileSync(store.statePath), bytes)
})

test('result artifacts must exist, remain physical children, and bind exact assignment content', (t) => {
  const { root, store, state } = runtime(t)
  const waiting = store.dispatchChild(child(state.stateVersion, 'task-it-one'))
  const assignment = waiting.activeAssignments[0]
  const before = readFileSync(store.statePath)
  const payload = artifact(assignment)
  const payloadBytes = `${canonicalJson(payload)}\n`

  const missingPath = join(assignment.resultArtifactRoot, 'missing-result.json')
  const missing = createAssignmentResult({
    assignmentId: assignment.assignmentId,
    directExecutionParentTaskId: assignment.directExecutionParentTaskId,
    childTaskId: assignment.childTaskId,
    transitionId: assignment.transitionId,
    dispatchStateVersion: assignment.dispatchStateVersion,
    typedResult: assignment.expectedTypedResult,
    resultArtifact: {
      path: missingPath,
      sha256: sha256(payloadBytes),
      fingerprint: payload.artifactFingerprint
    }
  })
  assert.throws(() => store.consumeResult(missing), /ASSIGNMENT_RESULT_ARTIFACT_ABSENT/)
  assert.deepEqual(readFileSync(store.statePath), before)

  const valid = result(assignment)
  writeFileSync(valid.resultArtifact.path, `${payloadBytes}tampered`)
  assert.throws(() => store.consumeResult(valid), /ASSIGNMENT_RESULT_ARTIFACT_SHA_MISMATCH/)
  assert.deepEqual(readFileSync(store.statePath), before)
  writeFileSync(valid.resultArtifact.path, payloadBytes)

  const aliasPath = join(assignment.resultArtifactRoot, 'result-alias.json')
  symlinkSync(valid.resultArtifact.path, aliasPath)
  const aliased = createAssignmentResult({
    assignmentId: assignment.assignmentId,
    directExecutionParentTaskId: assignment.directExecutionParentTaskId,
    childTaskId: assignment.childTaskId,
    transitionId: assignment.transitionId,
    dispatchStateVersion: assignment.dispatchStateVersion,
    typedResult: assignment.expectedTypedResult,
    resultArtifact: { ...valid.resultArtifact, path: aliasPath }
  })
  assert.throws(() => store.consumeResult(aliased), /ASSIGNMENT_RESULT_ARTIFACT_PHYSICAL_ALIAS/)
  assert.deepEqual(readFileSync(store.statePath), before)

  const otherRoot = realpathSync(mkdtempSync(join(tmpdir(), 'oes-assignment-other-owner-')))
  t.after(() => rmSync(otherRoot, { recursive: true, force: true }))
  const wrongOwnerPath = join(otherRoot, 'result.json')
  writeFileSync(wrongOwnerPath, payloadBytes)
  const wrongOwner = createAssignmentResult({
    assignmentId: assignment.assignmentId,
    directExecutionParentTaskId: assignment.directExecutionParentTaskId,
    childTaskId: assignment.childTaskId,
    transitionId: assignment.transitionId,
    dispatchStateVersion: assignment.dispatchStateVersion,
    typedResult: assignment.expectedTypedResult,
    resultArtifact: { ...valid.resultArtifact, path: wrongOwnerPath }
  })
  assert.throws(
    () => store.consumeResult(wrongOwner),
    /ASSIGNMENT_RESULT_ARTIFACT_OUTSIDE_BOUND_ROOT/
  )
  assert.deepEqual(readFileSync(store.statePath), before)

  const mismatchedPayload = artifact(assignment, { childTaskId: 'task-it-other' })
  const mismatchedReference = writeArtifact(
    assignment,
    mismatchedPayload,
    join(assignment.resultArtifactRoot, 'mismatched-result.json')
  )
  const mismatched = createAssignmentResult({
    assignmentId: assignment.assignmentId,
    directExecutionParentTaskId: assignment.directExecutionParentTaskId,
    childTaskId: assignment.childTaskId,
    transitionId: assignment.transitionId,
    dispatchStateVersion: assignment.dispatchStateVersion,
    typedResult: assignment.expectedTypedResult,
    resultArtifact: mismatchedReference
  })
  assert.throws(
    () => store.consumeResult(mismatched),
    /ASSIGNMENT_RESULT_ARTIFACT_ASSIGNMENT_MISMATCH/
  )
  assert.deepEqual(readFileSync(store.statePath), before)

  const receipt = store.consumeResult(valid)
  assert.equal(receipt.remainingAssignments, 0)
  assert.equal(store.load().status, 'ACTIVE')
})

test('wrong-route, stale, unexpected, and unknown results preserve exact state bytes', (t) => {
  const { store, state } = runtime(t)
  const waiting = store.dispatchChild(child(state.stateVersion, 'task-it-one'))
  const assignment = waiting.activeAssignments[0]
  const cases: Array<[AssignmentResult, RegExp]> = [
    [result(assignment, { directExecutionParentTaskId: 'task-wrong-parent' }), /WRONG_PARENT/],
    [result(assignment, { childTaskId: 'task-wrong-child' }), /WRONG_CHILD/],
    [result(assignment, { transitionId: 'transition:wrong' }), /WRONG_TRANSITION/],
    [
      result(assignment, { dispatchStateVersion: assignment.dispatchStateVersion + 1 }),
      /STALE_STATE/
    ],
    [result(assignment, { typedResult: 'WRONG_RESULT' }), /UNEXPECTED_TYPE/],
    [result(assignment, { assignmentId: '8'.repeat(64) }), /ASSIGNMENT_RESULT_STALE_OR_UNKNOWN/]
  ]
  for (const [value, expected] of cases) {
    const before = readFileSync(store.statePath)
    assert.throws(() => store.consumeResult(value), expected)
    assert.deepEqual(readFileSync(store.statePath), before)
  }
})

test('a conflicting duplicate result fails without replacing the accepted tombstone', (t) => {
  const { store, state } = runtime(t)
  const waiting = store.dispatchChild(child(state.stateVersion, 'task-it-one'))
  const accepted = result(waiting.activeAssignments[0])
  store.consumeResult(accepted)
  const before = readFileSync(store.statePath)
  const conflict = result(waiting.activeAssignments[0], {
    resultArtifact: {
      path: '/tmp/conflicting-result.json',
      sha256: 'e'.repeat(64),
      fingerprint: '4'.repeat(64)
    }
  })
  assert.throws(() => store.consumeResult(conflict), /ASSIGNMENT_RESULT_CONFLICT/)
  assert.deepEqual(readFileSync(store.statePath), before)
})

test('parallel child results may arrive in either order and recompute WIP after each result', (t) => {
  const { store, state } = runtime(t)
  const one = store.dispatchChild(child(state.stateVersion, 'task-it-one'))
  const two = store.dispatchChild(child(one.stateVersion, 'task-it-two'))
  const review = store.dispatchChild(child(two.stateVersion, 'task-ri-one', 'FEATURE_REVIEW'))
  assert.deepEqual(review.wip.features, [
    { featureKey: 'feature-alpha', activeImplementationTasks: 2, activeFeatureReviews: 1 }
  ])
  const secondAssignment = review.activeAssignments.find(
    (assignment) => assignment.childTaskId === 'task-it-two'
  )!
  const secondReceipt = store.consumeResult(result(secondAssignment))
  assert.equal(secondReceipt.remainingAssignments, 2)
  assert.deepEqual(secondReceipt.wip.features, [
    { featureKey: 'feature-alpha', activeImplementationTasks: 1, activeFeatureReviews: 1 }
  ])
  const firstAssignment = review.activeAssignments.find(
    (assignment) => assignment.childTaskId === 'task-it-one'
  )!
  store.consumeResult(result(firstAssignment))
  const reviewAssignment = review.activeAssignments.find(
    (assignment) => assignment.childTaskId === 'task-ri-one'
  )!
  const finalReceipt = store.consumeResult(result(reviewAssignment))
  assert.equal(finalReceipt.remainingAssignments, 0)
  assert.equal(store.load().status, 'ACTIVE')
})

test('canonical 3 FL, 3 IT per feature, and 1 Feature RI ceilings never mutate on overflow', (t) => {
  const feature = runtime(t)
  let state = feature.state
  for (let index = 1; index <= 3; index += 1)
    state = feature.store.dispatchChild(child(state.stateVersion, `task-it-${index}`))
  let before = readFileSync(feature.store.statePath)
  assert.throws(
    () => feature.store.dispatchChild(child(state.stateVersion, 'task-it-four')),
    /IMPLEMENTATION_TASK_WIP_EXCEEDED/
  )
  assert.deepEqual(readFileSync(feature.store.statePath), before)
  state = feature.store.dispatchChild(child(state.stateVersion, 'task-ri-one', 'FEATURE_REVIEW'))
  before = readFileSync(feature.store.statePath)
  assert.throws(
    () => feature.store.dispatchChild(child(state.stateVersion, 'task-ri-two', 'FEATURE_REVIEW')),
    /FEATURE_REVIEW_WIP_EXCEEDED/
  )
  assert.deepEqual(readFileSync(feature.store.statePath), before)

  const stage = runtime(t, 'STAGE_LEAD')
  state = stage.state
  for (let index = 1; index <= 3; index += 1)
    state = stage.store.dispatchChild(
      child(state.stateVersion, `task-fl-${index}`, 'FEATURE_LEAD', {
        featureKey: `feature-${index}`
      })
    )
  before = readFileSync(stage.store.statePath)
  assert.throws(
    () =>
      stage.store.dispatchChild(
        child(state.stateVersion, 'task-fl-four', 'FEATURE_LEAD', {
          featureKey: 'feature-four'
        })
      ),
    /FEATURE_LEAD_WIP_EXCEEDED/
  )
  assert.deepEqual(readFileSync(stage.store.statePath), before)
})

test('self-child and duplicate active Feature ownership fail before any state bytes change', (t) => {
  const feature = runtime(t)
  let before = readFileSync(feature.store.statePath)
  assert.throws(
    () => feature.store.dispatchChild(child(feature.state.stateVersion, 'task-fl-alpha')),
    /ASSIGNMENT_SELF_CHILD_ROUTE/
  )
  assert.deepEqual(readFileSync(feature.store.statePath), before)

  const stage = runtime(t, 'STAGE_LEAD')
  const first = stage.store.dispatchChild(
    child(stage.state.stateVersion, 'task-fl-first', 'FEATURE_LEAD', {
      featureKey: 'feature-duplicate'
    })
  )
  before = readFileSync(stage.store.statePath)
  assert.throws(
    () =>
      stage.store.dispatchChild(
        child(first.stateVersion, 'task-fl-second', 'FEATURE_LEAD', {
          featureKey: 'feature-duplicate'
        })
      ),
    /ASSIGNMENT_DUPLICATE_ACTIVE_FEATURE_OWNER/
  )
  assert.deepEqual(readFileSync(stage.store.statePath), before)
})

test('persisted self-routes and duplicate active Feature owners fail on reopen', (t) => {
  const feature = runtime(t)
  const featureWaiting = feature.store.dispatchChild(
    child(feature.state.stateVersion, 'task-it-one')
  )
  const selfRouted = structuredClone(featureWaiting)
  const selfAssignment = selfRouted.activeAssignments[0]
  selfAssignment.childTaskId = selfRouted.owner.taskId
  selfAssignment.requestFingerprint = objectFingerprint(
    {
      expectedStateVersion: selfAssignment.dispatchStateVersion - 1,
      childTaskId: selfAssignment.childTaskId,
      childRole: selfAssignment.childRole,
      featureKey: selfAssignment.featureKey,
      expectedTypedResult: selfAssignment.expectedTypedResult,
      nextLegalActionOnResult: selfAssignment.nextLegalActionOnResult,
      scopeFingerprint: selfAssignment.scopeFingerprint,
      resultArtifactRoot: selfAssignment.resultArtifactRoot
    },
    '__none__'
  )
  selfAssignment.assignmentId = objectFingerprint(
    selfAssignment as unknown as Record<string, unknown>,
    'assignmentId'
  )
  selfRouted.recordFingerprint = objectFingerprint(
    selfRouted as unknown as Record<string, unknown>,
    'recordFingerprint'
  )
  assert.throws(() => validateAssignmentRuntimeState(selfRouted), /ASSIGNMENT_SELF_CHILD_ROUTE/)

  const stage = runtime(t, 'STAGE_LEAD')
  let stageState = stage.store.dispatchChild(
    child(stage.state.stateVersion, 'task-fl-one', 'FEATURE_LEAD', {
      featureKey: 'feature-one'
    })
  )
  stageState = stage.store.dispatchChild(
    child(stageState.stateVersion, 'task-fl-two', 'FEATURE_LEAD', {
      featureKey: 'feature-two'
    })
  )
  const duplicated = structuredClone(stageState)
  const second = duplicated.activeAssignments.find(
    (assignment) => assignment.childTaskId === 'task-fl-two'
  )!
  second.featureKey = 'feature-one'
  second.requestFingerprint = objectFingerprint(
    {
      expectedStateVersion: second.dispatchStateVersion - 1,
      childTaskId: second.childTaskId,
      childRole: second.childRole,
      featureKey: second.featureKey,
      expectedTypedResult: second.expectedTypedResult,
      nextLegalActionOnResult: second.nextLegalActionOnResult,
      scopeFingerprint: second.scopeFingerprint,
      resultArtifactRoot: second.resultArtifactRoot
    },
    '__none__'
  )
  second.assignmentId = objectFingerprint(
    second as unknown as Record<string, unknown>,
    'assignmentId'
  )
  duplicated.activeAssignments.sort((left, right) =>
    left.assignmentId.localeCompare(right.assignmentId)
  )
  duplicated.recordFingerprint = objectFingerprint(
    duplicated as unknown as Record<string, unknown>,
    'recordFingerprint'
  )
  assert.throws(
    () => validateAssignmentRuntimeState(duplicated),
    /ASSIGNMENT_DUPLICATE_ACTIVE_FEATURE_OWNER/
  )
})

test('role-invalid dispatch, stale CAS, and immediate SQLite contention fail closed', (t) => {
  const { store, state } = runtime(t)
  const before = readFileSync(store.statePath)
  assert.throws(
    () => store.dispatchChild(child(state.stateVersion, 'task-fl-one', 'FEATURE_LEAD')),
    /OWNER_CHILD_ROUTE_INVALID/
  )
  assert.throws(
    () =>
      store.dispatchChild(
        child(state.stateVersion, 'task-it-other-feature', 'IMPLEMENTATION_TASK', {
          featureKey: 'feature-other'
        })
      ),
    /FEATURE_OWNER_SCOPE_MISMATCH/
  )
  assert.throws(
    () => store.dispatchChild(child(state.stateVersion + 1, 'task-it-one')),
    /STATE_VERSION_MISMATCH/
  )
  const competing = new DatabaseSync(store.statePath)
  competing.exec('PRAGMA busy_timeout = 0; BEGIN IMMEDIATE')
  try {
    assert.throws(
      () => store.dispatchChild(child(state.stateVersion, 'task-it-one')),
      /ASSIGNMENT_STATE_BUSY/
    )
  } finally {
    competing.exec('ROLLBACK')
    competing.close()
  }
  assert.deepEqual(readFileSync(store.statePath), before)
})

test('tampered state fingerprint and recomputed but false WIP both fail on reopen', (t) => {
  const { store, state } = runtime(t)
  const waiting = store.dispatchChild(child(state.stateVersion, 'task-it-one'))
  const tampered = { ...waiting, nextLegalAction: 'WRONG_ACTION' }
  const database = new DatabaseSync(store.statePath)
  database
    .prepare('UPDATE assignment_runtime_state SET record_json = ? WHERE feature_key = ?')
    .run(JSON.stringify(tampered), 'feature-alpha')
  assert.throws(() => store.load(), /ASSIGNMENT_STATE_FINGERPRINT_MISMATCH/)
  const falseWip: AssignmentRuntimeState = {
    ...waiting,
    wip: { activeFeatureLeads: 0, features: [] },
    recordFingerprint: ''
  }
  falseWip.recordFingerprint = objectFingerprint(
    falseWip as unknown as Record<string, unknown>,
    'recordFingerprint'
  )
  database
    .prepare('UPDATE assignment_runtime_state SET record_json = ? WHERE feature_key = ?')
    .run(JSON.stringify(falseWip), 'feature-alpha')
  database.close()
  assert.throws(() => validateAssignmentRuntimeState(falseWip), /WIP_SNAPSHOT_MISMATCH/)
})

test('complete independent proof within the ceiling yields exact FEATURE_REPLAN_REQUIRED', () => {
  const request = replanRequest(1, [sibling()])
  const decision = decideFeatureReplan(request)
  assert.equal(decision.decision, 'FEATURE_REPLAN_REQUIRED')
  assert.equal(decision.newTopology.activeFeatureLeads, 2)
  assert.equal(decision.nextLegalAction, 'RETURN_FEATURE_REPLAN_REQUIRED_TO_DIRECT_PARENT')
  assert.equal(decision.request.invalidationConditions.length, 9)
  validateFeatureReplanDecision(decision, request)
  validateJsonSchema(schema('assignment-feature-replan.schema.json'), request)
  validateJsonSchema(schema('assignment-feature-replan.schema.json'), decision)
})

test('incomplete independence proof preserves one atomic Feature owner', () => {
  const request = replanRequest(1, [sibling('feature-beta', ['scripts/beta/**'], false)])
  const decision = decideFeatureReplan(request)
  assert.equal(decision.decision, 'ATOMIC_CONTINUATION')
  assert.equal(decision.newTopology.activeFeatureLeads, 1)
  assert.equal(decision.nextLegalAction, 'CONTINUE_ORIGINAL_FEATURE_WITH_BOUNDED_ITS')
})

test('proven sibling WIP overflow and write conflicts fail instead of changing topology', () => {
  assert.throws(
    () =>
      decideFeatureReplan(
        replanRequest(1, [sibling()], {
          oldTopology: { activeFeatureLeads: 3, features: [] }
        })
      ),
    /FEATURE_REPLAN_WIP_CEILING_EXCEEDED/
  )
  assert.throws(
    () =>
      decideFeatureReplan(
        replanRequest(1, [
          sibling('feature-beta', ['scripts/shared/**']),
          sibling('feature-gamma', ['scripts/shared/runtime.ts'])
        ])
      ),
    /FEATURE_REPLAN_WRITE_SET_CONFLICT/
  )
  assert.throws(
    () =>
      decideFeatureReplan(
        replanRequest(1, [sibling('feature-beta', ['scripts/feature-alpha/runtime/**'])])
      ),
    /FEATURE_REPLAN_RETAINED_WRITE_SET_CONFLICT/
  )
  assert.throws(
    () => sibling('feature-beta', ['scripts/shared/*.ts']),
    /FEATURE_REPLAN_WRITE_RANGE_INVALID/
  )
})

test('Stage WIP authority rejects a false old topology before a replan decision', () => {
  const authority = stageAuthority(3)
  assert.throws(
    () =>
      replanRequest(1, [sibling()], {
        stageWipAuthority: authority,
        oldTopology: { activeFeatureLeads: 1, features: [] }
      }),
    /FEATURE_REPLAN_STAGE_AUTHORITY_MISMATCH/
  )
  const tampered = { ...authority, stageStateVersion: authority.stageStateVersion + 1 }
  assert.throws(
    () =>
      replanRequest(1, [sibling()], {
        stageWipAuthority: tampered
      }),
    /FEATURE_REPLAN_STAGE_AUTHORITY_FINGERPRINT_MISMATCH/
  )

  const exactRequest = replanRequest(1, [sibling()], {
    oldTopology: { activeFeatureLeads: 3, features: [] }
  })
  const exactState = exactStageState(exactRequest)
  const forgedAuthority = {
    ...exactRequest.stageWipAuthority,
    activeFeatureLeads: 1,
    activeFeatureKeys: ['feature-alpha'],
    authorityFingerprint: ''
  }
  forgedAuthority.authorityFingerprint = objectFingerprint(
    forgedAuthority as unknown as Record<string, unknown>,
    'authorityFingerprint'
  )
  const {
    schemaVersion: _schemaVersion,
    kind: _kind,
    requestFingerprint: _requestFingerprint,
    invalidationConditions: _invalidationConditions,
    ...exactInput
  } = exactRequest
  const forgedRequest = createFeatureReplanRequest({
    ...exactInput,
    stageWipAuthority: forgedAuthority,
    oldTopology: { activeFeatureLeads: 1, features: [] }
  })
  assert.throws(
    () => decideFeatureReplanWithStage(forgedRequest, exactState),
    /FEATURE_REPLAN_STAGE_AUTHORITY_NOT_EXACT_STATE/
  )
})

test('any exact replan binding change invalidates the prior decision', () => {
  const request = replanRequest(1, [sibling()])
  const decision = decideFeatureReplan(request)
  const changed = replanRequest(2, [sibling()])
  assert.throws(
    () => validateFeatureReplanDecision(decision, changed),
    /FEATURE_REPLAN_DECISION_INVALIDATED/
  )
  const tampered = { ...decision, reason: 'changed' }
  assert.throws(
    () => validateFeatureReplanDecision(tampered, request),
    /FEATURE_REPLAN_DECISION_FINGERPRINT_MISMATCH/
  )
})

test('persisted replan marker is idempotent, blocks expansion, and preserves in-flight results', (t) => {
  const { store, state } = runtime(t)
  const waiting = store.dispatchChild(child(state.stateVersion, 'task-it-one'))
  const request = replanRequest(waiting.stateVersion, [sibling()], {
    oldTopology: {
      activeFeatureLeads: 1,
      features: [
        { featureKey: 'feature-alpha', activeImplementationTasks: 1, activeFeatureReviews: 0 }
      ]
    }
  })
  const decision = store.recordFeatureReplanDecision(request, exactStageState(request))
  const marked = store.load()
  assert.equal(marked.status, 'FEATURE_REPLAN_REQUIRED')
  assert.equal(marked.featureReplan?.decisionFingerprint, decision.decisionFingerprint)
  validateJsonSchema(schema('assignment-runtime-state.schema.json'), marked)
  const markedBytes = readFileSync(store.statePath)
  assert.deepEqual(store.recordFeatureReplanDecision(request, exactStageState(request)), decision)
  assert.deepEqual(readFileSync(store.statePath), markedBytes)
  assert.throws(
    () => store.dispatchChild(child(marked.stateVersion, 'task-it-two')),
    /DISPATCH_AFTER_FEATURE_REPLAN/
  )
  const receipt = store.consumeResult(result(waiting.activeAssignments[0]))
  assert.equal(receipt.remainingAssignments, 0)
  const invalidated = store.load()
  assert.equal(invalidated.status, 'ACTIVE')
  assert.equal(invalidated.featureReplan, null)
  assert.equal(invalidated.nextLegalAction, 'REEVALUATE_FEATURE_REPLAN')
  validateJsonSchema(schema('assignment-runtime-state.schema.json'), invalidated)
  assert.throws(
    () => store.recordFeatureReplanDecision(request, exactStageState(request)),
    /FEATURE_REPLAN_STATE_VERSION_MISMATCH/
  )
})

test('atomic continuation marker remains dispatchable and is superseded only by a new state binding', (t) => {
  const { store, state } = runtime(t)
  const request = replanRequest(state.stateVersion, [])
  const decision = store.recordFeatureReplanDecision(request, exactStageState(request))
  assert.equal(decision.decision, 'ATOMIC_CONTINUATION')
  const recorded = store.load()
  assert.equal(recorded.status, 'ACTIVE')
  const waiting = store.dispatchChild(child(recorded.stateVersion, 'task-it-one'))
  assert.equal(waiting.status, 'WAITING_ON_CHILD')
  assert.equal(waiting.featureReplan, null)
  assert.throws(
    () => store.recordFeatureReplanDecision(request, exactStageState(request)),
    /FEATURE_REPLAN_STATE_VERSION_MISMATCH/
  )
})

test('schema and runtime both reject open or malformed assignment contracts', (t) => {
  const { store, state } = runtime(t)
  const waiting = store.dispatchChild(child(state.stateVersion, 'task-it-one'))
  const value = result(waiting.activeAssignments[0])
  assert.throws(
    () => validateJsonSchema(schema('assignment-result.schema.json'), { ...value, extra: true }),
    /additionalProperties/
  )
  const traversalResult = {
    ...value,
    resultArtifact: {
      ...value.resultArtifact,
      path: `${value.resultArtifact.path}/../outside-result.json`
    }
  }
  assert.throws(
    () => validateJsonSchema(schema('assignment-result.schema.json'), traversalResult),
    /JSON_SCHEMA_VALIDATION_FAILED/
  )
  assert.throws(
    () =>
      createAssignmentResult({
        assignmentId: traversalResult.assignmentId,
        directExecutionParentTaskId: traversalResult.directExecutionParentTaskId,
        childTaskId: traversalResult.childTaskId,
        transitionId: traversalResult.transitionId,
        dispatchStateVersion: traversalResult.dispatchStateVersion,
        typedResult: traversalResult.typedResult,
        resultArtifact: traversalResult.resultArtifact
      }),
    /ASSIGNMENT_RESULT_ARTIFACT_PATH_INVALID/
  )
  const request = replanRequest(waiting.stateVersion, [sibling()], {
    oldTopology: {
      activeFeatureLeads: 1,
      features: [
        { featureKey: 'feature-alpha', activeImplementationTasks: 1, activeFeatureReviews: 0 }
      ]
    }
  })
  const malformed = {
    ...request,
    invalidationConditions: request.invalidationConditions.slice(1)
  }
  assert.throws(
    () => validateJsonSchema(schema('assignment-feature-replan.schema.json'), malformed),
    /minItems|contains/
  )
  const openWriteGlob = structuredClone(request)
  openWriteGlob.proposedSiblings[0].writeSet = ['scripts/shared/*.ts']
  assert.throws(
    () => validateJsonSchema(schema('assignment-feature-replan.schema.json'), openWriteGlob),
    /pattern|not/
  )
})

test('assignment runtime contains no background coordination mechanism', () => {
  const source = readFileSync(
    join(import.meta.dirname, '..', 'src', 'assignment-runtime.ts'),
    'utf8'
  )
  for (const forbidden of [
    /setInterval\s*\(/,
    /setTimeout\s*\(/,
    /readdirSync\s*\(/,
    /watchFile\s*\(/,
    /watch\s*\(/,
    /while\s*\(/
  ])
    assert.doesNotMatch(source, forbidden)
})
