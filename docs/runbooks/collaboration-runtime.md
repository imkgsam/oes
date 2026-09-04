# Collaboration Runtime Operations

This runbook operates the contracts defined by [Codex execution model](../governance/codex-execution-model.md). It does not create owner, merge, or cleanup authority.

## 1. Effective owner profile

1. Choose exactly one mode, `ON_REQUEST_AUTO_REVIEW` or `NEVER_USER`, and pass only that discriminant to the renderer/launcher. It atomically derives `on-request/auto_review` or `never/user`; a raw approval-policy/reviewer pair has no supported entry. Render `scripts/collaboration-runtime/profile/oes-project-owner.config.toml` with the exact repository, owner, owner-exclusive `.git`, artifact, task-temp, package-cache, trusted-authorization, and serial-admission paths. Never render a shared Git common directory as owner-writable. A stable task-temp root is the physical direct child of the platform temp parent whose leaf is exactly `oes-owner-<sha256(exact ownerTaskId UTF-8 bytes)>`; the temp parent itself, a logical alias, a generic/shared child, another owner's derived leaf, or any deeper ancestor is never owner-owned. Before cutover, set `resource_topology_version = "pre-cutover-v1"` and leave the binding reference empty; after cutover, set `stable-owner-exclusive-v1` and render the exact path, SHA-256, and fingerprint of one sealed `OES_OWNER_RESOURCE_BINDING` under the owner's stable artifact root. Except for the derived pair, mode label, and their integrity summaries, compare the two renderings byte-for-byte across filesystem, network, credential, resource-topology, and other permission fields.
2. Atomically install and read back the rendered bytes and SHA-256. Seal a launch receipt with the selected mode, derived pair, complete profile hash, expected managed/restricted effective permission/sandbox fingerprint, and owner/resource binding. The trusted authorization root is a descendant of the installed profile directory and remains owner-read-only; the serial root contains only the shared exact `latest-main.lock`.
3. Before each probe turn, the creating parent/Human-gate issuer atomically replaces the fixed profile-derived `current-profile-probe-attempt.json` under the owner-read-only authorization root. Its `OES_PROFILE_PROBE_ATTEMPT` binds one unique attempt id, exact request-contract fingerprint, owner, transition, profile generation, launch receipt, expected rollout session, and the only accepted attempt-scoped snapshot-record path. Then run `profile-preflight-probe` with the exact request and task-local draft path. It performs actual filesystem, disposable Git switch/add/commit, focused build/runtime tests, task-owned SQLite, `127.0.0.1`, GitHub read, and credential-key-only probes, then self-hashes the attempt identity, request, observations, literal evidence, and credential reference. After that turn completes, the issuer atomically imports the complete Codex event source and writes `OES_APPROVAL_TELEMETRY_SNAPSHOT_RECORD` only at the attempt-selected path; the record repeats the exact attempt, draft/request, rollout session, completed turn, and snapshot path/SHA/fingerprint. A following same-profile turn runs `profile-preflight-finalize` without any caller-selected attempt, record, or telemetry path. It reopens the fixed current attempt, derives the record and telemetry paths, executes only telemetry observation and report sealing, and inspects every `turn_context` in the bound completed rollout. Replacing the current attempt invalidates an older identical-content draft and report; replacing the attempt-scoped record makes an older record reference unusable. Owner-local, symlink-escaped, changed-request/draft, wrong-session, incomplete-turn, or failed evidence is rejected. There is no production or compatibility one-step writer.
4. Accept only a reopened `OES_EFFECTIVE_PROFILE_REPORT`: every observation has hashed literal evidence; profile, launch receipt, current probe attempt, attempt-scoped snapshot record, and telemetry bytes rehash exactly; attempt, record, draft, request, rollout session, completed turn, telemetry path, SHA, and trusted-source fingerprint all compare equal; credential keys are exactly `username,password`; all contexts contain one stable closed pair, exact active managed profile identity, `permission_profile.file_system.type=restricted`, `file_system_sandbox_policy.kind=restricted`, an enumerated `workspace-write` sandbox, and the exact expected effective fingerprint; and `normalPermissionPromptCount=0`. `NEVER_USER` additionally requires `approvalEventCount=0`. Reject cross pairs, missing or unknown modes, duplicate-conflicting contexts, last-write-wins selection, installed/launch/effective drift, and actual disabled, unrestricted, or full-access sessions. A stable report is accepted only after reopening its binding, observing the exact private Git/common directory and symbolic owner ref, and rehashing the current Packet, evidence manifest, checkpoint bundle, and optional Git bundle. New reports are v2; the frozen v1 reader accepts only legacy `on-request/auto_review` and never authorizes `NEVER_USER`.
5. A declared failure before handoff is `EXECUTION_ENVIRONMENT_NOT_READY`; after handoff it is `EXECUTION_PROFILE_DEFECT` and retains owner/state. An undeclared operation is `PERMISSION_EXPANSION_REQUIRED`. Any mode, profile-byte, or effective-fingerprint change uses a monotonic successor profile transition in the same task and reruns affected smoke; never reuse the predecessor's authorization or binding for the successor.

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
- The official Stage child plan requires `--profile-report`, a root `--authorization`, and a protected `--child-authorization`; it also reopens the fixed profile-protected `current-stage-cleanup.json` CAS record, requires its exact active purpose/root/child/state/version/transition, derives the child owner from the accepted profile, and rejects caller-selected owner input. The Stage verifier uses the same fixed current record with the Stage-owner purpose; issuer replacement with `INVALIDATED` or `COMPLETED` makes old cards unusable. A Stage cleanup plan requires one observation for every bound resource and exactly one topology across the batch. Legacy cards keep the frozen pre-cutover derivation: local/remote refs are exactly `codex/feature/<featureKey>` with exact SHA, worktrees are exactly `/private/tmp/oes-fl-<featureKey>` with exact SHA, and task temp is exactly `/private/tmp/oes-fl-<featureKey>-artifacts` with no Git SHA. Stable cards embed one validated owner-resource binding per feature and derive the ref, owner clone, and task-temp path only from it; the binding's exact owner has the Stage Lead as direct parent. Stable and legacy resources cannot be mixed. Every SHA-bearing resource equals that feature's accepted candidate SHA, and the Stage ref is exactly `codex/cleanup/<stageKey>`. Git-invalid names, alternate path spellings, protected or other-owner roots, shared temp parents, another owner's derived scratch leaf, and Feature Packets are excluded from child cleanup resources. The cleanup planner re-derives the scratch leaf from the exact cleanup owner and revalidates physical containment immediately before emitting `REMOVE`. Missing, dirty, unknown or SHA-mismatched resources are preserved as failures. Removal succeeds only with an explicit post-removal `exists=false` observation; verified completed keys are skipped on retry.
- A remote cleanup binding contains exactly the bound owner branch and expected SHA. The cleanup-only PR verifier consumes the complete name-status diff and accepts only exact `D` entries for the authorized terminal Feature Packets; any addition or modification fails.
- Validate persisted artifacts against their published schema with `schema-validate`; CI also runs representative schema/runtime parity tests.
- Before each Stage item, run `stage-merge-plan --authorization CARD --results CURRENT_RESULTS --technical-revisions REVISIONS --repository-root REPOSITORY` and execute only `nextItem`. A `MERGED_VERIFIED` prefix is accepted only after live GitHub PR/head/merge-parent/main-ancestry/`Baseline Checks` readback. The first item's Merge Commit first parent must equal its authorized integration base (or the trusted revision's latest main); every later first parent must equal the immediately preceding verified merge SHA, while the second parent must equal that item's effective head. Append one exact result and plan again. `STOPPED_FAILURE` preserves `healthyPrefix` and prohibits `blockedSuffix`. If main moved, use `stage-merge-revision --repository-root REPOSITORY`; the runtime reads current remote main, both Git diffs, the refreshed PR head and its latest `Baseline Checks` itself. The refreshed head must be a descendant of both latest main and the previous feature head, so only append-only merging of main is accepted; rebase/history rewrite is not a technical refresh. Any ancestry/patch/content/scope/risk/set mismatch invalidates the remaining card instead of producing a revision.
- At each task creation, the creating parent preserves the task-native creation receipt in `OES_STAGE_LIFECYCLE_ROSTER_AUTHORITY` beneath the installed profile's owner-read-only authorization root. When cleanup intent is detected, a task-native transport queries the complete parent/child/state roster and writes `OES_STAGE_LIFECYCLE_INVENTORY` beneath that root. `stage-lifecycle-plan` now requires `--profile-report`, the protected current Stage cleanup `--authorization`, and trusted references for `--roster-authority` and `--inventory`; caller-authored JSON has no planner entry. Every receipt binds the exact Stage cleanup authorization fingerprint and transition. Missing/extra/reparented tasks, incomplete topology, or truncated readback fail before archive. After each returned `ARCHIVE` tier is executed with the task archive API, the task-native transport writes one inventory-bound `OES_STAGE_ARCHIVE_RESULT_SET` beneath the same root; `--prior-results` accepts only its trusted reference. The planner advances IT/Feature RI → FL → Stage Design → Stage RI → SL, retries only the failed tier, and excludes Global UD.

