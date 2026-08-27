# Collaboration Runtime Assignment

## Purpose and boundary

This runbook covers the repository runtime for direct-parent child assignment, persisted `WAITING_ON_CHILD`, direct `ASSIGNMENT_RESULT` consumption, and bounded `FEATURE_REPLAN_REQUIRED` decisions.

The runtime is a library. It does not create tasks, select owners, send messages, push branches, open pull requests, scan task directories, or change topology resources. The calling SL or FL must already hold an exact confirmed assignment and child handoff binding.

## Storage contract

Create one store for the current owner and feature:

```ts
const store = new AssignmentRuntimeStore(TASK_TEMP, FEATURE_KEY)
```

The store owns exactly:

```text
TASK_TEMP/assignment-runtime/FEATURE_KEY.sqlite
```

The SQLite database contains one current feature row. Its `record_json` value is canonical JSON conforming to `scripts/collaboration-runtime/schemas/assignment-runtime-state.schema.json` and carrying a self-verifying `recordFingerprint`.

Every write uses `BEGIN IMMEDIATE`, an exact `state_version` compare-and-swap, an in-transaction readback, and `COMMIT`. SQLite rollback handles interrupted transactions. Busy contention returns `ASSIGNMENT_STATE_BUSY` immediately; callers wait for a new direct event or operator turn rather than repeatedly probing.

Transition-local result tombstones are part of the current state row. They exist only to make an exact child result idempotent after restart; they are not a cross-owner or global history store.

## Initialize the exact owner state

Initialize after the owner handoff and profile are verified:

```ts
const state = store.initialize({
  owner: {
    role: 'FEATURE_LEAD',
    taskId: FEATURE_LEAD_TASK_ID,
    directExecutionParentTaskId: STAGE_LEAD_TASK_ID
  },
  stageKey: STAGE_KEY,
  featureKey: FEATURE_KEY,
  transitionId: TRANSITION_ID,
  scopeFingerprint: SCOPE_FINGERPRINT,
  ceiling: {
    maxActiveFeatureLeads: 3,
    maxActiveImplementationTasksPerFeature: 3,
    maxActiveFeatureReviewsPerFeature: 1
  },
  nextLegalAction: 'DISPATCH_CHILD'
})
```

Re-initialization is idempotent only when owner, parent, Stage/Feature keys, transition, scope, and ceiling compare exactly. A mismatch returns `ASSIGNMENT_STATE_BINDING_CONFLICT` without changing the row.

## Persist `WAITING_ON_CHILD`

Only dispatch a child whose identity and narrower handoff have already passed the repository two-phase handoff:

```ts
const waiting = store.dispatchChild({
  expectedStateVersion: state.stateVersion,
  childTaskId: CHILD_TASK_ID,
  childRole: 'IMPLEMENTATION_TASK',
  featureKey: FEATURE_KEY,
  expectedTypedResult: 'SLICE_ACCEPTED',
  nextLegalActionOnResult: 'REVIEW_SLICE',
  scopeFingerprint: CHILD_SCOPE_FINGERPRINT,
  resultArtifactRoot: CHILD_RESULT_ARTIFACT_ROOT
})
```

The persisted active assignment binds:

- deterministic `assignmentId` and request fingerprint;
- exact direct parent and child task;
- child role and feature;
- transition and dispatch state version;
- expected typed result;
- narrower scope fingerprint;
- approved result artifact root and its dispatch-time physical directory identity;
- next legal action after the result.

After dispatch, persist the same marker in the Feature or Stage Packet and current evidence manifest, send the exact assignment, and end the turn. Do not keep a turn open to wait for the child.

An exact retry of the same dispatch request returns the current state without incrementing `stateVersion`. A changed request for an already active child returns `ASSIGNMENT_CHILD_ALREADY_ACTIVE`.

## Return and consume a direct result

The child first writes a canonical typed artifact beneath the exact `resultArtifactRoot` bound in the active assignment:

```ts
const artifact = createAssignmentResultArtifact({
  assignmentId: ASSIGNMENT_ID,
  directExecutionParentTaskId: PARENT_TASK_ID,
  childTaskId: CHILD_TASK_ID,
  transitionId: TRANSITION_ID,
  dispatchStateVersion: DISPATCH_STATE_VERSION,
  typedResult: EXPECTED_TYPED_RESULT,
  scopeFingerprint: CHILD_SCOPE_FINGERPRINT
})
writeJsonAtomic(RESULT_ARTIFACT_PATH, artifact)
```

