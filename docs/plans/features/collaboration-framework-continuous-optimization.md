# Collaboration Framework Continuous Optimization

featureKey: collaboration-framework-continuous-optimization
truthCommit: 5c590128d9576506c7d04de4d030cfb5b9855037
baseSha: 5c590128d9576506c7d04de4d030cfb5b9855037
integrationBranch: codex/feature/collaboration-framework-continuous-optimization
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: CANDIDATE_READY
implementationCandidateAncestor: 06b5341825128e5aa27aaed4a16f7c47dc5310b3
review: round-3 findings remediated; exact candidate pending same independent Feature RI

## Status

`CANDIDATE_READY`

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

## Current verification

- `static-risk`: PASS; prepared build passed, unit matrix passed with 8 packages / 449 suites / 2033 tests, collaboration runtime passed 153/153, and all contract/risk checks passed. Product/build evidence is reusable because the remediation changes only collaboration-runtime trust binding and tests.
- `l2-runtime`: PASS; 18 packages / 59 suites / 185 tests, database rollback passed, and task-owned container/volume/network residue is zero.
- Local-main scenario: PASS; a profile-trusted owner/transition/nonce/realpath/ref/SHA-bound confirmation authorized one exact ff-only update, while a sibling FL worktree retained its original branch and HEAD; stale transition, cross-transition nonce replay, forged confirmation, root/remote/SHA drift, and symlink alias fail closed.
- CLI/fault smoke: PASS; unproven terminal delivery fails closed, an immutable profile-trusted CI observation proves the exact completed failed run/job/SHA relation, the identical recovery returns its existing monotonic receipt, and stale-transition, unrelated-job, or run-alias observations fail closed.

## Feature RI remediation

- Terminal UD release now requires a typed result, payload hash, exact return-task delivery proof, and byte-identical replay.
- same-SHA CI infrastructure recovery writes one owner/job/SHA receipt before returning rerun authorization; duplicate invocation replays that receipt.
- local-main sync reopens a profile-read-only Human confirmation bound to exact realpath project root, remote URL, remote-main SHA, action, owner, transition, and nonce, with monotonic response-loss recovery.
- The profile report now carries its exact transition into runtime trust; local-main binding, confirmation, and checkpoint must all match it, and the nonce identity prevents cross-transition reuse.
- CI recovery no longer accepts caller-supplied run/job/failure facts; it reopens a profile-read-only live-CI observation, validates run/job/SHA/failure association, and binds the monotonic receipt to owner, transition, observation, and globally unique job identity.
- The installed read-only profile now seals owner and transition; effective-profile report readback must match both before local-main or CI trust context can be created.
- Local-main now atomically creates an owner/nonce `CLAIMED` checkpoint before the first Git command; `EEXIST` is reopened and transition-validated, closing the concurrent stale-checkpoint TOCTOU window.