## 4. Authoritative CI operation

`CI / Baseline Checks` is the sole required aggregate. The Change Plan always runs and reports one of
`DOCS`, `SCOPED`, `FULL`, or `FULL_REQUIRED`. The detailed selection contract is defined by
[Testing And CI](../architecture/platforms/testing-and-ci.md).

For a pull request:

1. Resolve the immutable base and candidate SHAs and run the planner.
2. Upload the deterministic human-readable and JSON plans.
3. For `DOCS`, run documentation structure, formatting, and link checks.
4. For `SCOPED`, run the selected owner builds and Unit, Component, Contract, Integration, and Journey
   groups. Every group consumes the exact plan rather than a caller-authored package list.
5. For `FULL`, run the complete inventory after Human confirmation when the profile was triggered by
   the pull-request diff.
6. Aggregate every planned job. A missing, skipped contrary to plan, cancelled, failed, or residue-
   bearing result fails `CI / Baseline Checks`.

`FULL_REQUIRED` is an intentional blocked result, not a reduced test profile. Report the reasons,
owners, selected scope, phases, and estimated cost in the plan artifact. After Human confirmation,
rerun the exact candidate through an explicit full request. Nightly, manual, and release full runs use
their pre-authorized trigger semantics and do not add another confirmation.

Integration jobs derive task-owned Postgres/NATS/Compose identity from the workflow run and job. Wait
for readiness, run the plan, then always perform teardown and residue checks. Keep only proven shared-
resource conflicts in serial groups; Collaboration/Notification live NATS remains one such group.

