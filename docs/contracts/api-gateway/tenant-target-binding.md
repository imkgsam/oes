# API Gateway Tenant Target Binding Contract

## 1. Purpose And Scope

This contract defines the black-box behavior for every protected API Gateway HTTP route whose canonical route template contains the path parameter `:tenantId`. The rule is independent of HTTP verb and covers reads, writes and destructive commands.

It freezes:

- canonical target recognition and normalization;
- TENANT/SYSTEM Gateway binding and Permission eligibility;
- request-scoped verified handoff and RPC serialization;
- target-owned dedicated SYSTEM method enforcement;
- ExecutionToken, business selector, resource ownership and audit boundaries;
- fail-closed errors, compatibility exceptions and acceptance behavior.

It does not define a fine-grained SYSTEM tenant range, Permission Service ownership, Permission Code metadata, business resource rules, frontend information architecture or implementation slices.

## 2. Baseline And Statement Classification

### 2.1 Current Canonical Facts

- Tenant isolation is a platform hard boundary; Permission cannot widen it, and SYSTEM cross-tenant execution requires a dedicated interface: [authorization-layering-and-resource-policy.md](../../architecture/platforms/authorization-layering-and-resource-policy.md).
- Gateway is the external HTTP application boundary: [gateway-and-bff.md](../../architecture/platforms/gateway-and-bff.md).
- Permission Service owns current grants; `allowedScopeLevels` is static principal eligibility and does not replace tenant isolation: [permission-code-source.md](../../architecture/platforms/permission-code-source.md).
- gRPC authority is the combination of mTLS workload, target-audience ExecutionToken and target-owned method declaration; request payload identity copies and ordinary metadata are not authority: [grpc-metadata-and-service-trust.md](../../architecture/platforms/grpc-metadata-and-service-trust.md).
- `ExchangeExecutionToken` accepts only target audience and requested Permission Codes; TENANT subject identity may carry `tenant_id`, while SYSTEM remains tenantless: [execution-token.md](../auth-service/execution-token.md).
- Site Management P1 already has a feature-specific explicit SYSTEM deny: [admin-bff.md](../site-service/admin-bff.md).

### 2.2 Normative Decisions

Sections 3 through 12 are normative. SYSTEM's current tenant target range defaults to `ALL`, but only a target-owned method/interface explicitly dedicated to SYSTEM tenant targeting may consume that range. Route Permission Code, current grant and `allowedScopeLevels=SYSTEM` are necessary eligibility inputs, not cross-tenant authority by themselves.

### 2.3 Inferences And Recommendations

- **Inference:** separate platform and tenant frontend shells may reuse page components because the backend target and authorization boundary is independent of frontend navigation. This contract does not freeze UI behavior.
- **Recommendation:** implementations may use an opaque `VerifiedTenantTarget` type and request-private carrier inside Gateway. Names and framework mechanics are non-normative; provenance, lifetime and non-reconstructability are required.
- **Deferred recommendation:** tenant allowlists, expiry, ticket/work-order limits and other fine-grained SYSTEM ranges require a later design. No placeholder field or model is reserved here.

## 3. Canonical Target Recognition And Normalization

- After route matching, Gateway inspects the canonical route template. A protected route containing the exact path parameter `:tenantId` is automatically tenant-target-bound for every HTTP verb.
- The global Tenant Target Guard applies without route opt-in metadata. `AllowSystemTenantTarget`, `TENANT_ONLY`, `SYSTEM_TARGETABLE` and equivalent Gateway targetability decorators do not participate in the generic decision.
- The decoded path value is parsed by the shared canonical tenant identifier parser. Normalization must not case-fold, truncate or perform a lossy transformation.
- A missing required segment remains a route miss and returns `404`. A present empty, whitespace-only, malformed or non-canonical value returns `400`.
- query, body, session tenant and ordinary metadata are not target sources. A route without canonical `:tenantId` does not acquire a target merely because another request location contains `tenantId`.
- Global recognition does not make the downstream method SYSTEM-targetable. That authority remains target-owned.

## 4. Exact Execution Order

The order is verb-independent:

1. route match and session authentication;
2. canonical `:tenantId` recognition, parsing and normalization;
3. scope-specific Gateway tenant-target binding;
4. route `RequirePermissions` resolution;
5. current Permission grant and effective Code `allowedScopeLevels` eligibility;
6. handler, target-audience ExecutionToken exchange and target-owned selector serialization;
7. target-service mTLS, Token, principal, Code and method-declaration admission;
8. target-service selector authorization;
9. resource ownership, query boundary and domain rules;
10. result and audit completion.

Any rejection stops all later stages. No business side effect occurs before target-service selector authorization and ownership/domain enforcement complete.

Exact protected exception: for a `SYSTEM` session on Site Management P1 `/site-management/tenants/:tenantId/**`, stage 3 returns `403` and stops. Permission resolution, handler execution, ExecutionToken exchange, selector serialization and downstream invocation do not occur. This feature-specific binding deny is not a generic route targetability opt-in or a platform default-deny mechanism.

## 5. Gateway Scope And Permission Matrix

