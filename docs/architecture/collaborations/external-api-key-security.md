# External API Key Security Collaboration

```text
status: FROZEN_DG3
capabilityKey: API-KEY
designGate: DG-3
predecessorGate: FROZEN_TRUSTED_GRPC_METADATA
revocationInvariant: BOUNDED_RESIDUAL_MAX_5_MINUTES
dg2ExternalOpeningGate: false
externalOpening: DISABLED_PENDING_DG3_IMPLEMENTATION_ACCEPTANCE
requiredForExternalOpening:
  - FROZEN_TOKEN_CRYPTOGRAPHY_AND_WORKLOAD_IDENTITY
```

> This document freezes collaboration only. `auth-service`, `identity-service`, and `permission-service` ownership remains defined by their respective service truth sources. HTTP fields and errors are defined by the linked contracts.

## 1. Purpose

This collaboration protects a tenant-owned external integration without creating a Marketplace, shared App principal, direct gRPC access, or a second authorization vocabulary. An external API Key is a long-lived credential used only at the Gateway/Auth entry; it is never a business principal or an internal service credential.

## 2. Stable Participants

| Participant | Stable collaboration responsibility | Does not own |
| --- | --- | --- |
| `identity-service` | Tenant Integration Machine identity, tenant reference, type, name, and active/disabled lifecycle. | API Key material or validation. |
| `auth-service` | Credential lifecycle, secret verification, exchange decision, external access-token issuance, and credential audit. | Machine identity, tenant truth, HTTP routing, or permission truth. |
| `permission-service` | Machine principal grants and the Permission Code decision used by Auth. | Credential, token signing, or external route exposure. |
| `tenant-org-service` | Tenant lifecycle fact consumed by Auth and Gateway. | Machine, credential, or permission truth. |
| `api-gateway` | Only external HTTP entry, header sanitisation, rate protection, external-token validation, external endpoint enforcement, and internal trusted-call composition. | Credential secret, machine lifecycle, role/grant truth, or direct external gRPC exposure. |
| Business service | Owns a business endpoint and resource/domain checks after Gateway calls it with a target-audience ExecutionToken. | External API Key validation or the external caller's raw credential. |

## 3. Tenant Integration Machine Boundary

- A tenant administrator creates a distinct `TENANT` Integration Machine for each independently auditable external integration, such as `warehouse-sync`.
- A machine is exactly one tenant's principal. It cannot select a different tenant in an HTTP body, represent a HUMAN, become a SYSTEM principal, or be installed into another tenant.
- An API Key is a credential for that one machine, not the machine itself. A machine can be disabled independently of its credentials.
- Permission is configurable by an authorised tenant administrator through the machine's normal `PrincipalRoleBinding` and policy. A Permission definition may be classified by Permission Service as externally eligible, but that classification never opens an HTTP endpoint. Effective external access is the intersection of: a Gateway route explicitly marked external, that route's existing `RequirePermissions` BUSINESS Code requirement, the machine's current externally eligible granted Permission Code snapshot, tenant/resource policy, and endpoint-specific domain rules.
- An administrator cannot turn an internal gRPC method, authentication/security operation, or human-administration endpoint into an external API merely by granting a Permission Code.

## 4. Credential Lifecycle

The public identifier has no tenant, customer, role, or permission meaning. The credential presentation is:

```text
Authorization: ApiKey oek_live_<opaque-identifier>.<secret>
```

- `oek_live_` is a type/environment marker only. Identifier and secret are generated independently with cryptographically secure randomness; the secret has at least 256 bits of entropy and uses URL-safe encoding.
- Auth displays the complete secret once, only in the create or rotate success response. Query, audit, error, support, and retry paths reveal only a masked identifier or non-secret metadata.
- Auth stores an irreversible verifier calculated with a versioned KMS/HSM-held pepper and verifies it in constant time. Secret, verifier, and pepper never enter application logs, traces, metrics labels, events, backups intended for operational use, or downstream request context.
- Normal state is `ACTIVE`. Expired, disabled, revoked, or superseded-after-overlap credentials cannot exchange. A replacement may overlap its predecessor for at most seven days; a machine can have at most two valid credentials.
- Default expiry is one year. At 90 days and before expiry, Auth produces rotation-health reminders; it does not silently expire a healthy integration at 90 days. Tenant security policy may enforce a shorter maximum.
- Confirmed leakage revokes the credential immediately and permanently. A new credential is required; the leaked secret is never restored or reactivated.

## 5. HTTP Entry And Internal Propagation

