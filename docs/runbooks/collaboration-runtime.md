# Collaboration Runtime Operations

This runbook operates the contracts defined by [Codex execution model](../governance/codex-execution-model.md). It does not create owner, merge, or cleanup authority.

## 1. Effective owner profile

1. Render `scripts/collaboration-runtime/profile/oes-project-owner.config.toml` with the exact repository, owner, owner-exclusive `.git`, artifact, task-temp, package-cache, trusted-authorization, and serial-admission paths. Never render a shared Git common directory as owner-writable.
2. Install/read back the rendered bytes and SHA-256. The trusted authorization root is a descendant of the installed profile directory and remains owner-read-only; the serial root contains only the shared exact lock.
3. Prepare a `profile-preflight` input that binds the request, repository, smoke root and persisted Codex event source, then execute the production command. It performs actual filesystem, disposable Git switch/add/commit, proto lint/gen, common build, runtime tests, task-owned SQLite, `127.0.0.1`, GitHub read, credential-key-only, and approval-telemetry probes.
4. Accept only a reopened `OES_EFFECTIVE_PROFILE_REPORT`: every observation has hashed literal evidence, the profile and telemetry bytes rehash exactly, credential keys are exactly `username,password`, reviewer mode is `on-request/auto_review`, and `normalPermissionPromptCount=0`.
5. A declared failure before handoff is `EXECUTION_ENVIRONMENT_NOT_READY`; after handoff it is `EXECUTION_PROFILE_DEFECT` and retains owner/state. An undeclared operation is `PERMISSION_EXPANSION_REQUIRED`.

## 2. Trusted remote transaction

The driver consumes authority; it does not mint it. It reopens the full-capability effective-profile report and derives the trusted authorization and serial-admission roots from the hashed installed profile; per-command environment variables cannot select either root. Before every action, the creating parent or exact Human-gate issuer atomically writes an `OES_REMOTE_ACTION_AUTHORIZATION` beneath the installed profile's trusted authorization root. The record references the root envelope/CAS record and binds the current owner/state/version, root confirmation, transition, scope, truth/base/candidate, repository/resource set, one action, nonce, and postcondition. Merge and cleanup records also bind their exact Human fingerprints.

Prepare a canonical `OES_REMOTE_DRIVER_BINDING` that references the authorization's exact path/SHA/fingerprint. Its corresponding fields and resource-set fingerprint must compare equal. Then validate and execute:

```sh
node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  validate-binding --profile-report effective-profile.json --binding binding.json
scripts/collaboration-runtime/bin/oes-remote-driver --profile-report effective-profile.json --binding binding.json
```

The runtime checks owner worktree/ref/repository identity, live main/candidate, server ruleset and workflow baseline, exact PR title/body/head/base, required checks, annotations, comments, reviews, and unresolved threads. `publish-pr` creates only a Draft PR. `merge-pr` requires the exact Human merge fingerprint. Serialized mode uses the profile-bound global latest-main lock and releases an uncheckpointed main-drift failure; native queue mode records its generated base/head commits, proves the base descends from the admitted latest main, and verifies `Baseline Checks` on the exact group head. `verify-main` requires the recorded merge SHA, two parents with confirmed PR head second, candidate ancestry, reviewed tree identity, and exact main CI.

The driver atomically advances:

```text
REMOTE_PREFLIGHT_VERIFIED -> REMOTE_MUTATION_RECORDED
-> REMOTE_VERIFICATION_PENDING -> REMOTE_VERIFIED
```

On interruption, rerun the same binding. A matched mutation resumes verification. If the terminal checkpoint exists but the result is absent, the driver reopens the receipt and remote truth and reconstructs the result. A different owner/state/scope/resource binding fails closed.

## 3. Evidence and cleanup

- Generate evidence keys only from exact candidate, dependency/input/profile/command/result fingerprints, exit status and coverage ids. A result/fingerprint change or nonzero exit invalidates all covered evidence; unrelated main paths may refresh only the baseline; intersecting paths run focused coverage; contract/dependency/profile/command changes run full coverage; frozen semantic conflict returns `DESIGN_GAP`.
- A Stage cleanup plan requires one observation for every bound resource. Missing, dirty, unknown or SHA-mismatched resources are preserved as failures. Removal succeeds only with an explicit post-removal `exists=false` observation; verified completed keys are skipped on retry.
- A remote cleanup binding contains exactly the bound owner branch and expected SHA. The cleanup-only PR verifier consumes the complete name-status diff and accepts only exact `D` entries for the authorized terminal Feature Packets; any addition or modification fails.
- Validate persisted artifacts against their published schema with `schema-validate`; CI also runs representative schema/runtime parity tests.
