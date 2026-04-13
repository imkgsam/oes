# Auth BFF Self-Service Security

## Scope

This document defines the authenticated self-service security endpoints exposed by `auth-bff`.

These endpoints are intended for signed-in end users managing their own sessions and MFA settings. They do not use `checkPermission`, `buildQueryScope`, or `checkResource`; instead they rely on the authenticated JWT context and self-bound semantics.

## Endpoints

### Sessions

- `GET /auth/sessions`
  - Purpose: list the current user's sessions.
  - Downstream: `ListSessions`
- `POST /auth/logout`
  - Purpose: revoke the current session.
  - Downstream: `Logout`
- `POST /auth/logout-other-devices`
  - Purpose: revoke every session except the current session.
  - Downstream: `LogoutOtherDevices`
- `POST /auth/logout-all`
  - Purpose: revoke every session of the current user.
  - Downstream: `LogoutAll`

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

## Control Model

- All endpoints require an authenticated gateway JWT.
- The BFF resolves `userId` and `sessionId` from the current JWT context rather than trusting client-supplied identity fields.
- These endpoints are intentionally self-bound and should not be reused for administrator operations.
