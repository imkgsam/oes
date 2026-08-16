# Auth BFF Login Flow

> `auth-service` 的服务设计唯一真相源是 [auth-service.md](../../architecture/services/auth-service.md)。涉及 Terminal Access Policy、access summary、角色、权限或导航授权的服务设计边界，以 [permission-service.md](../../architecture/services/permission-service.md) 为准；本文只描述 Auth BFF HTTP contract。

## Scope

This document defines the public HTTP login flow exposed by `auth-bff`. These endpoints orchestrate authentication steps for web and app clients and intentionally hide the downstream gRPC auth-service contract.

For the existing `/auth/*` endpoints, `auth-bff` is the Web terminal entry and normalizes the downstream terminal as `WEB`.

`auth-service` service design, account selection, session, token, OTP and MFA boundaries are defined only in [auth-service.md](../../architecture/services/auth-service.md). This BFF contract describes HTTP orchestration and response shape only.

## Product Flow Constraints

- `account selection` is strictly a post-auth step.
- No client should enter `account selection` before primary identity verification succeeds.
- The current `tenant-web` direction is to keep the login flow practical and direct, without introducing additional pre-check endpoints as a hard requirement.

## Endpoints

### `POST /auth/login`

- Purpose: unified primary login submission for password and OTP-based login methods.
- Users: unauthenticated end users.
- Control model: public authentication endpoint; no `checkPermission`, `buildQueryScope`, or `checkResource`.
- Deferred fields:
  - `tenantHint` is kept in the HTTP contract as a future client-side preference input, but it is not forwarded downstream yet.
  - `device.deviceId` is not forwarded during the primary credential-verification step; it is forwarded in the post-auth account-selection step for trusted-device recognition.
  - OTP login methods do not consume login-device hints yet.
- Active device propagation:
  - for `EMAIL_PASSWORD` and `PHONE_PASSWORD`, BFF now forwards `device.deviceName` together with the incoming HTTP `user-agent` and `ip` to `auth-service`
  - this propagation is currently used to enrich failed-login audit records and the self-service login-history view
- Terminal propagation:
  - Web `/auth/*` endpoints always forward trusted `terminal=WEB` downstream
  - clients must not be able to turn Web login into `PDA` or `KIOSK` by submitting a terminal field
  - terminal access is checked after account selection and before MFA challenge creation or session issuance
- Downstream:
  - `LoginWithEmailPassword`
  - `LoginWithEmailOtp`
  - `LoginWithPhonePassword`
  - `LoginWithPhoneOtp`
- Contract constraint:
  - `ACCOUNT_SELECTION_REQUIRED` may only be returned after primary identity verification has succeeded
  - if the user still needs to prove identity, BFF must return the corresponding continuation state such as password challenge, OTP challenge, or MFA continuation instead of account selection
- Proposed request:

```json
{
  "identifier": "vic.chen@meilong-ceramics.com",
  "method": "EMAIL_PASSWORD",
  "credential": "plain-or-otp-value",
  "tenantHint": "meilong",
  "device": {
    "deviceId": "browser-fingerprint",
    "deviceName": "Chrome on macOS"
  }
}
```

- Password-login forwarding note:
  - `device.deviceName` is forwarded only for password login methods in the current stage
  - `user-agent` and `ip` are taken from the HTTP request rather than from the JSON body

- Proposed success response:

```json
{
  "status": "SUCCESS",
  "nextStep": "NONE",
  "loginMethod": "EMAIL_PASSWORD",
  "operator": {
    "userId": "usr_123",
    "displayName": "Vic Chen"
  },
  "session": {
    "accessToken": "jwt-access",
    "refreshToken": "jwt-refresh",
    "expiresIn": 3600
  },
  "accountOptions": []
}
```

- Proposed MFA continuation response:

