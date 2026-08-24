# OES collaboration runtime

This directory is the repository-owned implementation of the reliability rules frozen in `docs/governance/codex-execution-model.md`.

## Components

- `profile/`: exact-owner project profile template. It separates the owner-exclusive Git directory from shared metadata, keeps the action-authorization root read-only, and grants only the protocol's shared serial-admission directory.
- `src/profile-preflight.ts`: production capability probes, persisted observation readback, actual profile/telemetry hashing, zero-normal-prompt acceptance, and bounded defect/repair routing.
- `src/remote-driver.ts`: monotonic remote transaction state, result-loss reconstruction, and read-after-write recovery.
- `src/github-adapter.ts`: exact Git/GitHub implementation for `preflight`, `publish-pr`, `verify-pr`, `merge-pr`, `verify-main`, and `cleanup`, including repository rules, review, annotation, merge-group, and merge-parent gates.
- `src/admission.ts`: crash-resumable global lock for serialized latest-main admission. Native queue receipts bind the generated base/head commits and their exact checks.
- `src/evidence.ts`: evidence keys and changed-path/contract/dependency/profile/command/result invalidation decisions.
- `src/cleanup.ts`: profile-derived protected Stage/child authorization narrowing, observation-bound partial-failure preservation, post-removal verification, and complete cleanup-only diff verification.
- `src/schema-validation.ts` and `schemas/`: an executable JSON Schema subset plus versioned binding, authorization, checkpoint, receipt, result, profile, evidence, cleanup and diff contracts.

## Commands

```sh
pnpm collaboration-runtime:check

node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  profile-preflight --input exact-profile-preflight.json

node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  validate-binding --profile-report effective-profile.json --binding binding.json

scripts/collaboration-runtime/bin/oes-remote-driver --profile-report effective-profile.json --binding binding.json
```

The remote driver loads its authorization and admission roots only from the reopened, hash-verified installed effective profile; per-command environment variables are not trust inputs. It never creates authority. A creating parent or exact Human-gate issuer writes an `OES_REMOTE_ACTION_AUTHORIZATION` beneath the profile-configured, owner-read-only authorization root beneath the installed profile directory before mutation. A binding references its exact bytes/fingerprint and must compare equal on owner, state/version, transition, scope, truth/base/candidate, repository, resources, action, nonce, and any merge/cleanup authorization. The CLI deliberately has no binding- or cleanup-authority sealing command.

Publication is Draft-only. Merge requires an exact Human merge fingerprint and either the global serial-admission lock at the exact profile-bound `latest-main.lock` or native queue admission. Queue recovery records the generated base/head pair and validates `Baseline Checks` on that head. Main verification binds the merge SHA, confirms two parents with the PR head second, checks ancestry and reviewed/merge-group tree identity, and validates main CI. Remote cleanup accepts one exact SHA-matched remote branch; local/worktree/packet cleanup reopens the fixed protected `current-stage-cleanup.json` CAS record and its exact state/version/transition-bound Stage root and child assignment.

A crash after remote success is resumed from exact branch/PR/queue/main truth. A crash after the terminal checkpoint but before result write reconstructs the typed result from the checkpoint receipt plus fresh remote verification; no matched mutation is issued twice.