On `merge_group`, plan and validate the exact generated combined result. On `push main`, run integrity
and the five critical quick-smoke families only. A migration-caused smoke failure, missing required
context, demonstrated selector omission, or unreliable execution prepares a revert of the single
test/CI migration Merge Commit; remote mutation still requires its own Human confirmation.

## 5. Stable owner recovery and compatibility

1. Reopen the installed profile's exact binding reference and rehash the binding before inspecting resources. Never infer stable topology from a path shape.
2. Reopen and rehash the current evidence manifest, Feature Packet, checkpoint bundle, and optional Git bundle. Each path must equal the one sealed by the binding and remain beneath the stable artifact root.
3. If the exact clone and private Git/common directory still match, reuse them. If the stable clone is absent and the verified Git bundle exists, restore only the same owner clone/ref, then re-observe repository, Git directory, common directory, and symbolic ref before success. If only task-temp is absent, rebuild only that exact scratch root. Both operations must converge when repeated.
4. If a pre-cutover owner loses any bound resource, preserve its original binding and report `RESOURCE_BINDING_MISMATCH`. Do not create a stable replacement, move paths, rename refs, or include that owner in a stable cleanup batch.
5. Treat any owner/transition rebound, stable/legacy mixture, digest drift, private-Git mismatch, missing durable artifact, or cleanup derivation mismatch as a closed failure. Preserve all resources for owner-led recovery.

## 6. Approval-mode profile repair

1. Preserve the exact task, owner, candidate, receipt, ref, worktree/artifact binding, and remote-absent or remote-present observation. Profile repair never provisions a replacement owner and never republishes a preserved candidate.
2. Reopen the installed profile, launch receipt, effective report, and complete rollout event source. Classify the exact mismatch before mutation; do not repair a raw pair or overwrite one `turn_context` in place.
3. Select one closed mode and create a monotonic successor profile transition with a fresh attempt-specific smoke directory. Render, install, launch, and read back the successor; predecessor evidence remains immutable and cannot authorize the successor.
4. Require the actual target session to expose the successor's managed/restricted permission/sandbox fingerprint and exact derived pair across every new context. Produce a v2 effective report, run only the affected smoke, and issue new remote authorization only after that report passes.
5. To roll back issuance, stop selecting `NEVER_USER` and use `ON_REQUEST_AUTO_REVIEW` for later successors while keeping the v2 reader active. Remove v2 compatibility only after every v2 owner reaches terminal/cleanup; never rewrite an accepted v2 report as v1.
