# OES Notification Service Foundation Plan

Updated: 2026-03-30 +09:00

## 1. Objective

Build a project-level `notification-service` foundation for OES that can first support `auth-service` OTP delivery, then expand to workflow and business notifications, without coupling upstream services to concrete providers.

This plan is based on:

- `docs/architecture/platforms/notification.md`
- OES platform boundary rules
- the current need to externalize Email and SMS delivery from `auth-service`

## 2. Planning principle

This plan must guide implementation threads, not just describe intent.

Therefore this document fixes:

- service responsibility
- implementation phases
- MVP scope
- task ordering
- dependency graph
- parallelization boundaries

This document does **not** freeze:

- final vendor selection
- final ORM / table minutiae
- internal class-level code structure

## 3. Service placement

Recommended placement:

- `src/services/system/notification-service`

Reason:

- this is a platform service, not a business-domain local helper
- it will be shared by `auth-service`, workflow, CRM, SRM, ERP, and future communication workbench

## 3.1 Current recommended stack

To stay aligned with existing OES system services, implementation threads should prefer:

- framework: `NestJS`
- application style: `CQRS + DDD`
- internal contract: gRPC
- primary persistence: PostgreSQL + Prisma
- idempotency / rate coordination / lightweight buffering: Redis
- outbound Email provider first choice: Amazon SES
- outbound SMS provider first choice: AWS End User Messaging SMS or Twilio

Important rule:

- provider choice must stay behind adapter ports
- implementation threads must not couple upstream modules to vendor SDKs

## 4. MVP scope for the auth mainline

This thread’s mainline dependency only requires a minimal subset of `notification-service`.

### 4.1 Required for `auth-service`

- accept Email OTP dispatch request
- accept SMS OTP dispatch request
- persist dispatch record
- return `accepted / rejected`
- support idempotency key
- provide normalized failure reason
- keep provider logic behind adapter

### 4.2 Explicitly out of MVP

- inbound email
- campaign / marketing messaging
- preference center
- unsubscribe governance
- batch segmentation engine
- advanced provider routing
- communication-thread workbench capability

## 5. Recommended implementation phases

### Phase A. Boundary and contract freeze

Target:

- freeze the service boundary
- freeze auth-to-notification MVP interaction shape
- freeze what is inside the first implementation scope

Must-deliver artifacts:

- architecture doc alignment
- implementation plan
- proto design draft
- error model draft

Blocking outputs:

- service name and placement confirmed
- MVP request/response semantics confirmed

Parallelization:

- can run in parallel with service skeleton preparation
- cannot proceed to contract implementation until boundary is frozen

### Phase B. Service skeleton and module baseline

Target:

- create `notification-service` skeleton with standard OES service structure

Required modules:

- `application/`
- `domain/`
- `infrastructure/`
- `interfaces/`
- `modules/`

Recommended first internal slices:

- dispatch module
- template module
- provider module
- audit / observability module

Deliverables:

- service bootstrap
- module wiring
- dependency injection boundaries
- build baseline

Parallelization:

- can run in parallel with provider abstraction design
- should not wait for real provider selection

### Phase C. Core domain and persistence foundation

Target:

- establish the minimal domain model for outbound dispatch

Minimum domain objects:

- `NotificationDispatch`
- `NotificationAttempt`
- `NotificationTemplate`
- `ProviderRoute`

Minimum repository abstractions:

- dispatch repository
- template repository
- route repository

Minimum persisted facts:

- dispatch id
- channel
- category
- source service
- recipient snapshot
- template key
- variable payload snapshot
- idempotency key
- status
- created time
- last attempt time
- final result

Parallelization:

- can run in parallel with proto codegen preparation
- should finish before auth integration implementation

### Phase D. gRPC contract and interface baseline

Target:

- establish the first stable internal contract

Recommended first contract approach:

- first round may use `SendEmail` and `SendSms` for implementation speed
- design should still preserve a path toward later unification as `CreateNotificationDispatch`

Minimum request fields:

- `tenantId`
- `orgId` when applicable
- `sourceService`
- `category`
- `recipient`
- `templateKey`
- `variables`
- `idempotencyKey`
- `priority`

Minimum response fields:

- `accepted`
- `dispatchId`
- `status`
- `rejectionReason`

Deliverables:

- proto file
- generated contract refresh
- controller / handler mapping
- normalized exception mapping

Parallelization:

- can run after Phase A
- auth-side adapter thread can begin once proto stabilizes

### Phase E. Auth-oriented MVP integration

Target:

- let `auth-service` stop depending on placeholder Email/SMS sender implementations

Required tasks:

- define auth-side port / adapter
- map OTP Email challenge to `notification-service`
- map OTP SMS challenge to `notification-service`
- define auth idempotency key format
- define rejection behavior in auth flow

Important invariants:

- OTP truth remains in `auth-service`
- notification truth remains in `notification-service`
- delivery acceptance is not the same thing as OTP validity

