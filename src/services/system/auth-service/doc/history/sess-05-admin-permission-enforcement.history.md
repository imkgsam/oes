# SESS-05 Admin Permission Enforcement

Updated: 2026-03-26 00:20 +08:00

## Scope

- Enforce explicit permission codes on `SESS-05` admin session interfaces
- Consume unified permission-code constants from `@oes/common/authorization`
- Keep the current operator-context contract unchanged

## Changes

- Added auth session admin permission codes in `common`:
  - `auth.session.admin.view`
  - `auth.session.admin.revoke`
- Added `AuthOperatorPermissionResolver` in `auth-service`
- Wired `OPERATOR_PERMISSION_RESOLVER` in `AuthModule`
- `AdminListUserSessions` now uses:
  - `@RequirePermission(AUTH_SESSION_PERMISSION_CODES.ADMIN_VIEW_USER_SESSIONS)`
  - `InternalServiceGuard`
  - `AuthenticatedOperatorGuard`
  - `PermissionGuard`
- `AdminRevokeSession` now uses:
  - `@RequirePermission(AUTH_SESSION_PERMISSION_CODES.ADMIN_REVOKE_SESSION)`
  - `InternalServiceGuard`
  - `AuthenticatedOperatorGuard`
  - `PermissionGuard`

## Validation

- `pnpm --filter @oes/common build`
- `pnpm --filter auth-service build`

## Notes

- This slice consumes the legacy permission snapshot from authenticated operator context.
- It does not yet migrate `permission-service` to unified common permission-code constants.
