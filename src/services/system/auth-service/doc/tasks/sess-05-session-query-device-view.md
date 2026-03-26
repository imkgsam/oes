# SESS-05 Session Query And Device View

Updated: 2026-03-26 00:20 +08:00

## Upstream Design Docs

- [../design/session-token-management.md](../design/session-token-management.md)
- [../design/auth-center.md](../design/auth-center.md)

## Scope

- Provide user-side session list and minimal device management
- Provide admin-side minimal session query and single-session revoke
- Align admin interfaces to existing project-level operator context

## Current Status

- Partially implemented

## Minimum Closure

- `ListSessions`
- `LogoutOtherDevices`
- `RenameSessionDevice`
- `AdminListUserSessions`
- `AdminRevokeSession`
- Admin actor comes from authenticated operator context instead of request-body `adminId`

## Out Of Scope

- Admin suspend / restore
- Full device inventory lifecycle management
- Cross-service operator context redesign

## Acceptance

- User can query own sessions
- User can rename a user-owned device
- User can keep current session and revoke other sessions
- Admin can list a user's sessions
- Admin can revoke a target session with reason
- Admin interfaces no longer accept `adminId` in proto request body
- Admin interfaces require authenticated operator context
- Admin interfaces require explicit permission codes
- `pnpm --filter auth-service build` passes

## 2026-03-25 12:00:00 +08:00 Incremental Update

- Added `RenameSessionDevice`
- Current user can rename a user-owned session device
- Validation now enforces session existence and ownership

## 2026-03-25 12:30:00 +08:00 Incremental Update

- Added admin-side minimal session management
- Added `AdminListUserSessions`
- Added `AdminRevokeSession`
- Current `SESS-05` now also covers:
  - admin-side full user session list
  - admin-side single-session revoke with reason

## 2026-03-25 15:40:00 +08:00 Incremental Update

- Removed `adminId` from:
  - `AdminListUserSessionsRequest`
  - `AdminRevokeSessionRequest`
- `AuthGrpcController` now resolves admin operator identity from authenticated operator context
- Admin interfaces now use:
  - `@RequireAuthenticatedOperator()`
  - `InternalServiceGuard`
  - `AuthenticatedOperatorGuard`
- Current `SESS-05` admin path is aligned with the existing cross-service operator context design

## 2026-03-26 00:20:00 +08:00 Incremental Update

- Added unified permission-code enforcement for admin session interfaces
- `AdminListUserSessions` now requires:
  - `AUTH_SESSION_PERMISSION_CODES.ADMIN_VIEW_USER_SESSIONS`
- `AdminRevokeSession` now requires:
  - `AUTH_SESSION_PERMISSION_CODES.ADMIN_REVOKE_SESSION`
- `auth-service` now provides an `OperatorPermissionResolver` implementation backed by authenticated operator-context `operator_permissions`
- Current `SESS-05` admin path now requires both:
  - authenticated operator identity
  - explicit permission code authorization


## Related Design Docs

- [../design/session-token-management.md](../design/session-token-management.md)
- [../design/auth-center.md](../design/auth-center.md)
