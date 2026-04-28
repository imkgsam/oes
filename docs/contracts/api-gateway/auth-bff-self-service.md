# Auth BFF Self-Service Security

## Scope

This document defines the authenticated self-service security endpoints exposed by `auth-bff`.

These endpoints are intended for signed-in end users managing their own sessions and MFA settings. They do not use `checkPermission`, `buildQueryScope`, or `checkResource`; instead they rely on the authenticated JWT context and self-bound semantics.

For session management specifically, the self-service boundary is the current authenticated `account` context, not every account owned by the same natural person.

For login history specifically, the self-service boundary is the current authenticated `user`, not the current `account` context, because login attempts happen before account selection finalizes the work context.

## Endpoints

### Sessions

- `GET /auth/sessions`
  - Purpose: list the sessions of the current authenticated account.
  - Downstream: `ListSessions`
- `POST /auth/logout`
  - Purpose: revoke the current session.
  - Downstream: `Logout`
- `POST /auth/sessions/:sessionId/logout`
  - Purpose: revoke one other active session in the current authenticated account.
  - Downstream: `LogoutSession`
- `POST /auth/logout-other-devices`
  - Purpose: revoke every other session in the current authenticated account while keeping the current session.
  - Downstream: `LogoutOtherDevices`
- `POST /auth/logout-all`
  - Purpose: revoke every session in the current authenticated account, including the current session.
  - Downstream: `LogoutAll`

### Login History

- `GET /auth/login-history`
  - Purpose: list the current authenticated user's own login-attempt history.
  - Downstream: `ListLoginHistory`
  - Filters:
    - `result`
    - `occurredAtFrom`
    - `occurredAtTo`
    - `cursor`
    - `pageSize`
  - Stable semantics:
    - only returns the current authenticated user's records
    - only returns `LOGIN_SUCCEEDED / LOGIN_FAILED`
    - does not mix current session inventory, logout events, or session lifecycle events

### Login Methods

- `GET /auth/login-methods`
  - Purpose: list the current authenticated user's login method status.
  - Downstream: `ListLoginMethods`
  - Stable semantics:
    - derives `userId` from the authenticated session
    - does not expose credential secrets, password hashes, OTP values, or MFA secrets
- `POST /auth/password/change`
  - Purpose: change the current authenticated user's password after verifying the current password.
  - Downstream: `ChangeOwnPassword`
- `POST /auth/login-methods/:methodId/enable`
  - Purpose: enable one current-user login method.
  - Downstream: `SetLoginMethodEnabled`
- `POST /auth/login-methods/:methodId/disable`
  - Purpose: disable one current-user login method.
  - Downstream: `SetLoginMethodEnabled`
  - Stable semantics:
    - rejects disabling the final enabled and verified login method

### Session Semantics

- BFF derives `userId` and `sessionId` from the authenticated JWT and forwards `currentSessionId` downstream for self-service session operations.
- `GET /auth/sessions`, `POST /auth/sessions/:sessionId/logout`, `POST /auth/logout-other-devices`, and `POST /auth/logout-all` are interpreted against the current account resolved from the current session.
- `POST /auth/sessions/:sessionId/logout` must reject targeting the current authenticated session; current-session logout continues to use `POST /auth/logout`.
- When the end user switches account context, the platform now replaces the current session instead of surfacing an additional parallel self-service session for the same device flow.
- End-user self-service pages should present friendly login-method labels and should not expose raw `context-switch` as a primary visible session method.
- End-user self-service session management keeps “active sessions” and “login history” separated; a successful single-session logout removes the target from the active-session view.
- End-user self-service login history is user-bound:
  - one login attempt should not be fragmented into multiple account-scoped records
  - the front end should treat this API as a black-box user security timeline for login attempts only

### Stable Error Semantics

- When the target session does not exist, is no longer active, or is no longer visible under the current authenticated account:
  - return one stable “target session is not operable” semantic; callers should not depend on internal exception detail
- When the caller attempts to use `POST /auth/sessions/:sessionId/logout` on the current authenticated session:
  - return one stable “current session cannot be revoked through this endpoint” semantic

### MFA

- `GET /auth/mfa-bindings`
  - Purpose: list the current user's MFA binding state.
  - Downstream: `ListMfaBindings`
- `POST /auth/mfa/bindings/enable`
  - Purpose: enable one MFA binding type.
  - Downstream: `EnableMfaBinding`
- `POST /auth/mfa/bindings/disable`
  - Purpose: disable one MFA binding type.
  - Downstream: `DisableMfaBinding`
- `POST /auth/mfa/totp/initialize`
  - Purpose: initialize a TOTP binding.
  - Downstream: `InitializeTotpBinding`
- `POST /auth/mfa/totp/activate`
  - Purpose: activate a previously initialized TOTP binding.
  - Downstream: `ActivateTotpBinding`
- `POST /auth/mfa/recovery-codes/initialize`
  - Purpose: initialize recovery codes.
  - Downstream: `InitializeRecoveryCodes`
- `POST /auth/mfa/recovery-codes/regenerate`
  - Purpose: regenerate recovery codes.
  - Downstream: `RegenerateRecoveryCodes`

### Contact Binding Follow-up

- `POST /auth/contact-bindings/email/verify`
  - After one verified email binding succeeds, `auth-bff` must call self-service-only downstream write interfaces:
    - `IdentityManagementService.UpdateOwnUserBasicInfo`
    - `AuthService.BootstrapOwnLoginMethods`
- `POST /auth/contact-bindings/phone/verify`
  - After one verified phone binding succeeds, `auth-bff` must call self-service-only downstream write interfaces:
    - `IdentityManagementService.UpdateOwnUserBasicInfo`
    - `AuthService.BootstrapOwnLoginMethods`
- Stable governance rule:
  - self-service contact binding must not reuse admin-management downstream mutations

## Control Model

- All endpoints require an authenticated gateway JWT.
- Gateway authentication is not signature-only: protected requests must also pass downstream `ValidateAccessToken` session-truth validation in `auth-service`.
- If a session has been deleted or revoked on another device, the old access token must be rejected on the next protected request with an unauthenticated response.
- The BFF resolves `userId` and `sessionId` from the current JWT context rather than trusting client-supplied identity fields.
- These endpoints are intentionally self-bound and should not be reused for administrator operations.
