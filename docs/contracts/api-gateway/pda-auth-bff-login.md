# PDA Auth BFF Login Contract

> `auth-service` 的服务设计唯一真相源是 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)。涉及 Terminal Access Policy、access summary、角色、权限或导航授权的服务设计边界，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准；本文只描述 PDA Auth BFF HTTP contract。

## 1. Purpose

This document defines the PDA-specific HTTP authentication contract exposed by `api-gateway`.

PDA is an independent terminal entry, not a tenant-web skin. The BFF fixes `terminal = PDA` for all PDA auth endpoints and forwards the trusted terminal to `auth-service`.

`auth-service` account selection, MFA, session and token boundaries are defined only in [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md). This document only describes the PDA BFF terminal contract and response shape.

## 2. Endpoint Scope

Phase 1 PDA auth exposes only the login/session initialization subset:

- `POST /pda/auth/login`
- `POST /pda/auth/account-selection`
- `POST /pda/auth/mfa/complete`
- `POST /pda/auth/mfa/challenges`
- `POST /pda/auth/session/refresh`
- `GET /pda/auth/session/context`

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

Request and response shapes mirror the stable Web auth BFF login contract unless this document states otherwise.

The major semantic difference is terminal binding:

- `auth-service` receives `terminal = PDA`.
- `auth-service` applies the Terminal Access Policy decision according to its unique truth source before MFA challenge creation or session issuance.
- PDA sessions and tokens carry `terminal = PDA`.

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
