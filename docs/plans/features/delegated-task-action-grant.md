# Delegated Task ActionGrant Implementation Packet

```text
status: DESIGN_FROZEN_IMPLEMENTATION_NOT_DISPATCHED
capabilityKey: ACTION-GRANT
designGate: DG-4
architectureTruthSource: docs/architecture/services/collaboration-service.md
taskContract: docs/contracts/collaboration-service/task-command.md
genericCredentialContract: docs/contracts/auth-service/delegated-execution-and-action-grant.md
predecessors: EXEC-CRYPTO MAIN_READY, EXEC-REVOKE MAIN_READY, PRINCIPAL-ROLE MAIN_READY, API-KEY MAIN_READY, FROZEN_AI_PLATFORM_TASK_ASSISTANT
```

## 1. Purpose

This packet turns the frozen generic DG-4 contract into one narrow Task validation slice. It does not implement Task Assistant UX or AI orchestration; AI-PLATFORM owns those concerns. The only high-risk mutation is creating a Task assigned to another tenant account.

## 2. Frozen Operation Set

| Operation | Risk class | Required behavior |
| --- | --- | --- |
| `ListTasks`, `GetTask` | `DELEGATION_ALLOWED` | DELEGATED ExecutionToken and ordinary participant visibility; no ActionGrant. |
| draft Task action | no command | proposal only; no Task write. |
| `CreateTask` self todo | `DELEGATION_ALLOWED` | explicit HUMAN intent and idempotency key; no ActionGrant. |
| `CreateTask` assigned task | `ACTION_GRANT_REQUIRED` | matching DELEGATED ExecutionToken, exact confirmation, `ActionDescriptorV1`, `x-oes-action-grant`, idempotency and local atomic consumption. |
| all other Task P1 commands | `AI_FORBIDDEN` in this slice | no AI tool registration. |

Task assignment has an exact confirmation but does not require step-up MFA by default. A future tenant risk policy may require step-up only through a separately frozen policy change.

## 3. Canonical Binding

The descriptor and digest follow the Auth ActionGrant Contract. `CreateTask` assigned-task binds the exact tenant, assignee, normalized title, description including nullness, due instant including nullness, explicit priority, ToolContract version and idempotency key. The target service derives creator, visibility and initial status; neither AI nor body fields may override them.

## 4. Required Owner Deltas

| Owner | Allowed paths / surfaces | Required output |
| --- | --- | --- |
| Auth | `src/common/src/contracts/auth_service/delegated_execution.proto` (new), `src/services/system/auth-service/src/{application,domain,infrastructure,interfaces,modules}/delegated-execution/**`, Auth Prisma / tests | DelegationGrant lifecycle, ActionGrant issuance, `ag+jwt` signer/validator inputs, `ActionDescriptorV1` digest, credential lifecycle audit. |
| Permission | `src/common/src/contracts/permission_service/delegated_authorization.proto` (new), `src/services/system/permission-service/src/{application,domain,infrastructure,interfaces,modules}/delegated-authorization/**`, focused tests | Trusted HUMAN/delegation/tool/operation intersection decision; no credential issuance or Task data ownership. |
| Common trusted transport | `src/common/src/authorization/trusted-execution/action-grant/**`, `src/common/src/authorization/constants/metadata.constants.ts`, reviewed exports/tests | `x-oes-action-grant` extraction, `ag+jwt` verification, descriptor binding and request-context projection; no business risk mapping or Task persistence. |
| Collaboration Task | `src/common/src/contracts/collaboration_service/collaboration.proto`, `src/services/system/collaboration-service/prisma/**`, `src/services/system/collaboration-service/src/{application,domain,infrastructure,interfaces,modules}/task/**`, focused tests | `idempotency_key` on `CreateTask`, registered operation risk enforcement, receipt/unique constraints, transaction-local ActionGrant consumption, audit references and existing-outbox-preserving result replay. |
| AI-PLATFORM | owner-assigned ToolContract / orchestration path only | Registers the already frozen read/draft/create tools and presents confirmation. This capability must not select AI-PLATFORM paths or redefine its UX. |

`src/common/src/generated/**` changes only via `pnpm proto:regen`. No new public Task event, Permission Code, Gateway route, Task ownership field, shared database or distributed transaction is authorized.

## 5. Transaction And Schema Boundary

Collaboration owns a new local command receipt record with: tenant, HUMAN operator, operation key, idempotency key, descriptor digest, nullable ActionGrant JTI, Task id, result reference and timestamps. It enforces unique `actionGrantJti` and unique `(tenant, operator, operationKey, idempotencyKey)`. The Task mutation, task audit, existing outbox record, receipt and ActionGrant-consumed fact commit in one Collaboration database transaction.

## 6. Acceptance

1. A delegated user sees only their own Task scopes and details.
2. A self todo with an identical key/digest returns one Task; the same key with a changed descriptor fails.
3. An assigned task is rejected without matching ActionGrant, matching DELEGATED ExecutionToken, valid `collaboration.task.assign`, active same-tenant assignee and exact descriptor.
4. Replaying the same ActionGrant, changing assignee/title/description/due/priority or using it from another workload creates no Task.
5. A successful assigned task produces the existing Task audit/outbox facts plus non-secret delegation/action references; it produces no new public ActionGrant event.
6. Timeout, signature failure, permission denial, descriptor mismatch or transaction failure is never reported as Task creation success.

## 7. Gates And Non-goals

Capability Command allocates formal implementation ownership only after AI-PLATFORM has exposed its registered ToolContract surface. This packet does not authorize Task Assistant UI, model routing, knowledge retrieval, new service topology, external channels, other Task commands, step-up policy changes or unattended automation.