```json
{
  "status": "MFA_REQUIRED",
  "nextStep": "COMPLETE_MFA",
  "loginMethod": "EMAIL_PASSWORD",
  "challenge": {
    "challengeId": "chl_mfa_123",
    "scenario": "LOGIN",
    "defaultFactor": "EMAIL_OTP",
    "availableFactors": [
      {
        "type": "EMAIL_OTP",
        "label": "邮箱验证码",
        "priority": 1
      },
      {
        "type": "TOTP",
        "label": "认证器 App",
        "priority": 2
      },
      {
        "type": "SMS_OTP",
        "label": "手机验证码",
        "priority": 3
      },
      {
        "type": "BACKUP_CODE",
        "label": "恢复码",
        "priority": 4
      }
    ]
  },
  "operator": {
    "userId": "usr_123",
    "displayName": "Vic Chen"
  },
  "accountOptions": []
}
```

- MFA continuation constraint:
  - `MFA_REQUIRED` only creates the login-level MFA flow challenge.
  - `challenge.scenario` is `LOGIN` or `NEW_DEVICE_LOGIN` for the current login flow.
  - `challenge.defaultFactor` and `challenge.availableFactors[]` are ordered by the selected account tenant's MFA factor priority.
  - BFF must not treat `defaultFactor: EMAIL_OTP` or `defaultFactor: SMS_OTP` as meaning an OTP has already been sent.
  - `factorChallengeId`, `destination`, and `expiresAt` are omitted until the user explicitly requests an OTP factor challenge.
  - Current UI must gate email and SMS OTP send / resend behind captcha before calling the factor challenge endpoint.
  - `NEW_DEVICE_LOGIN` only appears after primary身份验证成功且账号选择完成，不是登录前的独立风险页。

- Proposed post-auth account-selection response:

```json
{
  "status": "ACCOUNT_SELECTION_REQUIRED",
  "nextStep": "SELECT_ACCOUNT",
  "loginMethod": "EMAIL_PASSWORD",
  "operator": {
    "userId": "usr_123",
    "displayName": "Vic Chen"
  },
  "accountOptions": [
    {
      "accountId": "acc_001",
      "tenantId": "tenant_a",
      "displayName": "Meilong Ceramics"
    },
    {
      "accountId": "acc_002",
      "tenantId": "tenant_b",
      "displayName": "Meilong Trading"
    }
  ]
}
```

- Proposed denial response:

```json
{
  "status": "DENIED",
  "nextStep": "NONE",
  "loginMethod": "EMAIL_PASSWORD",
  "reasonCode": "INVALID_CREDENTIAL",
  "message": "The submitted credential is invalid."
}
```

- Proposed terminal-access denial response:

```json
{
  "status": "DENIED",
  "nextStep": "NONE",
  "loginMethod": "EMAIL_PASSWORD",
  "reasonCode": "TERMINAL_ACCESS_DENIED",
  "message": "该账号不允许从当前终端登录，请联系管理员。",
  "accountOptions": []
}
```

- Proposed response field expectations:
  - `status`: `SUCCESS`, `MFA_REQUIRED`, `ACCOUNT_SELECTION_REQUIRED`, `DENIED`
  - `nextStep`: `NONE`, `COMPLETE_MFA`, `SELECT_ACCOUNT`
  - `loginMethod`: method used by the current step
  - `challenge`: challenge payload when the flow must continue
  - `operator`: minimal authenticated identity summary
  - `session`: token payload only when the flow is ready to establish a session
  - `accountOptions`: only meaningful after identity verification succeeds
  - `reasonCode`: stable UI-facing denial classification
  - `message`: operator-facing message suitable for the UI

### `POST /auth/challenges/email-otp`

- Purpose: request an email OTP challenge before OTP login submission.
- Users: unauthenticated end users.
- Control model: public authentication endpoint; no resource authorization.
- Downstream: `RequestEmailOtpLoginChallenge`

### `POST /auth/challenges/phone-otp`

