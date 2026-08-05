# Auth Delegated Execution And ActionGrant Contract

```text
status: FROZEN
decisionAdr: docs/adr/0016-delegated-execution-and-action-grant.md
architectureTruthSource: docs/architecture/services/auth-service.md
collaborationTruthSource: docs/architecture/collaborations/delegated-execution-and-action-grant.md
```

> This contract describes Auth’s black-box delegation and ActionGrant behavior. Permission decisions remain in [delegated-authorization.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/delegated-authorization.md); business commands and their risk classes remain owned by each target service.

## 1. DelegationGrant

A logical create request is made only when a trusted HUMAN instruction starts one bounded AI Run. Auth derives the human, session, tenant and trace from trusted context, resolves the current active AgentPrincipal from Identity and the current active ToolContract identity/version/operation upper bound from the AI Platform runtime owner contract, and binds those facts with the requested operation / Permission Code set and expiry. Caller fields and repository registration JSON cannot substitute for owner resolution.

Auth creates a fresh Run-bound grant only if Permission authorizes the exact trusted upper bound. Permission receives a fixed safe snapshot/reference and independently intersects current HUMAN grants; it does not query Auth storage. Successful output exposes an opaque delegation reference, effective expiry and safe audit reference; it never exposes signing material, role graph or a reusable user credential.

A grant can be revoked by its human owner or an authorized human-management flow. It cannot be widened, transferred, silently renewed or converted to MACHINE authorization. Conversation continuity never extends it; every later user instruction starts a new Run and obtains current authority.

## 2. RequestActionGrant

A logical request identifies the existing Run/delegation reference plus a business-owner supplied, canonical action descriptor: target audience, operation key, target reference, canonical input digest, ToolContract identity/version, idempotency reference and material-impact summary. The protected owner resolution also supplies the code baseline, effective tenant-tightened risk class and policy version; caller or AI fields cannot lower or replace them.

Auth requires all of the following:

1. active human / tenant / delegation and unchanged AgentPrincipal / ToolContract binding;
2. an allowed delegated-authorization decision for that exact owner facts and policy version;
3. immutable Auth-owned HUMAN confirmation evidence matching the descriptor exactly;
4. step-up evidence when the owner policy requires it.

AI Platform presents the human-readable confirmation, but Auth owns the confirmation fact and rejects an AI/body assertion of confirmation. It returns one short-lived, signed ActionGrant bound to one owner-defined business action and its policy version, not one technical RPC or arbitrary batch. It is bound to the direct workload using the DG-1 JWS, audience and mTLS rules, and has no refresh, exchange or delegation path. Auth records issuance, revoke and expiry facts; it does not report that a business command succeeded.

### Canonical Action Descriptor And Transport

Every ActionGrant uses `ActionDescriptorV1`. The business-owner adapter constructs the following logical object before human confirmation:

```text
descriptorVersion
operationKey
toolContract
target
input
idempotencyKey
```

`toolContract` is an object containing its immutable identity and version. `target` and `input` use owner-defined JSON-compatible values. The complete object is canonicalized with RFC 8785 JSON Canonicalization Scheme, UTF-8 encoded, SHA-256 hashed, and base64url encoded without padding. The resulting `descriptorDigest` is the credential binding; Auth signs that digest and the individual stable references, never a caller-provided digest alone. Changes to any logical value—including a ToolContract version or omitted versus explicit `null`—produce a different digest and require a new confirmation.

The compact ActionGrant JWS uses protected header `typ=ag+jwt` and is carried only as the single gRPC metadata value `x-oes-action-grant`. It is never a DTO field, query parameter, event payload, log field or audit plaintext. The matching DELEGATED ExecutionToken remains mandatory in `authorization` metadata.

## 3. Target Consumption Contract

Target services require the matching DELEGATED ExecutionToken and validate ActionGrant signature, issuer, expiry, exact audience, workload binding, human / tenant / delegation attribution, owner policy version and the complete descriptor. They must atomically persist the business receipt/result, presented JTI consumption and business write. A target must not use ActionGrant as a generic bearer capability or as a fallback after ExecutionToken validation fails.

The target owns one immutable business receipt keyed by `(tenant, human operator, operationKey, idempotencyKey)` and separate immutable consumption facts keyed by `actionGrantJti`. Repeating the same idempotency identity with the same descriptor returns the established result. When response/signing uncertainty requires a replacement ActionGrant for that unchanged confirmed descriptor, the new JTI is consumed against the same receipt/result and cannot create another business write. Reusing a JTI, changing the descriptor/policy version, or substituting the idempotency identity fails closed.

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
7. A long-lived Conversation and a stopped/completed Run cannot retain or revive delegation authority.
8. Auth obtains AgentPrincipal and ToolContract bounds only through owner runtime contracts; disabled registration JSON never authorizes execution.
