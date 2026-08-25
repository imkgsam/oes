# Infrastructure and Databases

featureKey: infrastructure-databases
truthCommit: 8638401207d3d94fd3695e8d5e25deaf3e2a760a
baseSha: 7a5df0a61315667e8966b4161f08b8fa71c7bd0c
integrationBranch: codex/feature/infrastructure-databases
worktreeKey: infrastructure-databases
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: CANDIDATE_READY

## Objective

Make the repository-declared local infrastructure and the 21 service-owned PostgreSQL databases reproducibly start, become healthy, migrate, seed, verify, and roll back from a clean worktree. Preserve service ownership boundaries and use only task-owned local resources.

## Invariants

- Each of the 21 services owns a distinct database and connection URL; no service reads or writes another service database.
- Local project, container, network, volume, host-port, and database names derive from the worktree task key and never collide with another worktree.
- Local credentials are generated development fixtures, remain outside Git, and match container readiness and lifecycle commands.
- Deployable histories and preserved legacy fragment bytes are immutable and auditable. Deploy never falls back to `prisma db push`.
- Seed is idempotent. Rollback targets only the exact task-owned resources created by the driver and fails closed on ownership mismatch.
- Stable service, gRPC, event, tenant/org/operator/trace/audit, and data-ownership semantics do not change.

## Slices

### INFRA-DB-1 — Inventory and failure reproduction
state: CANDIDATE_READY
candidate: 5f63d09a6d1d71614efebf1c135bfa2a9e616b3a
review: self ACCEPT

- Scope: Inventory the main/infra Compose files, Dockerfiles, 21 schemas, migration histories, package scripts, and environment mapping; record symptom, trigger, root cause, and an acceptance-to-evidence matrix.
- Protected scope: No product data, shared containers/databases, secrets, or stable semantic changes.
- Dependencies: reproducible-build@7a5df0a61315667e8966b4161f08b8fa71c7bd0c.
- Acceptance: A deterministic check reproduces stale services, missing Dockerfiles, shared/static infrastructure resources, credential/readiness mismatches, missing migrations, and lifecycle-entry gaps.

### INFRA-DB-2 — Task-owned infrastructure Compose
state: CANDIDATE_READY
candidate: 5f63d09a6d1d71614efebf1c135bfa2a9e616b3a
review: self ACCEPT

- Scope: Converge main and infra Compose infrastructure definitions on task-keyed project/container/network/volume/host-port inputs and consistent PostgreSQL, Redis, NATS, MinIO, and observability readiness.
- Protected scope: Local proof only; production topology, production/shared data, new secrets, and event semantics remain unchanged.
- Dependencies: INFRA-DB-1.
- Acceptance: Config render and up/health/down prove collision-free task-owned infrastructure, consistent credentials, and cleanup without touching foreign resources.

### INFRA-DB-3 — Complete service image topology
state: CANDIDATE_READY
candidate: 5f63d09a6d1d71614efebf1c135bfa2a9e616b3a
review: self ACCEPT

- Scope: Remove stale Entity/Resource entries, provide the required reusable service Dockerfile strategy, and include Gateway plus all 21 existing services in the main Compose topology.
- Protected scope: No service boundary, port contract, trust manifest, or gRPC runtime changes.
- Dependencies: INFRA-DB-1.
- Acceptance: Static inventory and `docker compose config` show exactly Gateway plus the canonical 21 services, with no missing build context/Dockerfile and no Entity/Resource service.

### INFRA-DB-4 — Database migration lifecycle
state: CANDIDATE_READY
candidate: 5f63d09a6d1d71614efebf1c135bfa2a9e616b3a
review: self ACCEPT

- Scope: Provide distinct service database creation/URL mapping, `prisma migrate deploy` for every schema, baseline migrations for the eight zero-migration schemas, and failure-safe orchestration.
- Protected scope: Existing migration history and business models remain semantically unchanged; no `db push`, shared database, or destructive production command.
- Dependencies: INFRA-DB-1, INFRA-DB-2.
- Acceptance: All 21 schemas deploy to distinct task-owned databases; repeat deploy is a no-op; an injected partial failure returns non-zero and resumes without corrupting completed databases.

### INFRA-DB-5 — Idempotent seed and rollback
state: CANDIDATE_READY
candidate: 5f63d09a6d1d71614efebf1c135bfa2a9e616b3a
review: self ACCEPT

- Scope: Add a repository-owned seed contract and task-owned rollback driver; preserve existing domain seed entry points and use no fabricated cross-service data.
- Protected scope: No production/shared data, business-policy expansion, or cross-service seed writes.
- Dependencies: INFRA-DB-4.
- Acceptance: Seed runs twice with the same verified result; rollback removes only exact task-owned databases/volumes/project resources; ownership mismatch fails closed.

### INFRA-DB-6 — Clean-worktree lifecycle verification
state: CANDIDATE_READY
candidate: 5f63d09a6d1d71614efebf1c135bfa2a9e616b3a
review: global-ri pending on exact integration HEAD

