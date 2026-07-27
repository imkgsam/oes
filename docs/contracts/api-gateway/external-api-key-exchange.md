# External API Key Exchange Contract

```text
status: FROZEN_DG3
architectureTruthSource: docs/architecture/collaborations/external-api-key-security.md
externalOpening: DISABLED_PENDING_DG2
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

The token represents the Integration Machine and its tenant; neither is caller-selectable. Gateway rejects it at management, human-session, account-security, MFA, Auth, internal-only, and gRPC routes. On a permitted external request, Gateway obtains a new target-audience ExecutionToken for its own mTLS call; the external caller never receives it.

## 3. External Capability Enforcement

- A route is usable only when its Gateway contract explicitly declares external exposure and the required existing BUSINESS Permission Code(s).
- Gateway evaluates the route declaration, external-token tenant, current credential deny state, machine permission decision, tenant/resource boundary, rate protection, idempotency requirements, and the business service's own domain checks.
- Configuring a machine's Permission grants does not expose any route that lacks the explicit external declaration. Internal gRPC, human admin, credential management, security, and MFA operations are permanently excluded from this contract.

## 4. Rate Protection And Errors

Gateway supplies the default rate profile; no initial tenant self-service rate configuration exists. Gateway separately protects invalid exchange attempts and valid integration traffic before downstream side effects. Exceptional capacity requires an OES platform operation and remains bounded by platform safety controls.

Public error responses use stable categories such as `EXTERNAL_API_AUTHENTICATION_FAILED`, `EXTERNAL_API_ACCESS_DENIED`, and `EXTERNAL_API_RATE_LIMITED`. They must not reveal whether an identifier, credential, Integration Machine, tenant, Permission Code, or external route exists. `429` is used for active rate protection; detailed internal Auth categories stay in secure audit/trace records.

## 5. Revocation And Audit

- A revoked, expired, disabled, or leaked key cannot obtain a new access token.
- Before public opening, Gateway must consume the Auth credential-deny fact so a confirmed leak invalidates outstanding tokens before their five-minute expiry. DG-2 owns the event transport and recovery contract; this contract does not define a second revocation event.
- Gateway audits exchange outcome, rate protection, approved external capability use, request/trace correlation, credential reference, Integration Machine, tenant, and safe source summary. It never logs API Key material, Bearer access tokens, internal ExecutionTokens, or request payloads by default.

## 6. Acceptance

1. Only the specified Authorization header can authenticate the exchange; URL/query/body/cookie presentation fails and is redacted.
2. The response token works only at declared external HTTP routes and expires within five minutes.
3. An external token cannot call gRPC or any internal/human/security route.
4. Gateway sends only a target-audience ExecutionToken downstream; API Key and external access token are absent from gRPC metadata and application DTOs.
5. Cross-tenant target injection, disabled machines, revoked/expired credentials, disallowed capabilities, and rate violations fail before business side effects.
6. Credential denial invalidates an outstanding external token according to the DG-2 opening gate.