1. The external server sends the API Key only to the frozen Gateway exchange endpoint over HTTPS. It must not send a credential in a URL, query parameter, cookie, request body, or to an OES internal endpoint.
2. Gateway applies generic invalid-credential protection and calls Auth's frozen `ExternalApiKeyCredentialService.ExchangeExternalApiKey` over its mTLS internal path. The call carries Gateway's verified workload identity and exact INTERNAL ExecutionToken for `auth.internal.external_api_key.exchange`; the raw key is permitted only in that one sensitive gRPC request field, never in metadata, logs, traces, events, or a business-service DTO. Auth validates credential, Integration Machine lifecycle and tenant lifecycle, then obtains the Integration Machine's current externally eligible BUSINESS Permission Code snapshot from Permission Service. Neither Gateway nor the external caller selects a capability, Permission Code, role, audience, tenant or expiry during exchange.
3. Auth returns a short-lived external-access result. Gateway returns the Gateway-only external access token to the external server; its maximum TTL is five minutes and it has no refresh token. Auth refuses an empty or oversized external authorization snapshot rather than issuing a Token that would be ambiguous or silently incomplete.
4. The external access token is valid only at Gateway external HTTP endpoints. It is not an `ExecutionToken`, cannot be submitted to gRPC, and is rejected by Auth management, human session, MFA, and internal-only routes.
5. For each approved external request, Gateway validates the external token locally, applies external-route and tenant checks, then uses the trusted context to obtain the separate target-audience, workload-bound ExecutionToken for its internal mTLS call.
6. A business service therefore sees a normal `MACHINE` Execution Principal, trusted tenant/operator/trace context, and a target-audience ExecutionToken. It never sees the API Key or Gateway-only external token.

The external access token is an Auth-signed JWT under the DG-1 frozen issuer and key controls. It has a distinct token type and exact `aud = api-gateway`, and carries `sub` as the Integration Machine, tenant, credential reference, `scope` as the server-derived externally eligible BUSINESS Permission Code snapshot, `authz_version`, `jti`, and five-minute expiry. It has no role graph, resource facts, INTERNAL Code, internal service audience or mTLS `cnf` claim. JWT claims are readable by its holder, so all permitted `scope` values must be intentionally external-safe. Auth enforces a 4 KiB serialized-token limit. Gateway must reject it at every non-external route.

## 6. Exposure, Rate Protection, And Errors

- External opening is deny-by-default. An endpoint is callable only when its Gateway contract carries the Gateway-owned `@ExternalApiRoute()` opt-in and its existing `RequirePermissions` declaration names the required existing BUSINESS Permission Code(s). `RequirePermissions` is the single route-to-permission source; `@ExternalApiRoute()` is only the external exposure switch, not a duplicate allowlist or tenant-configurable mapping. Gateway starts fail-closed if the two declarations are missing, duplicated or invalid. No wildcard API product, route family, tenant, or audience exists.
- Gateway supplies a conservative platform-default rate profile per Integration Machine and separately protects invalid exchange attempts. There is no tenant self-service rate-limit UI in the initial opening; exceptional capacity is an OES platform operation bounded by platform safety limits.
- Rate limits, credential status, tenant status, and machine status must be evaluated before business side effects. Rate limiting does not replace idempotency, resource policy, or domain validation.
- External responses use stable generic authentication/authorisation categories and never disclose whether an identifier exists, which credential field was wrong, exact grants, secret comparisons, or internal service topology.

## 7. Audit, Leak Response, And Opening Gate

Auth and Gateway record correlated, tenant-scoped audit facts for creation, reveal-once success, rotation start/completion, revocation, disablement, exchange success/failure category, rate protection, external capability use, and security-policy changes. Audit includes credential reference, Integration Machine, actor where applicable, tenant, requested/approved capability, request/trace correlation, timestamp, and safe source summary; it excludes secrets, tokens, Authorization headers, and business payloads.

Credential management uses the existing trusted HUMAN execution context and current Permission Codes: `identity.machine.api_key.create`, `identity.machine.api_key.rotate`, and `identity.machine.api_key.revoke`. It does not require an API-Key-specific step-up MFA grant. Organisations that require stronger administrator assurance apply it through the shared session / conditional-access policy, not through a new credential-only MFA scenario.

- A confirmed leak synchronously prevents new exchanges through Auth, disables the affected credential, records a high-severity audit fact, and requires replacement rather than reactivation.
- Outstanding Gateway-only access tokens have a five-minute natural maximum. Gateway does not persist an API Key allowlist or credential-deny cache, and it does not call Auth merely to validate each external API request. A confirmed credential revoke or grant removal immediately affects new exchange; a token issued before the change carries only its original snapshot and can never remain usable past its five-minute natural expiry. A later target-audience ExecutionToken exchange may deny it sooner under the current MACHINE grant. DG-2 continues to govern emergency revocation of internal ExecutionTokens and does not gate this external-token model.
- Suspicious use (for example repeated failures or anomalous volume) triggers rate protection and alerting without silently revoking a healthy integration. The security operator may revoke it after investigation.

## 8. Non-goals

- Direct external gRPC, external access to `auth-service`, shared App principals, cross-tenant installations, Marketplace/developer-platform models, and reusable project-wide API keys.
- API Key use by OES first-party services, Cron, Robot, or AI workers; they use the frozen workload-identity and ExecutionToken path.
- A new scope language, Permission-to-scope translation, bearer-token pool, API Key query parameter, long-lived external session, or automatic API exposure based only on a role grant.
