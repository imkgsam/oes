# OES collaboration runtime

This directory is the repository-owned implementation of the collaboration reliability rules frozen in `docs/governance/codex-execution-model.md`.

## Components

- `profile/`: exact-owner project profile template. Render placeholders, hash the rendered file, then prove the effective capabilities with an `OES_EFFECTIVE_PROFILE_REPORT`.
- `src/profile-preflight.ts`: complete capability probes, persisted approval telemetry validation, zero-normal-prompt acceptance, and bounded defect/repair routing.
- `src/remote-driver.ts`: monotonic remote transaction state and read-after-write recovery.
- `src/github-adapter.ts`: exact Git/GitHub implementation for `preflight`, `publish-pr`, `verify-pr`, `merge-pr`, `verify-main`, and `cleanup`.
- `src/admission.ts`: crash-resumable single binding lock for serialized latest-main admission. Native merge queue uses remote queue truth instead.
- `src/evidence.ts`: evidence keys and changed-path/contract/dependency/profile/command invalidation decisions.
- `src/cleanup.ts`: Stage batch authorization narrowing, partial-failure preservation, and cleanup-only diff verification.
- `schemas/`: versioned binding, checkpoint, receipt, result, profile, evidence, and cleanup JSON contracts.

## Commands

```sh
pnpm collaboration-runtime:check

node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  binding-fingerprint --input binding.unsealed.json --output binding.json

scripts/collaboration-runtime/bin/oes-remote-driver --binding binding.json
```

The remote driver never creates authority. Its input must already bind the exact owner, state, transition, scope, truth/main/candidate SHAs, one action, nonce, artifact paths, required checks, and any Human merge or cleanup fingerprint. `publish-pr` always creates a Draft PR; `merge-pr` accepts only Merge Commit and requires native queue or a serialized latest-main lock; `cleanup` requires exact cleanup authorization and SHA-matched resources.

A crash after remote success is resumed by querying the exact branch/PR/queue/main truth. A matched mutation is checkpointed and verification continues; it is not issued again.
