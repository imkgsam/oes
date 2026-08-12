# ShortLink Target Resolver Contract

> 服务设计唯一真相源：[public-entry-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/public-entry-service.md)。本文只描述 ShortLink INTERNAL_REF target resolver contract，不重新定义 target owner 的业务对象真相。

## 1. Purpose

Defines the internal resolver contract used by ShortLink module to resolve `INTERNAL_REF` targets.

It exists to keep ShortLink from knowing target owner route structure or business content.

Phase 1 registered target:

```text
BUSINESS_CARD -> BusinessCard module resolver
```

## 2. Boundary

Resolver owns:

- target existence check.
- target public availability check.
- target redirect URL construction.
- target-specific unavailable / not found result.

Resolver does not return:

- target business object content.
- BusinessCard fields.
- CRM lead or customer data.
- private readiness details to anonymous public response.

ShortLink owns:

- shortCode lookup.
- ShortLink status / expiresAt check.
- VisitEvent write.
- redirect or generic unavailable response.

## 3. Phase 1 Transport

Phase 1 uses in-process module resolver inside `public-entry-service`.

Rules:

- Resolver contract is stable.
- Resolver transport is replaceable.
- Phase 1 does not use gRPC.
- Future cross-service targets may use gRPC or explicit internal contract without changing ShortLink domain model.
- Trusted gRPC cutover does not turn this in-process resolver into another RPC. For public redirect, resolver tenant/target facts continue to come only from the ShortLink record found by owner code, never from anonymous or Gateway request authority.

## 4. Request

```json
{
  "tenantId": "tenant_001",
  "targetType": "BUSINESS_CARD",
  "targetResourceId": "card_001",
  "requestContext": {
    "userAgent": "Mozilla/5.0 ...",
    "detectedChannel": "BROWSER",
    "deviceType": "MOBILE",
    "locale": "zh-CN",
    "referrer": "https://example.com/page",
    "traceId": "trace_public_001"
  }
}
```

Rules:

- `tenantId` comes from resolved ShortLink.
- `targetType + targetResourceId` come from ShortLink target reference.
- Resolver must not trust anonymous caller input for tenant or target identity.
- Request context is advisory for redirect selection and diagnostics.

## 5. Response

### REDIRECT

```json
{
  "result": "REDIRECT",
  "redirectUrl": "https://app.oes.com/public/business-cards/card_001",
  "resultTarget": "business-card:web"
}
```

Rules:

- `redirectUrl` is required for `REDIRECT`.
- `redirectUrl` must be a public URL safe for anonymous redirect.
- `resultTarget` is a short summary for VisitEvent, not business truth.

### UNAVAILABLE

```json
{
  "result": "UNAVAILABLE",
  "redirectUrl": null,
  "resultTarget": "business-card:unavailable"
}
```

Use when target exists but should not be publicly accessible.

Examples:

- BusinessCard disabled.
- Employee offboarded.
- Required public display data unavailable.

### NOT_FOUND

```json
{
  "result": "NOT_FOUND",
  "redirectUrl": null,
  "resultTarget": "business-card:not-found"
}
```

Use when target owner cannot find the target resource inside the ShortLink tenant.

Public redirect maps both `UNAVAILABLE` and `NOT_FOUND` to generic unavailable response.

## 6. BUSINESS_CARD Resolver

Phase 1 `BUSINESS_CARD` resolver semantics:

- target owner: BusinessCard module.
- target resource id: `businessCardId`.
- resolver checks card belongs to tenant.
- resolver checks card can be publicly rendered.
- resolver returns public BusinessCard page URL when available.
- resolver returns `UNAVAILABLE` or `NOT_FOUND` without exposing details to anonymous public redirect.

BusinessCard resolver must not:

- ask ShortLink to read BusinessCard internals.
- transfer BusinessCard content into ShortLink.
- let ShortLink own vCard or display field truth.

## 7. Error Semantics

Contract-level errors:

- unsupported target type
  - no registered resolver for `targetType`
- resolver unavailable
  - resolver module throws or is temporarily unavailable
- tenant mismatch
  - target exists but not under ShortLink tenant
- invalid resolver result
  - resolver returns `REDIRECT` without `redirectUrl`

Mapping to public redirect:

| Resolver error | Public behavior | VisitEvent resultStatus |
| --- | --- | --- |
| unsupported target type | generic unavailable | `INVALID_TARGET` |
| resolver unavailable | generic unavailable | `INVALID_TARGET` |
| tenant mismatch | generic unavailable | `INVALID_TARGET` |
| invalid resolver result | generic unavailable | `INVALID_TARGET` |

Rules:

- Resolver failures must not leak stack traces or internal details to public response.
- Public redirect may log diagnostics with trace id.
