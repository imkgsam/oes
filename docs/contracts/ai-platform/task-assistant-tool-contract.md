# AI Platform Task Assistant ToolContract

```text
status: FROZEN
frozenDate: 2026-08-03
toolContractId: oes.ai.task-assistant.collaboration-task
version: 1.0.0
architectureTruthSource: docs/architecture/platforms/ai-platform.md
collaborationTruthSource: docs/architecture/collaborations/task-assistant.md
operationOwnerPacket: docs/plans/features/delegated-task-action-grant.md
predecessorDesignGate: FROZEN_AI_PLATFORM_TASK_ASSISTANT
registrationGate: FROZEN_TOOL_CONTRACT_REGISTRATION_READY
```

> This contract freezes one immutable, AI-owned registration artifact. It registers metadata only: it does not define an API, runtime, service, schema, provider, UX, orchestration topology, credential lifecycle or business rule.

## 1. Identity And Immutability

The exact identity is：

```text
toolContractId = oes.ai.task-assistant.collaboration-task
version = 1.0.0
```

`toolContractId + version` is immutable after entering `main`. The repository artifact filename is versioned. Any operation, mapping, flag or semantic change requires a new version and a new file; editing or replacing `1.0.0` in place is forbidden.

## 2. Registration State

The manifest must contain these exact top-level invariants：

| Field | Exact value |
| --- | --- |
| `kind` | `OesAiToolContractRegistration` |
| `toolContractId` | `oes.ai.task-assistant.collaboration-task` |
| `version` | `1.0.0` |
| `registrationState` | `REGISTERED_DISABLED` |
| `immutable` | `true` |
| `runtimeExecutionEnabled` | `false` |
| `mutationExecutionEnabled` | `false` |
| `publicExposureEnabled` | `false` |

The manifest must not contain or imply service placement, endpoint, route, proto, schema, credential, provider, UI, prompt, model or runtime adapter configuration.

## 3. Exact Registered Operation Set

The manifest contains exactly five operations and no others：

| `operationKey` | `mode` | Owner contract / operation | `ownerRiskClass` | Effect | `runtimeEnabled` |
| --- | --- | --- | --- | --- | --- |
| `collaboration.task.list.v1` | `READ` | `docs/contracts/collaboration-service/task-query.md` / `ListTasks` | `DELEGATION_ALLOWED` | read only | `false` |
| `collaboration.task.get.v1` | `READ` | `docs/contracts/collaboration-service/task-query.md` / `GetTask` | `DELEGATION_ALLOWED` | read only | `false` |
| `oes.ai.task-assistant.draft-task-create.v1` | `DRAFT_ONLY` | none / none | `null` | proposal only; no Task command | `false` |
| `collaboration.task.create-self.v1` | `MUTATION` | `docs/contracts/collaboration-service/task-command.md` / `CreateTask` self todo variant | `DELEGATION_ALLOWED` | Task mutation, disabled | `false` |
| `collaboration.task.create-assigned.v1` | `MUTATION` | `docs/contracts/collaboration-service/task-command.md` / `CreateTask` assigned variant | `ACTION_GRANT_REQUIRED` | Task mutation, disabled | `false` |

Every non-draft operation must also cite `docs/plans/features/delegated-task-action-grant.md` as its risk source. These values mirror Collaboration-owned truth and do not transfer risk ownership to AI-PLATFORM. A mismatch with the owner source invalidates the registration.

`UpdateTask`、`StartTask`、`CompleteTask`、`CancelTask`、`ReopenTask`、`ArchiveTask` and `UnarchiveTask` must not appear. Absence means unregistered; their owner-declared Task Assistant P1 risk remains `AI_FORBIDDEN`.

## 4. Exact Manifest Shape

The repository artifact is exactly：

`src/ai-platform/tool-contracts/registrations/task-assistant-collaboration-task.v1.json`

Its complete logical content is the following exact object；the implementation must preserve this operation order and every literal value：