- Purpose: request a phone OTP challenge before OTP login submission.
- Users: unauthenticated end users.
- Control model: public authentication endpoint; no resource authorization.
- Downstream: `RequestPhoneOtpLoginChallenge`

### `POST /auth/password-recovery/options`

- Purpose: inspect which verified recovery channels are currently available for one submitted account identifier.
- Users: unauthenticated end users after the frontend captcha gate succeeds.
- Control model: public authentication endpoint; no `checkPermission`.
- Downstream: `InspectPasswordRecoveryChannels`
- Stable semantics:
  - request carries one submitted verified login identifier
  - response returns the matched verified recovery channels with masked destinations
  - when only one verified channel is available, `defaultChannel` is returned so the frontend can skip the chooser step

### `POST /auth/password-recovery/challenges`

- Purpose: start one forgot-password recovery attempt after the frontend captcha gate succeeds.
- Users: unauthenticated end users.
- Control model: public authentication endpoint; no `checkPermission`.
- Downstream: `RequestPasswordRecoveryChallenge`
- Stable semantics:
  - request carries the selected verified channel plus the originally submitted account identifier
  - `auth-service` resolves the user first, then dispatches OTP to the selected verified destination
  - current V1 frontend captcha is a client-side gate, not a third-party reCAPTCHA integration

### `POST /auth/password-recovery/challenges/:challengeId/verify`

- Purpose: verify one forgot-password OTP and receive a short-lived reset grant token.
- Users: unauthenticated end users in an active recovery flow.
- Control model: public authentication endpoint; challenge validation replaces resource authorization.
- Downstream: `VerifyPasswordRecoveryChallenge`

### `POST /auth/password-recovery/complete`

- Purpose: set a new unified password and revoke all existing sessions for the recovered user.
- Users: unauthenticated end users holding a verified reset grant token.
- Control model: public authentication endpoint; verified reset grant validation replaces resource authorization.
- Downstream: `CompletePasswordRecovery`

### `POST /auth/mfa/complete`

- Purpose: complete a pending MFA challenge returned by the primary login step.
- Users: end users in an in-progress authentication flow.
- Control model: public authentication endpoint; challenge validation replaces resource authorization.
- Downstream: `SubmitMfaChallenge`
- Request fields:
  - `challengeId`: JWT-sized login MFA flow challenge id; max length must allow signed JWT payloads
  - `factor`: one of `EMAIL_OTP / SMS_OTP / TOTP / BACKUP_CODE`
  - `code`: user-submitted factor code
  - `factorChallengeId`: required only for `EMAIL_OTP / SMS_OTP`
  - `loginMethod`: original primary login method
- Recovery-code semantics:
  - `BACKUP_CODE` participates in normal factor priority ordering.
  - A successful backup-code verification consumes the emergency set and disables the current `BACKUP_CODE` binding.
  - A used recovery-code set cannot be reused; the user must regenerate codes in the security center before it becomes available again.

### `POST /auth/mfa/challenges`

- Purpose: explicitly request an email or SMS OTP factor challenge inside a pending login MFA flow.
- Users: end users in an in-progress authentication flow who have actively chosen to send or resend an OTP factor.
- Control model: public authentication endpoint; challenge validation replaces resource authorization.
- Downstream: `RequestLoginMfaFactorChallenge`
- Contract constraint:
  - this endpoint must be invoked only from a user action, not from page load, automatic MFA route entry, or passive factor selection
  - email and SMS factors must be gated by captcha in the UI before this endpoint is called
  - server-side captcha token validation is a BFF concern if/when a tokenized captcha provider is introduced
  - `TOTP` and `BACKUP_CODE` do not create downstream OTP challenges
- Proposed request:

```json
{
  "challengeId": "chl_mfa_123",
  "factor": "EMAIL_OTP"
}
```

- Proposed response:

```json
{
  "challengeId": "otp_factor_123",
  "destination": "a***@example.com",
  "expiresAt": "2026-04-22T10:00:00.000Z"
}
```

