# Extension Auth BFF Login Contract

> `auth-service` 的服务设计唯一真相源是 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)。涉及 Terminal Access Policy、access summary、Role、Policy、permission code、navigation visibility 或授权判定的服务设计边界，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。本文只描述 browser-extension terminal 的 Auth BFF HTTP contract。

## 1. Purpose

本文定义 OES browser extension 的第一阶段登录闭环。

Browser extension 是独立 terminal，不是 `tenant-web` 的附属页面，也不通过读取 `tenant-web` token 建立登录态。

第一阶段目标：

- 插件内直接登录 OES。
- BFF 固定可信 `terminal = BROWSER_EXTENSION`。
- 登录成功后初始化 extension launcher。
- `navigation.visibleEntries` 控制插件 launcher 可见 workspace。
- `actionCodes` 控制进入 workspace 后的动作能力。

## 2. Terminal Boundary

Extension auth endpoints use a terminal-specific BFF prefix:

```http
/extension/auth/*
```

Rules:

- Requests entering `/extension/auth/*` are normalized by BFF as `terminal = BROWSER_EXTENSION`.
- Clients must not be able to turn extension login into `WEB`、`PDA`、`KIOSK` or any other terminal by submitting a `terminal` field.
- Extension sessions and refresh tokens are independent from `tenant-web` sessions.
- `tenant-web` account / tenant switching does not silently switch the extension session.
- Extension account / tenant switching must use extension auth endpoints and re-issue session state.

## 3. First-Stage Login Method

First-stage demo login uses:

- `EMAIL_PASSWORD`

Deferred but compatible with existing auth flow:

- `EMAIL_OTP`
- `PHONE_PASSWORD`
- `PHONE_OTP`
- MFA continuation
- factor challenge / resend flows
- password recovery

If downstream auth returns MFA or other continuation states, BFF should preserve the existing Auth BFF response shape. This contract does not introduce extension-only MFA semantics.

## 4. Endpoint Summary

| Endpoint | Purpose |
| --- | --- |
| `POST /extension/auth/login` | Submit primary extension login. |
| `POST /extension/auth/account-selection` | Select one extension-eligible account after primary identity verification. |
| `POST /extension/auth/session/refresh` | Refresh an established extension session. |
| `GET /extension/auth/session/context` | Initialize extension shell / launcher context. |
| `GET /extension/auth/session/access-summary` | Return roles and action codes for the selected extension account context. |
| `GET /extension/auth/session/contexts` | List switchable extension account contexts. |
| `POST /extension/auth/session/switch-context` | Switch extension account context and re-issue session tokens. |

Response shapes should mirror existing Auth BFF view models unless this contract explicitly defines extension-specific semantics.

## 5. Login

```http
POST /extension/auth/login
```

Purpose:

- Authenticate a user from the browser extension terminal.
- Return a session when exactly one extension-eligible account can be selected automatically.
- Return extension-filtered account options when account selection is required.

Request:

```json
{
  "identifier": "designer@example.com",
  "method": "EMAIL_PASSWORD",
  "credential": "plain-password",
  "device": {
    "deviceId": "extension-installation-id",
    "deviceName": "Chrome Extension on macOS"
  }
}
```

Rules:

- `method = EMAIL_PASSWORD` is the first-stage default.
- `device.deviceId` is an extension runtime hint, not a business identifier.
- BFF forwards trusted `terminal = BROWSER_EXTENSION` downstream.
- BFF must not forward a client-supplied terminal override.
- Primary identity verification must succeed before account options are returned.

### 5.1 Account Options Filtering

Extension differs from current Web auth behavior.

When `/extension/auth/login` returns account options, the options must be filtered to accounts that can establish a `BROWSER_EXTENSION` terminal session.

Rules:

- Account options must only include accounts allowed by Terminal Access Policy for `BROWSER_EXTENSION`.
- System-scope accounts are excluded by default unless future governance explicitly allows `BROWSER_EXTENSION` for system accounts.
- If no selectable account remains after filtering, BFF returns a stable denial instead of an empty ambiguous list.
- BFF must not expose `effectiveAllowedTerminals` in unauthenticated denial responses.

Recommended denial:

```json
{
  "status": "DENIED",
  "nextStep": "NONE",
  "loginMethod": "EMAIL_PASSWORD",
  "reasonCode": "NO_SELECTABLE_ACCOUNT_FOR_TERMINAL",
  "message": "当前账号不允许从浏览器插件登录，请联系管理员。",
  "accountOptions": []
}
```

Account-selection response:

```json
{
  "status": "ACCOUNT_SELECTION_REQUIRED",
  "nextStep": "SELECT_ACCOUNT",
  "loginMethod": "EMAIL_PASSWORD",
  "operator": {
    "userId": "usr_123",
    "displayName": "Designer A"
  },
  "accountOptions": [
    {
      "accountId": "acc_designer_001",
      "tenantId": "tenant_a",
      "tenantName": "Meilong Ceramics",
      "scopeLevel": "TENANT",
      "displayName": "Designer A @ Meilong Ceramics"
    }
  ]
}
```

