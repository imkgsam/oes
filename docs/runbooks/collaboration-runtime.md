# Collaboration Runtime Operations

This runbook operates the contracts defined by [Codex execution model](../governance/codex-execution-model.md). It does not create owner, merge, or cleanup authority.

## 1. Effective owner profile

1. Render `scripts/collaboration-runtime/profile/oes-project-owner.config.toml` with the exact repository, owner, owner-exclusive `.git`, artifact, task-temp, package-cache, trusted-authorization, and serial-admission paths. Never render a shared Git common directory as owner-writable. Before cutover, set `resource_topology_version = "pre-cutover-v1"` and leave the binding reference empty; after cutover, set `stable-owner-exclusive-v1` and render the exact path, SHA-256, and fingerprint of one sealed `OES_OWNER_RESOURCE_BINDING` under the owner's stable artifact root.
2. Install/read back the rendered bytes and SHA-256. The trusted authorization root is a descendant of the installed profile directory and remains owner-read-only; the serial root contains only the shared exact `latest-main.lock`.
3. Prepare a `profile-preflight` input that binds the request, repository, smoke root and persisted Codex event source, then execute the production command. It performs actual filesystem, disposable Git switch/add/commit, proto lint/gen, common build, runtime tests, task-owned SQLite, `127.0.0.1`, GitHub read, credential-key-only, and approval-telemetry probes.
4. Accept only a reopened `OES_EFFECTIVE_PROFILE_REPORT`: every observation has hashed literal evidence, the profile and telemetry bytes rehash exactly, credential keys are exactly `username,password`, reviewer mode is `on-request/auto_review`, and `normalPermissionPromptCount=0`. A stable report is accepted only after reopening its binding, observing the exact private Git/common directory and symbolic owner ref, and rehashing the current Packet, evidence manifest, checkpoint bundle, and optional Git bundle.
5. A declared failure before handoff is `EXECUTION_ENVIRONMENT_NOT_READY`; after handoff it is `EXECUTION_PROFILE_DEFECT` and retains owner/state. An undeclared operation is `PERMISSION_EXPANSION_REQUIRED`.

## 2. Trusted remote transaction

The driver consumes authority; it does not mint it. It reopens the full-capability effective-profile report and derives the trusted authorization and serial-admission roots from the hashed installed profile; per-command environment variables cannot select either root. Before every action, the creating parent or exact Human-gate issuer atomically writes an `OES_REMOTE_ACTION_AUTHORIZATION` beneath the installed profile's trusted authorization root. The record references the root envelope/CAS record and binds the current owner/state/version, root confirmation, transition, scope, truth/base/candidate, repository/resource set, one action, nonce, and postcondition. Merge and cleanup records also bind their exact Human fingerprints.

Prepare a canonical `OES_REMOTE_DRIVER_BINDING` that references the authorization's exact path/SHA/fingerprint. Its corresponding fields and resource-set fingerprint must compare equal. A stable action also binds the exact owner-resource fingerprint and uses only `<artifactRoot>/remote-actions/<action>/<nonce>/{checkpoint.json,result.json,invalidated.json}`. A legacy profile rejects those stable fields, and a stable profile rejects their absence. Then validate and execute:

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

On interruption, rerun the same binding. A matched mutation resumes verification. If the terminal checkpoint exists but the result is absent, the driver reopens the receipt and remote truth and reconstructs the result. Stable checkpoints and results also compare the exact transition and owner-resource fingerprint, so a duplicate transition with changed resource identity fails before mutation. A different owner/state/scope/resource binding fails closed.

## 3. Evidence and cleanup

- Generate evidence keys only from exact candidate, dependency/input/profile/command/result fingerprints, exit status and coverage ids. A result/fingerprint change or nonzero exit invalidates all covered evidence; unrelated main paths may refresh only the baseline; intersecting paths run focused coverage; contract/dependency/profile/command changes run full coverage; frozen semantic conflict returns `DESIGN_GAP`.
- The official Stage child plan requires `--profile-report`, a root `--authorization`, and a protected `--child-authorization`; it also reopens the fixed profile-protected `current-stage-cleanup.json` CAS record, requires its exact active purpose/root/child/state/version/transition, derives the child owner from the accepted profile, and rejects caller-selected owner input. The Stage verifier uses the same fixed current record with the Stage-owner purpose; issuer replacement with `INVALIDATED` or `COMPLETED` makes old cards unusable. A Stage cleanup plan requires one observation for every bound resource and exactly one topology across the batch. Legacy cards keep the frozen pre-cutover derivation: local/remote refs are exactly `codex/feature/<featureKey>` with exact SHA, worktrees are exactly `/private/tmp/oes-fl-<featureKey>` with exact SHA, and task temp is exactly `/private/tmp/oes-fl-<featureKey>-artifacts` with no Git SHA. Stable cards embed one validated owner-resource binding per feature and derive the ref, owner clone, and task-temp path only from it; the binding's exact owner has the Stage Lead as direct parent. Stable and legacy resources cannot be mixed. Every SHA-bearing resource equals that feature's accepted candidate SHA, and the Stage ref is exactly `codex/cleanup/<stageKey>`. Git-invalid names, alternate path spellings, protected or other-owner roots, and Feature Packets are excluded from child cleanup resources. Missing, dirty, unknown or SHA-mismatched resources are preserved as failures. Removal succeeds only with an explicit post-removal `exists=false` observation; verified completed keys are skipped on retry.
- A remote cleanup binding contains exactly the bound owner branch and expected SHA. The cleanup-only PR verifier consumes the complete name-status diff and accepts only exact `D` entries for the authorized terminal Feature Packets; any addition or modification fails.
- Validate persisted artifacts against their published schema with `schema-validate`; CI also runs representative schema/runtime parity tests.

## 4. Stable owner recovery and compatibility

1. Reopen the installed profile's exact binding reference and rehash the binding before inspecting resources. Never infer stable topology from a path shape.
2. Reopen and rehash the current evidence manifest, Feature Packet, checkpoint bundle, and optional Git bundle. Each path must equal the one sealed by the binding and remain beneath the stable artifact root.
3. If the exact clone and private Git/common directory still match, reuse them. If the stable clone is absent and the verified Git bundle exists, restore only the same owner clone/ref, then re-observe repository, Git directory, common directory, and symbolic ref before success. If only task-temp is absent, rebuild only that exact scratch root. Both operations must converge when repeated.
4. If a pre-cutover owner loses any bound resource, preserve its original binding and report `RESOURCE_BINDING_MISMATCH`. Do not create a stable replacement, move paths, rename refs, or include that owner in a stable cleanup batch.
5. Treat any owner/transition rebound, stable/legacy mixture, digest drift, private-Git mismatch, missing durable artifact, or cleanup derivation mismatch as a closed failure. Preserve all resources for owner-led recovery.