```json
{
  "kind": "OesAiToolContractRegistration",
  "toolContractId": "oes.ai.task-assistant.collaboration-task",
  "version": "1.0.0",
  "registrationState": "REGISTERED_DISABLED",
  "immutable": true,
  "runtimeExecutionEnabled": false,
  "mutationExecutionEnabled": false,
  "publicExposureEnabled": false,
  "operations": [
    {
      "operationKey": "collaboration.task.list.v1",
      "mode": "READ",
      "ownerContract": "docs/contracts/collaboration-service/task-query.md",
      "ownerOperation": "ListTasks",
      "ownerRiskClass": "DELEGATION_ALLOWED",
      "riskSource": "docs/plans/features/delegated-task-action-grant.md",
      "businessEffect": "READ_ONLY",
      "runtimeEnabled": false
    },
    {
      "operationKey": "collaboration.task.get.v1",
      "mode": "READ",
      "ownerContract": "docs/contracts/collaboration-service/task-query.md",
      "ownerOperation": "GetTask",
      "ownerRiskClass": "DELEGATION_ALLOWED",
      "riskSource": "docs/plans/features/delegated-task-action-grant.md",
      "businessEffect": "READ_ONLY",
      "runtimeEnabled": false
    },
    {
      "operationKey": "oes.ai.task-assistant.draft-task-create.v1",
      "mode": "DRAFT_ONLY",
      "ownerContract": null,
      "ownerOperation": null,
      "ownerRiskClass": null,
      "riskSource": null,
      "businessEffect": "PROPOSAL_ONLY",
      "runtimeEnabled": false
    },
    {
      "operationKey": "collaboration.task.create-self.v1",
      "mode": "MUTATION",
      "ownerContract": "docs/contracts/collaboration-service/task-command.md",
      "ownerOperation": "CreateTask",
      "ownerRiskClass": "DELEGATION_ALLOWED",
      "riskSource": "docs/plans/features/delegated-task-action-grant.md",
      "businessEffect": "TASK_CREATE",
      "runtimeEnabled": false
    },
    {
      "operationKey": "collaboration.task.create-assigned.v1",
      "mode": "MUTATION",
      "ownerContract": "docs/contracts/collaboration-service/task-command.md",
      "ownerOperation": "CreateTask",
      "ownerRiskClass": "ACTION_GRANT_REQUIRED",
      "riskSource": "docs/plans/features/delegated-task-action-grant.md",
      "businessEffect": "TASK_CREATE",
      "runtimeEnabled": false
    }
  ]
}
```

`collaboration.task.create-self.v1` and `collaboration.task.create-assigned.v1` identify the two owner-defined `CreateTask` variants；the manifest does not redefine their request semantics. `businessEffect` is descriptive classification only and is not an execution switch.

The top-level object must contain only the nine keys shown above, and each operation entry must contain only：

- `operationKey`；
- `mode`；
- `ownerContract`（`null` only for the draft operation）；
- `ownerOperation`（`null` only for the draft operation）；
- `ownerRiskClass`（`null` only for the draft operation）；
- `riskSource`（`null` only for the draft operation）；
- `businessEffect`；
- `runtimeEnabled = false`。

No additional top-level or operation-entry key is permitted. This exact structural allowlist rejects service、endpoint、route、proto、schema、credential、provider、UI、prompt、model、adapter and executable runtime configuration while permitting only the required false-valued safety flags. No field can grant authority. The manifest is an immutable allowlist descriptor, not a credential, Permission, policy, delegation or runtime switch.

## 5. Repository Ownership And Implementation Lease

The registration artifact is owned by AI-PLATFORM at a repository-level neutral path; the path does not select a service or deployment topology.

One v2 Lite A/I may write only：

- `src/ai-platform/tool-contracts/registrations/task-assistant-collaboration-task.v1.json`
- `src/ai-platform/tool-contracts/registrations/task-assistant-collaboration-task.v1.static.check.mjs`

The static check uses only the Node standard library and must not require a package, lockfile, generated code, network access or runtime service.

## 6. Validation Contract

The static check and A/V evidence must prove：

1. exact identity、version、kind、state and immutable flag；
2. exact five-operation set with no duplicate/additional key；
3. exact owner contract/operation/risk mapping；
4. all global execution/exposure flags and every `runtimeEnabled` are `false`；
5. draft has no owner command or risk class；
6. forbidden Task commands are absent；
7. top-level and operation-entry key sets exactly match section 4, with no additional topology or executable-runtime configuration；
8. candidate changes only the two leased implementation paths；
9. no production source imports, loads or executes the manifest；
10. the standalone Node test exits successfully。

Required test command：

```bash
node --test src/ai-platform/tool-contracts/registrations/task-assistant-collaboration-task.v1.static.check.mjs
```

## 7. Disabled-Phase Consequences

- `FROZEN_TOOL_CONTRACT_REGISTRATION_READY` succeeds `FROZEN_AI_PLATFORM_TASK_ASSISTANT` and can unblock ACTION-GRANT implementation ordering because identity/version and operation bindings are stable.
- It cannot authorize, invoke or expose `ListTasks`、`GetTask` or either `CreateTask` variant.
- No ActionGrant runtime is needed to register disabled metadata.
- Mutation execution requires a future accepted runtime candidate plus EXEC-CRYPTO, DG-4 and Collaboration target readiness.
- Public exposure requires separately frozen Gateway/BFF and UX ownership.

## 8. Non-goals

- No service, proto, DTO, schema, database, event, permission code or operator-context change.
- No model/provider, prompt, knowledge, UX or orchestration choice.
- No DelegationGrant/ActionGrant issue, validation, descriptor, consumption or idempotency implementation.
- No Collaboration Task mutation implementation.
- No runtime execution or public route.
