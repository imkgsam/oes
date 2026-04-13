# SESS-05 Session Login Method View History

## 2026-03-27

### Scope

- extend session query views with login-method visibility

### Result

- `SelectAccount` now writes `loginMethod` into session metadata
- user-side and admin-side session queries now expose `loginMethod`
- session views can now show the authentication source of each session

### Validation

- `pnpm proto:gen`
- `cd src/common && pnpm exec tsc -b --force`
- `pnpm --filter auth-service build`
