# Infrastructure and Databases

featureKey: infrastructure-databases
truthCommit: 8638401207d3d94fd3695e8d5e25deaf3e2a760a
baseSha: aef8e7ff3a30a801ab4df27fd2dafe42793215cf
integrationBase: aef8e7ff3a30a801ab4df27fd2dafe42793215cf
dependencyCandidate: reproducible-build@dca7b173d155a33e9c78b2213ad6c22943b4314a
integrationBranch: codex/feature/infrastructure-databases
worktreeKey: infrastructure-databases
pullRequest: 28
mergeSha: pending
cleanup: HOLD
state: CANDIDATE_READY

## Objective

Make the repository-declared local infrastructure and the 21 service-owned PostgreSQL databases reproducibly start, become healthy, migrate, seed, verify, and roll back from a clean worktree. Preserve service ownership boundaries and use only task-owned local resources.

## Invariants

- Each of the 21 services owns a distinct database and connection URL; no service reads or writes another service database.
- Local project, container, network, volume, host-port, and database names derive from the worktree task key and never collide with another worktree.
- Local credentials are generated development fixtures, remain outside Git, and match container readiness and lifecycle commands.
- Existing active Prisma migration identifiers and SQL bytes remain unchanged. Explicit baseline/resolve plans make non-empty legacy histories and empty installs converge without prisma db push.
- Seed fixtures are deterministic and idempotent. Rollback targets only the exact task-owned resources created by the driver and fails closed on ownership mismatch.
- Stable service, gRPC, event, tenant/org/operator/trace/audit, and data-ownership semantics do not change.

## Slices

### INFRA-DB-1 — Inventory and failure reproduction
state: CANDIDATE_READY
candidate: 35b7db53f087182fb1fd3ec203b2b21de5968eb1
review: self ACCEPT

- Scope: Inventory main/infra Compose, Dockerfiles, 21 schemas, migration histories, package scripts, and environment mapping; reproduce stale services, missing images, shared resources, credential/readiness mismatch, and migration gaps.
- Dependencies: reproducible-build@dca7b173d155a33e9c78b2213ad6c22943b4314a, merged to main as aef8e7ff3a30a801ab4df27fd2dafe42793215cf.
- Acceptance: Deterministic audit identifies each root cause and maps it to a bounded repair and evidence command.

### INFRA-DB-2 — Task-owned infrastructure Compose
state: CANDIDATE_READY
candidate: 35b7db53f087182fb1fd3ec203b2b21de5968eb1
review: self ACCEPT

- Scope: Converge main and infra Compose on task-keyed project/resources, consistent local credentials, digest-pinned images, and real HTTP readiness for Tempo, Loki, OTEL Collector, Grafana, and Nacos.
- Dependencies: INFRA-DB-1.
- Acceptance: Config/up/health/down prove isolated resources; pre-up and pre-down inspection rejects foreign owner or Compose-project labels.

### INFRA-DB-3 — Complete service image topology
state: CANDIDATE_READY
candidate: 35b7db53f087182fb1fd3ec203b2b21de5968eb1
review: self ACCEPT

- Scope: Remove stale Entity/Resource entries, use the reusable digest-pinned service image strategy, and include Gateway plus all 21 services.
- Dependencies: INFRA-DB-1.
- Acceptance: Compose render contains exactly Gateway plus the canonical 21 services with valid build files; Permission and Gateway images build from the final Docker context.

### INFRA-DB-4 — Database migration lifecycle
state: CANDIDATE_READY
candidate: 35b7db53f087182fb1fd3ec203b2b21de5968eb1
review: self ACCEPT

- Scope: Create 21 service databases/URLs, deploy all schemas, add baselines for the eight zero-migration schemas, and retain original active identifiers/bytes for nine incomplete-from-empty histories through versioned baseline/resolve manifests.
- Dependencies: INFRA-DB-1, INFRA-DB-2.
- Acceptance: Empty installs and a legacy-shaped database converge; repeat deploy is a no-op; partial legacy history and injected orchestration failure fail closed and resume safely.

