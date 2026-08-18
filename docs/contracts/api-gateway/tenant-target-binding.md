# API Gateway Tenant Target Binding Contract

## 1. Purpose And Scope

This contract defines the black-box behavior for protected API Gateway HTTP routes whose canonical route template contains the path parameter `:tenantId`.

It freezes:

- canonical target recognition and normalization;
- `TENANT` / `SYSTEM` binding and permission order;
- request-scoped verified handoff;
- ExecutionToken, downstream ownership and audit boundaries;
- read and command behavior, fail-closed errors and compatibility exceptions.

It does not define a fine-grained SYSTEM tenant range, Permission Service ownership, Permission Code metadata, business-service resource rules, frontend information architecture or implementation slices.

## 2. Baseline And Statement Classification

### 2.1 Current Canonical Facts

- Gateway is the external HTTP application boundary and propagates trusted execution context: [gateway-and-bff.md](../../architecture/platforms/gateway-and-bff.md).
- Permission Service owns current grants; each Permission Code's `allowedScopeLevels` is the static SYSTEM/TENANT eligibility truth and does not replace runtime tenant isolation: [permission-code-source.md](../../architecture/platforms/permission-code-source.md).
- `ExchangeExecutionToken` accepts only target audience and requested Permission Codes; TENANT subject identity may carry `tenant_id`, while a request resource/tenant selector is not execution authority: [execution-token.md](../auth-service/execution-token.md).
- A target service owns resource truth and performs resource/domain enforcement after Token validation: [authorization-decision-flow.md](../../architecture/collaborations/authorization-decision-flow.md).
- Site Management P1 already has a feature-specific explicit SYSTEM deny: [admin-bff.md](../site-service/admin-bff.md).

### 2.2 Normative Decisions

Sections 3 through 10 are the stable, normative contract. In particular, SYSTEM's current tenant target range defaults to `ALL`, but SYSTEM has no wildcard operation capability: route Permission Code, current grant and `allowedScopeLevels=SYSTEM` remain mandatory.

### 2.3 Inferences And Recommendations

- **Inference:** separate platform and tenant frontend shells may reuse page components because the backend target and authorization boundary is independent of frontend navigation. This contract does not freeze UI behavior.
- **Recommendation:** implementations may use an opaque `VerifiedTenantTarget` type and request-private carrier. Names and framework mechanics are non-normative; only provenance, lifetime and non-reconstructability are required.
- **Deferred recommendation:** explicit tenant allowlists, expiry, ticket/work-order limits and other fine-grained SYSTEM tenant ranges require a later design. No placeholder field or model is reserved here.

## 3. Canonical Target Recognition And Normalization

1. After HTTP route matching, Gateway inspects the canonical route template. A protected route containing the exact path parameter `:tenantId` is automatically tenant-target-bound.
2. The global Tenant Target Guard applies without route opt-in metadata. `AllowSystemTenantTarget`, `TENANT_ONLY`, `SYSTEM_TARGETABLE` and equivalent targetability decorators do not participate in the generic decision.
3. The decoded path value is parsed by the shared canonical tenant identifier parser. Normalization must not case-fold, truncate or otherwise perform a lossy transformation.
4. A missing required segment remains a route miss and returns `404`. A present empty, whitespace-only, malformed or non-canonical value returns `400`.
5. query, body, session tenant and ordinary metadata are not target sources. A route without canonical `:tenantId` does not acquire a target merely because one of those locations contains `tenantId`.

## 4. Stable Execution Order

The order is exact and applies to `GET`, `POST`, `PUT` and `PATCH`:

1. route match and session authentication;
2. canonical `:tenantId` recognition, parsing and normalization;
3. scope-specific tenant-target binding;
4. route `RequirePermissions` resolution;
5. current Permission grant decision and each effective Code's `allowedScopeLevels` eligibility;
6. handler, target-audience ExecutionToken exchange and downstream call;
7. target-service Token, principal, request-target and resource-ownership enforcement;
8. result and audit completion.

Any rejection stops all later stages. No permission lookup, downstream call or business side effect may occur after an earlier-stage failure.

## 5. Scope And Permission Matrix

| Session scope | Session tenant | Path target relation | Route Code / grant / `allowedScopeLevels` | Result before downstream |
| --- | --- | --- | --- | --- |
| `TENANT` | valid | exact match | Code declared, granted, allows `TENANT` | allow verified target to proceed |
| `TENANT` | valid | mismatch | any | `403`; permission is not called |
| `TENANT` | missing / invalid | any | any | `401`; invalid authenticated context |
| `SYSTEM` | absent, as required | any valid target in current `ALL` range | Code declared, granted, allows `SYSTEM` | allow verified target to proceed |
| `SYSTEM` | absent, as required | any valid target | missing Code, denied grant or Code excludes `SYSTEM` | `403` |

`ALL` is only the current SYSTEM target range. It neither grants a Permission Code nor overrides `allowedScopeLevels`, target-service method declarations, resource ownership, domain rules or explicit route-group exceptions.

## 6. Request-Scoped Verified Handoff

- Only the global Tenant Target Guard may produce the verified target.
- The verified value is request-scoped, immutable and unavailable to another concurrent request. It must not be accepted from a public DTO, an enumerable request property, ordinary metadata or a caller-created object.
- Controllers, BFF use cases and downstream adapters consume the verified value through a private trusted carrier. They must not reparse raw path, query or body values.
- The verified value is the sole source for the downstream explicit tenant target, tenant context and audit target.
- Raw path text and client duplicates must not flow to a downstream request or overwrite the verified value.

## 7. GET And Command Payload Rules

