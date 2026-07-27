# Delegated Authorization Contract

```text
status: FROZEN
decisionAdr: docs/adr/0016-delegated-execution-and-action-grant.md
architectureTruthSource: docs/architecture/services/permission-service.md
collaborationTruthSource: docs/architecture/collaborations/delegated-execution-and-action-grant.md
```

> This contract freezes Permission Service’s delegated upper-bound decision only. Auth owns DelegationGrant and ActionGrant credentials; the AI tool layer owns ToolContract registration; target services own resource facts, risk classification and domain invariants.

## 1. ResolveDelegatedAuthorization

The logical input is entirely trusted or owner-derived:

- HUMAN principal and active session / security reference;
- delegation reference and its Auth-supplied fixed bounds;
- AgentPrincipal and immutable ToolContract identity/version;
- tenant / org, exact target service audience, operation key and requested Permission Codes;
- business-owner risk class and minimum resource facts where policy needs them.

The caller cannot self-report a more privileged principal, broader tenant, lower risk class, different tool version, target or Permission Code set.

The stable output contains:

- `allowed` and the exact allowed Permission Code subset;
- `riskClass` as declared by the business owner;
- effective tenant / org and resource-policy decision;
- policy / grant references, `authzVersion` and a safe reason category.

`allowed` is true only if every required restriction intersects successfully: HUMAN grant, delegation bound, ToolContract bound, tenant / org, method authorization, resource policy and current target facts. `AI_FORBIDDEN` is always denied for a delegated caller. `ACTION_GRANT_REQUIRED` can be authorized as an upper-bound decision but still requires Auth confirmation / step-up and ActionGrant before mutation.

## 2. Stable Rules

- DELEGATED never receives a durable Role or copied HUMAN grant.
- ToolContract bounds are restrictive only; a user’s wider permission cannot widen them.
- A changed ToolContract version, disabled AgentPrincipal, inactive human, inactive delegation, tenant mismatch or policy change fails closed.
- Permission Service does not issue or consume credentials and does not own ActionGrant replay records.
- Target service domain rules, approval separation, state transitions and idempotency remain mandatory after an allowed decision.

## 3. Stable Error Categories

- `AUTHORIZATION_DELEGATION_DENIED`
- `AUTHORIZATION_DELEGATION_INACTIVE`
- `AUTHORIZATION_TOOL_BOUNDARY_DENIED`
- `AUTHORIZATION_OPERATION_CLASS_INVALID`
- `AUTHORIZATION_OPERATION_FORBIDDEN_FOR_AI`
- `AUTHORIZATION_TENANT_MISMATCH`
- `AUTHORIZATION_RESOURCE_FACTS_INVALID`

## 4. Acceptance

1. A DELEGATED request is denied if any of human, delegation, tool, tenant, policy or resource restrictions denies it.
2. A ToolContract cannot be widened by a user role, request body or agent-provided risk label.
3. `AI_FORBIDDEN` remains denied even if the human holds the corresponding management Permission.
4. `ACTION_GRANT_REQUIRED` is not executable until Auth has produced a descriptor-matching ActionGrant.
5. Permission outputs are auditable but contain no credential, secret or internal role graph.