### INFRA-DB-5 — Deterministic seed, invariants, and rollback
state: CANDIDATE_READY
candidate: 35b7db53f087182fb1fd3ec203b2b21de5968eb1
review: self ACCEPT

- Scope: Make Collaboration fixtures time-stable and create-only, make Permission fixture IDs deterministic, hash ordered fixture content, verify custom pg_catalog objects, and enforce resource-owner rollback guards.
- Dependencies: INFRA-DB-4.
- Acceptance: Repeated seed and a freshly recreated Permission database produce identical hashes; missing/custom-definition drift is rejected; rollback removes only exact task-owned resources.

### INFRA-DB-6 — Clean-worktree lifecycle verification
state: CANDIDATE_READY
candidate: 35b7db53f087182fb1fd3ec203b2b21de5968eb1
review: prior exact Global RI ACCEPT; moving-main affected validation ACCEPT

- Scope: Run static/unit, failure/recovery, upgrade, seed, custom-invariant, image-build, and clean-worktree lifecycle routes.
- Dependencies: INFRA-DB-2, INFRA-DB-3, INFRA-DB-4, INFRA-DB-5.
- Acceptance: Literal commands/outputs/statuses cover every feature condition; independent Global RI accepts the exact candidate.

All slices protect production/shared data, secrets, host/system privilege, remote mutation before review, stable contracts, and other feature owners' paths.

## Feature acceptance

1. Main and infra Compose share one infrastructure definition, contain no stale Entity/Resource service, and main Compose includes Gateway and all 21 current services without missing Dockerfiles.
2. PostgreSQL, Redis, NATS, MinIO, Nacos, and observability resources become actually ready under an isolated task-keyed project with consistent credentials.
3. Twenty-one schemas use 21 distinct service-owned URLs and auditable migrate deploy; eight former zero-migration schemas have baselines; nine historic chains preserve every original active migration ID and byte.
4. Seed content is deterministic across repeat and fresh-database runs; Prisma schema and versioned pg_catalog invariants are verified.
5. Failure injection, partial history, legacy adoption, invariant loss, ownership mismatch, repeat execution, and exact task-owned rollback are covered.
6. Self-review and independent Global RI accept the exact frozen candidate. Only then may the versioned remote driver publish this branch and create its independent Draft PR; required CI precedes READY_FOR_STAGE_REVIEW.

## Reproduced failures and formal repair

- Main Compose mixed static names, a shared database URL, stale Entity/Resource entries, and missing service Dockerfiles. Infra Compose duplicated resources with conflicting credentials/readiness. The repair uses one included task-keyed infrastructure definition, exact owner/project labels, random loopback ports, and digest-pinned images.
- Eight schemas had no migration; nine other histories referenced pre-existing tables from their first migration; four deployable histories drifted from current datamodel. The repair retains each original active migration ID/SQL byte, validates SHA-256 manifests, executes an audited complete baseline on an empty database, resolves original IDs plus baseline, adopts only schema/invariant-matching legacy databases, and rejects partial histories.
- Candidate d9f9abda76755214438656ac5a2cebf7b74570cd was rejected because it rewrote active history, compared seed counts only, treated Nacos/observability as process-only, checked resource ownership too late, omitted custom pg_catalog drift, and used mutable image tags. The first remediation closed those six root causes.
- Candidate a8138f53f7163daf6d97f8eecdce00387b6140bc was rejected because two runtime files were still ignored, main-only grpc_trust_runtime was not guarded, baseline resolution had no same-sequence checkpoint, and two Alpine helper refs were mutable. Implementation 9aa921398e960787351d4ef07be2371fa33b2ff7 tracks both files, enumerates all main resources, binds resumable intent to task/project/database OID/plan/targets, pins every rendered Compose image, and excludes Feature Packet-only documentation from the verified runtime Docker context.
- Tracked-only verification then exposed two clean-context prerequisites hidden by the owner worktree: images lacked generated Proto contracts, and lifecycle seed lacked generated/Common outputs. Digest-pinned Buf stages plus explicit generated/Common seed preparation close both clean-worktree defects.
- The final seed route hashes ordered Collaboration/Permission/Role content. The final verification route checks Prisma diff plus seven custom objects. Rollback checks the stored resource fingerprint and exact existing network/volume labels before any deletion.

