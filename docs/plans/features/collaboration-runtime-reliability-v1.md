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
candidate: 0107c6269495b679b17bf7cdf2affac44cbab170
review: global-ri round 7 exact integration candidate pending; round 6 findings closed by the current slice candidate

- Scope: project profile template; actual-capability observation validation; approval telemetry; typed same-transition defect/repair classification.
- Protected scope: secret values, production/shared data, unrestricted host permissions, business services and contracts.
- Dependencies: canonical execution model sections 4.4-4.7; installed profile smoke evidence.
- Acceptance: filesystem/Git/build-test/SQLite/localhost/GitHub/credential-reference/telemetry evidence is exact, hashed, zero-prompt, and failures route by handoff state and declared scope.

### versioned-remote-driver-and-recovery

state: CANDIDATE_READY
candidate: 0107c6269495b679b17bf7cdf2affac44cbab170
review: global-ri round 7 exact integration candidate pending; round 6 findings closed by the current slice candidate

- Scope: typed Node.js/TypeScript binding, checkpoint, receipt and result contracts; thin entrypoint; GitHub adapter; preflight/publish-pr/verify-pr/merge-pr/verify-main/cleanup; idempotent read-after-write recovery.
- Protected scope: direct main push, force/history rewrite, cross-owner refs, merge/cleanup without exact authorization.
- Dependencies: execution-profile-preflight-and-telemetry.
- Acceptance: every mutation validates owner/state/ref/SHA/scope, advances atomic checkpoints, resumes from remote truth after result loss, and never repeats a matched mutation.

### merge-admission-evidence-and-cleanup

state: CANDIDATE_READY
candidate: 0107c6269495b679b17bf7cdf2affac44cbab170
review: global-ri round 7 exact integration candidate pending; round 6 findings closed by the current slice candidate

- Scope: `merge_group` Baseline Checks, serialized latest-main fallback, evidence keys and affected-test matrix, Stage batch cleanup planning and partial-failure verification.
- Protected scope: product code, Stage product branches, non-terminal packets, unknown or mismatched resources.
- Dependencies: versioned-remote-driver-and-recovery.
- Acceptance: latest-main/merge-group inputs, lock identity, ruleset main-ref targeting, and required-check run ids are exact; evidence reuse is key-bound and risk-selective; cleanup narrows to each owner and preserves failed/unknown resources.

## Review closure

- Round 1 candidate `7bb948fac24cf55ab4d1a9dbcf51672d58813aa6`: rejected; remediation ancestor `67a24365307cec8645c3d5f7dad77c8665be43d2`.
- Round 2 candidate `527c95616c4d8008333be7860dc9b3cfb56cdf9b`: rejected; RI-002/004/008/010 remained closed, while RI-001/003/005/006/007/009 and the original RI-011 surface were remediated in `f3cb6c9db01918432d1e819d4bc0cc6cfbcb33f9`.
- Round 3 candidate `ed8334789e840d09ad65678fb665c52e165d0747`: rejected; RI-001 through RI-010 are closed. RI-011 (invalid lone required-check id), RI-012 (caller-minted Stage cleanup authority), RI-013 (alternate serial lock identity), and RI-014 (ruleset targeting a non-main ref) are fixed with targeted regressions in `ad53ba41f438468060b4dc4d257ec91fd607f632`.
- Round 4 candidate `5bbf6ac34fa741e1239b07187c52f514d77d9c40`: rejected; RI-001 through RI-014 are closed. RI-015 (undeclared cleanup decision), RI-016 (runtime/schema cleanup-resource identity mismatch), and RI-017 (stale protected Stage authorization replay) are fixed with targeted regressions in `2a64dc6e2bd9fe8137176c419234f6cff3d12a5c`.
- Round 5 candidate `de6a79b9a5a1af3315ddc7a15f7a73a72d448c2b`: rejected; RI-001 through RI-017 remain closed. RI-018 (protected `main` and Stage-owned Feature Packets accepted as child cleanup resources) is fixed by excluding Feature Packets, requiring safe non-main `codex/` refs, canonical absolute worktree/task-temp paths, and kind-specific SHA semantics in `470605d5432eded33c46e0e6dd28b46dccc79d7a`.
- Round 6 candidate `a7c5c3056c19edb8d4593db555b0408aff27deab`: rejected; RI-001 through RI-018 remain closed. RI-019 (Stage-owned, unbounded, or aliased cross-owner resources) and RI-020 (Git-invalid owner refs) are fixed by feature-key-derived resource identities, exact Stage ref derivation, safe Git ref grammar, canonical owner paths, direct child-owner binding, and schema/runtime regressions in `0107c6269495b679b17bf7cdf2affac44cbab170`.
- Round 7 reviews the next exact integration candidate; no remote mutation is permitted before acceptance.

## Feature acceptance

1. `pnpm proto:lint`, `pnpm proto:gen`, and `pnpm --filter @oes/common build` pass.
2. Runtime typecheck, static checks, and focused/scenario tests pass on the exact candidate.
3. Remote mutation crash recovery proves one mutation with read-after-write resume.
4. Moving-main tests cover reuse, focused invalidation, full invalidation, and frozen semantic conflict.
5. Stage cleanup tests cover protected current/root/child authorization, exact state/version/transition CAS and invalidation, profile-derived ownership, runtime/schema identity parity, fail-closed result decisions, exact batch binding, child narrowing, cleanup-only deletion, idempotent partial retry, and verification.
6. Evidence records bind candidate, dependency/input/profile/command fingerprints, literal results, and exit codes.
7. Risk-based Global RI accepts the exact complete feature candidate before its first remote write.

## Evidence keys

- candidate: exact integration HEAD assigned to Global RI; current slice ancestor `0107c6269495b679b17bf7cdf2affac44cbab170`
- dependency fingerprint: `pnpm-lock.yaml` plus Node/pnpm/TypeScript toolchain
- literal inputs: truth/base/scope binding plus exact changed paths
- execution profile fingerprint: `7eef45be1901a115668c5a2b50b878292ea2a926b9cea20598300fa621458c42`
- command coverage: proto lint/gen, common build, runtime typecheck/tests/static, diff checks
- result coverage: literal outputs and exit statuses under the feature artifact key
