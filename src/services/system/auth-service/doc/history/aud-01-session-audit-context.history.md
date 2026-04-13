# AUD-01 Session Audit Context History

## 2026-03-28

### Scope

- enrich session-related auth audit events with a unified session/device context

### Result

- `LOGIN_SUCCEEDED`, `SESSION_REFRESHED`, `SESSION_DEVICE_RENAMED`, `LOGOUT_SUCCEEDED`, and `ADMIN_SESSION_REVOKED` now include a shared session context
- the shared context now carries:
  - `sessionId`
  - `userId`
  - `accountId`
  - `tenantId`
  - `loginMethod`
  - `deviceId`
  - `deviceName`
  - `userAgent`
  - `ipAddress`
  - `platform`
  - `browser`
- batch logout events now include affected session ids/counts
- this round does not add new external audit integrations; it improves the internal audit payload quality

### Validation

- `pnpm --filter auth-service build`
