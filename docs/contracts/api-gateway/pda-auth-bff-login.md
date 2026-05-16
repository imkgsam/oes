# PDA Auth BFF Login Contract

> `auth-service` 的服务设计唯一真相源是 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)。涉及 Terminal Access Policy、access summary、角色、权限或导航授权的服务设计边界，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准；本文只描述 PDA Auth BFF HTTP contract。

## 1. Purpose

This document defines the PDA-specific HTTP authentication contract exposed by `api-gateway`.

PDA is an independent terminal entry, not a tenant-web skin. The BFF fixes `terminal = PDA` for all PDA auth endpoints and forwards the trusted terminal to `auth-service`.

`auth-service` account selection, MFA, session and token boundaries are defined only in [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md). This document only describes the PDA BFF terminal contract and response shape.

## 2. Endpoint Scope

Phase 1 PDA auth exposed the login/session initialization subset:

- `POST /pda/auth/login`
- `POST /pda/auth/account-selection`
- `POST /pda/auth/mfa/complete`
- `POST /pda/auth/mfa/challenges`
- `POST /pda/auth/session/refresh`
- `GET /pda/auth/session/context`

Terminal-aware Account Security Phase 2 changes the PDA target flow:

- PDA 登录租户由受管设备绑定决定，用户登录时不再选择租户。
- PDA Phase 2 不提供 account selection；`POST /pda/auth/account-selection` 只作为历史 Phase 1 / compatibility 入口看待，不作为 Phase 2 目标流程继续扩展。
- PDA 常规登录 MFA 默认关闭；`/pda/auth/mfa/*` 仅在租户显式开启 PDA terminal MFA 时才可能进入流程。

Not part of Phase 1:

- password recovery
- personal center mutation
- self-service security management
- admin security management

## 3. Terminal Trust Boundary

The PDA BFF endpoint owns terminal normalization.

Rules:

- PDA clients do not choose terminal freely.
- Requests entering `/pda/auth/*` are forwarded downstream as `terminal = PDA`.
- If future payloads carry a terminal field, BFF must reject values that conflict with the endpoint terminal.

## 4. Login Flow

Request and response shapes mirror the stable Web auth BFF login contract only where PDA terminal semantics do not differ.

The major semantic difference is terminal binding:

- `auth-service` receives `terminal = PDA`.
- PDA BFF must provide the trusted `terminalDeviceId` and device-bound tenant context after consulting the managed terminal device capability.
- `auth-service` authenticates the user, then resolves exactly one PDA-eligible account inside the device-bound tenant.
- `auth-service` applies the Terminal Access Policy decision according to its unique truth source before MFA challenge creation or session issuance.
- PDA sessions and tokens carry `terminal = PDA`.
- PDA sessions carry `terminalDeviceId` and `deviceBoundTenantId`.
- If no PDA-eligible account exists in the device-bound tenant, login is denied.
- If multiple PDA-eligible accounts exist in the device-bound tenant, login is denied and requires admin-side identity / permission governance.

Terminal denial response:

```json
{
  "status": "DENIED",
  "nextStep": "NONE",
  "reasonCode": "TERMINAL_ACCESS_DENIED",
  "message": "该账号不允许从当前终端登录，请联系管理员。",
  "accountOptions": []
}
```

The response must not include `effectiveAllowedTerminals`.

PDA account resolution denial response:

```json
{
  "status": "DENIED",
  "nextStep": "NONE",
  "reasonCode": "PDA_ACCOUNT_RESOLUTION_FAILED",
  "message": "当前账号无法在此 PDA 设备绑定租户内建立唯一可用登录上下文，请联系管理员。",
  "accountOptions": []
}
```

## 5. Session Context

`GET /pda/auth/session/context` returns the authenticated PDA shell context.

Target fields:

```json
{
  "operator": {
    "userId": "usr_123",
    "displayName": "Chen"
  },
  "account": {
    "accountId": "acc_123",
    "name": "Chen / Workshop",
    "scopeLevel": "TENANT"
  },
  "tenant": {
    "tenantId": "tenant_123",
    "name": "Meilong Ceramics"
  },
  "terminalDevice": {
    "terminalDeviceId": "pda_001",
    "deviceBoundTenantId": "tenant_123",
    "displayName": "PDA-001"
  },
  "org": null,
  "terminal": "PDA",
  "allowedTerminals": ["PDA"],
  "navigation": {
    "defaultEntry": "pda.home",
    "visibleEntries": ["pda.home"]
  },
  "access": {
    "actionCodes": []
  }
}
```

PDA maps `entryKey` values to local pages, task cards, scanner flows, or screen stacks. The BFF must not return Web route, menu hierarchy, icon, or layout as cross-terminal truth.

## 6. Navigation Baseline

Phase 1 seeds only the minimal PDA entry:

- `pda.home`

Business entries such as receiving, inventory, production, or quality execution are outside this terminal access contract and must be added by their own feature designs.
