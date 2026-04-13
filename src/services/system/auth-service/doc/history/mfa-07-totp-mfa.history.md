# MFA-07 TOTP MFA History

## 2026-03-28

### Scope

- complete the minimal `TOTP` MFA closure inside `auth-service`

### Result

- added `InitializeTotpBinding` and `ActivateTotpBinding` contracts
- `ListMfaBindings` now returns `TOTP`
- users can initialize a `TOTP` binding and receive `secret / qrCodeUrl`
- users can activate a binding with the first valid code
- users can disable `TOTP` through the existing MFA binding management surface
- login flows now create `TOTP` MFA challenges before `EMAIL_OTP / SMS_OTP`
- `SubmitMfaChallenge` now verifies `TOTP` using the active binding id
- audit events now cover `MFA_BINDING_INITIALIZED` and `TOTP` binding enable / disable actions

### Validation

- `pnpm proto:gen`
- `cd src/common && pnpm exec tsc -b --force`
- `pnpm --filter auth-service build`
