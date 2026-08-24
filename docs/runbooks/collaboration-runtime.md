# Collaboration Runtime Operations

This runbook operates the contracts defined by [Codex execution model](../governance/codex-execution-model.md). It does not create owner, merge, or cleanup authority.

## 1. Effective owner profile

1. Render `scripts/collaboration-runtime/profile/oes-project-owner.config.toml` with the exact repository, owner, Git common-directory, artifact, task-temp, and package-cache paths.
2. Store the rendered SHA-256 in the existing authorization envelope.
3. Execute the actual filesystem, Git switch/add/commit, standard build/test, task-owned database, `127.0.0.1`, approved GitHub network, credential-reference-key, and approval-telemetry probes.
4. Accept only a valid `OES_EFFECTIVE_PROFILE_REPORT` with `approvalPolicy=on-request`, `approvalsReviewer=auto_review`, and `normalPermissionPromptCount=0`.
5. A declared failure before handoff is `EXECUTION_ENVIRONMENT_NOT_READY`; after handoff it is `EXECUTION_PROFILE_DEFECT` and retains the owner/state. An undeclared operation is `PERMISSION_EXPANSION_REQUIRED`.

## 2. Remote transaction

Prepare an unsealed `OES_REMOTE_DRIVER_BINDING` under the exact owner's artifact root. Fill the existing owner/state/transition/scope authorization and exact refs/SHAs, then seal and validate it:

```sh
node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  binding-fingerprint --input binding.unsealed.json --output binding.json
node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  validate-binding --binding binding.json
scripts/collaboration-runtime/bin/oes-remote-driver --binding binding.json
```

Use one action per binding: `preflight`, `publish-pr`, `verify-pr`, `merge-pr`, `verify-main`, or `cleanup`. Publication is Draft-only. Merge requires an exact Human merge fingerprint and either native merge-queue admission or the exact serial-admission lock path. Cleanup requires the exact cleanup fingerprint and resources.

The driver atomically advances:

```text
REMOTE_PREFLIGHT_VERIFIED -> REMOTE_MUTATION_RECORDED
-> REMOTE_VERIFICATION_PENDING -> REMOTE_VERIFIED
```

On interruption, rerun the same binding. The driver reads remote truth first and resumes verification when branch, PR, queue, merge, or cleanup state already matches.

## 3. Evidence and cleanup

- Generate evidence keys only from the exact candidate, dependency/input/profile/command/result fingerprints, exit status, and coverage ids.
- Run the affected-test matrix after main drift. Exact inputs reuse evidence; unrelated paths refresh the baseline; intersecting paths run focused coverage; contract/dependency/profile/command changes run full coverage; frozen semantic conflicts return `DESIGN_GAP`.
- Stage cleanup accepts one fingerprinted batch. Each FL receives only its own exact resources. Dirty, unknown, or SHA-mismatched resources are preserved. Verified successful resources are skipped on retry.
- A cleanup-only PR may delete exactly the authorized terminal Feature Packet paths and no product or stable-truth files.
