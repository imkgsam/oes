# AUTH-03 Phone Password Login

Updated: 2026-03-23 23:44:40 +09:00

## Scope

- Start the `AUTH-03` phone password primary-auth slice
- Add the phone-password strategy, CQRS handler, and gRPC entry on the active auth flow

## Changes

- Added `PhonePasswordStrategy`
- Added `LoginWithPhonePasswordCommand` and `LoginWithPhonePasswordHandler`
- Registered the phone-password strategy in `AuthStrategyFactory`
- Added `LoginWithPhonePassword` to auth proto and gRPC controller mapping
- Reused the existing password-login risk throttle, MFA challenge flow, and account-selection flow

## Validation

- `pnpm proto:gen`
- `pnpm --filter @oes/common build`
- `pnpm --filter auth-service build`

## Conclusion

- Users can now enter the unified auth flow with `phone + password`
- The new path can transition into `MFA_REQUIRED` or `ACCOUNT_SELECTION_REQUIRED` just like the email-password path
- This slice still does not add phone-number normalization beyond the current DTO/repository path, so normalization remains a follow-up concern
