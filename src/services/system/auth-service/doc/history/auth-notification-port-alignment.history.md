# Auth Notification Port Alignment

## Scope

- reduce direct coupling between OTP flows and local Email/SMS placeholder senders
- align `auth-service` with the accepted `notification-service` boundary without blocking on full `notification-service` implementation

## Changes

- introduced `NotificationDispatchPort` as the auth-side outbound notification dependency
- added `LocalNotificationDispatchAdaptor` as the current fallback implementation over the existing local Email/SMS dev senders
- updated email OTP login, phone OTP login, email OTP MFA challenge, and phone OTP MFA challenge to call the notification port instead of depending on `EmailService` / `SmsService` directly
- preserved the existing development-mode hardcoded-code behavior through the local fallback adapter

## Result

- `auth-service` OTP issuance logic is now structured around a notification boundary
- current local development/test OTP behavior still works
- later migration to real `notification-service` gRPC integration can replace the adapter binding instead of rewriting OTP application services

## Validation

- `pnpm --filter auth-service build`
