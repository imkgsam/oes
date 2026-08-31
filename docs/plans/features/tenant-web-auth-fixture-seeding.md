# Tenant Web Auth Fixture Seeding

featureKey: tenant-web-auth-fixture-seeding
truthCommit: 37641aca82867c4fa51d5a644efb0740e297803b
baseSha: 37641aca82867c4fa51d5a644efb0740e297803b
integrationBranch: codex/tenant-web-auth-fixture-seed
worktreeKey: 9d4f
pullRequest: https://github.com/imkgsam/oes/pull/54
mergeSha: pending
cleanup: HOLD
state: ACCEPTED

## Objective

Make the repository-owned tenant-web authentication fixture seeder part of the ordinary `pnpm db:seed` path, with explicit task-owned database bindings, idempotent replay, credential-redacted output, fail-closed errors, and no access to shared or legacy stacks.

## Slices

### task-bound-seed-orchestration

state: ACCEPTED
candidate: 72b9ae7929b471af1f4871888821f119425ea366
review: feature-ri `01a052d7-1611-7001-8e91-e6d6e70b2fb5` accepted exact published candidate `9e965a80c00b958d629dd7cd1175456eb1ceac76`; bounded post-PR50 rebind pending

- Scope: local database lifecycle orchestration, tenant-web authentication seed environment contract, dedicated password-recovery/MFA-required/first-login-password-setup acceptance fixtures, credential-redacted seeder output, focused tooling tests, and current runbook guidance.
- Protected scope: production or shared databases, legacy Docker projects, non-task-owned containers/volumes/networks, committed credentials, service business contracts, and unrelated seeders.
- Dependencies: the existing task-owned environment bootstrap, database lifecycle ownership checks, official tenant-web fixture builders, and the six service-owned Prisma schemas used by the seeder.
- Moving-main revalidation: `origin/main@37641aca82867c4fa51d5a644efb0740e297803b` has no exact path overlap with this feature. PRs #48/#55/#50 are semantically adjacent through tenant-session hydration, HUMAN OBO, and Auth-owned email/phone password failure handling; they do not alter the task-owned database lifecycle, fixture builders, Prisma schema, migrations, recovery/MFA/first-login state, or Public Card data. The same Feature RI performs a bounded exact-head rebind after affected login/session and task-owned seed validation.
- Acceptance: fresh `db:seed` includes the official fixture; repeat `db:seed` is stable; missing/foreign/mixed-port database bindings fail before writes; lifecycle host URLs use the current task runtime port rather than service `.env`; recovery, MFA-required and setup-required journeys each have a dedicated resettable identity/state; expiry, invalid challenge and replay remain fail-closed; no login identifier, password, OTP, TOTP secret, or database credential is printed; a failed tenant-web seed exits non-zero and does not record `SEEDED`; rollback remains bound to the exact task project.

## Feature acceptance

1. Focused tests reproduce the missing lifecycle command and unsafe service `.env` fallback before the fix, then pass with an explicit task-bound six-database environment.
2. Unit tests cover fresh plan, repeat ordering/idempotency inputs, missing and foreign environment values, host/task port divergence, credential redaction, partial command failure, shared-stack rejection, and independent recovery/MFA/setup fixture state.
3. A task-owned runtime cycle proves fresh seed, repeat seed, recovery/MFA/setup fixture presence, verification, fail-closed expired/replayed grant state, and exact rollback without touching foreign resources.
4. The exact candidate passes formatting/lint for changed files, focused Node tests, and the affected database lifecycle tooling suite.
5. An independent visible Feature RI accepts the exact candidate before remote publication and Draft PR creation.
