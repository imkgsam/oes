# Collaboration Runtime Lean Cutover

featureKey: `COLLABORATION-RUNTIME-LEAN-CUTOVER`
truthCommit: `1e6d575fe1eab3a1ac4018c5e43d70ab1caf17a0`
baseSha: `1e6d575fe1eab3a1ac4018c5e43d70ab1caf17a0`
integrationBranch: `codex/feature/collaboration-runtime-lean-cutover`
worktreeKey: `collaboration-runtime-lean-cutover`
pullRequest: `pending`
mergeSha: `pending`
cleanup: `HOLD`
state: `CANDIDATE_READY_ROUND_3`

## Objective

Deliver the stable owner runtime, direct assignment wakeup, and risk-tiered validation contracts as one atomic collaboration-runtime candidate while preserving pre-cutover owners and excluding schedulers, registries, relays, watchers, polling infrastructure, and product/business semantics.

## Slices

### STABLE-OWNER-RUNTIME

state: `CANDIDATE_READY_ROUND_3`
candidate: `a95cc6ace3e26ca4216c0f3dc9efa8ed4ad998a0`
review: `Round 2 remediation for visible RI 01a04401-de22-74a3-8fc8-517c48ce997d`

- Scope: stable owner resource binding, recovery, remote/cleanup compatibility, executable schemas, focused tests, and runbook guidance.
- Protected scope: existing tasks/resources and all pre-cutover bindings remain unchanged.
- Acceptance: mixed profiles, temporary-path aliases, shared or ancestor task-temp roots, wrong-origin recovery, and incomplete cleanup fail closed; cleanup never emits `REMOVE` for a non-owner-exclusive temp root.

### EVENT-DRIVEN-ASSIGNMENT

state: `CANDIDATE_READY_ROUND_3`
candidate: `a95cc6ace3e26ca4216c0f3dc9efa8ed4ad998a0`
review: `Round 2 remediation for visible RI 01a04401-de22-74a3-8fc8-517c48ce997d`

- Scope: persisted `WAITING_ON_CHILD`, direct `ASSIGNMENT_RESULT`, bounded feature replan, executable schemas, focused tests, and runbook guidance.
- Protected scope: no scheduler, inbox, relay, watcher, polling loop, duplicate owner, or hidden owner transport.
- Acceptance: exact-parent routing is idempotent; owner/topology authority is immutable; WIP and write-conflict checks fail closed; a result releases WIP only after its assignment-bound physical artifact is reopened, hashed, schema/content validated, and matched to its envelope.

### RISK-TIERED-VALIDATION

state: `CANDIDATE_READY_ROUND_3`
candidate: `a95cc6ace3e26ca4216c0f3dc9efa8ed4ad998a0`
review: `Round 2 remediation for visible RI 01a04401-de22-74a3-8fc8-517c48ce997d`

- Scope: complete evidence keys, focused/affected/full validation plans, bounded design-risk scan, executable schemas, focused tests, and runbook guidance.
- Protected scope: no product build/database/journey expansion and no new design result beyond `EXISTING_TRUTH_SUFFICIENT | DESIGN_GAP`.
- Acceptance: malformed paths, re-sealed invalid plans, legacy exported types, and schema/runtime divergence fail closed; runtime and schema both reject non-canonical truth paths and incomplete/duplicate surface identity sets.

## Feature RI Round 1 remediation