Parallelization:

- one thread can implement `notification-service` contract handlers
- another can implement `auth-service` adapter
- final integration requires both sides complete

### Phase F. First real provider adapters

Target:

- replace placeholder dispatch with real provider implementations

Recommended adapter order:

1. Email adapter
2. SMS adapter

Email adapter requirements:

- provider-agnostic `EmailProviderPort`
- support future SMTP-backed implementation path

SMS adapter requirements:

- provider-agnostic `SmsProviderPort`
- keep room for later primary/backup routing

Deliverables:

- config schema
- secret-loading rules
- adapter implementation
- normalized provider error mapping

Parallelization:

- Email and SMS adapters can be separate threads

### Phase G. Reliability and observability hardening

Target:

- make the dispatch path production-ready

Required capabilities:

- idempotency enforcement
- retry classification
- retry backoff
- dead-letter handling
- status query
- audit logging
- metrics
- alerting baseline

Recommended outcome:

- provider outage does not require auth-side redesign
- failures are observable without reading raw provider logs

### Phase H. Event-driven business onboarding

Target:

- allow non-auth notification scenarios to enter the service through Event Bus

Recommended first business scenarios:

- workflow approval assigned
- workflow escalation
- order status changed

Rule:

- auth OTP stays a synchronous acceptance path
- general business notification onboarding should prefer event-driven ingestion

## 6. Executable task breakdown

### Workstream N1. Architecture and proto

Scope:

- proto draft
- status model
- error model
- idempotency semantics

Depends on:

- architecture freeze

Can parallelize with:

- N2 skeleton

### Workstream N2. Service skeleton

Scope:

- service bootstrap
- module baseline
- build pipeline

Depends on:

- architecture freeze

Can parallelize with:

- N1 proto
- N3 domain modeling

### Workstream N3. Domain and persistence

Scope:

- dispatch aggregate
- attempt aggregate
- template model
- repository abstractions

Depends on:

- architecture freeze

Can parallelize with:

- N2 skeleton

### Workstream N4. Interface and controller

Scope:

- proto integration
- controller mapping
- command handlers

Depends on:

- N1 proto
- N2 skeleton
- N3 domain baseline

### Workstream N5. Auth integration MVP

Scope:

- auth adapter
- Email OTP path integration
- SMS OTP path integration

Depends on:

- N1 proto
- N4 interface baseline

### Workstream N6. Provider adapters

Scope:

- Email adapter
- SMS adapter

Depends on:

- N3 domain baseline
- N4 interface baseline

Recommended first concrete choice:

- Email adapter: Amazon SES
- SMS adapter: AWS End User Messaging SMS if infra is AWS-first, otherwise Twilio

### Workstream N7. Reliability hardening

Scope:

- retries
- dead-letter
- metrics
- audit

Depends on:

- N4 interface baseline
- N6 first provider adapters

## 7. Deliverables by thread type

### Architecture / design thread

- architecture alignment
- plan completion
- proto draft

### Implementation thread: service baseline

- service skeleton
- domain model
- repositories

### Implementation thread: interface

- proto implementation
- controller / handler layer

### Implementation thread: provider adapters

- Email adapter
- SMS adapter

### Implementation thread: auth integration

- auth-side port
- auth-side handler integration

## 8. Best-practice checkpoints

Before a thread claims `notification-service` MVP is ready, verify:

- upstream services do not import provider SDKs
- provider errors are normalized
- dispatch status is queryable
- message sending is idempotent
- audit records include source service, tenant, recipient snapshot, template, route, and result
- OTP truth is still only in `auth-service`
- contact truth is still only in `identity-service`
- provider secrets are isolated from application services

## 9. Risks and anti-patterns

### Risk A. Turning notification into a business-truth service

Avoid:

- storing business workflow truth inside dispatch records
- letting templates own business rules

### Risk B. Turning notification into a thin provider proxy only

Avoid:

- skipping template, audit, retry, and status modeling
- hardcoding vendors into service endpoints

### Risk C. Overbuilding too early

Avoid:

- building a full campaign platform in the first round
- adding inbound mailbox processing before outbound delivery is stable

### Risk D. Coupling auth semantics to delivery success

Avoid:

- treating provider delivery success as the same thing as OTP validity

## 10. Recommended next action after this plan

The next execution step should be:

1. confirm `notification-service` placement under `src/services/system`
2. produce the first proto draft for Email OTP / SMS OTP dispatch
3. start N2 and N3 in parallel
4. start auth-side MVP integration only after proto stabilizes

## 11. Selection note for implementation threads

Implementation threads should follow this default unless an ADR later overrides it:

- do not self-host mail infrastructure in phase 1
- use managed Email/SMS providers first
- keep SMTP compatibility in the Email adapter design
- do not let provider selection change the `auth-service -> notification-service` contract shape
