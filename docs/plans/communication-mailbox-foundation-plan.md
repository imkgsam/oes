# OES Communication And Mailbox Foundation Plan

Updated: 2026-03-30 +09:00

## 1. Objective

Build a dedicated `communication-service` foundation for OES that supports shared mailbox workbench capability, responsibility ownership, SLA, business linkage, full persistence of communication history, and staged AI assistance.

This plan is based on:

- `docs/architecture/platforms/communication-and-mailbox.md`
- `docs/architecture/platforms/notification.md`

## 2. Planning conclusion

This plan now fixes the service positioning decision:

- OES should proceed with **independent `communication-service`**
- it should not stay as an unnamed future capability block

Reason:

- the confirmed capability set already exceeds a small mailbox module
- it includes thread modeling, assignment, status, SLA, linkage, archive, and AI assistance
- multiple upstream domains are expected to depend on it

## 3. Self-build vs. infrastructure split

Implementation threads must not confuse `communication-service` with full mail infrastructure work.

### 3.1 Must be built inside `communication-service`

- thread model
- message timeline model
- claim / reassignment
- ownership
- handling status
- SLA
- business linkage
- archive and audit views
- AI reading assistance
- AI reply draft assistance
- business / compliance semantic review

### 3.2 Should be delegated to infrastructure or third-party

- SMTP / Submission
- IMAP / POP3 / JMAP server
- raw inbound / outbound mail transport
- spam filtering
- virus scanning
- DKIM / SPF / DMARC / MTA-STS
- low-level mailbox compatibility
- base webmail capability

### 3.3 Important rule

`communication-service` may consume and index communication facts, but it should not attempt to become a full mail server stack in the first implementation phases.

## 3.4 Current recommended stack

Implementation threads should align with existing OES service style:

- framework: `NestJS`
- application style: `CQRS + DDD`
- internal contract: gRPC
- primary persistence: PostgreSQL + Prisma
- workbench timers / lightweight state / cache: Redis
- large raw-message snapshots and attachments: S3-compatible object storage
- full-text search: phase 1 stays on PostgreSQL; evaluate OpenSearch only when query volume or archive size justifies it

Important rule:

- outbound Email/SMS must go through `notification-service`
- do not embed SMTP / IMAP clients into the communication domain model

## 4. Mainline dependency rule

This service is strategically important, but it is **not** part of the immediate `auth-service` MVP dependency.

Therefore:

- this thread must fully design it and fully plan it
- separate implementation threads can build it
- the current auth mainline should not block on `communication-service` full implementation

## 5. MVP scope for the service itself

### 5.1 First-service MVP must include

- communication thread model
- communication message persistence
- shared mailbox ownership model
- claim / reassignment
- handling status
- SLA reminders
- business linkage
- workbench query model
- full communication archive baseline

### 5.2 Explicitly after MVP

- advanced compliance workflow
- inbound parsing automation
- complex approval routing
- omnichannel orchestration
- AI auto-send
- full campaign features

## 6. Service placement

Recommended placement:

- `src/services/system/communication-service`

Reason:

- this is a cross-domain platform-style communication workbench
- CRM / SRM / ERP / support / finance all may rely on it

## 7. Recommended implementation phases

### Phase A. Boundary freeze

Target:

- freeze the boundary between `communication-service` and `notification-service`
- freeze that `communication-service` manages communication process, not delivery infrastructure

Must-deliver artifacts:

- architecture doc alignment
- plan completion
- initial service placement decision

### Phase B. Domain and persistence foundation

Target:

- establish communication thread as the primary object
- persist inbound and outbound communication records

Minimum domain objects:

- `CommunicationThread`
- `CommunicationMessage`
- `CommunicationAssignment`
- `CommunicationStatusLog`
- `CommunicationLink`
- optional first round `Mailbox`

Minimum persisted facts:

- thread id
- mailbox id
- participant snapshot
- direction
- message body snapshot
- attachment reference
- assignment state
- handling status
- SLA timestamps
- business links
- audit metadata

### Phase C. Shared mailbox responsibility model

Target:

- support unassigned / assigned / in-progress / waiting / resolved / closed
- support claim and reassignment
- ensure every active thread can have a single clear owner

Required outputs:

- status model
- ownership rules
- assignment invariants
- visibility rules

### Phase D. Message-style thread view model

Target:

- support a workbench-friendly thread representation
- avoid traditional nested quoted-email display as the primary interaction mode

Required outputs:

- original RFC content retained
- incremental message body extraction strategy
- UI-facing message timeline model
- “show delta first, quoted history collapsed by default” display rules

### Phase E. SLA and workbench query model

Target:

- add first-response SLA
- add unclaimed / idle / overdue reminders
- add workbench-facing query shapes

Required views:

- pending
- urgent
- overdue
- assigned to me
- waiting external
- recently updated

### Phase F. Business linkage

Target:

- support weak links from communication threads to business objects

Minimum linkage shape:

- `entityType`
- `entityId`

Initial references:

- customer
- supplier
- order
- statement
- ticket

Important rule:

- business linkage is a foundation capability, not an optional enhancement

### Phase G. Notification integration boundary

Target:

- define how `communication-service` calls `notification-service` for outbound Email / SMS / IM delivery

Required outputs:

- dispatch command boundary
- delivery result ingestion model
- retry ownership split

Important rule:

- `communication-service` owns communication-process truth
- `notification-service` owns delivery truth
- SMTP or any third-party email transport must stay behind `notification-service`, not be called directly by `communication-service`

