# ADR 0002: System Role Instance And Account Role Scope

> 当前 `permission-service` 服务职责、核心对象与 owner 边界以 [permission-service.md](../architecture/services/permission-service.md) 为准；本 ADR 只保留 role kind 与 account-role scope 的架构决策记录。

## Status

Accepted

## Context

OES currently distinguishes role templates and tenant role instances, but it does not model a real system-level role instance that can be assigned to a system administrator account.

This creates an authorization gap:

- System administrator accounts are not bound to a tenant.
- `AccountRole` currently requires `tenantId`.
- Account-role assignment currently only accepts tenant role instances.
- `GET /auth/session/access-summary` cannot correctly return system administrator action codes without inventing an unsafe fallback.

## Decision

OES role kinds are split into three meanings:

- `SYSTEM_TEMPLATE`
  - Global template role.
  - Used as the source for tenant role instances.
  - Must not be assigned directly to accounts.
- `SYSTEM_INSTANCE`
  - Real system-level role.
  - Can be assigned to system-scope accounts.
  - Has `tenantId = null` and `scopeKey = "__SYSTEM__"`.
- `TENANT_INSTANCE`
  - Real tenant-level role.
  - Can be assigned to tenant-scope accounts.
  - Has `tenantId = tenantId` and `scopeKey = tenantId`.

`AccountRole` becomes scope-aware:

- `scopeLevel = SYSTEM`
  - `tenantId = null`
  - role must be `SYSTEM_INSTANCE`
- `scopeLevel = TENANT`
  - `tenantId` is required
  - role must be `TENANT_INSTANCE`

`SYSTEM_TEMPLATE` remains non-assignable.

## Consequences

Role CRUD and account-role management must understand the role kind boundary:

- Create/list/detail/update/delete role instance APIs must support both system and tenant instances.
- Account-role assignment must allow system accounts to bind system role instances.
- Tenant-scoped operators must not list or mutate system role instances.
- System-scoped operators may manage system role instances and tenant role instances according to management permissions.
- Access summary must resolve system administrator action codes from `SYSTEM_INSTANCE` bindings rather than returning an empty summary.

## Deferred Work

- Tenant feature / plugin filtering in access summary is permanently deferred under the current non-modular product direction.
- Historical `CheckPermissionWithContext` removal remains deferred until all consumers are confirmed migrated to `checkResource` / `buildQueryScope`.