- `GET`, `POST`, `PUT` and `PATCH` have identical target binding and authorization behavior.
- New or revised DTOs must omit query/body tenant duplicates when canonical `:tenantId` is present.
- During a bounded compatibility period, an existing duplicate may be accepted only after the same canonical parser normalizes it and it exactly equals the verified path target. Mismatch returns `400` before permission or downstream. Equality does not make the duplicate authoritative.
- A duplicate tenant value must never select execution scope, alter a Permission request, overwrite downstream target context or widen a list/query scope.

## 8. ExecutionToken And Downstream Boundary

- Target tenant is a legal business request target, not execution identity. It is absent from ExecutionToken claims and from `ExchangeExecutionToken` request fields.
- No new target claim, target metadata header or Exchange request field is introduced. `ExchangeExecutionToken` remains target audience plus requested Permission Codes.
- A TENANT subject may carry `tenant_id` as verified subject identity. A SYSTEM subject remains without `tenant_id`; the path target does not change that subject.
- Gateway sends the target service an explicit verified request target and a target-audience ExecutionToken.
- The target service independently validates mTLS workload, Token signature/profile/audience/`client_id`/`cnf`, execution principal, method Permission Code and applicable subject scope.
- For a TENANT subject, the target service also requires the Token subject tenant to equal the explicit request target. A SYSTEM subject has no subject tenant, so this equality is not invented for SYSTEM.
- The target service then uses request target plus resource id to load and recheck tenant ownership. For create/list operations without an existing resource id, the verified request target is the owner/query boundary. A Token success never substitutes for this check.

## 9. Audit Contract

Successful and denied decisions record, as applicable:

- trusted actor and principal identifiers;
- principal scope level (`SYSTEM` or `TENANT`) and trusted subject tenant when present;
- verified target tenant;
- route Permission Code set, decision reference and authorization version when available;
- request id, trace id and downstream correlation;
- result, denial stage and stable reason.

Audit must not treat raw path text, query/body duplicates, bearer values or ordinary metadata as the trusted target or identity source.

## 10. Error And Fail-Closed Semantics

| Condition | HTTP result | Permission called | Downstream called | Side effect |
| --- | --- | --- | --- | --- |
| no matching route / missing required tenant segment | `404` | no | no | none |
| present target is empty, whitespace, malformed or non-canonical | `400` | no | no | none |
| unauthenticated, expired/invalid session, or TENANT context lacks valid tenant | `401` | no | no | none |
| TENANT session tenant differs from verified path target | `403` | no | no | none |
| existing body/query duplicate differs from verified path target | `400` | no | no | none |
| route Permission Code missing, grant denied, or scope excluded by `allowedScopeLevels` | `403` | yes only when a resolvable Code reaches the decision stage | no | none |
| Permission dependency unavailable or decision malformed/stale | `503` | attempted | no | none |
| target service finds request target/resource ownership mismatch | `403` | yes | yes; target rejects | none |

Unknown scope, ambiguous target provenance, guard ordering failure, missing verified handoff, invalid Permission decision or audit/context binding failure is fail closed. None may fall back to session tenant, body/query tenant, ordinary metadata, local role copies or a broader target.

## 11. Existing Exception And Migration Boundary

Site Management P1's `/site-management/tenants/:tenantId/**` contract explicitly denies SYSTEM sessions. That feature-specific deny remains effective and is stronger than the generic current SYSTEM `ALL` target-range default until its own protected business contract is separately changed.

Migration rules:

1. remove the old platform default of “SYSTEM denied unless route is explicitly system-targetable”;
2. remove generic targetability opt-in decorators/metadata from the platform decision path;
3. preserve Site Management P1's explicit SYSTEM deny and acceptance behavior;
4. do not reinterpret existing routes without canonical `:tenantId` as tenant-target-bound;
5. do not add a fine-grained SYSTEM tenant range, Permission model, ExecutionToken claim or generic cross-service target metadata; each target service owns any explicit tenant target field in its business request contract;
6. a route is not implementation-complete for SYSTEM targeting until its target-service request contract can carry the explicit verified target and the service can recheck ownership; existing service contracts that derive tenant only from ExecutionToken remain unchanged until separately migrated within their own protected scope.

## 12. Acceptance Matrix

| Case | Expected observable behavior |
| --- | --- |
| valid TENANT, exact target, granted TENANT-eligible Code, owned resource | request succeeds; downstream and audit receive the verified target |
| valid TENANT, different target | `403` before Permission/downstream |
| TENANT session lacks tenant | `401` before target binding |
| valid SYSTEM, arbitrary normalized target, granted SYSTEM-eligible Code | request reaches downstream with SYSTEM subject lacking `tenant_id` and explicit request target |
| valid SYSTEM, Code is TENANT-only | `403` before downstream |
| valid SYSTEM, Code not granted | `403` before downstream |
| valid SYSTEM, no `RequirePermissions` declaration on protected target route | fail closed `403` |
| malformed path target | `400` before Permission/downstream |
| missing path segment | `404` route miss |
| matching legacy body/query duplicate | path remains canonical; behavior equals request without duplicate |
| mismatching legacy body/query duplicate | `400` before Permission/downstream |
| Token valid but resource belongs to another tenant | target service returns `403`; no domain side effect |
| request target differs from ET subject tenant for TENANT | Gateway already returns `403`; downstream never receives request |
| target service directly receives a TENANT Token and mismatching request target | target service returns `403`; no resource load or side effect |
| SYSTEM request target present during ET exchange | Exchange request and Token contain no target tenant claim/field |
| Site Management P1 SYSTEM request | existing explicit `403` remains; Permission/downstream not called |
| Permission unavailable, malformed or stale | fail closed `503`; no downstream or side effect |
