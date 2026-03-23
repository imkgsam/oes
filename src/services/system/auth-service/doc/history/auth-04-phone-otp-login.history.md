# AUTH-04 Phone OTP Login

Updated: 2026-03-23 23:52:28 +09:00

## Scope

- Start the `AUTH-04` phone OTP primary-auth slice
- Add phone OTP challenge issuance and phone OTP login on the unified auth flow

## Changes

- Added `PhoneOtpLoginService` for login OTP challenge issuance and verification
- Added `RequestPhoneOtpLoginChallengeCommand` / handler
- Added `LoginWithPhoneOtpCommand` / handler
- Extended auth proto and gRPC controller with `RequestPhoneOtpLoginChallenge` and `LoginWithPhoneOtp`
- Reused the existing OTP persistence, OTP send throttle, account selection, and email MFA follow-up path

## Validation

- `pnpm proto:gen`
- `cd src/common && pnpm exec tsc -b --force`
- `pnpm --filter auth-service build`

## Conclusion

- Users can now request a phone login OTP and use it to enter the unified auth flow
- Phone OTP primary auth does not re-trigger `SMS_OTP` MFA, but can still transition into email OTP MFA when an `EMAIL_OTP` binding is active
- Production SMS delivery is still placeholder-only, so this slice is functionally wired but not production-ready