## Remaining bounded risk

- Legacy adoption is proven against a task-local database shaped by the original Identity migration records. Production/shared upgrades remain protected and are not used as acceptance evidence.
- Service runtime trust/port corrections remain owned by trust-foundation; this feature preserves service boundaries and supplies only task-owned infrastructure/container wiring.
- Digest pins are platform-resolved artifacts verified on the current execution profile; multi-architecture publication remains a later packaging concern.

## Moving-main refresh — Stage stateVersion 88

- Upstream reproducible-build candidate dca7b173d155a33e9c78b2213ad6c22943b4314a is MAIN_VERIFIED through Merge Commit aef8e7ff3a30a801ab4df27fd2dafe42793215cf and main Baseline Checks 99023904021 success.
- The accepted FL2 dependency 7a5df0a61315667e8966b4161f08b8fa71c7bd0c is an ancestor of dca7b173d155a33e9c78b2213ad6c22943b4314a. Its final delta changes no build/env/package or FL2-owned product path, and the latest-main merge has no conflict or frozen semantic conflict.
- The 88-path feature patch before and after integration is byte-identical with SHA-256 2433e457e87d70b34157b506ad342acbaffffbe50185114292fcb3173d049f5e. Migration history, seed/failure recovery, Docker inputs, Compose, schema, and rollback evidence therefore remain reusable.
- The owner worktree and task-local environment were reconstructed, so build/env policy and the complete task-owned infra/21-database lifecycle were rerun. Both affected routes pass and exact rollback removes every task-owned resource.
- Integration commit 35b7db53f087182fb1fd3ec203b2b21de5968eb1 has parents 1b90f66ee3e007f2104cc795418ff50bea29895b and aef8e7ff3a30a801ab4df27fd2dafe42793215cf. The subsequent Packet-only freeze commit is the refreshed candidate for Draft PR #28.

## Evidence keys

- handoff: handoff-smoke.log, handoff-smoke-final.txt
- original reproduction/audit: migration-history-audit.log, migration-history-audit-after.log, schema-drift-audit-before.log
- orchestration failure/recovery: remediation/migrate-injected.log, remediation/migrate-recovery.log
- migration continuity: remediation/legacy-upgrade.log
- real readiness and clean lifecycle: remediation/final-clean-cycle.log
- custom-invariant negative/restoration: remediation/invariant-negative.log, remediation/verify-restored.log
- final fresh-database seed and rollback: remediation/final-fresh-seed-cycle.log
- focused tests/build: remediation/candidate-focused.log
- round2 closeout focused/negative: remediation-round3/focused-exact-b335.log, remediation-round3/focused-exact-9aa.log, remediation-round3/resolve-sequence-recovery-owner.log, remediation-round3/foreign-trust-volume-negative.log
- tracked-only prepare/config: remediation-round3/tracked-only-prepare.log
- tracked-only final images: remediation-round3/tracked-only-docker-build-exact-9aa.log
- tracked-only full lifecycle: remediation-round3/tracked-only-full-lifecycle-final.log
- moving-main affected matrix: affected-matrix-state88.json (SHA-256 103dda64714ee52a1058d15116e66a6cb96a24b0359b987596a3c8e5fc58733d)
- moving-main focused route: affected-focused-after-main.log
- moving-main full lifecycle: affected-full-cycle-after-main.log
- resumed execution profile: resume-profile-smoke.log
- evidence root is owner-local and contains no tracked credential value.

## Literal result summary