### `POST /auth/account-selection`

- Purpose: select one account candidate after the auth flow returns multiple account options.
- Users: end users who have already passed primary authentication and must choose a tenant/account.
- Control model: public authentication endpoint; account ownership and flow state replace resource authorization.
- Downstream: `SelectAccount`
- Contract constraint:
  - this endpoint is only valid after BFF has already established that the identity is authenticated
  - this endpoint must not be used as a substitute for pre-auth account lookup or any other pre-login routing step
- Proposed request:

```json
{
  "userId": "usr_123",
  "accountId": "acc_001",
  "loginMethod": "EMAIL_PASSWORD"
}
```

- Terminal constraint:
  - Web auth-bff forwards `terminal=WEB` to `auth-service.SelectAccount`.
  - Terminal access denial is returned as `DENIED / TERMINAL_ACCESS_DENIED`.
  - Denial does not include `effectiveAllowedTerminals`.

- Proposed response:

```json
{
  "status": "SUCCESS",
  "nextStep": "NONE",
  "loginMethod": "EMAIL_PASSWORD",
  "operator": {
    "userId": "usr_123",
    "displayName": "Vic Chen",
    "accountId": "acc_001",
    "tenantId": "tenant_a"
  },
  "session": {
    "accessToken": "jwt-access",
    "refreshToken": "jwt-refresh",
    "expiresIn": 3600
  },
  "accountOptions": []
}
```

### `POST /auth/session/refresh`

- Purpose: refresh an established session using a refresh token.
- Users: authenticated clients holding a refresh token.
- Control model: token protocol endpoint; refresh-token validation replaces resource authorization.
- Downstream: `RefreshSession`
- Terminal constraint:
  - refresh preserves the terminal bound to the original session
  - refresh does not accept a client-supplied terminal override
  - if terminal access is no longer allowed, BFF returns `DENIED / TERMINAL_ACCESS_DENIED` and no new tokens

### `GET /auth/session/context`

- Purpose: initialize the authenticated shell after login succeeds and account selection is settled.
- Users: authenticated clients holding a valid access token.
- Control model: authenticated session endpoint.
- Downstream:
  - JWT current-session context
  - `identity-service.GetAccountById`
  - `tenant-org-service.GetTenantById`
  - effective terminal access summary from `permission-service`
- Tenant lifecycle 与 tenant status 语义以 [tenant-org-service.md](../../architecture/services/tenant-org-service.md) 为准；BFF 只做聚合与展示适配。
- Stage-one delivery:
  - `operator / account / tenant` return real authenticated context
  - `org` is optional and may be `null`
  - `navigation.defaultEntry` is the back-end-selected navigation entry
  - `navigation.visibleEntries` is the back-end navigation visibility truth
  - `navigation.defaultHomePath` is a temporary Web compatibility field
  - `navigation.menus` is a temporary compatibility placeholder
  - `access.actionCodes` is currently an empty compatibility placeholder
  - `terminal` is the terminal bound to the current session, currently `WEB` for this contract
  - `allowedTerminals` is the current account's effective terminal access summary for read-only display
- Related design references:
  - Navigation semantics follow [navigation-summary.md](./navigation-summary.md).
  - Access-summary semantics follow [access-summary.md](./access-summary.md).
- Current response example:

```json
{
  "operator": {
    "userId": "usr_123",
    "displayName": "Vic Chen"
  },
  "account": {
    "accountId": "acc_001",
    "name": "Vic Chen @ Meilong Ceramics"
  },
  "tenant": {
    "tenantId": "tenant_a",
    "name": "Meilong Ceramics"
  },
  "org": null,
  "terminal": "WEB",
  "allowedTerminals": ["WEB"],
  "navigation": {
    "defaultEntry": "workbench.home",
    "defaultHomePath": "/workbench/home",
    "visibleEntries": [
      "workbench.home"
    ],
    "menus": []
  },
  "access": {
    "actionCodes": []
  }
}
```

