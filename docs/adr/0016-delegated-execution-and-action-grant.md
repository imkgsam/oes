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
8. A durable Conversation is context only and never carries authority. Every user-initiated instruction creates one bounded AI Run; Auth creates a fresh Run-bound `DelegationGrant` from the current verified HUMAN session, AgentPrincipal and ToolContract upper bound. A completed, stopped or expired Run cannot continue calling tools, and reopening a Conversation creates a new Run rather than reviving an old grant.
9. Every business owner keeps a versioned code baseline for each AI-exposed operation. Platform and tenant policy may only tighten that baseline (`DELEGATION_ALLOWED` -> `ACTION_GRANT_REQUIRED` -> `AI_FORBIDDEN`), require step-up or disable the operation; P1 has no org, role or personal downgrade/override. The business owner returns the effective class and policy version from a trusted owner-action resolution, and the ActionGrant binds that version.
10. Exact confirmation is one user-understandable business action, not one technical RPC. One ActionGrant cannot authorize another action, arbitrary batch or cross-service bundle. A future batch is eligible only when its owner defines it as one first-class business operation and shows the complete batch impact.
11. AI Platform presents the confirmation, but Auth owns the immutable HUMAN confirmation fact. Caller fields cannot assert confirmation, risk class, target facts or policy version. Material descriptor or security-policy change requires a new confirmation; an unchanged technical retry does not.
12. A target persists the business idempotency receipt separately from every ActionGrant JTI consumption. An identical retry returns the established result; a replacement JTI for the same confirmed descriptor is consumed against that result; a changed descriptor, substituted key or reused JTI fails closed. The target never reports success without an explicit owner result.
13. User stop ends future work in the current Run and cancels pending confirmation, but it does not pretend to undo an already committed business action. Conversation receipts expose business status; immutable owner/Auth/Permission/AI audit facts retain governance evidence without credential plaintext.
14. Principal Authorization scheme A remains unchanged. `ResolveDelegatedAuthorization` is a normal protected method on the existing Permission surface, requiring Auth mTLS plus a certificate-bound Permission-audience ExecutionToken with `permission.internal.delegated_authorization.resolve`. The Task owner-action resolver similarly requires Auth mTLS plus `collaboration.internal.ai_action.resolve`; neither is an mTLS-only bootstrap exception.
15. Auth orchestrates the trusted DELEGATED upper bound: current HUMAN/session and Auth-owned DelegationGrant, Identity-owned active AgentPrincipal, AI Platform-owned active ToolContract runtime bounds, and business-owner action/policy facts. Permission independently resolves HUMAN grants and computes the intersection; it does not query Auth storage, read AI registration JSON or create a Permission -> Auth -> Permission synchronous cycle.
16. Common remains the sole static INTERNAL Code source. ActionGrant adds exactly the two protected resolver Codes above and no BUSINESS Code; implementation readiness must also register the already-frozen Principal Authorization Code before runtime opening.

## Consequences

- Ordinary delegated work stays low-friction; exact human confirmation is reserved for operations whose business owner classifies as high risk.
- The user can understand, cancel and audit delegation without giving AI a persistent general-purpose authority.
- High-risk consumers need a local ActionGrant consumption / idempotency record and black-box tests. This is a target-service responsibility, not an Auth database integration.
- Conversation continuity remains independent from authorization lifetime, so a Codex-like long-lived conversation never becomes a standing grant.
- Low-risk foreground work remains user-invisible inside one bounded Run, while every independent high-risk action requires its own business confirmation.
- Tenant configuration remains usable without creating a downgrade path: missing, stale or invalid effective policy closes the affected operation.
- Technical retry and result reconciliation remain low-friction, but changed business intent always returns to confirmation.
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