- pnpm db:config -> COMPOSE_CONFIG=PASS backendServices=21 totalServices=37, exit 0.
- Clean route -> five real READINESS status=PASS, INFRA_HEALTH=PASS containers=13, DATABASE_MIGRATE=PASS services=21, DATABASE_VERIFY=PASS databases=21, DATABASE_ROLLBACK=PASS, exits 0.
- Legacy route -> BASELINE_ADOPTED_LEGACY service=identity-service recordedMigrations=13 tables=8, then DATABASE_MIGRATE=PASS services=21.
- Fresh seed route -> identical collaborationTaskDigest=1c962576..., permissionDigest=bc3a1269..., roleDigest=dc574210... before/after rebuilding the Permission database; FRESH_REPEAT_EXITS migrate=0 seed=0.
- Invariant negative route -> DATABASE_INVARIANT_MISSING and exit 1 after dropping the task-owned Identity index; restored route verifies all seven objects.
- Focused route -> exact 9aa lifecycle policy 13/13, reproducible-build 16/16, Permission L1 76 suites/329 tests, Permission build; all exit 0.
- Resolve interruption route -> checkpoint recorded before baseline, injected failure after first CRM resolve exits 1, removing the checkpoint makes the same partial history exit 1, restoring the exact checkpoint resumes and completes 21 services.
- Trust-volume route -> a foreign exact-name grpc_trust_runtime makes rollback exit 1 and remains present; after bounded fixture teardown, rollback exits 0.
- Tracked-only route at 9aa921398e960787351d4ef07be2371fa33b2ff7 -> install/bootstrap/env-check/config and final Permission/Gateway image builds exit 0. The full up/health/migrate/seed/verify/rollback cycle at its runtime-equivalent ancestor b3357fa8318bc2d0e4c8c9a5becf9cb33f56a323 exits 0; the only subsequent runtime input change is `.dockerignore`, which excludes `docs`, and its policy assertion passes in the exact-candidate focused route.
- Moving-main focused route -> frozen install, idempotent bootstrap, env check, reproducible-build 16/16, lifecycle policy 13/13, and both Compose renders exit 0.
- Moving-main full cycle -> five real readiness endpoints, 21/21 migrate/seed/verify, deterministic fixture digests, custom invariants, ownership guards, and exact rollback; `AFFECTED_FULL_CYCLE_EXIT=0`.

## Validation route

- Static: Compose render/inventory, pinned-image policy, build-context existence, schema/migration/database mapping, syntax, dependency ancestry, and diff scope.
- Focused: lifecycle and reproducible-build unit tests; full Permission L1 and TypeScript build.
- Component: task-owned PostgreSQL/Redis/NATS/MinIO/Nacos/observability readiness; 21 database migrate/seed/schema/custom-object verification.
- Failure/recovery: injected migration interruption, legacy-history adoption, fresh database reseed, custom invariant removal/restoration, owner/project mismatch.
- Journey: clean worktree bootstrap then infra up -> health -> migrate -> seed -> verify -> rollback -> exact resource absence.
- Review: FL self-review, independent Global RI on exact packet-freeze HEAD, Draft PR required CI, then parent SL Stage Review.

## Feature Review

- Result: ACCEPT for moving-main integration ancestor 35b7db53f087182fb1fd3ec203b2b21de5968eb1; exact refreshed candidate is the subsequent Packet-only freeze commit.
- Scope: all 88 paths relative to integrationBase aef8e7ff3a30a801ab4df27fd2dafe42793215cf are within Compose/Docker, database lifecycle, migrations/seeds/package entry, or this Feature Packet ownership. Trust manifest, Common gRPC transport/context, proto, stable service models, and cross-owner paths are unchanged.
- Behavior: actual task-owned cycle proves 21 isolated databases, five real HTTP readiness endpoints, deterministic seed content, schema/custom-object equality, and exact rollback.
- Negative paths: injected orchestration failure, partial/legacy history checks, missing custom index, and foreign resource labels fail closed; recovery/repeat paths return 0.
- Evidence reuse: prior exact Global RI acceptance and negative/recovery/image evidence remain valid because the refreshed 88-path feature patch is byte-identical. Reconstructed owner environment invalidated runtime identity, so focused build/env and full infra/database lifecycle evidence were replaced by stateVersion 88 runs.
- Review history: d9f9abda and a8138f53 are immutable rejected candidates and are excluded from publication. Round3 must review the subsequent exact packet-freeze HEAD.
- Remote: Draft PR #28 remains open at previous head 1b90f66ee3e007f2104cc795418ff50bea29895b. Only the repository-owned amendment driver may fast-forward it to the refreshed Packet-freeze candidate; main merge and cleanup remain excluded.
