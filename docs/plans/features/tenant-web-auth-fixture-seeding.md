# Tenant Web Auth Fixture Seeding

featureKey: tenant-web-auth-fixture-seeding
truthCommit: 1fc961d7e320bf57b69a2879b4b4e57b5a150c95
baseSha: 1fc961d7e320bf57b69a2879b4b4e57b5a150c95
integrationBranch: codex/tenant-web-auth-fixture-seed
worktreeKey: 9d4f
pullRequest: none (local follow-up candidate)
priorMergeSha: cad78c03508ed046f0053e16d05ab08a301e9dc4
cleanup: HOLD
state: ACCEPTED

## Objective

Extend the same repository-owned `pnpm db:seed` path with the exact Auth, PolicyInstance, Item Master, and canonical MES navigation fixtures needed by the current full-page acceptance run. Keep task-owned database bindings, idempotent replay, redacted output, fail-closed errors, existing Auth journeys, and Public Card fixtures unchanged.

## Navigation role truth table

| Entry key | Pages | Existing canonical role-to-entry truth | Fixture action |
| --- | --- | --- | --- |
| `master-data.supplier-management` | PAGE-053..055 | DESIGN_GAP | no role mapping invented |
| `sales.quote-orders` | PAGE-056..059 | DESIGN_GAP | no role mapping invented |
| `procurement.management` | PAGE-060..066 | DESIGN_GAP | no role mapping invented |
| `wms.management` | PAGE-067..069 | DESIGN_GAP | no role mapping invented |
| `finance.dashboard` | PAGE-070..072 | DESIGN_GAP | no role mapping invented |
| `mes.mold-management` | PAGE-073..075 | `mes.forming_workshop.supervisor` | seed one MeiLong tenant instance, exact permissions, account binding, and foundation-owned default-terminal visibility |

The first five groups remain explicit design gaps because current navigation foundation defines their registry entries but no role-to-entry policy. This feature does not grant them to `tenant.admin` or create new cross-domain roles.

## Slices

### task-bound-seed-orchestration

state: ACCEPTED
candidate: b5629347d2230868b89e87f8d236a4cdceee3785
review: same feature-ri `01a052d7-1611-7001-8e91-e6d6e70b2fb5`

- Scope: local database lifecycle orchestration; seven exact task database bindings; dedicated recovery-grant, MFA-required/scenario, first-login setup, bounded PolicyInstance preview, Item Master detail/create dependency, and MES navigation fixtures; credential-redacted output; focused tooling and real-page verification.
- Protected scope: production or shared databases, legacy Docker projects, non-task-owned containers/volumes/networks, committed credentials, service business contracts, and unrelated seeders.
- Dependencies: existing task-owned environment bootstrap, lifecycle ownership checks, official tenant-web and Permission foundation fixtures, and the seven service-owned Prisma schemas used by the seeder.
- Moving-main revalidation: after the earlier accepted receipt `c0f17b2c`, the same owner merged exact `main@1fc961d7` as local append-only merge candidate `b5629347` (parents `c0f17b2c` then `1fc961d7`). All 14 product paths remain byte-identical to accepted candidate `82e7d050`, and the Packet at the merge remains byte-identical to accepted receipt `c0f17b2c`. No rebase, remote mutation, or owner replacement occurred.
- Acceptance: fresh/repeat/drift/failure/recovery/rollback proofs; exact fixture inventory; PAGE-003/004/006/021/044/047/051/052 and PAGE-073..075 real-page results; first five navigation groups reported as DESIGN_GAP rather than broadened; no credential material in output; Public Card and prior Auth behavior preserved.

## Current findings and evidence