### Phase H. AI reading assistance

Target:

- summary
- translation
- extraction
- next-step suggestion

Important rule:

- AI is assistive, not authoritative business truth

### Phase I. AI handling and reply assistance

Target:

- classification suggestion
- tag suggestion
- assignee suggestion
- reply draft suggestion
- wording optimization

Important rule:

- reply assistance defaults to draft-only
- no default auto-send

## 8. Executable task breakdown

### Workstream C1. Architecture and service baseline

Scope:

- service placement
- architecture alignment
- service skeleton

Depends on:

- boundary freeze

Can parallelize with:

- C2 domain modeling

### Workstream C2. Thread and persistence model

Scope:

- thread aggregate
- message aggregate
- assignment model
- status log model
- archive model

Depends on:

- boundary freeze

### Workstream C3. Workbench query model

Scope:

- list views
- pending / overdue / assigned queries
- owner and status read model

Depends on:

- C2 domain baseline

### Workstream C4. SLA and responsibility rules

Scope:

- SLA timers
- overdue logic
- claim / reassignment invariants

Depends on:

- C2 domain baseline

Can parallelize with:

- C3 query model

### Workstream C5. Business linkage model

Scope:

- weak-link schema
- link management commands
- reverse lookup strategy

Depends on:

- C2 domain baseline

### Workstream C6. Notification integration

Scope:

- outbound dispatch integration
- dispatch result ingestion
- notification boundary adapters

Depends on:

- notification-service contract baseline
- C2 domain baseline

### Workstream C7. AI reading assistance

Scope:

- summary
- translation
- extraction
- next-step suggestion

Depends on:

- C2 persistence foundation
- C3 workbench query model

### Workstream C8. AI reply assistance

Scope:

- draft suggestion
- wording optimization
- business-linked draft context

Depends on:

- C5 business linkage
- C7 reading assistance foundation

## 9. Recommended infrastructure choice for this service

For the first implementation round:

- do not require self-hosted mail infrastructure to start `communication-service`
- assume outbound Email/SMS goes through `notification-service`
- assume inbound mailbox capability can be connected later to either:
  - third-party managed mailbox services
  - self-hosted mailbox stacks such as `mailcow` / `Mailu` / `Stalwart`

This keeps `communication-service` focused on its actual business value.

## 9.1 Recommended build-vs-buy decision

Implementation threads should use this default split:

- build in `communication-service`:
  - thread model
  - workbench
  - assignment / ownership
  - status / SLA
  - business links
  - archive
  - AI assistance
  - semantic review / approval hooks
- buy / deploy as infrastructure:
  - SMTP / mail transfer
  - IMAP / POP3 / JMAP
  - spam filtering
  - virus scanning
  - domain mail security
  - generic webmail baseline

This split is not optional for phase 1; it is the main mechanism that prevents the service from collapsing into a full mail stack project.

## 10. Recommended first business onboarding

Recommended first scenario:

- finance shared mailbox for supplier reconciliation and statement dispute handling

Why this scenario first:

- it strongly benefits from thread, ownership, status, SLA, business linkage, and archive
- it is more structurally valuable than a simple demo inbox

Optional second scenario:

- CRM shared mailbox for customer product inquiry handling

## 11. Deliverables by implementation thread

### Thread type A. Service baseline

- bootstrap
- modules
- repository abstractions
- build baseline

### Thread type B. Domain and persistence

- core objects
- persistence model
- archive baseline

### Thread type C. Query and workbench

- thread list
- assignment views
- status views
- SLA query views

### Thread type D. Notification integration

- communication-to-notification adapter
- dispatch and result mapping

### Thread type E. AI assistance

- reading assistance
- reply draft assistance

## 12. Best-practice checkpoints

Before a thread claims `communication-service` MVP is ready, verify:

- all inbound and outbound communication records are persisted
- thread is the primary interaction object
- claim / reassignment is supported
- handling status is explicit
- SLA state is queryable
- business links are queryable in both directions
- workbench views do not depend on traditional nested quoted-mail display
- AI output is never treated as authoritative business truth
- AI reply assistance is draft-only by default
- no direct SMTP or IMAP coupling exists inside the communication domain layer

## 13. Risks and anti-patterns

### Risk A. Building just another email UI

Avoid:

- focusing on folders first
- ignoring thread/process/ownership modeling

### Risk B. Collapsing communication into notification

Avoid:

- putting ownership, SLA, and thread logic into `notification-service`

### Risk C. Collapsing communication into mail infrastructure

Avoid:

- trying to build IMAP / SMTP / spam filtering directly into `communication-service`
- delaying thread/workbench delivery because of low-level mail stack concerns

### Risk D. Skipping archive because it seems “operational”

Avoid:

- treating archive and persistence as optional

Full communication persistence is a baseline requirement.

### Risk E. Over-automating AI too early

Avoid:

- auto-sending replies by default
- letting AI set authoritative status without human confirmation

## 14. Recommended next action after this plan

The next execution step should be:

1. create `communication-service` skeleton under `src/services/system`
2. freeze the first object model for thread / message / assignment / status / link
3. select finance shared mailbox as the first implementation scenario
4. start service-baseline and domain-model threads in parallel

## 15. Selection note for implementation threads

Implementation threads should assume:

- no self-hosted full mailbox stack is required for the first round
- inbound and advanced mailbox connectivity are later work
- phase 1 success is measured by workbench/process value, not by replacing a complete enterprise mail server
