# Permission Service Terminal Access Contract

> 服务设计唯一真相源：[permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。本文只描述 permission 侧 terminal access 判定 contract，不重新定义 Terminal Access Policy 的长期 owner、核心对象或服务边界。

## 1. Purpose

This document defines the internal gRPC runtime contract used by `auth-service` to resolve whether a selected account can establish or continue a session from a terminal.

This contract is not a management API and must not be called directly by front ends.

`auth-service` session, token, account selection, refresh and audit outcomes are defined only in [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md). This document only defines the permission-side terminal access decision contract.

## 2. Ownership

`permission-service` owns:

- role terminal access facts
- account terminal access override facts
- effective terminal access resolution
- management audit for terminal access configuration changes

`auth-service` consumes the runtime decision; session / token outcomes follow [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md).

## 3. gRPC Service

Target proto source:

- `/src/common/src/contracts/permission_service/permission_terminal_access.proto`

Target service:

```proto
service PermissionTerminalAccessService {
  rpc ResolveAccountTerminalAccess(ResolveAccountTerminalAccessRequest)
      returns (ResolveAccountTerminalAccessResponse);
}

message ResolveAccountTerminalAccessRequest {
  string account_id = 1;
  string tenant_id = 2;
  string scope_level = 3;
  string terminal = 4;
}

message ResolveAccountTerminalAccessResponse {
  bool allowed = 1;
  string reason_code = 2;
  repeated string effective_allowed_terminals = 3;
  string resolution_source = 4;
  repeated string matched_role_ids = 5;
}
```

## 4. Request Semantics

`account_id`:

- Required.
- Identifies the selected account context.
- The request does not include `user_id`; terminal access is account-scoped.

`tenant_id`:

- Required when `scope_level = TENANT`.
- Must be empty when `scope_level = SYSTEM`.

`scope_level`:

- `SYSTEM`
- `TENANT`

`terminal`:

- `WEB`
- `PDA`
- `KIOSK`
- `MOBILE`
- `MINIAPP`

Unknown terminal values must be rejected or resolved as denied by the service boundary. `DEFAULT` is not valid for login terminal access.

## 5. Response Semantics

`allowed`:

- `true` when the effective allowed terminal set includes the requested terminal.
- `false` otherwise.

`reason_code`:

- `ALLOWED`
- `TERMINAL_ACCESS_DENIED`
- `INVALID_TERMINAL`
- `INVALID_SCOPE`

`effective_allowed_terminals`:

- The effective terminal set after resolving account override or role union.
- Returned for internal audit and diagnostics.
- Must not be exposed in unauthenticated login denial HTTP responses.

`resolution_source`:

- `ACCOUNT_OVERRIDE`
- `ROLE_UNION`

`matched_role_ids`:

- Active role ids used when `resolution_source = ROLE_UNION`.
- Empty when an account override exists.

## 6. Resolution Rules

```text
if account override exists:
  effectiveAllowedTerminals = override.allowedTerminals
  resolutionSource = ACCOUNT_OVERRIDE
else:
  effectiveAllowedTerminals = union(active role allowedTerminals)
  resolutionSource = ROLE_UNION
```

Rules:

- Active roles are loaded through the same account-role scope semantics used by access summary.
- Disabled roles and expired / not-yet-effective account-role bindings do not participate.
- Missing role terminal access is equivalent to an empty terminal set.
- Multiple roles use allow union.
- Account override fully replaces role union.
- Account override with an empty terminal set means the account cannot log in from any terminal.

## 7. Runtime Callers

Primary caller:

- `auth-service`

Runtime call sites:

- account selection, after account and tenant lifecycle checks, before MFA challenge creation
- refresh session, before issuing a new token pair

Not callers:

- front ends
- tenant-web management pages
- PDA / KIOSK clients

Management UI and query flows must use separate management contracts through `api-gateway`.

## 8. Audit Expectations

The runtime RPC may return explanation fields without persisting every allow decision in Phase 1.

`permission-service` must persist management mutation audit events for:

- role terminal access changes
- account terminal access override changes

`auth-service` must persist auth audit events for:

- terminal access denied during login
- terminal access denied during refresh
- successful login with terminal metadata

## 9. Deferred Work

- Per-terminal effective windows.
- Approval workflow for temporary overrides.
- Dedicated diagnostic / preview API.
- Persisted deny decision audit in permission-service if security governance requires it.
