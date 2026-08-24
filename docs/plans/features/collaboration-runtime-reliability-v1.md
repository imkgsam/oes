# Collaboration Runtime Reliability V1

featureKey: collaboration-runtime-reliability-v1
truthCommit: 45c8d56788c5689e9bbcf68de6a628334e2c65e4
baseSha: ee0c289b69f6b77266567132bb5db4733a1dc799
integrationBranch: codex/feature/collaboration-runtime-reliability-v1
worktreeKey: collaboration-runtime-reliability-v1
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: CANDIDATE_READY

## Objective

Deliver one repository-owned collaboration runtime that enforces effective owner profiles, zero-normal-prompt handoff evidence, recoverable remote transactions, latest-main admission, selective evidence invalidation, and exact Stage cleanup without acquiring artifact ownership.

## Slices

### execution-profile-preflight-and-telemetry

state: CANDIDATE_READY
candidate: 67a24365307cec8645c3d5f7dad77c8665be43d2
review: global-ri exact integration candidate pending

- Scope: project profile template; actual-capability observation validation; approval telemetry; typed same-transition defect/repair classification.
- Protected scope: secret values, production/shared data, unrestricted host permissions, business services and contracts.
- Dependencies: canonical execution model sections 4.4-4.7; installed profile smoke evidence.
- Acceptance: filesystem/Git/build-test/SQLite/localhost/GitHub/credential-reference/telemetry evidence is exact, hashed, zero-prompt, and failures route by handoff state and declared scope.

### versioned-remote-driver-and-recovery

state: CANDIDATE_READY
candidate: 67a24365307cec8645c3d5f7dad77c8665be43d2
review: global-ri exact integration candidate pending

- Scope: typed Node.js/TypeScript binding, checkpoint, receipt and result contracts; thin entrypoint; GitHub adapter; preflight/publish-pr/verify-pr/merge-pr/verify-main/cleanup; idempotent read-after-write recovery.
- Protected scope: direct main push, force/history rewrite, cross-owner refs, merge/cleanup without exact authorization.
- Dependencies: execution-profile-preflight-and-telemetry.
- Acceptance: every mutation validates owner/state/ref/SHA/scope, advances atomic checkpoints, resumes from remote truth after result loss, and never repeats a matched mutation.

### merge-admission-evidence-and-cleanup

state: CANDIDATE_READY
candidate: 67a24365307cec8645c3d5f7dad77c8665be43d2
review: global-ri exact integration candidate pending

- Scope: `merge_group` Baseline Checks, serialized latest-main fallback, evidence keys and affected-test matrix, Stage batch cleanup planning and partial-failure verification.
- Protected scope: product code, Stage product branches, non-terminal packets, unknown or mismatched resources.
- Dependencies: versioned-remote-driver-and-recovery.
- Acceptance: latest-main/merge-group inputs are exact; evidence reuse is key-bound and risk-selective; cleanup narrows to each owner and preserves failed/unknown resources.

## Feature acceptance

1. `pnpm proto:lint`, `pnpm proto:gen`, and `pnpm --filter @oes/common build` pass.
2. Runtime typecheck, static checks, and focused/scenario tests pass on the exact candidate.
3. Remote mutation crash recovery proves one mutation with read-after-write resume.
4. Moving-main tests cover reuse, focused invalidation, full invalidation, and frozen semantic conflict.
5. Stage cleanup tests cover exact batch binding, child narrowing, cleanup-only deletion, idempotent partial retry, and verification.
6. Evidence records bind candidate, dependency/input/profile/command fingerprints, literal results, and exit codes.
7. Risk-based Global RI accepts the exact complete feature candidate before its first remote write.

## Evidence keys

- candidate: exact integration HEAD assigned to Global RI; current slice ancestor `67a24365307cec8645c3d5f7dad77c8665be43d2`
- dependency fingerprint: `pnpm-lock.yaml` plus Node/pnpm/TypeScript toolchain
- literal inputs: truth/base/scope binding plus exact changed paths
- execution profile fingerprint: `7eef45be1901a115668c5a2b50b878292ea2a926b9cea20598300fa621458c42`
- command coverage: proto lint/gen, common build, runtime typecheck/tests/static, diff checks
- result coverage: literal outputs and exit statuses under the feature artifact key
