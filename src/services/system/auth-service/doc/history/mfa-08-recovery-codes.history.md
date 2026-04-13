# MFA-08 Recovery Codes History

## 2026-03-28

### Scope

- complete the minimal `Recovery Codes` closure as the fallback factor for `TOTP`

### Result

- added `InitializeRecoveryCodes` and `RegenerateRecoveryCodes` contracts
- `ListMfaBindings` now returns `BACKUP_CODE`
- recovery code issuance requires an active `TOTP` binding
- recovery codes can be rotated through the formal management surface
- `SubmitMfaChallenge` can now consume recovery codes under a `TOTP` challenge
- consumed recovery codes are removed from the active binding and the binding is disabled when exhausted

### Validation

- `pnpm proto:gen`
- `cd src/common && pnpm exec tsc -b --force`
- `pnpm --filter auth-service build`