- Exact reviewed candidate: `ff51b58a19774030c0a3a2697953443009a1f358` / tree `9fdd5233cfb74fb26e14c7a3b5d8445ebe1593c2`.
- Exact visible RI: `01a04401-de22-74a3-8fc8-517c48ce997d`.
- Review record SHA-256: `ffa0358e606e73a3a7a87fa0cb34c497a81e8603a09d64c9514a900a2a985bb7`.
- Remediation implementation: `bb807d3598323e56664ccd18b8035c1851ad9916` / tree `787bdf7e1be613e7495438f7447b240b5efb4de7`.
- P1 cleanup: stable task-temp is a physical `oes-`-namespaced direct child of an approved temp parent; binding, cleanup resource schemas/runtime, and the final cleanup decision all reject shared roots and ancestor aliases.
- P1 assignment result: dispatch binds the child result root and its physical identity; consumption reopens a strict physical child with no-follow identity checks, hashes canonical bytes, validates the typed artifact contract/fingerprint, and matches assignment plus envelope before WIP changes.
- P2 Design Risk: executable schema now rejects absolute, traversal, dot, empty-segment, and trailing truth paths and requires all seven distinct surface identities like runtime.
- Round 1 candidate evidence is invalidated by the append-only implementation commit. Review reproductions remain the selected adversarial coverage; affected and full validation are rerun on the final Round 2 tree.

## Feature RI Round 2 remediation

- Exact reviewed candidate: `65ecefc60a8924bd200d769bc0dc4bc12f962d69` / tree `c0b3dea552f63d65bd9400502d3d235cec0df39a`.
- Exact visible RI: `01a04401-de22-74a3-8fc8-517c48ce997d`.
- Review record SHA-256: `3c6ada34fa992a8d60593a096a01c66a7578ccc39aac0828d09932c9d8032142`; review manifest SHA-256: `3eb4d6a4e4c0f1d7e382ca87bce2703f09bb644e37e72438586c85089fdf2d30`.
- P1 stable scratch: the stable leaf is now exactly `oes-owner-<sha256(ownerTaskId)>`; schema restricts that shape, binding requires the hash of its exact owner, and final cleanup re-derives it from the cleanup owner before `REMOVE`.
- P1 assignment root: active assignments persist canonical physical path, decimal device/inode, and `DIRECTORY`; consumption opens no-follow, compares the exact dispatch-time object before and after reading, and rejects same-path directory replacement without changing assignment/WIP bytes.
- Round 3 remediation implementation: `a95cc6ace3e26ca4216c0f3dc9efa8ed4ad998a0` / tree `e24dd5cce0190fbf30a714d68af98f5119bc2130`.
- Round 2 candidate evidence is invalidated by these contract changes. The exact review reproductions remain risk-selection evidence; focused and full validation will be rerun on the final Round 3 tree.

## Evidence decision

- Reuse the verified recovery bundles and Stable 10-file WIP patch as byte-exact implementation inputs.
- Preserve prior findings and their reproductions as risk coverage, but invalidate prior candidate test results because the integration base, combined tree, and commands differ.
- Re-run each lane's focused tests after import, then run the complete collaboration-runtime gate on the final tree.

## Feature acceptance

1. All three slices are present on latest canonical main in one owner-exclusive local candidate.
2. Every known Stable, Event, and Risk review finding has an executable regression test and passes.
3. Typecheck, focused tests, full collaboration-runtime tests, static checks, diff checks, and rollback verification pass.
4. No push, PR, merge, old-resource mutation, cleanup, or independent review occurs before the exact parent creates the visible RI.

## Current verification

- Stable focused: typecheck + 46 tests + static checks passed, including real bundle recovery followed by remote preflight.
- Event focused: typecheck + 21 tests + static checks passed; Stage WIP decisions require separately authenticated exact Stage state.
- Risk focused: typecheck + 33 tests + static checks passed.
- Round 2 affected focused: typecheck + 62 tests passed across assignment, topology, cleanup, schema, and Design Risk suites.
- Round 2 pre-freeze full gate: typecheck + 130 tests + static checks passed on the combined implementation tree.
- Round 3 affected focused: typecheck + 74 tests passed across assignment, binding, cleanup, resource-topology, and schema suites; static checks passed.
- Round 3 pre-freeze full gate: typecheck + 133 tests + static checks passed on implementation tree `e24dd5cce0190fbf30a714d68af98f5119bc2130`.
- Prior candidate test results were not reused; only the hash-verified implementation inputs and finding reproductions were reused.