`RESULT_ARTIFACT_PATH` must be an exact, non-aliased physical file strictly below the bound root. The child then constructs a self-hashed envelope after hashing the canonical artifact bytes:

```ts
const result = createAssignmentResult({
  assignmentId: ASSIGNMENT_ID,
  directExecutionParentTaskId: PARENT_TASK_ID,
  childTaskId: CHILD_TASK_ID,
  transitionId: TRANSITION_ID,
  dispatchStateVersion: DISPATCH_STATE_VERSION,
  typedResult: EXPECTED_TYPED_RESULT,
  resultArtifact: {
    path: RESULT_ARTIFACT_PATH,
    sha256: RESULT_ARTIFACT_SHA256,
    fingerprint: RESULT_ARTIFACT_FINGERPRINT
  }
})
```

Send the envelope only to the exact direct execution parent. The parent applies it once:

```ts
const receipt = store.consumeResult(result)
```

The consumer validates the envelope self-hash and exact assignment route, reopens the bound root and artifact through physical containment, verifies the exact bytes SHA-256, validates `assignment-result-artifact.schema.json`, checks the artifact self-fingerprint, and compares its assignment, parent, child, transition, dispatch version, typed result, and scope to both the active assignment and envelope before changing state. Missing, changed, aliased, non-canonical, wrong-root, or mismatched artifact bytes leave the assignment active and WIP unchanged. Only then does it remove the matching lane, recompute WIP, store the exact result tombstone and receipt, and select the next state:

```text
remaining child lanes > 0  -> WAITING_ON_CHILD
no remaining child lanes   -> ACTIVE
current replan marker      -> result applies, marker clears, replan is recomputed
```

The same result after restart returns the original receipt and leaves state bytes unchanged. A different result for the same `assignmentId` returns `ASSIGNMENT_RESULT_CONFLICT`.

## Result failure routes

| Error                                            | Meaning                                          | State effect |
| ------------------------------------------------ | ------------------------------------------------ | ------------ |
| `ASSIGNMENT_RESULT_STALE_OR_UNKNOWN`             | No active or completed exact assignment exists   | None         |
| `ASSIGNMENT_RESULT_WRONG_PARENT`                 | Result was routed to another parent              | None         |
| `ASSIGNMENT_RESULT_WRONG_CHILD`                  | Child differs from the active binding            | None         |
| `ASSIGNMENT_RESULT_WRONG_TRANSITION`             | Transition differs                               | None         |
| `ASSIGNMENT_RESULT_STALE_STATE`                  | Dispatch state version differs                   | None         |
| `ASSIGNMENT_RESULT_UNEXPECTED_TYPE`              | Typed result differs                             | None         |
| `ASSIGNMENT_RESULT_CONFLICT`                     | Same assignment returned different exact bytes   | None         |
| `ASSIGNMENT_RESULT_ARTIFACT_ABSENT`              | The bound artifact is missing                    | None         |
| `ASSIGNMENT_RESULT_ARTIFACT_SHA_MISMATCH`        | Reopened bytes differ from the envelope digest   | None         |
| `ASSIGNMENT_RESULT_ARTIFACT_OUTSIDE_BOUND_ROOT`  | Physical file belongs to another root            | None         |
| `ASSIGNMENT_RESULT_ARTIFACT_PHYSICAL_ALIAS`      | Artifact path is an alias                        | None         |
| `ASSIGNMENT_RESULT_ARTIFACT_ASSIGNMENT_MISMATCH` | Typed content differs from the assignment        | None         |
| `ASSIGNMENT_STATE_BUSY`                          | Another write transaction currently owns the row | None         |

Preserve the exact state and evidence on every failure. Correct routing or binding at the producing child or direct parent; do not substitute an ancestor task or a generic callback.

## WIP enforcement

WIP is derived from active assignments after every dispatch and result:

```text
active Feature Leads                    <= 3
active Implementation Tasks per feature <= 3
active Feature Reviews per feature       <= 1
```

The Stage state also enforces one active `FEATURE_LEAD` per `featureKey`. Every child task must
differ from its direct parent task. Both invariants are revalidated when persisted state is
reopened, so a self-route or duplicate Feature owner fails before any row changes.

Overflow returns a stable WIP error before the SQLite row changes. Completing a lane immediately releases its count for the next event-driven decision.

## Decide a bounded Feature replan

Build every proposed sibling with `createFeatureReplanSibling`. Its fingerprint binds objective, scope, protected scope, write set, dependencies, acceptance, required capability, and all four independence proofs:

```text
independent candidate
independent Feature RI
independent pull request
safe independent main merge
```

Then create and decide the exact request:

```ts
const stageWipAuthority = createStageWipAuthorityBinding(EXACT_STAGE_STATE)

const request = createFeatureReplanRequest({
  stageLeadTaskId: STAGE_LEAD_TASK_ID,
  featureLeadTaskId: FEATURE_LEAD_TASK_ID,
  stageKey: STAGE_KEY,
  featureKey: FEATURE_KEY,
  transitionId: TRANSITION_ID,
  stateVersion: state.stateVersion,
  scopeFingerprint: SCOPE_FINGERPRINT,
  rootAuthorizationFingerprint: ROOT_AUTHORIZATION_FINGERPRINT,
  stageWipAuthority,
  oldTopology: CURRENT_STAGE_TOPOLOGY,
  delegationCeiling: CURRENT_DELEGATION_CEILING,
  retainedWriteSet: ORIGINAL_FL_WRITE_RANGES_AFTER_EXTRACTION,
  currentResources: CURRENT_FEATURE_RESOURCES,
  completedSlices: COMPLETED_SLICE_BINDINGS,
  proposedSiblings: SIBLING_BINDINGS
})

const decision = store.recordFeatureReplanDecision(request, EXACT_STAGE_STATE)
```

`EXACT_STAGE_STATE` is loaded by the exact Stage Lead and passed through the direct-parent event;
the Feature Lead does not discover or read the Stage owner's store. Decision and persisted-decision
validation require that exact state separately and recompute the authority from it; a caller-resealed
authority is not sufficient. The authority self-hash binds
the Stage task, Stage/transition, Stage state version/fingerprint, active Feature keys/count, and
ceiling. `oldTopology.activeFeatureLeads`, the delegation ceiling, and the original feature key
must compare equal to that authority before the replan request exists.

Write sets accept only normalized literal repository paths or a terminal recursive range such as
`scripts/collaboration-runtime/**`. Other glob forms, absolute paths, and `.`/`..` segments fail
closed. Every proposed sibling must be disjoint from every other sibling and from
`retainedWriteSet`, which is the original FL's write range after the proposed extraction.

The decision is `FEATURE_REPLAN_REQUIRED` only when at least one proposed sibling has all four proofs, all proposed siblings are independently deliverable, their write ranges do not overlap each other or the retained FL range, and the authoritative new active-FL count stays within the exact ceiling. It persists the stop marker and blocks new child dispatches while still accepting already in-flight exact results. Any accepted in-flight result changes state/completed-work inputs, clears the stale decision marker, and sets `REEVALUATE_FEATURE_REPLAN` as the next legal action.

Incomplete proof returns `ATOMIC_CONTINUATION`, keeping the original FL and allowing bounded IT dispatch. Proven independence that exceeds WIP or has overlapping writes fails closed; it is not converted into an atomic feature.

The request always carries the canonical invalidation set. Any owner/parent, Stage/Feature key, transition/state, scope/protected scope, root authorization, topology/ceiling, sibling, completed work/evidence, or resource change produces a different request fingerprint. Validate a decision against the current request with `validateFeatureReplanDecision` before routing it to the exact SL.

## Restart procedure

1. Reopen the exact assignment, owner profile, Feature Packet, and current evidence manifest.
2. Construct `AssignmentRuntimeStore` with the same task temp and feature key.
3. Call `load()` and verify owner, direct parent, transition, scope fingerprint, status, state version, active assignments, WIP, and next legal action.
4. If the triggering direct result was already consumed, call `consumeResult` with the exact same envelope and reuse the returned receipt.
5. If it remains active, consume it once. If it is unknown or conflicts, keep the state unchanged and return the stable route error to the exact producer/parent.
6. Update the Packet and current evidence manifest from the reopened state, then perform only `nextLegalAction`.

SQLite automatically rolls back an incomplete transaction when the database is reopened. No custom lock cleanup or assignment scan is required.

## Verification

Focused development:

```bash
pnpm collaboration-runtime:typecheck
node --experimental-strip-types --test scripts/collaboration-runtime/test/assignment-runtime.test.ts
```

Affected candidate gate:

```bash
pnpm collaboration-runtime:check
```

The focused suite covers positive, boundary, negative, restart, duplicate, out-of-order, contention, WIP, schema, replan, invalidation, and forbidden-background-mechanism cases.