- Current response field expectations:
  - `operator`: current operator summary used by the top-right user shell
  - `account`: selected account summary
  - `tenant`: selected tenant summary
  - `org`: selected org summary when available; currently may be `null`
  - `terminal`: session-bound terminal
  - `allowedTerminals`: current account's effective terminal access for read-only display
  - `navigation.defaultEntry`: stable default entry key selected by BFF
  - `navigation.visibleEntries`: stable visible entry keys selected by BFF
  - Current minimal emitted entry set:
    - `workbench.home`: tenant-scope default entry
    - `platform.home`: system-scope default entry
    - `admin.auth-session-management`: admin-only left-navigation entry when the current context is granted visibility
  - `navigation.defaultHomePath`: temporary Web compatibility mapping for the current default entry
  - `navigation.menus`: temporary compatibility placeholder; not the long-term navigation truth
  - `access.actionCodes`: currently `[]` compatibility placeholder; long-term source is `GET /auth/session/access-summary`

### `GET /auth/session/access-summary`

- Purpose: return the current authenticated session's role summary and effective action codes.
- Users: authenticated clients holding a valid access token.
- Control model: authenticated session endpoint.
- Current status: implemented.
- Downstream:
  - `permission-service.PermissionAccessSummaryService.GetAccountAccessSummary`
- Long-term responsibility:
  - `roles` are returned for display and diagnostics only.
  - `actionCodes` are returned for front-end button and action control.
  - current-stage `actionCodes` equal effective permission codes for the current account / tenant context.
  - system-scope accounts are resolved through `scopeLevel = SYSTEM` and do not require `tenantId`.
  - BFF / downstream services resolve roles and permissions; front end must not derive permissions from roles.
  - tenant feature / plugin enablement filtering is not part of the current authorization roadmap.
- Target response:

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

- Design reference:
  - [access-summary.md](./access-summary.md)

### `GET /auth/session/contexts`

- Purpose: list the authenticated user's available account contexts that can be switched to after login.
- Users: authenticated clients holding a valid access token.
- Control model: authenticated session endpoint.
- Downstream:
  - current-session JWT context
  - `identity-service` available account-context query for the current user
- Contract constraints:
  - this endpoint is self-bound; users can list only their own available account contexts
  - the current context must be included in the response for display, but should not be switchable in the UI
  - `SYSTEM` context must not carry a tenant binding
  - `TENANT` context must carry a valid `tenantId`
- Minimal response shape:

```json
{
  "items": [
    {
      "accountId": "acc_system",
      "scopeLevel": "SYSTEM",
      "displayName": "Platform Admin",
      "tenantId": null,
      "tenantName": null,
      "isCurrent": true
    },
    {
      "accountId": "acc_tenant_a",
      "scopeLevel": "TENANT",
      "displayName": "Vic Chen @ Meilong Ceramics",
      "tenantId": "tenant_a",
      "tenantName": "Meilong Ceramics",
      "isCurrent": false
    }
  ]
}
```

- Response field expectations:
  - `accountId`: target account context identifier
  - `scopeLevel`: `SYSTEM` or `TENANT`
  - `displayName`: user-facing account-context label
  - `tenantId`: nullable for `SYSTEM`, required for `TENANT`
  - `tenantName`: nullable for `SYSTEM`, optional display summary for `TENANT`
  - `isCurrent`: whether this item is the current active context

### `POST /auth/session/switch-context`

- Purpose: switch the authenticated session to another available account context without requiring a full re-login.
- Users: authenticated clients holding a valid access token.
- Control model: authenticated session endpoint; the target context must belong to the current user.
- Downstream:
  - current-session JWT context
  - available account-context validation
  - `auth-service` session/token re-issuance for the target context
