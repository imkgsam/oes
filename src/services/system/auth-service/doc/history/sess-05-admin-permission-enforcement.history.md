# SESS-05 Admin Permission Enforcement

Updated: 2026-04-20 00:28 +08:00

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
- 2026-04-20 follow-up pitfall:
  - `AuthenticatedOperatorGuard` does not automatically parse operator metadata just because the guard is present in `@UseGuards(...)`
  - The guard only activates operator-context verification/attachment when the interface also declares `@RequirePermission(...)` or `@RequireAuthenticatedOperator()`
  - We hit this exact bug on `AdminDeleteAccountSessions`: the new RPC used `InternalServiceGuard + AuthenticatedOperatorGuard`, but omitted both metadata decorators, so handler-level `getRequiredOperatorId(...)` failed with `APP_SECURITY_003`
  - Team rule going forward:
    - any admin / management gRPC interface that reads operator identity, operator scope, or resource-boundary context must declare `@RequirePermission(...)` or `@RequireAuthenticatedOperator()`
