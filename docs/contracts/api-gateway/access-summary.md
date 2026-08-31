# Access Summary Design

> `permission-service` 的服务设计唯一真相源：[permission-service.md](../../architecture/services/permission-service.md)。本文只描述 API Gateway / BFF access-summary contract，不重新定义 permission 侧 Role、AccountRole、permission code 或 access summary owner 边界。

## 1. Purpose

This document defines the OES access-summary design used by API Gateway / BFF contracts.

The goal is to provide the front end with a stable current-session authorization summary without requiring front-end code to derive permissions from roles.

`auth-service` session and token boundaries are defined only in [auth-service.md](../../architecture/services/auth-service.md). This document only describes the BFF access-summary contract and its relationship with permission summaries.

## 2. Core Decision

OES separates session context from access summary.

- `GET /auth/session/context` returns current shell context and navigation visibility.
- `GET /auth/session/access-summary` returns current role summaries and action codes.

This prevents the shell context endpoint from becoming a large mixed payload and allows authorization summaries to be refreshed independently.

## 3. Responsibility Split

Back end owns:

- Resolving current effective roles.
- Resolving current effective permission codes.
- Applying future policy / scope / deny rules before returning codes.

Front end owns:

- Declaring required action codes on components or buttons.
- Hiding or disabling controls based on returned `actionCodes`.
- Never deriving action permissions from returned roles.

## 4. Roles And Action Codes

`roles` and `actionCodes` have different purposes.

- `roles` are returned for display, diagnostics, or operator explanation.
- `actionCodes` are returned for UI action and button control.

The front end must not compute permissions from `roles`.

## 5. Current Action Code Semantics

Current stage:

- `actionCodes` equal the current context's effective permission codes.
- The back end resolves roles and role permissions.
- The front end consumes the resulting codes directly through `v-access:code`, `AccessControl type="code"`, or equivalent helpers.

Future extension:

- OES may later introduce UI-only action codes if a non-sensitive UI behavior needs independent control.
- Business-sensitive actions should continue to be modeled as back-end permissions.
- The current contract should not require the front end to distinguish these cases.

## 6. Target Contract Shape

The access-summary endpoint is:

```http
GET /auth/session/access-summary
```

Target response:

```json
{
  "roles": [
    {
      "roleId": "role_001",
      "code": "tenant_admin",
      "name": "Tenant Admin",
      "scope": "TENANT"
    }
  ],
  "actionCodes": [
    "permission.list",
    "role.create",
    "role.update",
    "role.assign_permission"
  ]
}
```

Rules:

- `roles` should be summaries only.
- `roles` should not include full role-permission expansion.
- `actionCodes` are the front-end control source.
- The response should be scoped to the current authenticated account / tenant context.
- System-scope accounts are supported; they resolve `SYSTEM_INSTANCE` roles with `scopeLevel=SYSTEM` and no tenant binding. Gateway does not synthesize a tenant for a platform account.

## 7. Relationship With Session Context

`GET /auth/session/context` may keep `access.actionCodes` as a temporary compatibility placeholder, but it is not the long-term source of access control truth.

Long-term direction:

- Use `session/context` for shell context and navigation.
- Use `session/access-summary` for roles and action codes.
- Let front ends refresh access summary independently when needed.

### 7.1 Cross-service execution

After Auth has established the selected session context, Gateway / BFF uses scope-aware HUMAN OBO for both Permission calls:

| HTTP composition | Permission INTERNAL Code | SYSTEM subject | TENANT subject |
| --- | --- | --- | --- |
| `GET /auth/session/access-summary` | `permission.internal.account_access_summary.resolve` | `tenant_id` absent | exact session `tenant_id` |
| `GET /auth/session/context` navigation composition | `permission.internal.account_navigation.resolve` | `tenant_id` absent | exact session `tenant_id` |

The existing signed `tenant_id` presence is the subject scope encoding: exact non-wildcard value means TENANT and complete absence means SYSTEM. Gateway does not send a caller-selected `scope_level` or tenant into `ExchangeExecutionToken`; Auth derives the pair from its verified session/subject Token. `scope` remains the requested/granted Permission Code set. The target request still carries its existing `scope_level` / optional `tenant_id` owner-query fields, derived from the same selected session and checked against the verified target Token.

The direct actor remains the registered tenantless SYSTEM MACHINE Gateway workload. Permission authorizes only that exact workload -> audience -> INTERNAL Code issuance and does not provide HUMAN subject scope or tenant. Exchange/admission failure returns the endpoint's stable dependency failure; Gateway does not fabricate an empty access summary, scope default, tenant value or broad BUSINESS grant.

## 8. Front-end Integration

The current tenant-web foundation already supports code-based access checks:

- `accessCodes` store.
- `hasAccessByCodes`.
- `v-access:code`.
- `AccessControl type="code"`.

Expected usage:

```vue
<button v-access:code="'role.create'">Create Role</button>
```

or:

```vue
<AccessControl type="code" :codes="['role.create']">
  <Button>Create Role</Button>
</AccessControl>
```

The front end should treat returned `actionCodes` as the effective authorization summary for the current session context.

## 9. Current Integration Boundary

Current state:

- `GET /auth/session/access-summary` is already the dedicated access-summary endpoint.
- The downstream source is `permission-service`.
- Both tenant-scope and system-scope accounts are supported.
- Account selection and both HTTP response schemas remain unchanged. Scope-aware OBO requires no proto, JWT-claim, role, permission-catalog, database or front-end change.

## 10. Current Deferred Work

- Keep `session/context.access.actionCodes` as a compatibility field until all front-end callers no longer depend on it.

## 11. Explicit Non-goal

- Tenant feature / plugin enablement filtering is not part of the current OES authorization roadmap. The system is not expected to evolve toward tenant-level module or plugin enablement in the current architecture.

Downstream design reference:

- [permission-service access summary](../permission-service/access-summary.md)

## 12. Acceptance

- A selected SYSTEM account keeps `tenantId = null`; access summary resolves the current `SYSTEM_INSTANCE` role/action set and session context returns `scopeLevel = SYSTEM` with tenant absent/null.
- A selected TENANT account keeps its exact tenant through access summary and navigation OBO; existing tenant role/action resolution is unchanged.
- Blank/wildcard tenant, SYSTEM-with-tenant, TENANT-without-tenant, missing session, wrong audience/Code/workload/actor, expired subject or Permission/audit mismatch fails before a downstream result is composed.
- The full SYSTEM journey covers account selection, `GET /auth/session/access-summary`, and `GET /auth/session/context`; success of account selection alone is not acceptance.
