# Collaboration Runtime Lean Cutover

featureKey: `COLLABORATION-RUNTIME-LEAN-CUTOVER`
truthCommit: `1e6d575fe1eab3a1ac4018c5e43d70ab1caf17a0`
baseSha: `1e6d575fe1eab3a1ac4018c5e43d70ab1caf17a0`
integrationBranch: `codex/feature/collaboration-runtime-lean-cutover`
worktreeKey: `collaboration-runtime-lean-cutover`
pullRequest: `pending`
mergeSha: `pending`
cleanup: `HOLD`
state: `RUNNING`

## Objective

Deliver the stable owner runtime, direct assignment wakeup, and risk-tiered validation contracts as one atomic collaboration-runtime candidate while preserving pre-cutover owners and excluding schedulers, registries, relays, watchers, polling infrastructure, and product/business semantics.

## Slices

### STABLE-OWNER-RUNTIME
state: `CANDIDATE_READY`
candidate: `pending`
review: `parent-created visible Feature RI after complete candidate`

- Scope: stable owner resource binding, recovery, remote/cleanup compatibility, executable schemas, focused tests, and runbook guidance.
- Protected scope: existing tasks/resources and all pre-cutover bindings remain unchanged.
- Acceptance: mixed profiles, temporary-path aliases, wrong-origin recovery, and incomplete cleanup fail closed.

### EVENT-DRIVEN-ASSIGNMENT
state: `RUNNING`
candidate: `pending`
review: `parent-created visible Feature RI after complete candidate`

- Scope: persisted `WAITING_ON_CHILD`, direct `ASSIGNMENT_RESULT`, bounded feature replan, executable schemas, focused tests, and runbook guidance.
- Protected scope: no scheduler, inbox, relay, watcher, polling loop, duplicate owner, or hidden owner transport.
- Acceptance: exact-parent routing is idempotent; owner/topology authority is immutable; WIP and write-conflict checks fail closed.

### RISK-TIERED-VALIDATION
state: `READY`
candidate: `pending`
review: `parent-created visible Feature RI after complete candidate`

- Scope: complete evidence keys, focused/affected/full validation plans, bounded design-risk scan, executable schemas, focused tests, and runbook guidance.
- Protected scope: no product build/database/journey expansion and no new design result beyond `EXISTING_TRUTH_SUFFICIENT | DESIGN_GAP`.
- Acceptance: malformed paths, re-sealed invalid plans, legacy exported types, and schema/runtime divergence fail closed.

## Evidence decision

- Reuse the verified recovery bundles and Stable 10-file WIP patch as byte-exact implementation inputs.
- Preserve prior findings and their reproductions as risk coverage, but invalidate prior candidate test results because the integration base, combined tree, and commands differ.
- Re-run each lane's focused tests after import, then run the complete collaboration-runtime gate on the final tree.

## Feature acceptance

1. All three slices are present on latest canonical main in one owner-exclusive local candidate.
2. Every known Stable, Event, and Risk review finding has an executable regression test and passes.
3. Typecheck, focused tests, full collaboration-runtime tests, static checks, diff checks, and rollback verification pass.
4. No push, PR, merge, old-resource mutation, cleanup, or independent review occurs before the exact parent creates the visible RI.