## 6. Account Selection

```http
POST /extension/auth/account-selection
```

Purpose:

- Select one extension-eligible account after primary identity verification.
- Establish an extension terminal session.

Request:

```json
{
  "userId": "usr_123",
  "accountId": "acc_designer_001",
  "loginMethod": "EMAIL_PASSWORD",
  "device": {
    "deviceId": "extension-installation-id",
    "deviceName": "Chrome Extension on macOS"
  }
}
```

Rules:

- This endpoint is public only within an active post-auth continuation flow.
- It must not be used as a pre-auth account lookup endpoint.
- BFF forwards trusted `terminal = BROWSER_EXTENSION`.
- Downstream terminal access denial is returned as `DENIED / TERMINAL_ACCESS_DENIED`.
- Successful selection re-issues session state for the selected account context.

Success response:

```json
{
  "status": "SUCCESS",
  "nextStep": "NONE",
  "loginMethod": "EMAIL_PASSWORD",
  "operator": {
    "userId": "usr_123",
    "displayName": "Designer A",
    "accountId": "acc_designer_001",
    "tenantId": "tenant_a"
  },
  "session": {
    "accessToken": "jwt-access",
    "refreshToken": "jwt-refresh",
    "expiresIn": 3600,
    "terminal": "BROWSER_EXTENSION"
  },
  "accountOptions": []
}
```

## 7. Session Refresh

```http
POST /extension/auth/session/refresh
```

Purpose:

- Refresh an established extension session.

Rules:

- Refresh preserves the terminal bound to the original session.
- Refresh must not accept a client-supplied terminal override.
- If `BROWSER_EXTENSION` terminal access is no longer allowed, BFF returns `DENIED / TERMINAL_ACCESS_DENIED` and no new tokens.
- Refresh denial should revoke or invalidate the current extension session according to auth-service session rules.

## 8. Session Context

```http
GET /extension/auth/session/context
```

Purpose:

- Initialize the extension shell after login, account selection, refresh or context switch.
- Provide launcher visibility through navigation entries.

Response:

```json
{
  "operator": {
    "userId": "usr_123",
    "displayName": "Designer A"
  },
  "account": {
    "accountId": "acc_designer_001",
    "name": "Designer A @ Meilong Ceramics",
    "scopeLevel": "TENANT"
  },
  "tenant": {
    "tenantId": "tenant_a",
    "name": "Meilong Ceramics"
  },
  "org": null,
  "terminal": "BROWSER_EXTENSION",
  "allowedTerminals": ["BROWSER_EXTENSION"],
  "navigation": {
    "defaultEntry": "extension.workspace.designer",
    "visibleEntries": ["extension.workspace.designer"]
  },
  "access": {
    "actionCodes": []
  }
}
```

Rules:

- `navigation.visibleEntries` is the launcher workspace visibility truth.
- `navigation.defaultEntry` may be used as the default focused workspace entry.
- Extension front end maps entry keys to local workspace UI.
- Extension front end must not use Web route, menu hierarchy, `defaultHomePath`, or `menus` as stable truth.

## 9. Access Summary

```http
GET /extension/auth/session/access-summary
```

Purpose:

- Return effective roles and action codes for the selected extension account context.

Rules:

- Response shape follows [access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md).
- `actionCodes` are the control source for workspace actions, context menu actions, commands and submit buttons.
- Front end must not derive action availability from role names.

## 10. Context List And Switch

```http
GET /extension/auth/session/contexts
POST /extension/auth/session/switch-context
```

Purpose:

- Let an authenticated extension user switch to another extension-eligible account / tenant context.

Rules:

- Semantics follow the existing account context switch model.
- Listed contexts must be filtered to accounts that can establish `BROWSER_EXTENSION` terminal sessions.
- Switch context re-issues session tokens for the target account context.
- After switch, extension must refresh:
  - session context
  - access summary
  - launcher visible entries
  - active workspace state
- `tenant-web` context switching does not alter the extension session.

## 11. Audit Expectations

Auth audit should distinguish extension terminal events from Web events.

Auth-service / BFF audit should include, where available:

- terminal: `BROWSER_EXTENSION`
- login method
- account id
- tenant id for tenant-scope accounts
- operator / user id
- device id / device name as client hints
- user-agent and IP from HTTP request metadata
- login success / denial reason
- account selection success / denial reason
- refresh success / denial reason
- context switch source and target account

The extension must not log credentials or refresh tokens.

## 12. Non-goals

- No content-script token scraping from `tenant-web`.
- No Firebase or external auth provider for OES identities.
- No direct extension call to `auth-service`, `permission-service`, `identity-service` or business services.
- No system-scope extension login by default.
- No designer workspace project submission contract in this auth document.

## 13. Related Documents

- [browser-workspace-extension-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/browser-workspace-extension-design.md)
- [auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-login.md)
- [pda-auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/pda-auth-bff-login.md)
- [navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md)
- [access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md)
- [terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/terminal-access-policy.md)
