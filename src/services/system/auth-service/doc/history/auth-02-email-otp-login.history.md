# AUTH-02 Email OTP Login

Updated: 2026-03-24 00:15:04 +09:00

## Scope

- Start the `AUTH-02` email OTP primary-auth slice
- Add email OTP challenge issuance and email OTP login on the unified auth flow

## Changes

- Added `EmailOtpLoginService` for login OTP challenge issuance and verification
- Added `RequestEmailOtpLoginChallengeCommand` / handler
- Added `LoginWithEmailOtpCommand` / handler
- Extended auth proto and gRPC controller with `RequestEmailOtpLoginChallenge` and `LoginWithEmailOtp`
- Reused the existing OTP persistence, OTP send throttle, account selection, and phone MFA follow-up path
- Kept delivery on the current development email service path instead of integrating a real provider

## Validation

- `pnpm proto:gen`
- `cd src/common && pnpm exec tsc -b --force`
- `pnpm --filter auth-service build`

## Conclusion

- Users can now request an email login OTP and use it to enter the unified auth flow
- Email OTP primary auth does not re-trigger `EMAIL_OTP` MFA, but can still transition into `SMS_OTP` MFA when a phone MFA binding is active
- Delivery is currently simulated through the existing development email service behavior, not a production mail provider
