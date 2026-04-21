# Access Summary Design

## 1. Purpose

This document defines the OES access-summary design used by API Gateway / BFF contracts.

The goal is to provide the front end with a stable current-session authorization summary without requiring front-end code to derive permissions from roles.

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
- System-scope accounts are supported; they resolve `SYSTEM_INSTANCE` roles without a tenant binding.

## 7. Relationship With Session Context

`GET /auth/session/context` may keep `access.actionCodes` as a temporary compatibility placeholder, but it is not the long-term source of access control truth.

Long-term direction:

- Use `session/context` for shell context and navigation.
- Use `session/access-summary` for roles and action codes.
- Let front ends refresh access summary independently when needed.

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

## 10. Current Deferred Work

- Keep `session/context.access.actionCodes` as a compatibility field until all front-end callers no longer depend on it.

## 11. Explicit Non-goal

- Tenant feature / plugin enablement filtering is not part of the current OES authorization roadmap. The system is not expected to evolve toward tenant-level module or plugin enablement in the current architecture.

Downstream design reference:

- [permission-service access summary](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/access-summary.md)
