# OES collaboration runtime

This directory is the repository-owned implementation of the reliability rules frozen in `docs/governance/codex-execution-model.md`.

## Components

- `profile/`: exact-owner project profile template. It seals the owner/transition identity, separates the owner-exclusive Git directory from shared metadata, keeps the action-authorization root read-only, and grants only the protocol's shared serial-admission directory.
- `src/profile-policy.ts`: closed approval-mode rendering, installed-profile/launch-receipt sealing, and monotonic same-owner successor transitions.
- `src/profile-preflight.ts`: mandatory two-phase production capability probes, v1 read compatibility, v2-only writing, fixed current-attempt plus exact draft/session/turn-bound issuer telemetry records, all-context managed/restricted telemetry hashing, zero-normal-prompt acceptance, and bounded defect/repair routing.
- `src/resource-topology.ts`: sealed stable-owner resource bindings, physical owner-namespaced scratch roots, private Git/common-directory observation, durable Packet/evidence/checkpoint verification, duplicate-transition detection, and exact-path recovery planning.
- `src/remote-driver.ts`: monotonic remote transaction state, result-loss reconstruction, and read-after-write recovery.
- `src/github-adapter.ts`: exact Git/GitHub implementation for `preflight`, `publish-pr`, `verify-pr`, `merge-pr`, `verify-main`, and `cleanup`, including repository rules, review, annotation, merge-group, and merge-parent gates.
- `src/admission.ts`: crash-resumable global lock for serialized latest-main admission. Native queue receipts bind the generated base/head commits and their exact checks.
- `src/proposal-queue.ts`: read-only FIFO derivation from exact UD native history, immutable Proposal/source/return binding, duplicate/superseded handling, typed terminal-result delivery proof, single-flight admission, and on-demand bounded visibility.
- `src/retry-policy.ts`: bounded transient retry with exponential backoff/jitter, immediate permission blockers, profile-read-only live-CI run/job observation verification, and a monotonic owner/job/SHA receipt that authorizes one same-SHA infrastructure rerun and rejects run aliases or transition rebound.
- `src/local-main.ts`: read-only designated-checkout eligibility plus profile-trusted Human confirmation, exact owner/transition/nonce/realpath/ref/SHA binding, monotonic nonce recovery, and guarded `fetch`/`ff-only` convergence; dirty, diverged, non-main, symlink-drift, or active-operation state is preserved.
- `src/evidence.ts`: evidence keys and changed-path/contract/dependency/profile/command/result invalidation decisions.
- `src/cleanup.ts`: profile-derived protected Stage/child authorization narrowing, observation-bound partial-failure preservation, post-removal verification, and complete cleanup-only diff verification.
- `src/stage-merge.ts`: immutable Stage merge-card validation, ordered single-item admission, live Git/GitHub proof for merged prefixes and moving-main equivalence, healthy-prefix preservation, and suffix stop.
- `src/stage-lifecycle.ts`: pre-cleanup task-native creation-receipt authority versus current parent/child/state readback reconciliation, plus dependency-ordered partial-retry automatic archive planning that excludes the long-lived Global UD.
- `src/assignment-runtime.ts`: direct event-driven assignment state, bounded WIP/replan enforcement, and physical reopen/hash/schema verification of typed result artifacts before lane completion.
- `src/schema-validation.ts` and `schemas/`: an executable JSON Schema subset plus versioned binding, authorization, checkpoint, receipt, result, profile, evidence, cleanup and diff contracts.

## Commands

```sh
pnpm collaboration-runtime:check

node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  profile-render --input exact-profile-render.json

node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  profile-preflight-probe --input exact-profile-probe.json

# After the issuer selects the fixed current attempt, and that target turn completes with its
# attempt-scoped rollout snapshot record sealed:
node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  profile-preflight-finalize --input exact-profile-finalize.json

node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  validate-binding --profile-report effective-profile.json --binding binding.json

node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  ud-queue-view --input exact-ud-native-history.json

node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  ci-recovery-decision --profile-report effective-profile.json \
  --input ci-recovery-input.json

node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  local-main --profile-report effective-profile.json \
  --binding local-main-sync-binding.json

scripts/collaboration-runtime/bin/oes-remote-driver --profile-report effective-profile.json --binding binding.json
```

The remote driver loads its owner, transition, authorization root, and admission root only from the reopened, hash-verified installed effective profile; the report owner/transition must equal those profile-sealed values, and per-command environment variables are not trust inputs. It never creates authority. A creating parent or exact Human-gate issuer writes an `OES_REMOTE_ACTION_AUTHORIZATION` beneath the profile-configured, owner-read-only authorization root beneath the installed profile directory before mutation. A binding references its exact bytes/fingerprint and must compare equal on owner, state/version, transition, scope, truth/base/candidate, repository, resources, action, nonce, and any merge/cleanup authorization. Under `stable-owner-exclusive-v1`, the profile, authorization root/action, binding, checkpoint, and result also carry the same sealed owner-resource binding; checkpoint/result/invalidation files must be the exact `remote-actions/<action>/<nonce>/` descendants of that binding's stable artifact root. The CLI deliberately has no binding- or cleanup-authority sealing command.

