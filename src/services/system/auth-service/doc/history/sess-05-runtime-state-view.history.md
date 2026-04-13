# SESS-05 Runtime State View History

## 2026-03-28

### Scope

- enrich `SESS-05` session queries with minimal runtime-state fields

### Result

- `SessionView` now returns `accessRemainingSeconds`
- `SessionView` now returns `refreshRemainingSeconds`
- `AdminSessionView` now returns `accessRemainingSeconds`
- `AdminSessionView` now returns `refreshRemainingSeconds`
- current values come directly from the session aggregate instead of forcing clients to derive them from timestamps

### Validation

- `pnpm proto:gen`
- `pnpm --filter @oes/common build`
- `pnpm --filter auth-service build`
