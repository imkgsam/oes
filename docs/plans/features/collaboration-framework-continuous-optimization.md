# Collaboration Framework Continuous Optimization

featureKey: collaboration-framework-continuous-optimization
truthCommit: 5c590128d9576506c7d04de4d030cfb5b9855037
baseSha: 5c590128d9576506c7d04de4d030cfb5b9855037
integrationBranch: codex/feature/collaboration-framework-continuous-optimization
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: IMPLEMENTING

## Status

`IMPLEMENTING`

## Scope

Implement the merged command-contract v8 follow-on cutover without replacing the existing FL owner:

- derive exact-UD Proposal FIFO and receipts from native task history only;
- enforce exact return, duplicate/superseded idempotency, single-flight recovery, and bounded retry decisions;
- add an explicitly confirmed, guarded local `main` ff-only command without background mutation;
- split the complete CI gate into parallel `static-risk` and isolated `l2-runtime` jobs while preserving the single required `Baseline Checks` context.

## Protected scope

- no new global scheduler, queue database, registry, heartbeat, watchdog, pull inbox, or background sync;
- no local project-root `main` mutation as part of this feature implementation;
- no reduction of existing unit, contract, runtime-risk, migration, L2, cleanup, PR, or main validation surfaces;
- no changes to product-domain services, business contracts, or existing in-flight owner bindings.

## Acceptance

1. Fast runtime tests prove FIFO/exact return, duplicate/superseded behavior, remote-truth recovery, latest-main gates, and local-main confirmation guards.
2. A transient remote mutation response loss rereads live truth before retry; permission failures stop immediately; CI infrastructure rerun is limited to once on the same SHA.
3. Local-main inspection is read-only; confirmed sync rechecks all guards, performs only fetch plus ff-only, verifies read-after-write, and leaves another FL worktree unchanged.
4. CI runs `static-risk` and `l2-runtime` independently and in parallel; `Baseline Checks` fails unless both succeed.
5. Generation/build work is not repeated inside `static-risk`; `l2-runtime` keeps an isolated task-owned environment and unconditional residue cleanup.

## Validation route

- Focused: collaboration runtime typecheck, unit tests, static invariants, workflow syntax/topology.
- Affected: repository tooling tests, prepared build, isolated L2 runner and cleanup.
- Full gate: the exact commands represented by both optimized CI jobs, then independent Feature RI.
