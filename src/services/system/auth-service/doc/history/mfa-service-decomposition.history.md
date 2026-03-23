# MFA Service Decomposition

Updated: 2026-03-23 22:38:03 +09:00

## Scope

- Start shrinking the legacy `MfaService`
- Move the active MFA-04 login-path flow to focused services
- Keep remaining legacy MFA methods in place without adding new responsibilities

## Changes

- Added `EmailOtpMfaChallengeService` for email OTP challenge creation
- Added `MfaChallengeVerificationService` for challenge verification
- Updated `LoginWithEmailPasswordHandler` to depend on `EmailOtpMfaChallengeService`
- Updated `SubmitMfaChallengeHandler` to depend on `MfaChallengeVerificationService`
- Marked `MfaService` as `OUTDATED`
- Removed unused `MFA_SERVICE` injection token
- Removed the legacy `MfaService` implementation after confirming no active code path depends on it
- Removed the now-unused `SmsService` provider from `AuthModule`

## Validation

- `pnpm --filter auth-service build`

## Conclusion

- The active MFA-04 login path no longer depends directly on the legacy `MfaService`
- The legacy `MfaService` has now been removed from the service graph
- MFA application logic is constrained to focused services instead of a catch-all entry point