- Root cause 1: the three dedicated Auth accounts were missing `WEB` terminal access. The official seed now recreates only those accounts with deterministic WEB access and lifecycle verification covers the exact count/digest.
- Root cause 2: the MFA factor repository requires all four factor-policy rows. The seed now enables TOTP and explicitly disables EMAIL_OTP, SMS_OTP, and BACKUP_CODE with deterministic priorities; recovery changed the lifecycle snapshot from one to four factors.
- Root cause 3: PAGE-003 attempted permission hydration before honoring the server `passwordSetupRequired` state. Auth finalization now routes the minimal authenticated context directly to first-login password setup, with a regression test proving access-summary and context hydration are skipped.
- Root cause 4: Policy preview consumed a flat response although the API returns the preview result under its response envelope. The view and test now consume the actual contract shape.
- Root cause 5: lifecycle host-side Prisma commands trusted the persisted PostgreSQL port after Docker daemon restart even when Docker had republished the task container on a different host port. Lifecycle operations now resolve the live published mapping as authoritative, persist the refresh, and cover the remap with a focused regression test.
- Real-browser results: PAGE-003 reached first-login setup without mutating the password; PAGE-006 reached TOTP and the exact real API completion succeeded; PAGE-021 returned `allowed=true` and `POLICY_ALLOW_MATCHED`; PAGE-044/047/051/052 rendered their exact task fixtures; the two canonical MES routes rendered for `mes.forming_workshop.supervisor` while the negative account retained zero MES role, permission, and visibility rows.
- Bounded existing blocker: PAGE-004 reaches recovery step 2 with masked destinations, then the Auth backend rejects challenge creation with `AUTH_NOTIFICATION_TRACEPARENT_REQUIRED`. Notification startup and the exact backend failure are recorded; this feature does not broaden into the notification tracing contract.
- Old-base focused verification: 66/66 concurrent Node tests and 25/25 tenant-web Vitest tests pass. The trusted-runtime suite now owns an isolated offline task env and injected selector profile, eliminating dependence on database-lifecycle residue.
- Old-base lifecycle recovery: the expected one-to-four MFA transition first failed closed with `SEED_NOT_IDEMPOTENT`, the official retry reached `SEEDED`, repeat seed passed, and the post-transient database verification passed all 21 databases plus the tenant-web snapshot.
- Post-main lifecycle proof: rollback removed exactly the task-owned containers, volumes, networks, and state; fresh `up`/`health` passed; migration recovered from one transient Prisma schema-engine failure; seed recovered from two transient host-routing failures; and verification detected the daemon remap with `POSTGRES_PORT_REFRESH before=56816 after=51229` before passing all 21 databases.
- Post-main repeat/drift/recovery proof: repeat seed plus verify both passed; a task-local lifecycle snapshot-only count drift made verify fail closed with `VERIFY_SEED_SNAPSHOT_MISMATCH`; the first official seed then failed closed with `SEED_NOT_IDEMPOTENT` and cleared the stale snapshot; the second official seed plus verify restored `SEEDED`/`VERIFIED` with all 21 databases passing. No business table was directly modified for drift injection.
- Post-main focused verification: all 70 Node tests and all 25 tenant-web Vitest tests pass on the merged tree, including the live Docker port-remap and verification-state regressions.
- Feature RI finding closure: verification now records `VERIFYING` before checks and `VERIFY_FAILED` on every failure instead of preserving an earlier `VERIFIED` phase. A live port refresh is persisted immediately before migrate/seed/verify work, so later failure retains the current mapping. Combined stale-port plus snapshot-only drift proved `POSTGRES_PORT_REFRESH`, nonzero verify, `VERIFY_FAILED`, and the live port in one run; the official two-seed recovery and final 21-database verify then passed.
- Feature RI accepted exact candidate `82e7d050a318f2804101128aafba373a74aee5f1` after independently confirming both finding closures, the 70/70 Node and 25/25 tenant-web results, candidate/archive tree identity, and exact rollback-to-base tree identity.
- Latest-main focused verification: exact append-only merge candidate `b5629347` passes all 70 Node tests and 51 tenant-web Vitest tests across Auth, Policy preview, Item Model Create, and latest-main Role Management coverage.
- Latest-main lifecycle verification: initial rollback read back zero task containers, volumes, networks, and state; fresh `up`/`health`/21-database migration, fresh seed, repeat seed, and verify all passed on live PostgreSQL port `59336`.
- Latest-main remap/drift/failure recovery: an injected stale state port `51229` plus snapshot-only factor count `3` produced `POSTGRES_PORT_REFRESH before=51229 after=59336`, nonzero verify, persisted live port, and exact `VERIFY_FAILED`. The first official seed then produced the expected `SEED_NOT_IDEMPOTENT`, `SEED_FAILED`, and null snapshot; the second seed plus 21-database verify restored factor count `4` and `VERIFIED`. Final rollback again read back zero task containers, volumes, networks, and state.
- Same Feature RI `01a052d7-1611-7001-8e91-e6d6e70b2fb5` accepted exact latest-main candidate `b5629347d2230868b89e87f8d236a4cdceee3785` with no findings after independently rerunning Node 70/70 and tenant-web 51/51 and reopening the fresh/repeat/21-database, remap/drift failure, two-seed recovery, zero-resource rollback, and four-artifact evidence. Remote publication and execution-profile preparation remain out of scope while the governing design is under review.

## Feature acceptance

1. Focused tests reproduce the missing lifecycle command and unsafe service `.env` fallback before the fix, then pass with an explicit task-bound seven-database environment.
2. Unit tests cover fresh plan, repeat ordering/idempotency inputs, missing and foreign environment values, host/task port divergence, credential redaction, partial command failure, shared-stack rejection, and independent recovery/MFA/setup fixture state.
3. A task-owned runtime cycle proves fresh seed, repeat seed, recovery/MFA/setup fixture presence, verification, fail-closed expired/replayed grant state, and exact rollback without touching foreign resources.
4. The exact candidate passes formatting/lint for changed files, focused Node tests, and the affected database lifecycle tooling suite.
5. An independent visible Feature RI accepts the exact candidate before remote publication and Draft PR creation.