- Contract constraints:
  - this endpoint must not accept arbitrary cross-user account switching
  - switching context must re-issue token/session state for the target account context
  - after a successful switch, front ends must refresh:
    - `GET /auth/session/context`
    - `GET /auth/session/access-summary`
  - target contexts that become unavailable between list and switch must return a stable error semantic such as `TARGET_CONTEXT_UNAVAILABLE`
- Proposed request:

```json
{
  "accountId": "acc_tenant_a"
}
```

- Proposed success response:

```json
{
  "status": "SUCCESS",
  "context": {
    "accountId": "acc_tenant_a",
    "scopeLevel": "TENANT",
    "tenantId": "tenant_a"
  },
  "session": {
    "accessToken": "jwt-access",
    "refreshToken": "jwt-refresh",
    "expiresIn": 3600
  }
}
```

- Proposed unavailable-target response:

```json
{
  "status": "DENIED",
  "reasonCode": "TARGET_CONTEXT_UNAVAILABLE",
  "message": "The selected context is no longer available. Please refresh and try again."
}
```

- Response field expectations:
  - `status`: `SUCCESS` or `DENIED`
  - `context`: minimal target-context summary after successful switching
  - `session`: newly issued token payload for the target context
  - `reasonCode`: stable UI-facing denial classification when switching fails
  - `message`: operator-facing error message suitable for the UI

### `GET /auth/personal-center`

- Purpose: return the first-stage personal-center summary for the authenticated user.
- Users: authenticated end users.
- Control model: authenticated session endpoint.
- Composition rules:
  - `userProfile` is `user`-level identity and login-method summary only, and it must not carry account-profile fields.
  - `accountContext` is current `account`-level work context and account-profile summary.
  - `roles` reflect the current authenticated account, not every role the natural person has globally.
  - enterprise-assigned work contacts are read-only in this stage.
  - current account profile fields `avatar` / `displayName` / `bio` belong to `accountContext`, not `userProfile`.
  - `avatar` is the external black-box field name in the BFF contract; downstream `identity-service.UserAccount` stores the same value in the internal field `avatarUrl`.
- First-stage response:

```json
{
  "userProfile": {
    "loginEmail": "chen.shuangpeng@meilong-ceramics.com",
    "loginPhone": "+8613900000001",
    "loginMethods": [
      { "type": "EMAIL_PASSWORD", "label": "邮箱密码", "value": "chen.shuangpeng@meilong-ceramics.com" },
      { "type": "PHONE_PASSWORD", "label": "手机密码", "value": "+8613900000001" }
    ]
  },
  "accountContext": {
    "accountId": "cb3f1d5d-1406-4fb0-8d53-75a144093001",
    "accountName": "陈双鹏 / 美隆陶瓷",
    "avatar": "data-or-url",
    "displayName": "陈双鹏",
    "bio": "外贸与平台协同负责人",
    "tenantId": "ea06d4a0-6990-4ba0-ae13-fb31485c2001",
    "tenantName": "潮州市美隆陶瓷实业有限公司",
    "scopeLevel": "TENANT",
    "roles": [
      { "roleId": "role-1", "code": "tenant.admin", "name": "租户管理员" }
    ],
    "workEmail": "chen.shuangpeng@meilong-ceramics.com",
    "workPhone": "+8613900000001"
  },
  "securityEntries": [
    { "code": "session-security", "label": "会话管理", "path": "/account/security" }
  ]
}
```

### `PATCH /auth/personal-center/account-profile`

- Purpose: update the editable display-profile fields of the current authenticated `account`.
- Users: authenticated end users.
- Control model: authenticated session endpoint; the target `account` is always the currently authenticated account context.
- Scope constraints:
  - this endpoint only updates current-account profile fields
  - it must not edit `user`-level login identity fields
  - it must not edit tenant context, role assignments, work contacts, or security settings
- Editable fields in stage one:
  - `avatarAssetId`
  - `displayName`
  - `bio`
