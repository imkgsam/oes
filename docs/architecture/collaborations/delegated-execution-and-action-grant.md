# DELEGATED Execution And ActionGrant Collaboration

```text
status: FROZEN
decisionAdr: docs/adr/0016-delegated-execution-and-action-grant.md
authTruthSource: docs/architecture/services/auth-service.md
permissionTruthSource: docs/architecture/services/permission-service.md
aiArchitectureTruthSource: docs/architecture/platforms/ai-platform.md
```

> Auth owns delegation and ActionGrant credentials; Permission owns authorization decisions; the AI tool layer owns ToolContract identity, user-facing confirmation and execution logs; each business service owns its operation risk class and business command. This collaboration document defines only their stable interaction.

## 1. Scope

This collaboration applies only when an AI or Robot acts as `DELEGATED` for a HUMAN. It defines delegation lifecycle, least-privilege intersection, high-risk confirmation, ActionGrant consumption, replay handling and audit. It neither creates an AI service nor changes any business service’s domain rules.

A durable Conversation is never an authorization container. One user instruction creates one bounded AI Run and one fresh Run-bound delegation; reopening or continuing the Conversation later creates a new Run from current HUMAN, tenant, AgentPrincipal, ToolContract and policy truth. A Run ends on completion, stop, expiry or loss of any required authority. Long-lived unattended work remains a separately governed MACHINE workflow.

Auth orchestrates the trusted upper bound without becoming its semantic owner: current HUMAN/session and Auth-owned DelegationGrant, Identity-owned active AgentPrincipal, AI Platform-owned active ToolContract runtime bounds, and business-owner action/policy facts. Permission independently resolves HUMAN grants and computes the intersection. Permission never queries Auth storage or AI registration JSON, and unavailable owner resolution fails closed rather than creating a synchronous Permission -> Auth -> Permission cycle.

## 2. Stable Flow

```text
HUMAN initiates one AI Run with an approved Agent + Tool
  -> Auth creates a Run-bound DelegationGrant without an extra low-risk UX prompt
  -> business owner resolves canonical action facts, code baseline and tenant tightening
  -> Permission resolves the effective delegated upper bound
  -> Tool invokes only that owner-resolved operation
      -> DELEGATION_ALLOWED: target executes with DELEGATED ExecutionToken
      -> ACTION_GRANT_REQUIRED: user sees exact operation / target / impact
          -> step-up when policy requires
          -> Auth records HUMAN confirmation and issues bound ActionGrant
          -> target validates and atomically consumes grant with command
      -> AI_FORBIDDEN: tool refuses; only a human management flow is available
```

## 3. Delegation Lifecycle

- A `DelegationGrant` is explicit, bound and time-limited; it is never a standing copy of a user role.
- The HUMAN act of initiating a Run is the explicit trigger for its bounded grant. It creates no separate low-risk authorization dialog and does not authorize a later Run.
- The user may revoke it at any time. It cannot be renewed or widened silently.
- A new user instruction creates a new Run and current grant rather than renewing a completed or expired grant. Conversation age and an open browser page extend nothing.
- Expiry, user revocation, inactive human / tenant, changed authorization version, changed AgentPrincipal, changed ToolContract version or policy denial prevents future delegated execution and ActionGrant issuance.
- Long-running unattended automation is a separately governed MACHINE workflow. It must not continue by retaining a user’s `DelegationGrant`.

## 4. Least-Privilege And Risk Rules

The effective action is the strict intersection of HUMAN grant, delegation grant, ToolContract upper bound, tenant / org, service method declaration, resource policy and domain rule. A tool cannot gain a user’s broader role merely because that user starts it.

Each business owner declares one immutable AI risk class per operation:

| Class | Meaning |
| --- | --- |
| `DELEGATION_ALLOWED` | The bounded delegated operation can proceed without a new confirmation. |
| `ACTION_GRANT_REQUIRED` | Exact user confirmation and a one-time ActionGrant are mandatory. |
| `AI_FORBIDDEN` | AI cannot execute the operation under any delegation or ActionGrant. |

`AI_FORBIDDEN` includes credential, MFA, recovery material, session, API Key, role, permission, policy, delegation and audit mutations, and an AI approving its own output. Business owners may add stricter prohibitions.

