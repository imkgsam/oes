# Auth BFF Extension Connect

## Scope

This document defines the first-stage `auth-bff` HTTP contract for explicitly connecting a trusted OES web session to a browser extension session.

The first-stage target client is the Chrome browser prospecting extension. The contract is intentionally owned by `auth-bff` because the flow answers authentication and session-establishment questions, not prospecting business questions.

This contract exists so the extension can obtain authenticated OES access without scraping `tenant-web` local storage, reading page tokens, or trusting browser page scripts as identity truth.

## Product Flow Constraints

- The user must already be authenticated in a trusted OES web page before creating a connection grant.
- The trusted web page initiates the connect action explicitly. Silent background connection is out of scope.
- The extension redeems the grant and stores extension auth material only in extension-controlled storage.
- The content script must not participate in token extraction from web pages.
- The connection flow must not switch tenant, account, or operator context during grant redemption.

## Endpoints

### `POST /auth/extensions/connection-grants`

- Purpose: create a short-lived, single-use extension connection grant from the current authenticated OES web session.
- Users: authenticated OES web users acting from a trusted web page.
- Control model: authenticated session endpoint owned by `auth-bff`.
- Downstream:
  - current session context resolution
  - current selected account / tenant context from the authenticated session
  - future auth-service grant issuance capability if downstream issuance becomes necessary

Proposed request:

```json
{
  "clientType": "browser_prospecting",
  "deviceLabel": "Chrome on macOS"
}
```

Required fields:

- `clientType`

Optional fields:

- `deviceLabel`

First-stage supported `clientType` values:

- `browser_prospecting`

Proposed response:

```json
{
  "clientType": "browser_prospecting",
  "grantId": "ext_grant_001",
  "grantToken": "one-time-grant-token",
  "expiresAt": "2026-04-18T10:05:00.000Z"
}
```

Stable semantics:

- The grant must be short-lived.
- The grant must be single-use.
- The grant is bound to the currently authenticated operator / account / tenant context.
- The grant must not contain business-scoped permissions for browser prospecting; it only authorizes extension session establishment.
- The grant must not be returned to unauthenticated callers.

### `POST /auth/extensions/connection-grants/redeem`

- Purpose: redeem a one-time extension connection grant and establish an extension-usable authenticated session.
- Users: the browser extension runtime.
- Control model: grant-validation endpoint owned by `auth-bff`.
- Downstream:
  - grant validation and single-use enforcement
  - current account / tenant / operator binding
  - future auth-service session issuance or token exchange capability

Proposed request:

```json
{
  "clientType": "browser_prospecting",
  "grantToken": "one-time-grant-token"
}
```

Required fields:

- `clientType`
- `grantToken`

Proposed response:

```json
{
  "clientType": "browser_prospecting",
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
  "session": {
    "accessToken": "jwt-access",
    "refreshToken": "jwt-refresh",
    "expiresIn": 3600
  }
}
```

Stable semantics:

- Redeem must fail when the grant is expired.
- Redeem must fail when the grant has already been used.
- Redeem must fail when `clientType` does not match the original grant.
- Redeem must not let the extension choose or override tenant, account, org, or operator identity.
- The returned session shape may reuse the existing bearer token model in first stage.
- If future extension-specific token audience or session format is introduced, `auth-bff` still owns the black-box HTTP contract and response mapping.

## Non-goals

- No content-script token scraping from `tenant-web`.
- No manual token copy-paste flow.
- No direct extension call to `auth-service`.
- No browser-prospecting business action in this contract.
- No account-context switching in the redemption step.

## Related Contracts

- Browser prospecting business endpoints:
  - [browser-prospecting-workspace.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/browser-prospecting-workspace.md)
- Login and current session context:
  - [auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-login.md)
