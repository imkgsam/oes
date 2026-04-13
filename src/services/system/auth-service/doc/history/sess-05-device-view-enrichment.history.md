# SESS-05 Device View Enrichment History

## 2026-03-28

### Scope

- improve `SESS-05` readability by surfacing richer device hints in session query responses

### Result

- `SessionView` now returns `platform` and `browser`
- `AdminSessionView` now returns `platform` and `browser`
- user-side and admin-side session queries now consume the normalized device hints derived during session creation
- this round does not add new session-management actions; it only improves the device-facing read model

### Validation

- `pnpm proto:gen`
- `pnpm --filter @oes/common build`
- `pnpm --filter auth-service build`
