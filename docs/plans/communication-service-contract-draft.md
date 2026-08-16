# OES Communication Service Contract Draft

Updated: 2026-03-30 +09:00

## 1. Purpose

This document freezes the first implementation-oriented contract draft for `communication-service`.

It is not the final generated proto file.

Its purpose is:

- give implementation threads a stable contract target
- define first-round request / response semantics before code work begins
- prevent the first implementation round from collapsing into either a generic email UI or a full mail infrastructure stack
- define the minimal contract surface for shared mailbox workbench MVP

Related documents:

- `docs/architecture/platforms/communication-and-mailbox.md`
- `docs/architecture/platforms/notification.md`
- `docs/plans/communication-mailbox-foundation-plan.md`
- `docs/plans/notification-service-contract-draft.md`

## 2. First-round contract strategy

For the first implementation round, the contract should focus on:

- workbench query
- ownership and claim / reassignment
- status transitions
- business linkage
- outbound draft submission boundary

It should **not** try to model every future mailbox capability in one round.

Therefore the first proto should optimize for:

- finance / supplier reconciliation shared mailbox
- customer / supplier thread handling
- message-style thread display
- explicit work ownership

## 3. Service identity

Recommended proto package:

- `communication_service`

Recommended service name:

- `CommunicationService`

Recommended Java package:

- `com.oes.communication.v1`

## 4. First-round RPC surface

### 4.1 Required MVP RPCs

- `ListThreads`
- `GetThread`
- `ClaimThread`
- `ReassignThread`
- `UpdateThreadStatus`
- `AddThreadLink`
- `RemoveThreadLink`
- `CreateOutboundDraft`
- `SubmitOutboundDraft`

### 4.2 Explicitly not in first-round proto

- full mailbox account administration
- IMAP / SMTP account configuration
- inbound raw email ingestion contract
- auto-routing engine
- approval workflow API
- AI invocation API
- bulk campaign / mailing API
- contact-master API

## 5. First-round object model

### 5.1 Primary aggregate

The first interaction object is:

- `CommunicationThread`

Reason:

- users work on communication threads, not isolated transport records
- ownership, SLA, status, and linkage all naturally attach to a thread

### 5.2 Supporting objects

- `CommunicationMessage`
- `CommunicationAssignment`
- `CommunicationLink`
- `OutboundDraft`

### 5.3 Optional first-round object

- `Mailbox`

This may be included if implementation threads need a stable shared-mailbox boundary early, but it does not need a large standalone management API in the first round.

## 6. Draft proto shape

### 6.1 Service

```proto
service CommunicationService {
  rpc ListThreads(ListThreadsRequest) returns (ListThreadsResponse);
  rpc GetThread(GetThreadRequest) returns (GetThreadResponse);
  rpc ClaimThread(ClaimThreadRequest) returns (ThreadMutationResponse);
  rpc ReassignThread(ReassignThreadRequest) returns (ThreadMutationResponse);
  rpc UpdateThreadStatus(UpdateThreadStatusRequest) returns (ThreadMutationResponse);
  rpc AddThreadLink(AddThreadLinkRequest) returns (ThreadMutationResponse);
  rpc RemoveThreadLink(RemoveThreadLinkRequest) returns (ThreadMutationResponse);
  rpc CreateOutboundDraft(CreateOutboundDraftRequest) returns (CreateOutboundDraftResponse);
  rpc SubmitOutboundDraft(SubmitOutboundDraftRequest) returns (SubmitOutboundDraftResponse);
}
```

### 6.2 Shared enums

```proto
enum ThreadStatus {
  THREAD_STATUS_UNSPECIFIED = 0;
  THREAD_STATUS_NEW = 1;
  THREAD_STATUS_UNASSIGNED = 2;
  THREAD_STATUS_ASSIGNED = 3;
  THREAD_STATUS_IN_PROGRESS = 4;
  THREAD_STATUS_WAITING_INTERNAL = 5;
  THREAD_STATUS_WAITING_EXTERNAL = 6;
  THREAD_STATUS_RESOLVED = 7;
  THREAD_STATUS_CLOSED = 8;
}

enum MessageDirection {
  MESSAGE_DIRECTION_UNSPECIFIED = 0;
  MESSAGE_DIRECTION_INBOUND = 1;
  MESSAGE_DIRECTION_OUTBOUND = 2;
}

enum ThreadPriority {
  THREAD_PRIORITY_UNSPECIFIED = 0;
  THREAD_PRIORITY_LOW = 1;
  THREAD_PRIORITY_NORMAL = 2;
  THREAD_PRIORITY_HIGH = 3;
  THREAD_PRIORITY_CRITICAL = 4;
}

enum DraftStatus {
  DRAFT_STATUS_UNSPECIFIED = 0;
  DRAFT_STATUS_DRAFT = 1;
  DRAFT_STATUS_READY = 2;
  DRAFT_STATUS_SUBMITTED = 3;
  DRAFT_STATUS_REJECTED = 4;
}
```

