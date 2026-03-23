# MFA-05 Phone OTP Challenge

Updated: 2026-03-23 23:35:50 +09:00

## Scope

- Start the `MFA-05` phone OTP MFA slice on the active login path
- Add phone OTP challenge creation for password login without changing external gRPC contracts

## Changes

- Added `PhoneOtpMfaChallengeService` for `SMS_OTP` MFA challenge creation
- Updated `LoginWithEmailPasswordHandler` to trigger phone OTP MFA when email OTP MFA is not active and a phone MFA binding is active
- Expanded MFA audit event channel typing from only `EMAIL_OTP` to `EMAIL_OTP | SMS_OTP`
- Restored `SmsService` as an active provider because the phone OTP MFA path now depends on it

## Validation

- `pnpm --filter auth-service build`

## Conclusion

- Password login can now enter `MFA_REQUIRED` through a phone OTP challenge when the user has an active `SMS_OTP` binding
- Existing `SubmitMfaChallenge` verification flow can continue to complete the challenge because it already supports phone OTP tokens
- This slice does not yet add a dedicated phone-password login path or new gRPC request types
