# Auth BFF Login Flow

## Scope

This document defines the public HTTP login flow exposed by `auth-bff`. These endpoints orchestrate authentication steps for web and app clients and intentionally hide the downstream gRPC auth-service contract.

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
  - `device` is kept in the HTTP contract for future login-device enrichment, but the primary login step does not forward it downstream yet.
  - Both fields are intentionally reserved and should not be treated as active behavior until the downstream auth flow requirement is frozen.
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
    "challengeId": "chl_mfa_123"
  },
  "operator": {
    "userId": "usr_123",
    "displayName": "Vic Chen"
  },
  "accountOptions": []
}
```

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

### `POST /auth/mfa/complete`

- Purpose: complete a pending MFA challenge returned by the primary login step.
- Users: end users in an in-progress authentication flow.
- Control model: public authentication endpoint; challenge validation replaces resource authorization.
- Downstream: `SubmitMfaChallenge`

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

### `GET /auth/session/context`

- Purpose: initialize the authenticated shell after login succeeds and account selection is settled.
- Users: authenticated clients holding a valid access token.
- Control model: authenticated session endpoint.
- Downstream:
  - JWT current-session context
  - `identity-service.GetAccountById`
  - `identity-service.GetTenantById`
- Stage-one delivery:
  - `operator / account / tenant` return real authenticated context
  - `org` is optional and may be `null`
  - `navigation.defaultEntry` is the back-end-selected navigation entry
  - `navigation.visibleEntries` is the back-end navigation visibility truth
  - `navigation.defaultHomePath` is a temporary Web compatibility field
  - `navigation.menus` is a temporary compatibility placeholder
  - `access.actionCodes` is currently an empty compatibility placeholder
- Navigation design:
  - The long-term navigation contract is `defaultEntry + visibleEntries`.
  - Front ends own terminal-specific route / page / screen mapping and menu rendering.
  - BFF does not return Web routes or a cross-terminal menu hierarchy as the stable truth.
  - See [navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md).
- Access design:
  - The long-term access-summary contract is a dedicated `GET /auth/session/access-summary` endpoint.
  - `roles` are for display / diagnostics.
  - `actionCodes` are for front-end button and action control.
  - Current-stage `actionCodes` are effective permission codes resolved by the back end.
  - Front ends must not derive permissions from returned roles.
  - See [access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md).
- Current response:

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
  - `navigation.defaultEntry`: stable default entry key selected by BFF
  - `navigation.visibleEntries`: stable visible entry keys selected by BFF
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
  - disabled tenant feature / plugin permissions should be filtered by the back end once feature enablement is available.
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
  - [access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md)

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
