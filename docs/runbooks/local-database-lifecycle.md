# Local Database Lifecycle

This runbook operates only the current worktree's task-owned local database stack. The lifecycle derives one `OES_TASK_KEY`, one Compose project, isolated named resources, and one database per Prisma service from ignored local environment files.

## Prepare

```bash
pnpm env:bootstrap
pnpm env:check
pnpm db:config
```

`db:config` is read-only. If application Compose requires projected machine selectors, provide the current task-local selector projection before running this validation; do not reuse values from another worktree or shared stack.

Host-side development uses PostgreSQL on the fixed loopback endpoint `127.0.0.1:5432`, matching every generated service `.env`. Stop any older container already publishing host port `5432` before starting this stack.

## Fresh database and ordinary seed

```bash
pnpm db:up
pnpm db:health
pnpm db:migrate
pnpm db:seed
pnpm db:verify
```

`pnpm db:seed` is the only supported host entry for repository-owned seeders. It generates clients, builds Common, applies permission and collaboration seeds, and runs the tenant-web auth fixture seeder with seven explicit loopback URLs using the current task runtime PostgreSQL port. The lifecycle also passes the exact environment-key-to-database inventory and runtime port; the seeder validates every URL against that binding before loading a Prisma client. Direct seeder invocation has no service `.env` fallback and fails before database writes when the task binding is missing, foreign, merely contains the task key, duplicated, non-loopback, or uses any other port.

Every host-side lifecycle command re-reads the task container's published PostgreSQL port and rejects any mapping other than `5432`. A persisted value from the former dynamic-port configuration is refreshed to `5432` without discarding the current seed snapshot.

Verification changes the lifecycle phase to `VERIFYING` before semantic checks. Any failed migration, schema, invariant, or seed-snapshot check records `VERIFY_FAILED`; only a complete pass records `VERIFIED`. A detected legacy PostgreSQL port refresh is persisted before migrate, seed, or verify work begins, so later command failure cannot restore a stale port.

The tenant-web auth seed output contains counts and status only. It does not print login identifiers, passwords, OTPs, TOTP secrets, or database URLs.

Before running the first seed command, the lifecycle replaces any older `SEEDED` or `VERIFIED` record with `SEEDING` and clears its snapshot. A command or snapshot failure records `SEED_FAILED` with no snapshot and exits non-zero; only a complete verified snapshot records `SEEDED`.

## Watched backend runtime

```bash
pnpm backend
```

The backend command migrates the task databases, synchronizes the Permission foundation, reconciles the fixed machine-workload selector projection, creates task-local trust leaves, and prepares the execution signer and issuer before starting watched services. Each watcher receives its own generated trusted-runtime environment rather than relying on the minimal Prisma `.env`. Console output retains the full outer workload prefix, for example `[permission-service] [run]` and `[api-gateway] [run]`.

`NATS_URL_REQUIRED`, `gRPC mTLS is required`, and `AUTH_EXECUTION_ISSUER is required` at process bootstrap mean a service bypassed this prepared runtime boundary. Do not copy those derived values into the service `.env`; rerun the backend entry so endpoints, certificates, workload identity, policy selectors, and issuer state remain one atomic task-owned profile.

## Replay and acceptance fixtures

Run the ordinary seed again to restore the same baseline:

```bash
pnpm db:seed
pnpm db:verify
```

Replay removes stale managed password-recovery grants and OTPs, MFA bindings, and password-setup requirements before recreating the declared baseline. The lifecycle snapshot rejects missing fixture state and detects non-idempotent results. `db:verify` requires a successful seed snapshot and rechecks the exact recovery channel types, TOTP binding fingerprint, Beichen `WEB` policy flags/factor order, and `FIRST_LOGIN` setup reason; semantic drift exits non-zero.

The source of the three dedicated acceptance identities is `scripts/local/tenant-web-auth-test-fixtures.mjs` under `AUTH_ACCEPTANCE_FIXTURES`:

- `passwordRecovery`: verified email and phone recovery channels; no pre-consumed grant.
- `mfa`: isolated `beichen` tenant `WEB` policy plus one active TOTP binding; it does not alter the existing PDA, browser-extension, meilong, or haisheng login policy.
- `passwordSetup`: one active first-login password requirement; completing it consumes only that user's requirement.

Test code may read fixture credential material in-process. Keep identifiers, passwords, OTPs, reset tokens, TOTP secrets, and generated codes out of command output, screenshots, and committed evidence.

Existing Auth runtime rules remain authoritative for expiry and replay: recovery OTPs and grants expire, grants are single-use, MFA challenges require the exact pending flow and factor, and completed password-setup requirements are no longer active. Re-run `pnpm db:seed` before each independent acceptance replay.

## Rollback

```bash
pnpm db:rollback
```

Rollback validates the saved task key, Compose project, resource fingerprint, owner labels, and exact resource inventory before deleting the current task's containers, volumes, networks, and local lifecycle state. Foreign, shared, legacy, dirty, or mismatched resources fail closed and remain untouched.
