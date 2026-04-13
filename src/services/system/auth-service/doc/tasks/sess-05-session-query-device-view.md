# SESS-05 Session Query And Admin Session Management

Updated: 2026-03-28 23:15 +09:00

## Upstream Design Docs

- [../design/session-token-management.md](../design/session-token-management.md)
- [../design/auth-center.md](../design/auth-center.md)

## Scope

- Provide user-side session list and self-service session cleanup
- Provide admin-side minimal session query and single-session revoke
- Align admin interfaces to existing project-level operator context

## Current Status

- Implemented

## Minimum Closure

- `ListSessions`
- `LogoutOtherDevices`
- `AdminListUserSessions`
- `AdminRevokeSession`
- Admin actor comes from authenticated operator context instead of request-body `adminId`
- Session query responses carry readable device hints including `platform` and `browser`
- Session query responses carry minimal runtime state including remaining access/refresh lifetime
- Session query responses carry direct runtime statistics including session age and idle time
- Session query responses carry direct runtime flags for expiration and revocation

## Out Of Scope

- Admin suspend / restore
- Full device inventory lifecycle management
- Cross-service operator context redesign

## Acceptance

- User can query own sessions
- User can keep current session and revoke other sessions
- Admin can list a user's sessions
- Admin can revoke a target session with reason
- Admin interfaces no longer accept `adminId` in proto request body
- Admin interfaces require authenticated operator context
- Admin interfaces require explicit permission codes
- User-side and admin-side session lists can distinguish device platform/browser when derivable from `userAgent`
- User-side and admin-side session lists can directly read access/refresh remaining seconds
- User-side and admin-side session lists can directly read `sessionAgeSeconds / idleSeconds`
- User-side and admin-side session lists can directly read `isAccessExpired / isRefreshExpired / isRevoked`
- `pnpm --filter auth-service build` passes

## 2026-03-25 12:00:00 +08:00 Incremental Update

- Removed low-value device rename action from the active contract baseline

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
- `auth-service` now provides an `OperatorPermissionResolver` implementation backed by the legacy permission snapshot carried in authenticated operator context
- Current `SESS-05` admin path now requires both:
  - authenticated operator identity
  - explicit permission code authorization

## 2026-03-27 13:20:00 +09:00 Incremental Update

- `ListSessions` and `AdminListUserSessions` now also return `loginMethod`
- session display can now distinguish:
  - email password
  - email otp
  - phone password
  - phone otp
- current `loginMethod` value comes from session metadata written at `SelectAccount`

## 2026-03-28 12:40:00 +09:00 Incremental Update

- `ListSessions` and `AdminListUserSessions` now also return:
  - `platform`
  - `browser`
- current values are derived from normalized session `deviceInfo`
- this round focuses on improving device readability, not adding new session-management actions

## 2026-03-28 12:55:00 +09:00 Incremental Update

- session 管理动作相关审计事件现在已统一带上会话与设备上下文
- 当前覆盖的 session 相关事件包括：
  - `LOGIN_SUCCEEDED`
  - `SESSION_REFRESHED`
  - `LOGOUT_SUCCEEDED`
  - `LOGOUT_OTHER_DEVICES_SUCCEEDED`
  - `LOGOUT_ALL_SUCCEEDED`
  - `ADMIN_SESSION_REVOKED`
- 这轮仍不新增新的 session 管理接口，只补审计可观测性

## 2026-03-28 13:05:00 +09:00 Incremental Update

- `ListSessions` and `AdminListUserSessions` now also return:
  - `accessRemainingSeconds`
  - `refreshRemainingSeconds`
- these values come directly from the session aggregate instead of forcing clients to derive them from timestamps

## 2026-03-28 13:20:00 +09:00 Incremental Update

- `ListSessions` and `AdminListUserSessions` now also return:
  - `isAccessExpired`
  - `isRefreshExpired`
  - `isRevoked`
- these flags are derived from the session aggregate and remove the need for clients to infer state from timestamps/status strings

## 2026-03-28 23:15:00 +09:00 Incremental Update

- `ListSessions` and `AdminListUserSessions` now also return:
  - `sessionAgeSeconds`
  - `idleSeconds`
- current values come directly from the session aggregate
- current `SESS-05` now includes:
  - user-side session list
  - admin-side session list
  - device rename
  - keep-current-device logout
  - admin single-session revoke
  - readable device hints
  - direct runtime state
  - direct runtime statistics


## Related Design Docs

- [../design/session-token-management.md](../design/session-token-management.md)
- [../design/auth-center.md](../design/auth-center.md)
