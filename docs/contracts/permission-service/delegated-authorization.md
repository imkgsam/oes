# Delegated Authorization Contract

```text
status: FROZEN
decisionAdr: docs/adr/0016-delegated-execution-and-action-grant.md
architectureTruthSource: docs/architecture/services/permission-service.md
collaborationTruthSource: docs/architecture/collaborations/delegated-execution-and-action-grant.md
```

> This contract freezes Permission Service’s delegated upper-bound decision only. Auth owns DelegationGrant and ActionGrant credentials; Identity owns AgentPrincipal lifecycle; the AI tool layer owns ToolContract runtime resolution; target services own resource facts, risk classification and domain invariants.

## 1. ResolveDelegatedAuthorization

The logical input is entirely trusted or owner-derived:

- HUMAN principal and active session / security reference;
- delegation reference and its Auth-supplied fixed bounds;
- Identity-owner-resolved active AgentPrincipal and AI-owner-resolved active immutable ToolContract identity/version/operation upper bound, carried by Auth as a safe fixed snapshot/reference;
- tenant / org, exact target service audience, operation key and requested Permission Codes;
- protected business-owner canonical action facts, code risk baseline, tenant-only tightening, effective risk class and policy version.

The caller cannot self-report a more privileged principal, broader tenant, lower risk class, different tool version, target or Permission Code set.

The stable output contains:

- `allowed` and the exact allowed Permission Code subset;
- `riskClass` and policy version as declared by the business owner;
- effective tenant / org and resource-policy decision;
- policy / grant references, `authzVersion` and a safe reason category.

`allowed` is true only if every required restriction intersects successfully: HUMAN grant, DelegationGrant bound, active AgentPrincipal bound, ToolContract bound, tenant / org, owner action/policy, method authorization, resource policy and current target facts. The same trusted owner-derived upper-bound semantics are consumed by `ResolvePrincipalAuthorization` for DELEGATED issuance and by this resolver. `AI_FORBIDDEN` is always denied for a delegated caller. `ACTION_GRANT_REQUIRED` can be authorized as an upper-bound decision but still requires Auth confirmation / step-up and ActionGrant before mutation.

## 2. Stable Rules

- DELEGATED never receives a durable Role or copied HUMAN grant.
- ToolContract bounds are restrictive only; a user’s wider permission cannot widen them.
- Code risk is the minimum baseline. Tenant policy may only disable, require step-up or tighten it; P1 has no org, role or personal override.
- A changed ToolContract version, disabled AgentPrincipal, inactive human, inactive delegation, tenant mismatch, missing/stale owner resolution or policy change fails closed.
- `ResolveDelegatedAuthorization` is a protected method on the existing `PermissionCheckService`, requiring exact Auth mTLS identity plus a certificate-bound Permission-audience ExecutionToken containing `permission.internal.delegated_authorization.resolve`; it is not bootstrap authorization.
- Permission Service validates that required transport credential but does not issue/store it, record its plaintext or own ActionGrant replay records. It never reads AI registration JSON, queries Auth storage or trusts caller/body-supplied bounds.
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
6. An unavailable Identity/AI/business-owner resolution, a stale policy version or a tenant attempt to lower the code baseline denies the request.
