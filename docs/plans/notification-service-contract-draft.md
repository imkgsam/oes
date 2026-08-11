# OES Notification Service Contract Draft

Updated: 2026-03-30 +09:00

```text
status: SUPERSEDED_BY_TRUTH_SOURCE
truthSource: docs/contracts/notification-service/auth-dispatch.md
doNotUseAsStableSource: true
```

> 本文仅保留第一轮实现草案的历史解释价值。Auth Email/SMS dispatch 的当前稳定 wire、trusted execution、SYSTEM scope、幂等、事务与 provider 语义只以 [Notification Auth Dispatch Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/notification-service/auth-dispatch.md) 为准；下文 `SourceContext` 与 request `source=1` 形状已被正式 contract 删除并 reserve，不得继续作为实现输入。

## 1. Purpose

This document freezes the first implementation-oriented contract draft for `notification-service`.

It is not the final generated proto file.

Its purpose is:

- give implementation threads a stable contract target
- define request / response semantics before code work begins
- define what `auth-service` needs for its MVP dependency
- prevent boundary drift during first-round proto design

Related documents:

- `docs/architecture/08-notification-architecture.md`
- `docs/plans/notification-service-foundation-plan.md`

## 2. First-round contract strategy

For the first implementation round, use explicit channel-specific RPCs:

- `SendEmail`
- `SendSms`

Reason:

- easier for first MVP implementation
- clearer auth-side integration path
- easier error mapping during the first OTP migration

However, the request model must preserve future convergence toward a unified dispatch model such as:

- `CreateNotificationDispatch`

## 3. Service identity

Recommended proto package:

- `notification_service`

Recommended service name:

- `NotificationService`

Recommended Java package:

- `com.oes.notification.v1`

## 4. First-round RPC surface

### 4.1 Required MVP RPCs

- `SendEmail`
- `SendSms`

### 4.2 Explicitly not in first-round proto

- inbound email ingestion
- delivery status query API
- template-management API
- preference-center API
- bulk campaign API
- webhook callback ingestion API
- IM / Push APIs

## 5. Common semantics

### 5.1 Acceptance semantics

These APIs do **not** mean “provider has successfully delivered”.

They only mean:

- the request was accepted by `notification-service`
- a dispatch record was created
- the platform will attempt delivery asynchronously

### 5.2 Idempotency semantics

Both RPCs must require:

- `idempotencyKey`

If the same idempotency key is submitted again within the effective deduplication window:

- the service must return the existing dispatch result
- it must not create a duplicate dispatch

### 5.3 Auth-side interpretation

For `auth-service`:

- `accepted=true` means OTP notification has entered the platform path
- it does not mean the OTP itself has been delivered
- OTP truth remains fully owned by `auth-service`

## 6. Draft proto shape

### 6.1 Service

```proto
service NotificationService {
  rpc SendEmail(SendEmailRequest) returns (SendDispatchResponse);
  rpc SendSms(SendSmsRequest) returns (SendDispatchResponse);
}
```

### 6.2 Shared enums

```proto
enum DispatchStatus {
  DISPATCH_STATUS_UNSPECIFIED = 0;
  DISPATCH_STATUS_ACCEPTED = 1;
  DISPATCH_STATUS_QUEUED = 2;
  DISPATCH_STATUS_REJECTED = 3;
}

enum DispatchPriority {
  DISPATCH_PRIORITY_UNSPECIFIED = 0;
  DISPATCH_PRIORITY_LOW = 1;
  DISPATCH_PRIORITY_NORMAL = 2;
  DISPATCH_PRIORITY_HIGH = 3;
  DISPATCH_PRIORITY_CRITICAL = 4;
}

enum NotificationCategory {
  NOTIFICATION_CATEGORY_UNSPECIFIED = 0;
  NOTIFICATION_CATEGORY_AUTH_OTP = 1;
  NOTIFICATION_CATEGORY_AUTH_SECURITY_ALERT = 2;
  NOTIFICATION_CATEGORY_WORKFLOW_REMINDER = 3;
  NOTIFICATION_CATEGORY_BUSINESS_STATUS = 4;
}
```

### 6.3 Shared message fragments

```proto
message NotificationVariable {
  string key = 1;
  string value = 2;
}

message RecipientSnapshot {
  string address = 1;
  string display_name = 2;
}

message SourceContext {
  string source_service = 1;
  string tenant_id = 2;
  string org_id = 3;
  string trace_id = 4;
  string request_id = 5;
}
```

### 6.4 Email request

