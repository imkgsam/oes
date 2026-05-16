# Permission Service Access Summary Contract

> 服务设计唯一真相源：[permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。本文只描述 access summary gRPC contract，不重新定义 Role、AccountRole、permission code 或授权摘要 owner 边界。

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

## 3. gRPC Service

Proto source:

- [/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/permission_access_summary.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/permission_access_summary.proto)

Current proto shape:

```proto
service PermissionAccessSummaryService {
  rpc GetAccountAccessSummary(GetAccountAccessSummaryRequest)
      returns (AccountAccessSummaryResponse);

  rpc ResolveAccountNavigation(ResolveAccountNavigationRequest)
      returns (AccountNavigationSummaryResponse);
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

message ResolveAccountNavigationRequest {
  string account_id = 1;
  string tenant_id = 2;
  string scope_level = 3;
  string terminal = 4;
}

message AccountNavigationSummaryResponse {
  repeated string visible_entries = 1;
  string default_entry = 2;
  string resolved_by_role_id = 3;
  string fallback_reason = 4;
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

Navigation flow:

- `GET /auth/session/context` calls `PermissionAccessSummaryService.ResolveAccountNavigation`.
- BFF passes the selected account context plus the current terminal, currently `WEB`.
- `permission-service` resolves role-driven `visible_entries` and `default_entry` from `NavigationEntry`, `RoleNavigationVisibility`, and `RoleLandingPolicy`.
- BFF preserves the existing session-context response shape: `navigation.visibleEntries` and `navigation.defaultEntry`.
- If managed navigation is not yet seeded or returns an incomplete result, BFF may temporarily fall back to the previous scope-based defaults during rollout.

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

`AccountNavigationSummaryResponse`:

- Used only by BFF session-context composition.
- Must not require management permissions such as `permission.navigation.resolve_preview`.
- `visible_entries` is the terminal-aware entry-key set for the selected account context.
- `default_entry` is selected from visible role landing policies first, then registry priority, then scope fallback.
- `resolved_by_role_id` is optional diagnostic metadata when a role landing policy wins.
- `fallback_reason` is optional diagnostic metadata when registry or scope fallback wins.

## 7. Application-Layer Resolution

The initial application handler should:

- Load effective roles for `account_id + scope_level + tenant_id`.
- Resolve `scope_level = SYSTEM` from `SYSTEM_INSTANCE` roles and `scope_level = TENANT` from `TENANT_INSTANCE` roles.
- Respect active account-role windows such as `effective_at` and `expires_at`.
- Ignore disabled roles.
- Extract permission codes from the effective roles.
- Deduplicate and sort action codes.
- Return role summaries and action codes.

The runtime navigation handler should:

- Load effective roles for `account_id + scope_level + tenant_id`.
- Resolve visible entries through role navigation visibility.
- Resolve role landing candidates for `scope_level + terminal`.
- Drop landing candidates that are not visible.
- Pick the highest-priority landing policy candidate.
- Fall back to registry priority, then scope fallback.

Current repository capability already exists in `permission-service`:

- `RoleRepository.findAccountRoles(accountId, tenantId, scopeLevel)`

## 8. Explicit Non-goal: Feature / Plugin Filtering

Tenant feature / plugin enablement filtering is not part of the current access-summary or navigation roadmap.

Rules:

- `permission-service` resolves effective permission codes from roles, account-role scope, role state, and active account-role windows.
- `permission-service` resolves navigation visibility from managed navigation facts and role configuration.
- BFF and front ends must not invent independent feature / plugin filtering.
- Any future reversal toward tenant-level module enablement requires an explicit architecture decision before changing this contract.

## 9. Relationship With Existing RPCs

Do not implement BFF access summary by chaining:

- `ListAccountRoles`
- `ListRolePermissions`

Those are management-oriented APIs and would put authorization-summary composition in the wrong layer.

Do not implement access summary with:

- `BatchCheckPermission`

That RPC answers whether known permission codes are allowed. It does not discover the current effective permission set.

## 10. Current Integration Boundary

Current state:

- The dedicated proto service is already part of the current contract.
- `permission-service` already exposes the gRPC controller for this query.
- `auth-bff` already uses this RPC behind `GET /auth/session/access-summary`.
- `auth-bff` uses `ResolveAccountNavigation` behind `GET /auth/session/context` for runtime navigation summary composition.
- Both tenant-scope and system-scope accounts are supported.

## 11. Deferred Work

- Decide whether short TTL caching is needed after usage patterns are known.