The owner code declaration is the minimum security baseline. The business owner may expose a tenant-level governed override that can only disable, require step-up or move the class toward a stricter value. P1 has no org, role or personal risk override. Missing, invalid or stale effective policy cannot lower risk. The owner returns a safe policy reference/version with the canonical action facts; Permission and Auth consume that fact but do not become the risk-class owner.

## 5. Exact Confirmation And ActionGrant

The confirmation UI must show the action, target, material business impact and reason for confirmation. It uses business language and never exposes mTLS, ExecutionToken or ActionGrant terminology. AI Platform presents the owner facts, while Auth owns the immutable HUMAN confirmation evidence; a request field or AI assertion is not confirmation.

One confirmation covers exactly one business-owner-defined action, even if that action uses multiple internal RPCs. It does not cover a second action or an arbitrary cross-service/batch bundle. A future owner-defined batch must be one first-class operation whose full material contents are displayed. An ActionGrant binds the confirmed human, Run/delegation, agent, tool version, tenant / org, target audience, operation key, canonical target reference, canonical input digest, idempotency reference, owner policy version, confirmation / step-up evidence and expiry. It cannot be transferred to another tool, workload, audience, target or input. The exact `ActionDescriptorV1` canonicalization and `x-oes-action-grant` metadata carrier are frozen by the [Auth ActionGrant Contract](../../contracts/auth-service/delegated-execution-and-action-grant.md).

Changing a material value—such as amount, counterparty, target resource, operation or tool version—requires a new confirmation. Network retry of the unchanged command does not create a second business result.

## 6. Consumption, Replay And Failure

- Auth issues the signed short-lived credential according to DG-1; target services require the matching DELEGATED ExecutionToken as well as the ActionGrant, and validate both issuer, exact audience and workload binding.
- The target owns one immutable business command receipt keyed by tenant/HUMAN/operation/idempotency identity and separate immutable consumption facts keyed by ActionGrant JTI. The first success writes the business result, receipt and presented JTI consumption in one local transaction.
- An identical technical retry returns the existing idempotent result without another business write. If an unchanged, still-confirmed action receives a replacement ActionGrant after a response/signing timeout, its new JTI is consumed against the same receipt/result. A reused JTI, changed descriptor, substituted idempotency identity or different action fails closed.
- Timeout is `RESULT_PENDING` until the owner result is reconciled. AI reports `SUCCEEDED` only from an explicit owner result and never retries by creating a new business identity.
- No service queries another service database, and no distributed transaction is introduced. Auth does not claim to have committed a business command.

## 7. Audit And UX

The system records Run creation/termination, proposal, display, confirmation, step-up outcome, issuance, refusal, revocation, expiry, attempted replay, consumption and business outcome. Audit records include human / agent / tool attribution, tenant / org, operation and target summary, input digest, request / trace / grant references, owner policy version, Permission decision and result category; they exclude secrets and sensitive plaintext.

The normal user experience is uninterrupted for low-risk work, an understandable confirmation card for each high-risk business action, an explicit result receipt, and an always-available stop control. Stop prevents new work and cancels pending confirmation in the current Run; an already committed business result remains visible and any reversal is a new owner-defined action. The Conversation may remain available indefinitely but carries no standing authority.

## 8. Dependencies And Non-goals

- DG-1 is consumed for ActionGrant JWS, issuer, audience and mTLS workload binding.
- DG-2 remains independently required for emergency execution revocation; it is not redefined here.
- Principal Authorization scheme A remains unchanged. `ResolveDelegatedAuthorization` is mounted on the existing `PermissionCheckService` and requires exact Auth mTLS plus a certificate-bound `aud=permission-service` ExecutionToken containing `permission.internal.delegated_authorization.resolve`. It is not a bootstrap method.
- Each business owner supplies canonical action facts through its own protected resolver. The Task P1 resolver requires exact Auth mTLS plus a Collaboration-audience ExecutionToken containing `collaboration.internal.ai_action.resolve`; caller-provided risk/facts cannot substitute for it.
- Common is the unique static owner registry for these INTERNAL Codes. Runtime opening requires the already-frozen `permission.internal.principal_authorization.resolve` plus exactly the two ActionGrant Codes above to be registered and catalog-synchronized; no new BUSINESS Code is introduced.
- This design does not define a proto, database schema, event payload, approval workflow, model policy, or individual business operation classification. Those follow their owner’s service truth and the applicable implementation plan.