| Session scope | Session tenant | Path target relation | Route Code / grant / `allowedScopeLevels` | Gateway result |
| --- | --- | --- | --- | --- |
| `TENANT` | valid | exact match | Code declared, granted, allows `TENANT` | create request-private verified target and proceed |
| `TENANT` | valid | mismatch | any | `403`; Permission/downstream not called |
| `TENANT` | missing / invalid | any | any | `401`; invalid authenticated context |
| `SYSTEM` | absent, as required | Site Management P1 `/site-management/tenants/:tenantId/**` | any | `403` at tenant binding; Permission, handler, Token exchange, selector serialization and downstream not called |
| `SYSTEM` | absent, as required | any valid target | Code declared, granted, allows `SYSTEM` | eligible to call downstream; no target authority is created |
| `SYSTEM` | absent, as required | any valid target | missing Code, denied grant or Code excludes `SYSTEM` | `403`; downstream not called |

Except for the exact Site Management P1 binding-stage deny above, Gateway success for SYSTEM means only that the request may reach target-service admission. It does not mean an ordinary tenant method became a cross-tenant interface.

## 6. Target-Service Authority Matrix

| Token subject | Serialized selector | Target-owned method declaration | Exact workload / Code / range | Target result before resource access |
| --- | --- | --- | --- | --- |
| TENANT with `tenant_id` | exact equality | method allows TENANT BUSINESS | match | authorize selector |
| TENANT with `tenant_id` | mismatch | any | any | `403` |
| SYSTEM without `tenant_id` | valid tenant | dedicated SYSTEM tenant-target method/interface | exact Gateway workload, same canonical SYSTEM-eligible Code and current `ALL` range match | authorize selector |
| SYSTEM without `tenant_id` | valid tenant | ordinary TENANT method or explicit SYSTEM deny | any | `403` |
| SYSTEM without `tenant_id` | valid tenant | dedicated method | workload, Code or range mismatch | `403` |

The target-owned dedicated declaration is the required system interface boundary. It is not a Gateway route opt-in decorator and cannot be inferred from Permission allow, shared HTTP path, controller reuse or `allowedScopeLevels` alone.

## 7. Gateway Request-Scoped Handoff

- Only the global Tenant Target Guard may produce the Gateway verified target.
- Inside Gateway, the value is request-scoped, immutable and unavailable to another concurrent request. It is not accepted from a public DTO, enumerable request property, ordinary metadata or caller-created object.
- Controllers, BFF use cases and downstream adapters consume it through a private trusted carrier and do not reparse raw path, query or body values.
- The verified value is the sole source for Gateway audit target and for the normalized id serialized by the downstream adapter.
- Raw path text and client duplicates do not flow to downstream or overwrite the verified value.

## 8. RPC Serialization And Provenance Boundary

- The downstream adapter writes the normalized id only to the exact tenant business selector field owned by the target RPC contract.
- The private Gateway carrier and HTTP guard provenance do not cross gRPC. The serialized selector is business input, not a credential, ExecutionToken claim, signed operator context or trusted metadata field.
- The selector therefore has no standalone authority. The target service re-authorizes it using mTLS workload, target-audience Token, principal shape, exact Permission Code, target-owned method declaration and platform range.
- TENANT authority comes from Token `tenant_id` plus selector equality. SYSTEM authority comes from tenantless SYSTEM subject plus the dedicated method/interface, exact workload/Code and current platform range.
- No target tenant field is added to `ExchangeExecutionToken`, and target tenant is absent from the Token cache key.

## 9. Verb And Duplicate-Field Rules

- `GET`, `POST`, `PUT`, `PATCH`, `DELETE` and every other protected verb have identical recognition, binding, Permission and downstream selector-authorization rules.
- New or revised DTOs omit query/body tenant duplicates when canonical `:tenantId` is present.
- During a bounded compatibility period, an existing duplicate may be accepted only after the same canonical parser normalizes it and it exactly equals the Gateway verified target. Mismatch returns `400` before Permission or downstream. Equality does not make the duplicate authoritative.
- A duplicate tenant value never selects execution scope, alters a Permission request, overwrites the target-owned selector or widens a list/query scope.

## 10. ExecutionToken And Resource Boundary

- Target tenant is a legal business selector, not execution identity. It is absent from ExecutionToken claims and `ExchangeExecutionToken` request fields.
- A TENANT subject may carry `tenant_id` as verified identity. A SYSTEM subject remains without `tenant_id`; the selector does not change that subject.
- The target service validates mTLS workload, Token signature/profile/audience/`client_id`/`cnf`, execution principal, the same canonical Permission Code required at Gateway and method declaration before authorizing the selector.
- After selector authorization, the target service uses selector plus resource id to load and recheck tenant ownership. For create/list operations without an existing resource id, the authorized selector is the owner/query boundary.
- Token success, Gateway binding and Permission allow never substitute for resource ownership or domain rules.

## 11. Audit Contract

Successful and denied decisions record, as applicable:

- trusted actor and principal identifiers;
- principal scope level and trusted subject tenant when present;
- Gateway verified HTTP target and target-service re-authorized tenant selector as distinct stage facts;
- route/target Permission Code set, decision reference and authorization version when available;
- target method/interface declaration reference;
- request id, trace id and downstream correlation;
- result, denial stage and stable reason.

Audit does not treat raw path text, query/body duplicates, bearer values or ordinary metadata as identity or target authority.

## 12. Error And Fail-Closed Semantics

| Condition | HTTP result | Permission called | Downstream called | Side effect |
| --- | --- | --- | --- | --- |
| no matching route / missing required tenant segment | `404` | no | no | none |
| present target empty, whitespace, malformed or non-canonical | `400` | no | no | none |
| unauthenticated, expired/invalid session, or TENANT context lacks tenant | `401` | no | no | none |
| TENANT session tenant differs from path target | `403` | no | no | none |
| existing body/query duplicate differs from verified target | `400` | no | no | none |
| route Code missing, grant denied, or scope excluded | `403` | yes only when a resolvable Code reaches decision | no | none |
| Permission dependency unavailable or decision malformed/stale | `503` | attempted | no | none |
| SYSTEM session on Site Management P1 tenant-bound route | `403` | no | no | none |
| TENANT Token tenant differs from serialized selector | `403` | yes | yes; target rejects before resource access | none |
| SYSTEM reaches an ordinary TENANT method outside an earlier feature-specific Gateway deny | `403` | yes | yes; target rejects before resource access | none |
| dedicated SYSTEM method has workload/Code/range mismatch | `403` | yes | yes; target rejects before resource access | none |
| resource belongs to another tenant | `403` | yes | yes; target rejects | none |

Unknown scope, ambiguous provenance, guard ordering failure, missing private handoff, undeclared target method, invalid Permission decision or audit/context binding failure is fail closed. None falls back to session tenant, duplicate tenant, ordinary metadata, local role copies or a broader target.

## 13. Existing Exception And Migration Boundary

Site Management P1 `/site-management/tenants/:tenantId/**` explicitly denies SYSTEM at Gateway tenant-target binding. Gateway returns `403` before Permission, handler, ExecutionToken exchange, selector serialization or downstream invocation. Its target-owned ordinary methods also reject SYSTEM as defense in depth, but that target-owned rejection does not replace or delay the edge rejection.

Migration rules:

- remove the old Gateway default of “SYSTEM denied unless route is explicitly system-targetable”;
- remove generic Gateway targetability opt-in decorators/metadata;
- preserve target-owned dedicated method declarations and target-owned rejection as the hard-boundary interface mechanism;
- preserve the exact feature-specific Site Management P1 Gateway binding deny and its no-Permission/no-handler/no-Token-exchange/no-serialization/no-downstream acceptance behavior;
- do not reinterpret routes without canonical `:tenantId` as tenant-target-bound;
- do not add a fine-grained SYSTEM range, Permission model, ExecutionToken claim or generic target metadata;
- a route is not SYSTEM implementation-complete until its target-owned business request carries the selector and the target method explicitly declares and enforces SYSTEM tenant targeting.

Existing service contracts that derive tenant only from ExecutionToken remain unchanged until separately migrated within their own protected scope.

## 14. Acceptance Matrix

| Case | Expected observable behavior |
| --- | --- |
| valid TENANT, exact target, eligible Code, TENANT method, owned resource | succeeds; target service re-authorizes selector from Token equality |
| valid TENANT, different HTTP target | `403` before Permission/downstream |
| TENANT session lacks tenant | `401` before target binding |
| valid SYSTEM, eligible Code, dedicated SYSTEM method, exact workload, target in current `ALL` range | succeeds with tenantless SYSTEM Token and re-authorized selector |
| valid SYSTEM and eligible Code, but ordinary TENANT method | target returns `403`; no resource access or side effect |
| valid SYSTEM and dedicated method, but wrong workload or Code | target returns `403`; no resource access or side effect |
| valid SYSTEM and TENANT-only Code | Gateway returns `403` before downstream |
| valid SYSTEM and Code not granted | Gateway returns `403` before downstream |
| valid SYSTEM and protected target route lacks `RequirePermissions` | Gateway fails closed `403` |
| malformed path target | `400` before Permission/downstream |
| missing path segment | `404` route miss |
| matching legacy body/query duplicate | path remains canonical; behavior equals request without duplicate |
| mismatching legacy body/query duplicate | `400` before Permission/downstream |
| TENANT Token tenant differs from serialized selector | target returns `403` before resource access |
| Token valid but resource belongs to another tenant | target returns `403`; no domain side effect |
| SYSTEM request during ET exchange | Exchange request, Token claims and Token cache key contain no target tenant |
| protected `DELETE` with mismatching TENANT target | same `403` ordering as GET/POST; destructive handler and downstream do not run |
| protected `DELETE` with SYSTEM against non-dedicated method | target returns `403`; deletion does not occur |
| Site Management P1 SYSTEM request, including `DELETE` | Gateway tenant binding returns `403`; Permission, handler, ExecutionToken exchange, selector serialization and downstream are not called; no side effect |
| Permission unavailable, malformed or stale | fail closed `503`; no downstream or side effect |