### 6.3 Shared message fragments

```proto
message ServiceContext {
  string tenant_id = 1;
  string org_id = 2;
  string trace_id = 3;
  string request_id = 4;
}

message OperatorContext {
  string operator_id = 1;
  string account_id = 2;
  string actor_type = 3;
}

message ThreadLink {
  string entity_type = 1;
  string entity_id = 2;
  string label = 3;
}

message ParticipantSnapshot {
  string address = 1;
  string display_name = 2;
  string party_type = 3;
}
```

### 6.4 Thread list and detail

```proto
message ListThreadsRequest {
  ServiceContext service = 1;
  OperatorContext operator = 2;
  string mailbox_id = 3;
  ThreadStatus status = 4;
  string assignee_account_id = 5;
  bool only_overdue = 6;
  bool only_unassigned = 7;
  int32 page_size = 8;
  string page_token = 9;
}

message ThreadSummaryView {
  string thread_id = 1;
  string mailbox_id = 2;
  string subject = 3;
  ThreadStatus status = 4;
  ThreadPriority priority = 5;
  string owner_account_id = 6;
  string last_message_preview = 7;
  int64 last_activity_at_epoch_ms = 8;
  int64 first_response_due_at_epoch_ms = 9;
  bool is_overdue = 10;
  repeated ThreadLink links = 11;
}

message ListThreadsResponse {
  repeated ThreadSummaryView items = 1;
  string next_page_token = 2;
}

message GetThreadRequest {
  ServiceContext service = 1;
  OperatorContext operator = 2;
  string thread_id = 3;
}

message MessageView {
  string message_id = 1;
  MessageDirection direction = 2;
  ParticipantSnapshot from = 3;
  repeated ParticipantSnapshot to = 4;
  string subject = 5;
  string body_delta = 6;
  string quoted_body = 7;
  bool quoted_body_collapsed = 8;
  int64 sent_at_epoch_ms = 9;
}

message ThreadDetailView {
  string thread_id = 1;
  string mailbox_id = 2;
  string subject = 3;
  ThreadStatus status = 4;
  ThreadPriority priority = 5;
  string owner_account_id = 6;
  string last_operator_account_id = 7;
  int64 created_at_epoch_ms = 8;
  int64 updated_at_epoch_ms = 9;
  int64 first_response_due_at_epoch_ms = 10;
  int64 next_action_due_at_epoch_ms = 11;
  bool is_overdue = 12;
  repeated ThreadLink links = 13;
  repeated MessageView messages = 14;
}

message GetThreadResponse {
  ThreadDetailView thread = 1;
}
```

### 6.5 Thread mutation

```proto
message ClaimThreadRequest {
  ServiceContext service = 1;
  OperatorContext operator = 2;
  string thread_id = 3;
}

message ReassignThreadRequest {
  ServiceContext service = 1;
  OperatorContext operator = 2;
  string thread_id = 3;
  string assignee_account_id = 4;
  string reason = 5;
}

message UpdateThreadStatusRequest {
  ServiceContext service = 1;
  OperatorContext operator = 2;
  string thread_id = 3;
  ThreadStatus target_status = 4;
  string reason = 5;
}

message AddThreadLinkRequest {
  ServiceContext service = 1;
  OperatorContext operator = 2;
  string thread_id = 3;
  ThreadLink link = 4;
}

message RemoveThreadLinkRequest {
  ServiceContext service = 1;
  OperatorContext operator = 2;
  string thread_id = 3;
  string entity_type = 4;
  string entity_id = 5;
}

message ThreadMutationResponse {
  bool success = 1;
  string thread_id = 2;
  ThreadStatus status = 3;
  string owner_account_id = 4;
  string rejection_reason = 5;
}
```

### 6.6 Outbound draft

```proto
message DraftRecipient {
  string address = 1;
  string display_name = 2;
}

message CreateOutboundDraftRequest {
  ServiceContext service = 1;
  OperatorContext operator = 2;
  string thread_id = 3;
  string subject = 4;
  string body = 5;
  repeated DraftRecipient to = 6;
}

message CreateOutboundDraftResponse {
  string draft_id = 1;
  DraftStatus status = 2;
  string thread_id = 3;
}

message SubmitOutboundDraftRequest {
  ServiceContext service = 1;
  OperatorContext operator = 2;
  string draft_id = 3;
  string idempotency_key = 4;
}

message SubmitOutboundDraftResponse {
  bool accepted = 1;
  string draft_id = 2;
  string thread_id = 3;
  string outbound_dispatch_id = 4;
  DraftStatus status = 5;
  string rejection_reason = 6;
}
```