- Avatar flow constraint:
  - avatar file upload must go through the dedicated `POST /auth/personal-center/avatar` endpoint first
  - this endpoint does not accept arbitrary external avatar URLs
  - the avatar upload / bind flow is available for both `TENANT` and `SYSTEM` current-account contexts; the difference is the downstream asset ownership scope, not feature availability
- Proposed request:

```json
{
  "avatarAssetId": "ast_01JAVATARABCDEF1234567890",
  "displayName": "陈双鹏",
  "bio": "负责美隆陶瓷的外贸协同与重点客户经营。"
}
```

- Proposed response:

```json
{
  "accountContext": {
    "accountId": "cb3f1d5d-1406-4fb0-8d53-75a144093001",
    "accountName": "陈双鹏 / 美隆陶瓷",
    "avatar": "https://cdn.example.com/avatar/account-1.png",
    "displayName": "陈双鹏",
    "bio": "负责美隆陶瓷的外贸协同与重点客户经营。",
    "tenantId": "ea06d4a0-6990-4ba0-ae13-fb31485c2001",
    "tenantName": "潮州市美隆陶瓷实业有限公司",
    "scopeLevel": "TENANT",
    "roles": [
      { "roleId": "role-1", "code": "tenant.admin", "name": "租户管理员" }
    ],
    "workEmail": "chen.shuangpeng@meilong-ceramics.com",
    "workPhone": "+8613900000001"
  }
}
```

- Proposed field expectations:
  - `avatarAssetId`: optional current-account avatar asset reference; it must come from the dedicated avatar upload flow rather than from a user-supplied URL
  - `displayName`: optional but user-facing current-account display label; when present it should be non-blank after trimming
  - `bio`: optional short current-account profile text
- Proposed validation baseline:
  - `avatarAssetId`: optional string, max length `64`
  - `displayName`: optional string, max length `64`, blank strings are normalized to `null`
  - `bio`: optional string, max length `280`, blank strings are normalized to `null`
- Suggested downstream ownership:
  - `auth-bff` validates request shape and forwards a current-account profile mutation
  - `identity-service` owns the write model because `avatarAssetId`, `displayName`, and `bio` belong to `UserAccount`
  - `asset-service` owns avatar asset upload, storage, and public URL generation

### `POST /auth/personal-center/avatar`

- Purpose: upload one avatar candidate file for the current authenticated account before saving the account profile.
- Users: authenticated end users.
- Control model: authenticated session endpoint; the target `account` is always the currently authenticated account context.
- Scope constraint:
  - this endpoint must support both `TENANT` and `SYSTEM` current-account contexts
  - `TENANT` current-account uploads produce tenant-owned avatar assets
  - `SYSTEM` current-account uploads produce system-owned avatar assets
- Request model:
  - `multipart/form-data`
  - one required `file` field
- Validation baseline:
  - allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
  - max size: `2MB`
  - the server must validate file headers and image decodability instead of trusting only the extension
- Proposed response:

```json
{
  "avatarAsset": {
    "assetId": "ast_01JAVATARABCDEF1234567890",
    "publicUrl": "https://assets.example.com/avatar/tenant-1/account-1/abc.webp",
    "mimeType": "image/webp",
    "size": 183421,
    "status": "PENDING_BIND"
  }
}
```

- Downstream ownership:
  - `auth-bff` owns the external HTTP endpoint and current-account authorization boundary
  - `asset-service` owns asset metadata, scope-aware ownership, storage writes, and `publicUrl` generation

## Current front-end readiness

- Ready now:
  - primary login submission
  - email OTP challenge request
  - phone OTP challenge request
  - MFA completion
  - account selection
  - session refresh
  - authenticated shell session context
- Not part of this first delivery:
  - self-service session management
  - self-service MFA management
  - admin security management
- Constraint:
  - clients should not depend on `tenantHint` or `device` changing downstream auth behavior yet; these fields are reserved but not active.
