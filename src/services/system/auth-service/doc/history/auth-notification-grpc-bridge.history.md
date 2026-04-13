# Auth Notification gRPC Bridge

## Scope

- finish the minimal bridge from `auth-service` to the new `notification-service` MVP
- keep local development behavior available while preparing the auth mainline for real notification dispatch

## Changes

- added `NotificationServiceGrpcAdaptor` over the new notification gRPC contract
- extended `auth-service` gRPC client configuration to include `notification-service`
- updated `ExternalServicesModule` to provide the notification gRPC adaptor
- changed `NOTIFICATION_DISPATCH_PORT` binding to select:
  - `local` fallback adaptor by default
  - `grpc` adaptor when `AUTH_NOTIFICATION_TRANSPORT=grpc`

## Result

- `auth-service` can keep using local OTP dispatch during development
- `auth-service` can switch to the real `notification-service` MVP without rewriting OTP application services

## Validation

- `pnpm proto:gen`
- `pnpm --filter @oes/common build`
- `pnpm --filter notification-service prisma:generate`
- `pnpm --filter notification-service build`
- `pnpm install`
- `pnpm --filter auth-service build`

## Runtime note

- `notification-service` runtime has now been verified against local PostgreSQL
- direct gRPC validation confirmed:
  - dispatch acceptance
  - idempotent replay returning the same `dispatchId`
  - persisted `NotificationDispatch` record in the database
- `auth-service` local runtime now supports static gRPC URL fallback for:
  - `identity-service`
  - `permission-service`
  - `notification-service`
- `auth-service` source-mode startup also now resolves proto files from absolute common-contract paths
- current end-to-end OTP trigger is still blocked by local Redis availability, not by the notification gRPC path

## 2026-03-31 Runtime Closure

- local PostgreSQL was split into per-service databases:
  - `authdb`
  - `identitydb`
  - `permissiondb`
  - `notificationdb`
- `auth-service` local gRPC port moved to `50050` to avoid conflicting with `identity-service`
- `identity-service` local runtime was aligned for source-mode development:
  - absolute proto path for `permission-service`
  - static local gRPC fallback
  - local `.env` disables Nacos registration
  - request-field compatibility for `userId/accountId` gRPC payloads
- local end-to-end verification has now completed under `AUTH_NOTIFICATION_TRANSPORT=grpc`:
  - `RequestEmailOtpLoginChallenge`
  - `LoginWithEmailOtp`
  - `SelectAccount`
  - session / access token / refresh token issuance
- latest verified local result:
  - `notification-service` persisted the OTP dispatch
  - `identity-service` returned account candidates
  - `auth-service` returned `LOGIN_STATUS_SUCCESS` from `SelectAccount`
