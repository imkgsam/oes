# Delegated Task ActionGrant Implementation Packet

```text
status: DESIGN_FROZEN_IMPLEMENTATION_NOT_DISPATCHED
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
| Auth | `src/common/src/contracts/auth_service/delegated_execution.proto` (new), `src/services/system/auth-service/src/{application,domain,infrastructure,interfaces,modules}/delegated-execution/**`, Auth Prisma / tests | Run-bound DelegationGrant lifecycle, trusted Identity/AI/owner resolution orchestration, Auth-owned HUMAN confirmation evidence, ActionGrant issuance, `ag+jwt` signer/validator inputs, `ActionDescriptorV1` digest, credential lifecycle audit. |
| Permission | `src/common/src/contracts/permission_service/delegated_authorization.proto` (new), `src/services/system/permission-service/src/{application,domain,infrastructure,interfaces,modules}/delegated-authorization/**`, focused tests | Protected resolver on existing `PermissionCheckService`; trusted HUMAN grant ∩ DelegationGrant ∩ AgentPrincipal ∩ ToolContract ∩ owner action/policy decision; no credential issuance, Auth/AI storage read or Task data ownership. |
| Common trusted transport | `src/common/src/authorization/trusted-execution/action-grant/**`, `src/common/src/authorization/constants/metadata.constants.ts`, reviewed exports/tests | `x-oes-action-grant` extraction, `ag+jwt` verification, descriptor binding and request-context projection; no business risk mapping or Task persistence. |
| Collaboration Task | `src/common/src/contracts/collaboration_service/collaboration.proto`, `src/services/system/collaboration-service/prisma/**`, `src/services/system/collaboration-service/src/{application,domain,infrastructure,interfaces,modules}/task/**`, focused tests | Protected owner-action resolver, code baseline + tenant-only tightening, `idempotency_key` on `CreateTask`, separate receipt/JTI-consumption facts, atomic Task write and existing-outbox-preserving result replay. |
| Common Permission Code registration | new `src/common/src/authorization/permission-codes/{permission,collaboration}/internal.permission-codes.ts`, existing namespace `index.ts` exports, sync/tests | Register pre-existing `permission.internal.principal_authorization.resolve` readiness gap plus exactly two ActionGrant INTERNAL Codes: `permission.internal.delegated_authorization.resolve` and `collaboration.internal.ai_action.resolve`; no new BUSINESS Code and no risk mapping. A shared types path is leased only if existing definition types are proven insufficient. |
| AI-PLATFORM | owner-assigned ToolContract runtime resolution / orchestration path only | Resolves active ToolContract identity/version/operation upper bound for Auth and presents confirmation. Disabled registration JSON is review input, never runtime authority; this capability must not choose a speculative topology or redefine UX. |

`src/common/src/generated/**` changes only via `pnpm proto:regen`. No new BUSINESS Permission Code, public Task event, Gateway route, Task ownership field, shared database or distributed transaction is authorized.

## 5. Transaction And Schema Boundary

Collaboration owns one local business command receipt identity for tenant, HUMAN operator, operation key and idempotency key, plus separate immutable ActionGrant JTI consumption facts. The Task mutation, task audit, existing outbox record, receipt and presented JTI consumption commit in one Collaboration database transaction. An unchanged replacement JTI binds to the existing receipt/result; it never creates a second Task. Exact schema remains implementation-owned.

## 6. Acceptance

1. A delegated user sees only their own Task scopes and details.
2. A self todo with an identical key/digest returns one Task; the same key with a changed descriptor fails.
3. An assigned task is rejected without matching ActionGrant, matching DELEGATED ExecutionToken, valid `collaboration.task.assign`, active same-tenant assignee and exact descriptor.
4. Replaying the same ActionGrant, changing assignee/title/description/due/priority or using it from another workload creates no Task.
5. A successful assigned task produces the existing Task audit/outbox facts plus non-secret delegation/action references; it produces no new public ActionGrant event.
6. Timeout, signature failure, permission denial, descriptor mismatch or transaction failure is never reported as Task creation success.
7. A replacement JTI for the unchanged confirmed descriptor resolves to the original Task, while a reused JTI, changed policy version or substituted idempotency identity creates no write.
8. Permission Code readiness proves the Principal Authorization Code plus both ActionGrant INTERNAL Codes are registered in Common with correct owner, kind, workload policy and protected RPC mapping; no BUSINESS Code is added.
9. Auth obtains active AgentPrincipal/ToolContract bounds from owner runtime contracts, Permission performs the independent intersection, and no runtime path reads AI registration JSON or forms a Permission -> Auth -> Permission cycle.

## 7. Gates And Non-goals

Formal implementation starts only after AI-PLATFORM has exposed its runtime ToolContract resolver, Common Permission Code readiness is proven and all predecessor gates hold. Initialization is fail closed: missing owner resolver, code registration/catalog sync, policy version, signer, receipt/JTI storage or audit dependency keeps delegated mutation disabled. Rollback disables the ToolContract mutation flag and ActionGrant issuance/consumption path while preserving immutable audit, receipts and already committed Task results; it never deletes evidence or pretends to undo business state. This packet does not authorize Task Assistant UI, model routing, knowledge retrieval, new service topology, external channels, other Task commands, step-up policy changes or unattended automation.