## 7. Field-level rules

### 7.1 `service`

Must include:

- `tenant_id`

Optional first-round fields:

- `org_id`
- `trace_id`
- `request_id`

### 7.2 `operator`

Must include enough fields to support:

- ownership attribution
- audit attribution
- future approval / review expansion

At minimum:

- `operator_id` or `account_id`

### 7.3 `body_delta`

The thread view must preserve the “message-style timeline” principle:

- `body_delta` is the newly added content for this message
- `quoted_body` is retained but should be collapsed by default

The first implementation does not need perfect email quote parsing, but it must preserve a dedicated field for delta-first rendering.

### 7.4 `links`

The first implementation should use weak links:

- `entity_type`
- `entity_id`

No deep cross-service structural dependency should be introduced in the first proto.

### 7.5 `SubmitOutboundDraft`

This call is not a direct SMTP or provider call.

It means:

- the draft is accepted by `communication-service`
- `communication-service` records the process action
- `communication-service` delegates delivery to `notification-service`

It does **not** mean:

- provider delivery is complete

## 8. Status transition rules

Recommended first-round legal transitions:

- `NEW -> UNASSIGNED`
- `UNASSIGNED -> ASSIGNED`
- `ASSIGNED -> IN_PROGRESS`
- `IN_PROGRESS -> WAITING_INTERNAL`
- `IN_PROGRESS -> WAITING_EXTERNAL`
- `WAITING_INTERNAL -> IN_PROGRESS`
- `WAITING_EXTERNAL -> IN_PROGRESS`
- `IN_PROGRESS -> RESOLVED`
- `RESOLVED -> CLOSED`

Important rule:

- `CLOSED` should be terminal in the first round unless a future reopen action is explicitly added

## 9. Normalized rejection reasons

Recommended first-round reasons:

- `THREAD_NOT_FOUND`
- `MAILBOX_NOT_FOUND`
- `THREAD_ALREADY_CLOSED`
- `THREAD_ALREADY_CLAIMED`
- `INVALID_STATUS_TRANSITION`
- `INVALID_ASSIGNEE`
- `LINK_ALREADY_EXISTS`
- `LINK_NOT_FOUND`
- `DRAFT_NOT_FOUND`
- `DRAFT_NOT_READY`
- `OUTBOUND_NOT_ALLOWED`
- `INTERNAL_REJECTION`

Important rule:

- these are business rejections
- transport failures should still surface as gRPC failures when appropriate

## 10. Notification boundary semantics

`communication-service` should not expose provider-facing details to callers.

The first implementation should treat outbound delivery as:

- process truth owned by `communication-service`
- delivery truth owned by `notification-service`

Recommended mapping:

- `SubmitOutboundDraft.accepted=true`
  - means the outbound draft entered the communication-to-notification path
- `outbound_dispatch_id`
  - stores the dispatch id returned by `notification-service`

Implementation threads should keep room for later delivery result ingestion, but that callback contract does not need to be frozen in this first draft.

## 11. Persistence expectation behind the contract

For each thread, the service should persist at minimum:

- thread id
- mailbox id
- subject snapshot
- status
- owner account id
- message timeline entries
- message body delta snapshot
- quoted content snapshot or raw-reference pointer
- business links
- audit metadata
- SLA timestamps

For each submitted outbound draft, the service should persist at minimum:

- draft id
- thread id
- operator snapshot
- draft body snapshot
- recipient snapshot
- idempotency key
- outbound dispatch id if accepted
- final draft status

## 12. What implementation threads should do next

### Thread A. Proto authoring

- convert this draft into first-round proto
- keep names aligned with OES proto conventions
- keep first-round scope limited to shared mailbox MVP

### Thread B. Communication-service baseline

- implement thread aggregate
- implement message persistence
- implement assignment and status invariants

### Thread C. Workbench query implementation

- implement list and detail views
- support overdue / unassigned / assigned-to-me filters

### Thread D. Notification integration

- implement `SubmitOutboundDraft` to `notification-service` mapping
- store returned `dispatch_id`
- keep retry and delivery ownership split clear

## 13. Deliberate non-goals of this draft

This draft intentionally does not yet define:

- mailbox account management
- inbound raw-email ingestion API
- approval workflow API
- AI execution API
- contact master API
- final delivery callback contract from `notification-service`
- full search API for every filter combination

Those should come after the first shared-mailbox MVP path is stabilized.
