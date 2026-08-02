# DELEGATED Execution And ActionGrant Collaboration

```text
status: FROZEN
decisionAdr: docs/adr/0016-delegated-execution-and-action-grant.md
authTruthSource: docs/architecture/services/auth-service.md
permissionTruthSource: docs/architecture/services/permission-service.md
aiArchitectureTruthSource: docs/architecture/04-ai-architecture.md
```

> Auth owns delegation and ActionGrant credentials; Permission owns authorization decisions; the AI tool layer owns ToolContract identity, user-facing confirmation and execution logs; each business service owns its operation risk class and business command. This collaboration document defines only their stable interaction.

## 1. Scope

This collaboration applies only when an AI or Robot acts as `DELEGATED` for a HUMAN. It defines delegation lifecycle, least-privilege intersection, high-risk confirmation, ActionGrant consumption, replay handling and audit. It neither creates an AI service nor changes any business service’s domain rules.

## 2. Stable Flow

```text
HUMAN selects Agent + Tool + bounded work
  -> Auth creates DelegationGrant
  -> Permission resolves the effective delegated upper bound
  -> Tool invokes only a business-owner classified operation
      -> DELEGATION_ALLOWED: target executes with DELEGATED ExecutionToken
      -> ACTION_GRANT_REQUIRED: user sees exact operation / target / impact
          -> step-up when policy requires
          -> Auth issues bound ActionGrant
          -> target validates and atomically consumes grant with command
      -> AI_FORBIDDEN: tool refuses; only a human management flow is available
```

## 3. Delegation Lifecycle

- A `DelegationGrant` is explicit, bound and time-limited; it is never a standing copy of a user role.
- The user may revoke it at any time. It cannot be renewed or widened silently.
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

## 5. Exact Confirmation And ActionGrant

The confirmation UI must show the action, target, material business impact and reason for confirmation. An ActionGrant binds the confirmed human, delegation, agent, tool version, tenant / org, target audience, operation key, canonical target reference, canonical input digest, idempotency reference, confirmation / step-up evidence and expiry. It cannot be transferred to another tool, workload, audience, target or input. The exact `ActionDescriptorV1` canonicalization and `x-oes-action-grant` metadata carrier are frozen by the [Auth ActionGrant Contract](../../contracts/auth-service/delegated-execution-and-action-grant.md).

Changing a material value—such as amount, counterparty, target resource, operation or tool version—requires a new confirmation. Network retry of the unchanged command does not create a second business result.

## 6. Consumption, Replay And Failure

- Auth issues the signed short-lived credential according to DG-1; target services require the matching DELEGATED ExecutionToken as well as the ActionGrant, and validate both issuer, exact audience and workload binding.
- The target service records `ActionGrant` consumption by unique grant identity in the same local transaction as its idempotency record and domain mutation. A duplicate identity cannot produce a second write.
- An identical retry returns the existing idempotent result. A reused grant with another operation, target, input digest or idempotency reference fails closed.
- No service queries another service database, and no distributed transaction is introduced. Auth does not claim to have committed a business command.

## 7. Audit And UX

The system records creation, display, confirmation, step-up outcome, issuance, refusal, revocation, expiry, attempted replay, consumption and business outcome. Audit records include human / agent / tool attribution, tenant / org, operation and target summary, input digest, request / trace / grant references, policy decision and result category; they exclude secrets and sensitive plaintext.

The normal user experience is uninterrupted for low-risk work, an understandable confirmation card for high-risk work, an explicit result receipt, and an always-available stop / revoke control.

## 8. Dependencies And Non-goals

- DG-1 is consumed for ActionGrant JWS, issuer, audience and mTLS workload binding.
- DG-2 remains independently required for emergency execution revocation; it is not redefined here.
- This design does not define a proto, database schema, event payload, approval workflow, model policy, or individual business operation classification. Those follow their owner’s service truth and the paired Capability Command.
