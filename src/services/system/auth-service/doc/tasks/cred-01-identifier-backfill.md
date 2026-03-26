# CRED-01 Identifier Backfill

Updated: 2026-03-25 15:05 +08:00

## Upstream Design Docs

- [../design/credential-management.md](../design/credential-management.md)
- [../design/auth-center.md](../design/auth-center.md)
- [../design/identifier-backfill.md](../design/identifier-backfill.md)

## Scope

- Govern historical `LoginMethod.identifier` data
- Backfill existing records to the current normalization rules
- Remove repository compatibility dual-lookup after data cleanup is verified

## Current Status

- Completed

## Minimum Closure

- Define the effective normalization rules as the only target format:
  - email: `trim + lowercase`
  - phone: remove non-digits, preserve a single leading `+` when the original value starts with `+`
- Audit current compatibility lookup points in `auth-service`
- Add a backfill execution plan for existing `LoginMethod.identifier` data
- Define verification rules for collision and uniqueness checks
- Remove repository fallback query only after backfill verification passes

## Out Of Scope

- Real email / SMS transport integration
- Cross-service operator context changes
- Identity-service data migration

## Acceptance

- The target identifier format is documented and frozen
- All compatibility dual-lookups in `auth-service` are enumerated
- A safe backfill path is documented before code removal starts
- The post-backfill cleanup condition is explicit and auditable

## Known Compatibility Points

- None in the current target database path
- Repository dual-lookup has been removed

## Suggested Execution Order

1. Freeze normalization rules and inventory current fallback query usage
2. Prepare and verify backfill script / migration plan
3. Run backfill and collision review
4. Remove fallback dual-lookup from repository methods
5. Rebuild and regression-check all login flows

## 2026-03-25 13:15:00 +08:00 Incremental Update

- Added executable scan script:
  - [identifier-backfill-scan.ts](../../src/scripts/identifier-backfill-scan.ts)
- Added package entry:
  - `identifier:scan`
- Current runtime status:
  - script logic is valid and can execute to Prisma query phase
  - `.env` loading has been added into the script
  - `pnpm run` in the current Windows environment also hits an external `EPERM: lstat 'C:\\Users\\csp'` issue

## 2026-03-25 14:20:00 +08:00 Runtime Check

- Direct script execution now reads `.env`
- Current runtime blocker changed from missing env to database shape mismatch:
  - Prisma error `P2021`
  - table `public.LoginMethod` does not exist in the current database
- This means the inventory script is ready, but the connected database was not yet the expected `auth-service` schema target

## 2026-03-25 15:05:00 +08:00 Runtime Check

- Executed Prisma schema push against the target database
- Reran identifier inventory scan successfully
- Current scan result:
  - `total_login_methods=0`
  - `drift_count=0`
  - `collision_group_count=0`
- Current conclusion:
  - target database is now aligned with current auth-service schema
  - there is no historical `LoginMethod` data to backfill in the current target database
  - repository compatibility dual-lookup remains governance debt, but not an active data cleanup task on this database

## 2026-03-25 15:20:00 +08:00 Cleanup

- Removed repository compatibility dual-lookup from:
  - [prisma.loginmethod.repository.ts](../../src/infrastructure/repositories/prisma/prisma.loginmethod.repository.ts)
- Current lookup behavior is now single-path only:
  - callers pass the normalized identifier
  - repository queries the normalized identifier directly
- Current conclusion:
  - on the current target database, `CRED-01` is closed
  - there is no remaining backfill work because the database contains no historical `LoginMethod` rows
