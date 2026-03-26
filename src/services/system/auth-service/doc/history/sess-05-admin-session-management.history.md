# SESS-05 Admin Session Management

Updated: 2026-03-25 12:30 +08:00

## Scope

- Extend `SESS-05` with admin-side minimal session management
- Do not add admin restore or suspend in this slice
- Keep the existing session model unchanged

## Result

- Added `AdminListUserSessions`
- Added `AdminRevokeSession`
- Admin session view now includes revoke metadata
- Added audit event `ADMIN_SESSION_REVOKED`

## Validation

- `pnpm proto:gen`
- `pnpm --filter @oes/common build`
- `pnpm --filter auth-service build`