Publication is Draft-only. Merge requires an exact Human merge fingerprint and either the global serial-admission lock at the exact profile-bound `latest-main.lock` or native queue admission. Queue recovery records the generated base/head pair and validates `Baseline Checks` on that head. Main verification binds the merge SHA, confirms two parents with the PR head second, checks ancestry and reviewed/merge-group tree identity, and validates main CI. Remote cleanup accepts one exact SHA-matched remote branch. Stage child cleanup reopens the fixed protected `current-stage-cleanup.json` CAS record and its exact state/version/transition-bound root and child assignment. A cleanup batch has exactly one topology: legacy batches continue to derive `codex/feature/<featureKey>`, `/private/tmp/oes-fl-<featureKey>`, and `/private/tmp/oes-fl-<featureKey>-artifacts`; stable batches derive the ref, owner clone, and task-temp paths only from each terminal feature's sealed owner-resource binding. Mixed batches, aliases, and any stable resource not equal to the binding-derived identity fail closed. Every SHA-bearing child resource is bound to the feature's exact accepted candidate; its stable owner is the binding's exact task with the Stage Lead as direct parent. Git-invalid aliases, including `HEAD`, and the Stage-owned `codex/cleanup/<stageKey>` ref are outside the child contract. Feature Packets stay outside child resources and are deleted only by the Stage cleanup-only PR after complete child verification.

A Stage card's `authorizationFingerprint` is passed as the existing remote driver's `mergeAuthorizationFingerprint`. `stage-merge-plan` requires `--repository-root`, admits no more than the first incomplete ordered item, and re-reads merged PR head, Merge Commit parents, current-main ancestry, and main `Baseline Checks`; the first parent chain must be exact authorization base/revision-main → prior verified merge, and a failed item stops the same-Stage suffix. `stage-merge-revision` additionally requires the refreshed head to descend from the previous head and latest main, rejecting rebases/history rewrites even when patch bytes match. `stage-lifecycle-plan` derives its trust root from `--profile-report`, reopens the protected current cleanup authorization, and accepts only trust-root references to issuer-written creation authority, task-native inventory, and archive result set. All three bind the current cleanup authorization fingerprint and transition. Direct caller summaries have no archive-planner entry. It exposes only the earliest incomplete dependency tier, retries exact failed results, blocks dependants, and excludes Global UD.

The single required `CI / Baseline Checks` context is produced by one authoritative workflow. Its deterministic Change Plan selects DOCS, SCOPED, or FULL from the complete Git diff, workspace reverse-dependency graph, and the versioned cross-service relationship table. Pull-request FULL runs require an exact-head confirmation label before expensive jobs start; the final gate fails closed while confirmation is absent. Integration runs use task-owned Postgres/NATS resources with readiness, selected migrations, `finally` teardown, and residue checks. Main runs quick smoke only, while eligible scheduled, manual, and release runs execute FULL.

A crash after remote success is resumed from exact branch/PR/queue/main truth. A crash after the terminal checkpoint but before result write reconstructs the typed result from the checkpoint receipt plus fresh remote verification; no matched mutation is issued twice.

Proposal queue output is always derived from the supplied exact UD native message/receipt history and is never persisted as a scheduler, inbox, registry, or second queue. A terminal Proposal receipt reopens a typed terminal result and exact delivery event, then matches Proposal/fingerprint, terminal status, payload hash, exact return task, delivery outcome, and delivery fingerprint before releasing UD single-flight; response loss may replay only the same bytes. Transient remote reads or mutations perform at most three retries; a mutation retry first rereads live truth and reuses an already-satisfied postcondition. CI recovery reopens an immutable live-truth observation beneath the profile-read-only authorization root, proves that the failed job belongs to the exact completed failed run and candidate SHA, and binds both to the profile-sealed owner and transition. It writes one owner/job/SHA rerun receipt before returning permission to rerun; identical recovery replays the receipt, while a run alias or transition rebound fails closed. Local-main inspection never fetches or mutates a checkout, while sync reopens a profile-read-only Human confirmation, binds exact owner/transition/nonce/realpath/root/remote/SHA/action, and rechecks every guard before and after the single `ff-only` update. Sync fsyncs a complete claim in a temporary file, atomically publishes it without replacement before the first Git command, and reopens any existing checkpoint for transition validation. An exact `CLAIMED` checkpoint resumes idempotently; an interrupted unpublished temporary file is ignored, while a stale checkpoint cannot cross the mutation boundary.

Stable recovery reopens and rehashes the owner binding, current evidence manifest, Feature Packet, checkpoint bundle, and optional Git bundle before deciding anything. A present exact owner clone is reused. A missing stable clone may be restored only to the same bound path and ref from the exact verified Git bundle; a missing task-temp root may be rebuilt only at its bound scratch path. Repeating either operation is idempotent. Pre-cutover resources retain their original paths and return a binding mismatch on loss; the stable runtime never migrates or replaces them.