```proto
message SendEmailRequest {
  SourceContext source = 1;
  NotificationCategory category = 2;
  string template_key = 3;
  RecipientSnapshot recipient = 4;
  repeated NotificationVariable variables = 5;
  string idempotency_key = 6;
  DispatchPriority priority = 7;
  string subject_override = 8;
}
```

### 6.5 SMS request

```proto
message SendSmsRequest {
  SourceContext source = 1;
  NotificationCategory category = 2;
  string template_key = 3;
  RecipientSnapshot recipient = 4;
  repeated NotificationVariable variables = 5;
  string idempotency_key = 6;
  DispatchPriority priority = 7;
}
```

### 6.6 Response

```proto
message SendDispatchResponse {
  bool accepted = 1;
  string dispatch_id = 2;
  DispatchStatus status = 3;
  string rejection_reason = 4;
}
```

## 7. Field-level rules

### 7.1 `source`

Must include:

- `source_service`
- `tenant_id`

Optional first-round fields:

- `org_id`
- `trace_id`
- `request_id`

### 7.2 `category`

The first MVP only requires these values to be actively used:

- `AUTH_OTP`
- `AUTH_SECURITY_ALERT`

Other categories can exist in proto but need not be implemented immediately.

### 7.3 `template_key`

Must be required.

Reason:

- template ownership belongs to `notification-service`
- upstream services should not submit fully rendered provider-specific payloads

### 7.4 `recipient`

First-round minimum:

- `address`

`display_name` may be empty.

### 7.5 `variables`

First round uses flat key-value pairs for implementation speed.

Do not over-design nested JSON variables in the first proto round.

### 7.6 `subject_override`

Email-only optional field.

Allowed only as a controlled override.

For auth OTP, this field is usually not needed and should normally be left empty.

## 8. Auth-service MVP mapping

### 8.1 Email OTP

Recommended auth-side mapping:

- RPC: `SendEmail`
- `category`: `AUTH_OTP`
- `template_key`: `AUTH_OTP_EMAIL`
- `recipient.address`: normalized email
- `variables`:
  - `code`
  - `ttlMinutes`
  - `maskedDestination`
- `idempotency_key`:
  - recommended shape: `auth:otp:email:<challengeId>`

### 8.2 SMS OTP

Recommended auth-side mapping:

- RPC: `SendSms`
- `category`: `AUTH_OTP`
- `template_key`: `AUTH_OTP_SMS`
- `recipient.address`: normalized phone
- `variables`:
  - `code`
  - `ttlMinutes`
  - `maskedDestination`
- `idempotency_key`:
  - recommended shape: `auth:otp:sms:<challengeId>`

## 9. Normalized rejection reasons

The response field `rejection_reason` should use normalized platform semantics, not raw provider errors.

Recommended first-round reasons:

- `INVALID_RECIPIENT`
- `TEMPLATE_NOT_FOUND`
- `TEMPLATE_NOT_ALLOWED`
- `CHANNEL_DISABLED`
- `PROVIDER_ROUTE_NOT_CONFIGURED`
- `IDEMPOTENCY_CONFLICT`
- `INTERNAL_REJECTION`

Important rule:

- raw provider response text should not be leaked to callers

## 10. Error handling rules

### 10.1 Business rejection

If the platform can deterministically reject before creating a dispatch:

- return `accepted=false`
- return `status=DISPATCH_STATUS_REJECTED`
- fill `rejection_reason`

### 10.2 Transport / service failure

If the RPC itself fails due to service-level error:

- return gRPC error
- do not rely only on `accepted=false`

This separation is important:

- business rejection is a valid service outcome
- transport failure is an infrastructure failure

## 11. Persistence expectation behind the contract

For each accepted request, the service should persist at minimum:

- dispatch id
- channel
- category
- template key
- recipient snapshot
- variables snapshot
- source service
- tenant id
- idempotency key
- accepted time
- current status

## 12. What implementation threads should do next

### Thread A. Proto authoring

- convert this draft into first-round proto file
- keep field names aligned with OES proto conventions
- keep the first round minimal

### Thread B. Notification-service interface implementation

- implement `SendEmail`
- implement `SendSms`
- implement normalized rejection behavior

### Thread C. Auth-service adapter

- map Email OTP to `SendEmail`
- map SMS OTP to `SendSms`
- define auth-side idempotency key generation
- define fallback behavior on RPC failure

## 13. Deliberate non-goals of this draft

This draft intentionally does not yet define:

- delivery callback contract
- dispatch query contract
- template-management contract
- provider admin contract
- communication-service outbound contract

Those should come after the OTP-oriented MVP path is stabilized.
