# Auth Method Propagation And MFA Usage Boundary

Updated: 2026-03-24 12:10:00 +08:00

## Scope

- Fix the MFA challenge usage boundary
- Propagate the real login method through MFA submission and account selection
- Keep audit output aligned with the real primary auth entry path

## Changes

- Added `login_method` to `LoginResponse`
- Added `login_method` to `SubmitMfaChallengeRequest`
- Added `login_method` to `SelectAccountRequest`
- `SubmitMfaChallenge` now carries `loginMethod` forward instead of hard-coding `EmailPassword`
- `SelectAccount` now uses the propagated `loginMethod` when emitting login-success audit
- MFA challenge verification now rejects non-`MFA_VERIFY` OTP tokens

## Validation

- `pnpm proto:gen`
- `pnpm --filter @oes/common build`
- `pnpm --filter auth-service build`

## Conclusion

- Login OTP challenges can no longer be reused as MFA challenge submissions
- Login-success audit now reflects the real primary login method across the active human-auth path
