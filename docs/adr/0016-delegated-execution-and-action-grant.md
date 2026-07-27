# ADR 0016: Delegated Execution And One-Time ActionGrant

```text
status: ACCEPTED
decisionDate: 2026-07-27
architectureTruthSource: docs/architecture/collaborations/delegated-execution-and-action-grant.md
authContract: docs/contracts/auth-service/delegated-execution-and-action-grant.md
authorizationContract: docs/contracts/permission-service/delegated-authorization.md
predecessor: DG-1 token cryptography and workload identity
```

## Context

ADR 0015 introduced `DELEGATED` as an execution principal but intentionally deferred its lifecycle, tool boundary and high-risk replay protection. A normal ExecutionToken is audience- and workload-bound but can be reused within its short lifetime; it is therefore not a user confirmation for an irreversible or high-impact business action. Letting an AI infer risk, retain a user’s full authority, or write business data directly would violate OES tenant, authorization and audit boundaries.

## Decision

1. HUMAN delegation uses an Auth-owned `DelegationGrant`. It is explicit, short-lived, revocable and limited to one human, tenant / org, AgentPrincipal, versioned ToolContract and declared operation / Permission Code upper bound. It creates no DELEGATED role and cannot silently renew.
2. Effective DELEGATED authority is the intersection of HUMAN grant, valid delegation, ToolContract upper bound, tenant / org, target resource policy and method authorization. `permission-service` owns this decision; Auth does not own role or policy truth.
3. Each business owner classifies every AI-exposed operation as `DELEGATION_ALLOWED`, `ACTION_GRANT_REQUIRED` or `AI_FORBIDDEN`. The tool layer may display a confirmation but may not change that class.
4. An Auth-issued `ActionGrant` is required in addition to the matching DELEGATED ExecutionToken for `ACTION_GRANT_REQUIRED`. It is issued only after exact human confirmation and applicable step-up. It binds one delegation, target service audience, operation key, canonical target reference, canonical input digest, ToolContract identity/version, tenant / org and idempotency reference. A material change invalidates the user decision.
5. Auth signs ActionGrant using the DG-1 JWS issuer, audience and mTLS workload-binding rules; no parallel signer, secret, wildcard audience or body-based identity is allowed. The grant is short-lived and has no refresh or transfer path.
6. The target business service validates the grant and inserts its unique consumption fact in the same local transaction as the domain command and idempotency result. A repeated identical request returns the established idempotent outcome; a different request or second use fails. Auth and the target service never share a database or use a distributed transaction.
7. AI is permanently forbidden from changing credentials, MFA, recovery materials, sessions, API keys, roles, permissions, policies, delegation, audit records, or approving its own result. Those operations remain human-only management flows.

## Consequences

- Ordinary delegated work stays low-friction; exact human confirmation is reserved for operations whose business owner classifies as high risk.
- The user can understand, cancel and audit delegation without giving AI a persistent general-purpose authority.
- High-risk consumers need a local ActionGrant consumption / idempotency record and black-box tests. This is a target-service responsibility, not an Auth database integration.
- DG-4 closes the design gate. Implementation still requires the DG-1 frozen JWS / workload binding and does not close the independently pending DG-2 emergency-revocation gate.

## Alternatives Rejected

### Reuse the normal ExecutionToken as confirmation

Rejected because its permitted reuse within TTL cannot prove one explicit approval or prevent replay of a high-risk command.

### Give an agent the user’s full permission set

Rejected because it defeats least privilege, tool isolation and revocation.

### Let every service invent a one-time grant

Rejected because lifecycle, user confirmation and cryptographic trust would drift. Auth owns the credential; target services only own their local atomic consumption beside the business write.

## Related Documents

- [Delegated Execution Collaboration](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/delegated-execution-and-action-grant.md)
- [Auth ActionGrant Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/delegated-execution-and-action-grant.md)
- [Delegated Authorization Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/delegated-authorization.md)