- Scope: Add focused static/unit tests and run clean-worktree infra up -> health -> migrate -> seed -> verify -> rollback, including repeat, failure, and recovery paths.
- Protected scope: Test-only local data and repository-declared containers; no remote mutation until feature/global review gates pass.
- Dependencies: INFRA-DB-2, INFRA-DB-3, INFRA-DB-4, INFRA-DB-5.
- Acceptance: Literal commands, outputs, exit statuses, tool versions, dependency fingerprint, and resource-removal proof are recorded for the exact candidate; Global RI returns ACCEPT.

## Feature acceptance

1. Main and infra Compose share one consistent infrastructure definition, contain no stale Entity/Resource services, and main Compose includes Gateway and all 21 current services without missing Dockerfiles.
2. PostgreSQL, Redis, NATS, MinIO, and observability resources are healthy under a task-keyed Compose project with isolated names, ports, network, volumes, and local credentials.
3. The 21 Prisma schemas use 21 distinct service-owned database URLs and auditable `migrate deploy`; all zero-migration schemas have a baseline.
4. Seed is repeatable and idempotent; lifecycle rollback is runnable, ownership-checked, and leaves foreign resources unchanged.
5. Focused checks cover static drift, partial migration, repeat execution, cleanup mismatch, and clean-worktree end-to-end lifecycle.
6. Feature self-review and independent Global RI accept the exact committed candidate. The versioned remote driver then publishes only this owner branch and creates an independent Draft PR; required CI succeeds before `READY_FOR_STAGE_REVIEW`.

## Reproduced failures and formal repair

- Main Compose mixed static container/volume names, one shared database URL, stale Entity/Resource entries, and five missing service-specific Dockerfiles. Infra Compose duplicated the same resources with different PostgreSQL credentials and health checks.
- Eight schemas had no migration; nine other histories started with fragments that referenced tables absent from an empty database; four deployable histories still drifted from their current datamodel.
- The repair uses one included infrastructure definition, one reusable service Dockerfile, task-keyed labels/project/resources, 21 distinct databases, complete baselines for empty/incomplete histories, byte-preserved legacy fragments with SHA-256 manifests, and additive reconciliation migrations where the existing history was deployable.
- Lifecycle verification compares every migrated database to its datamodel, verifies migration counts and seed snapshots, and refuses rollback when the owner/project/resource fingerprint changes.

## Remaining bounded risk

- The complete baselines replace histories that were already proven non-deployable from an empty database. Their old SQL is preserved byte-for-byte for review, but this stage does not exercise an upgrade against production/shared databases; those resources remain protected and outside this local delivery binding.
- Service runtime trust/port corrections remain owned by the parallel `trust-foundation` feature. This feature preserves the source ports and only supplies collision-free container networking.

## Evidence keys

- handoff profile: `handoff-smoke.log`, `handoff-smoke-final.txt`
- reproduction/audit: `migration-history-audit.log`, `migration-history-audit-after.log`, `schema-drift-audit-before.log`
- failure/recovery/repeat: `final-db-migrate-injected-failure.log`, `final-db-migrate-recovery.log`, `final-db-migrate-repeat.log`
- seed/schema verification: `final-db-seed-first.log`, `final-db-seed-repeat.log`, `final-db-verify.log`
- clean lifecycle/rollback: `final-clean-db-cycle.log`, `pre-final-cycle-rollback.log`
- Compose/Docker/static: `docker-build-final.log`, `static-verification.log`, `final-focused-verification.log`
- evidence root: owner-local path bound in the handoff envelope; no credential values are included in tracked files.

## Validation route

- Static: Compose render/inventory, Dockerfile/build-context existence, schema/migration/database mapping, shell/Node syntax, repository status.
- Focused: lifecycle-driver unit tests and injected failure/retry/ownership-mismatch cases.
- Component: task-owned PostgreSQL/Redis/NATS readiness plus 21 database migrate/seed verification.
- Journey: clean worktree bootstrap then infra up, health, migrate, seed, verify, rollback, and exact resource absence.
- Review: FL self-review, Global RI on the exact frozen candidate, Draft PR required CI, then Stage Review by the parent SL.

## Feature Review

- Result: `ACCEPT` for implementation ancestor `5f63d09a6d1d71614efebf1c135bfa2a9e616b3a`; exact integration HEAD is the subsequent packet-freeze commit assigned to Global RI.
- Scope review: all 115 changed paths are within Compose/Docker, database lifecycle, service migration/package entry, and this Feature Packet ownership. No trust manifest, Common gRPC transport/context, service model, proto, or cross-owner path changed.
- Behavior review: task-owned clean cycle reports infra health, 21 successful deploys, two idempotent seed snapshots, 21 schema matches, and exact rollback with zero labeled containers/volumes/networks remaining.
- Negative review: injected failure exits 1 after three migrations; the same databases resume and repeat with exit 0; owner/resource fingerprint mismatch is rejected by focused tests.
- Evidence reuse: dependency candidate build evidence remains valid for untouched backend/service source. This feature additionally builds one generic service image and the Gateway image from the clean Docker context.
- Remote state: no push or PR mutation has occurred; Global RI acceptance is required before requesting the parent-issued one-time remote binding.
