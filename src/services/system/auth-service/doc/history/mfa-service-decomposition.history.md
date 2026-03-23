# MFA Service Decomposition

Updated: 2026-03-23 23:35:00 +08:00

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

## Validation

- `pnpm --filter auth-service build`

## Conclusion

- The active MFA-04 login path no longer depends directly on the legacy `MfaService`
- `MfaService` remains only as a temporary holder for non-migrated MFA methods
