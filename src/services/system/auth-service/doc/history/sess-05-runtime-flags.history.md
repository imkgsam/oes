# SESS-05 Runtime Flags History

## 2026-03-28

### Scope

- enrich `SESS-05` session queries with direct runtime-state flags

### Result

- `SessionView` now returns `isAccessExpired`
- `SessionView` now returns `isRefreshExpired`
- `SessionView` now returns `isRevoked`
- `AdminSessionView` now returns `isAccessExpired`
- `AdminSessionView` now returns `isRefreshExpired`
- `AdminSessionView` now returns `isRevoked`
- current values are derived from the session aggregate instead of forcing clients to infer state from timestamps and status strings

### Validation

- `pnpm proto:gen`
- `pnpm --filter @oes/common build`
- `pnpm --filter auth-service build`
