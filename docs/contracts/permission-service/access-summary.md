# Permission Service Access Summary Contract

## 1. Purpose

This document defines the `permission-service` gRPC contract that supports `auth-bff`'s `GET /auth/session/access-summary` endpoint.

It is intentionally not a management API. It returns the current authenticated account's access summary for shell and UI authorization use.

## 2. Why A Dedicated Contract Is Needed

Existing `permission-service` management RPCs can list account roles and role permissions, but those APIs are designed for administrators managing roles.

They are not suitable as the long-term source for the current user's own access summary because:

- They require management permissions such as `VIEW_ACCOUNT_ROLE`.
- They would force BFF to stitch roles and permissions manually.
- Role-to-permission expansion, feature filtering, future deny rules, and policy effects belong inside `permission-service`.

Therefore, OES exposes a dedicated access-summary RPC.

## 3. Proposed gRPC Service

Proto source:

- [/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/permission_access_summary.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/permission_access_summary.proto)

Current proto shape:

```proto
service PermissionAccessSummaryService {
  rpc GetAccountAccessSummary(GetAccountAccessSummaryRequest)
      returns (AccountAccessSummaryResponse);
}

message GetAccountAccessSummaryRequest {
  string account_id = 1;
  string tenant_id = 2;
  string scope_level = 3;
}

message AccountAccessSummaryResponse {
  repeated AccessRoleSummary roles = 1;
  repeated string action_codes = 2;
}

message AccessRoleSummary {
  string role_id = 1;
  string code = 2;
  string name = 3;
  string tenant_id = 4;
  string scope = 5;
}
```

## 4. Usage Scenario

Primary caller:

- `auth-bff`

Primary BFF endpoint:

- `GET /auth/session/access-summary`

Expected flow:

- BFF reads current `accountId` and `tenantId` from the authenticated JWT/session context.
- BFF sends `scope_level = SYSTEM` for system-scope accounts and `scope_level = TENANT` for tenant accounts.
- BFF calls `PermissionAccessSummaryService.GetAccountAccessSummary`.
- BFF returns role summaries and action codes to the front end.

## 5. Authorization Boundary

This RPC is a current-session support query, not a platform management query.

It should not require:

- `VIEW_ACCOUNT_ROLE`
- `VIEW_ROLE`
- `VIEW_ROLE_DETAIL`

Expected controls:

- Internal service call boundary.
- Authenticated operator context propagated by Gateway / BFF.
- Request `account_id`, `tenant_id`, and `scope_level` must match or be derived from the current authenticated session context at the BFF boundary.
- `scope_level = SYSTEM` must use system role instances and does not require `tenant_id`.
- `scope_level = TENANT` must use tenant role instances and requires `tenant_id`.
- Future implementation may add service-side self-context validation if the operator context carries enough account / tenant facts.

## 6. Response Semantics

`roles`:

- Used for display, diagnostics, or explaining the current operator context.
- Must be summaries only.
- Must not include full role-permission expansion.

`action_codes`:

- Used by front ends for button and action control.
- Current stage: equals effective permission codes in the current account / tenant context.
- Must be deduplicated.
- Should be stable and sorted for deterministic client behavior.

## 7. Application-Layer Resolution

The initial application handler should:

- Load effective roles for `account_id + scope_level + tenant_id`.
- Resolve `scope_level = SYSTEM` from `SYSTEM_INSTANCE` roles and `scope_level = TENANT` from `TENANT_INSTANCE` roles.
- Respect active account-role windows such as `effective_at` and `expires_at`.
- Ignore disabled roles.
- Extract permission codes from the effective roles.
- Deduplicate and sort action codes.
- Return role summaries and action codes.

Current repository capability already exists in `permission-service`:

- `RoleRepository.findAccountRoles(accountId, tenantId, scopeLevel)`

## 8. Feature / Plugin Filtering

OES is expected to evolve into a modular system where tenants enable modules or plugins.

Long-term behavior:

- Permission codes belonging to disabled tenant features or plugins must be filtered out by `permission-service`.
- BFF and front ends should not implement feature filtering independently.

Current stage:

- Feature / plugin registry is not yet available.
- The implementation may initially return effective permission codes based on roles only.
- Feature filtering must remain a clear extension point.

## 9. Relationship With Existing RPCs

Do not implement BFF access summary by chaining:

- `ListAccountRoles`
- `ListRolePermissions`

Those are management-oriented APIs and would put authorization-summary composition in the wrong layer.

Do not implement access summary with:

- `BatchCheckPermission`

That RPC answers whether known permission codes are allowed. It does not discover the current effective permission set.

## 10. Implementation Status

Completed:

- Added the dedicated proto service and generated TypeScript client/server types.
- Implemented the application query and gRPC controller in `permission-service`.
- Added the BFF downstream adapter and `GET /auth/session/access-summary`.
- Added system-scope access-summary support via `scope_level = SYSTEM`.
- Wired the tenant web login hydration flow to consume `actionCodes` from the dedicated endpoint.

## 11. Deferred Work

- Add feature / plugin filtering after tenant enablement is introduced.
- Decide whether short TTL caching is needed after usage patterns are known.
