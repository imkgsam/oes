# MFA-06 OTP MFA Binding Management History

## 2026-03-27

### Scope

- complete the Phase 1 OTP MFA management surface for `EMAIL_OTP` and `SMS_OTP`

### Result

- added user-side query for current OTP MFA bindings
- added enable / disable commands for `EMAIL_OTP` and `SMS_OTP`
- enabling now requires a matching verified and enabled login method
- session/login challenge behavior now works against formally managed bindings instead of implicit data assumptions
- audit events now include MFA binding enable / disable changes

### Validation

- `pnpm proto:gen`
- `cd src/common && pnpm exec tsc -b --force`
- `pnpm --filter auth-service build`
