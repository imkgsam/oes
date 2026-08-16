# KIOSK Auth BFF Login Contract

> `auth-service` 的服务设计唯一真相源是 [auth-service.md](../../architecture/services/auth-service.md)。涉及 Terminal Access Policy、access summary、角色、权限或导航授权的服务设计边界，以 [permission-service.md](../../architecture/services/permission-service.md) 为准；本文只描述 KIOSK Auth BFF HTTP contract。

## 1. Purpose

This document defines the KIOSK-specific HTTP authentication contract exposed by `api-gateway`.

`KIOSK` represents fixed work-station touch screens such as an appearance inspection station. It is an interactive human terminal and participates in Terminal Access Policy.

Large display boards / dashboard TVs are not part of this human account login contract.

`auth-service` account selection, MFA, session and token boundaries are defined only in [auth-service.md](../../architecture/services/auth-service.md). This document only describes the KIOSK BFF terminal contract and response shape.

## 2. Endpoint Scope

Phase 1 KIOSK auth exposes only the login/session initialization subset:

- `POST /kiosk/auth/login`
- `POST /kiosk/auth/account-selection`
- `POST /kiosk/auth/mfa/complete`
- `POST /kiosk/auth/mfa/challenges`
- `POST /kiosk/auth/session/refresh`
- `GET /kiosk/auth/session/context`

Not part of Phase 1:

- password recovery
- personal center mutation
- self-service security management
- admin security management
- display-board device access
- biometric recognition or gesture-based authentication

## 3. Terminal Trust Boundary

The KIOSK BFF endpoint owns terminal normalization.

Rules:

- KIOSK clients do not choose terminal freely.
- Requests entering `/kiosk/auth/*` are forwarded downstream as `terminal = KIOSK`.
- If future payloads carry a terminal field, BFF must reject values that conflict with the endpoint terminal.

## 4. Login Flow

Request and response shapes mirror the stable Web auth BFF login contract unless this document states otherwise.

The major semantic difference is terminal binding:

- `auth-service` receives `terminal = KIOSK`.
- `auth-service` applies the Terminal Access Policy decision according to its unique truth source before MFA challenge creation or session issuance.
- KIOSK sessions and tokens carry `terminal = KIOSK`.

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

`GET /kiosk/auth/session/context` returns the authenticated KIOSK shell context.

Target fields:

```json
{
  "operator": {
    "userId": "usr_123",
    "displayName": "Chen"
  },
  "account": {
    "accountId": "acc_123",
    "name": "Chen / Quality Station",
    "scopeLevel": "TENANT"
  },
  "tenant": {
    "tenantId": "tenant_123",
    "name": "Meilong Ceramics"
  },
  "org": null,
  "terminal": "KIOSK",
  "allowedTerminals": ["KIOSK"],
  "navigation": {
    "defaultEntry": "kiosk.home",
    "visibleEntries": ["kiosk.home"]
  },
  "access": {
    "actionCodes": []
  }
}
```

KIOSK maps `entryKey` values to local touch-screen pages or station workflows. The BFF must not return Web route, menu hierarchy, icon, or layout as cross-terminal truth.

## 6. Navigation Baseline

Phase 1 seeds only the minimal KIOSK entry:

- `kiosk.home`

Appearance quality inspection workflows are outside this terminal access contract and must be added by the quality feature design.
