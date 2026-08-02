# External API Key Exchange Contract

```text
status: FROZEN_DG3
architectureTruthSource: docs/architecture/collaborations/external-api-key-security.md
revocationInvariant: BOUNDED_RESIDUAL_MAX_5_MINUTES
dg2ExternalOpeningGate: false
externalOpening: DISABLED_PENDING_DG3_IMPLEMENTATION_ACCEPTANCE
```

> This is the public Gateway HTTP contract for a future external integration. It is frozen for implementation but is not open to callers until its security gates are met.

## 1. Entry Point

```http
POST /api/v1/external/auth/exchange
Authorization: ApiKey oek_live_<opaque-identifier>.<secret>
Content-Type: application/json
```

The request body is an empty JSON object. It cannot select tenant, machine, subject, role, Permission Code, internal audience, expiry, or any other authority. API Keys in URL/query parameters, cookies, request bodies, or any non-`Authorization` header are rejected and redacted before logging.

The endpoint requires HTTPS. It is the only public endpoint that accepts an API Key. It is not a gRPC endpoint and does not proxy the API Key to a business service.

## 2. Success Response

```json
{
  "access_token": "<gateway-only-short-lived-token>",
  "token_type": "Bearer",
  "expires_in": 300
}
```

The token is valid for at most five minutes and has no refresh token. It is a Gateway-only external access token, not an OES internal `ExecutionToken`. The external caller presents it only as `Authorization: Bearer <access_token>` to an explicitly external-safe Gateway HTTP endpoint.

The token represents the Integration Machine and its tenant; neither is caller-selectable. It carries only Auth-derived, externally safe existing BUSINESS Permission Codes in its signed `scope` claim, plus an opaque authorization version; it is not encrypted and therefore carries no roles, policy graph, INTERNAL Code, resource fact, secret or business data. Gateway rejects it at management, human-session, account-security, MFA, Auth, internal-only, and gRPC routes. On a permitted external request, Gateway obtains a new target-audience ExecutionToken for its own mTLS call; the external caller never receives it.

## 3. External Capability Enforcement

- A route is usable only when it carries the Gateway-owned `@ExternalApiRoute()` opt-in and its existing `RequirePermissions` declaration names the required existing BUSINESS Permission Code(s). `RequirePermissions` remains the single source for a route's Code requirement; `@ExternalApiRoute()` is only the external exposure switch, not a second permission table or tenant-configurable mapping. The two declarations must be present on the same route contract before external opening.
- Gateway validates the token locally with Auth's trusted public keys, exact type, issuer, `aud = api-gateway`, expiry, tenant and signed `scope`. It then evaluates the existing route permission declaration against the `scope` snapshot before any internal Token exchange or business side effect. A missing external opt-in, missing/invalid BUSINESS metadata, unknown scope Code, or nonmatching required Code fails closed. Gateway does not persist an API Key allowlist or query Auth merely to validate each external request.
- After this entry check, Gateway obtains the target-audience `BUSINESS` ExecutionToken through its own verified mTLS workload and the frozen STS path. That Token represents the Integration Machine's business context and exact target requirements, not Gateway's business privilege; target services still evaluate current Permission, tenant/resource and domain rules.
- Configuring a machine's Permission grants does not expose any route that lacks the explicit external declaration. Internal gRPC, human admin, credential management, security, and MFA operations are permanently excluded from this contract.

## 4. Rate Protection And Errors

Gateway supplies the default rate profile; no initial tenant self-service rate configuration exists. Gateway separately protects invalid exchange attempts and valid integration traffic before downstream side effects. Exceptional capacity requires an OES platform operation and remains bounded by platform safety controls.

Public error responses use stable categories such as `EXTERNAL_API_AUTHENTICATION_FAILED`, `EXTERNAL_API_ACCESS_DENIED`, and `EXTERNAL_API_RATE_LIMITED`. They must not reveal whether an identifier, credential, Integration Machine, tenant, Permission Code, or external route exists. `429` is used for active rate protection; detailed internal Auth categories stay in secure audit/trace records.

## 5. Revocation And Audit

- A revoked, expired, disabled, or leaked key cannot obtain a new access token.
- Gateway does not consume a credential-deny list for this short-lived external token. A revoked, expired, disabled, or leaked key cannot obtain a new token; a token issued before the change naturally expires within five minutes. DG-2's `auth.execution-token.revoked` event remains for internal ExecutionToken consumers and does not gate this external HTTP contract.
- A removed machine Permission Code is absent from the next external Token. An already-issued Token contains its original signed snapshot for at most five minutes; any later target-audience ExecutionToken exchange can deny the Code sooner under the current MACHINE grant.
- Gateway audits exchange outcome, rate protection, approved external capability use, request/trace correlation, credential reference, Integration Machine, tenant, and safe source summary. It never logs API Key material, Bearer access tokens, internal ExecutionTokens, or request payloads by default.

## 6. Acceptance

1. Only the specified Authorization header can authenticate the exchange; URL/query/body/cookie presentation fails and is redacted.
2. The response token works only at declared external HTTP routes and expires within five minutes.
3. An external token cannot call gRPC or any internal/human/security route.
4. Gateway sends only a target-audience ExecutionToken downstream; API Key and external access token are absent from gRPC metadata and application DTOs.
5. Cross-tenant target injection, disabled machines, revoked/expired credentials, disallowed capabilities, and rate violations fail before business side effects.
6. Credential revocation prevents all new exchange; an already-issued external token expires naturally within five minutes without a Gateway credential-deny cache.
7. Gateway reads required BUSINESS Code(s) only from the existing route `RequirePermissions` declaration, and accepts external access only when that route is explicitly external-safe and its required Code(s) are present in the Auth-derived signed `scope` snapshot.
