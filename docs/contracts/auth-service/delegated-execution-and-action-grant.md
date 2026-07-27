# Auth Delegated Execution And ActionGrant Contract

```text
status: FROZEN
decisionAdr: docs/adr/0016-delegated-execution-and-action-grant.md
architectureTruthSource: docs/architecture/services/auth-service.md
collaborationTruthSource: docs/architecture/collaborations/delegated-execution-and-action-grant.md
```

> This contract describes Auth’s black-box delegation and ActionGrant behavior. Permission decisions remain in [delegated-authorization.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/delegated-authorization.md); business commands and their risk classes remain owned by each target service.

## 1. DelegationGrant

A logical create request is made only from a trusted HUMAN execution context and identifies an approved AgentPrincipal, immutable ToolContract identity/version, tenant / org, bounded requested operation / Permission Code set and expiry. Auth derives the human, session, tenant and trace from trusted context; caller body fields cannot substitute them.

Auth creates a grant only if Permission authorizes the exact requested upper bound. Successful output exposes an opaque delegation reference, effective expiry and safe audit reference; it never exposes signing material, role graph or a reusable user credential.

A grant can be revoked by its human owner or an authorized human-management flow. It cannot be widened, transferred, silently renewed or converted to MACHINE authorization.

## 2. RequestActionGrant

A logical request identifies the existing delegation reference plus a business-owner supplied, canonical action descriptor: target audience, operation key, target reference, canonical input digest, ToolContract identity/version, idempotency reference and material-impact summary.

Auth requires all of the following:

1. active human / tenant / delegation and unchanged AgentPrincipal / ToolContract binding;
2. an allowed delegated-authorization decision for that exact operation;
3. a user confirmation matching the descriptor exactly;
4. step-up evidence when the owner policy requires it.

It returns one short-lived, signed ActionGrant. It is bound to the direct workload using the DG-1 JWS, audience and mTLS rules, and has no refresh, exchange or delegation path. Auth records issuance, revoke and expiry facts; it does not report that a business command succeeded.

## 3. Target Consumption Contract

Target services require the matching DELEGATED ExecutionToken and validate ActionGrant signature, issuer, expiry, exact audience, workload binding, human / tenant / delegation attribution and the complete descriptor. They must atomically persist the unique grant consumption alongside their idempotency result and business write. A target must not use ActionGrant as a generic bearer capability or as a fallback after ExecutionToken validation fails.

## 4. Stable Error Categories

- `DELEGATION_AUTHENTICATION_REQUIRED`
- `DELEGATION_GRANT_INACTIVE`
- `DELEGATION_GRANT_EXPIRED`
- `DELEGATION_GRANT_REVOKED`
- `DELEGATION_TOOL_BOUNDARY_DENIED`
- `ACTION_GRANT_CONFIRMATION_REQUIRED`
- `ACTION_GRANT_STEP_UP_REQUIRED`
- `ACTION_GRANT_DESCRIPTOR_MISMATCH`
- `ACTION_GRANT_EXPIRED`
- `ACTION_GRANT_REPLAYED`
- `ACTION_GRANT_FORBIDDEN_OPERATION`

Errors do not reveal secrets, hidden policy graph or a near-match target.

## 5. Acceptance

1. A human cannot create a delegation wider than their actual Permission / policy authority.
2. Revoked, expired or altered-tool delegations cannot obtain a new ExecutionToken or ActionGrant.
3. An ActionGrant for one amount, target, operation, audience or input digest fails for every different descriptor.
4. A high-risk action without matching confirmation or required step-up fails before business mutation.
5. The same grant cannot create a second business result; an unchanged network retry returns the idempotent outcome.
6. Auth records credential lifecycle but does not share a database or falsely claim target command completion.
