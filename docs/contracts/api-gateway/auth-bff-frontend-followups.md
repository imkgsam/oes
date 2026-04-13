# Auth BFF Frontend Follow-ups

## 1. Purpose

This document tracks the remaining `auth-bff` capabilities that the `tenant-web` front-end still needs before the authentication area can be considered functionally complete.

It is intended for cross-thread collaboration:

- front-end threads record real client needs and current fallback behavior
- gateway / auth threads implement or expose the missing HTTP capabilities
- both sides update status as the contracts become usable

This document complements, but does not replace:

- [auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-login.md)
- [README.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/README.md)

## 2. Status Legend

- `READY`: front-end can safely integrate now
- `IN_PROGRESS`: contract or implementation is being prepared
- `TODO`: not yet exposed in a stable way
- `BLOCKED`: front-end cannot complete the flow until BFF support exists

## 3. Follow-up Items

### 3.1 Login Initialization Context

- Status: `READY`
- Front-end current state:
  - `tenant-web` can now read a stable post-login initialization payload from BFF instead of inventing the shell context entirely from partial login data.
- Current endpoint:
  - `GET /auth/session/context`
- Current stage-one response shape:

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
  "org": {
    "orgId": "org_hq",
    "name": "Headquarters"
  },
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
- Why this matters:
  - front-end should not continue inventing user/session context from partial auth payloads
  - later tenant governance, collaboration, and business modules need explicit tenant-aware context
- Current stage-one constraint:
  - `navigation.defaultEntry` and `navigation.visibleEntries` are the long-term navigation truth
  - `navigation.defaultHomePath` is a temporary Web compatibility field
  - `navigation.menus` is intentionally `[]`
  - `access.actionCodes` is intentionally `[]` as a compatibility placeholder
  - `org` may be `null`
  - richer navigation entries remain tracked separately below

### 3.2 Navigation Summary

- Status: `READY`
- Front-end current state:
  - current login flow can reach the workbench using local fallback logic
  - BFF now returns a stage-one navigation summary from `GET /auth/session/context`
- Current back-end contract:
  - BFF returns `navigation.defaultEntry`
  - BFF returns `navigation.visibleEntries`
  - BFF currently exposes `workbench.home` for tenant sessions and `platform.home` for system sessions
- Front-end responsibility:
  - map entry keys to local Web routes
  - keep Web menu hierarchy, grouping, icons, and rendering in the front end
  - filter out locally defined menu entries that are not present in `visibleEntries`
- Deferred work:
  - richer visible entries beyond the initial tenant/system default entries
  - tenant feature / plugin enablement
  - stable navigation entry registry
  - terminal-aware navigation policy
- Why this matters:
  - `tenant-web` should use BFF as the navigation visibility truth without asking BFF to own Web-specific routes or menu hierarchy
- Design reference:
  - [navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md)

### 3.3 Action Codes / Permission Summary

- Status: `READY`
- Front-end current state:
  - tenant-web login hydration now loads action codes from `GET /auth/session/access-summary`
- Accepted design:
  - BFF exposes a dedicated `GET /auth/session/access-summary` endpoint
  - the endpoint returns `roles` for display / diagnostics
  - the endpoint returns `actionCodes` for front-end button and action control
  - current-stage `actionCodes` equal effective permission codes resolved by the back end
  - front end must not derive permissions from returned roles
  - back end should filter disabled tenant feature / plugin permissions once feature enablement exists
- Front-end integration expectation:
  - use existing `accessCodes` store
  - use `v-access:code`, `AccessControl type="code"`, or equivalent helpers
  - components declare required action codes during development
- Why this matters:
  - front-end should not use empty codes as a long-term substitute for authorization summary
- Design reference:
  - [access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md)

### 3.4 QR Code Login

- Status: `DEFERRED`
- Front-end current state:
  - `tenant-web` exposes a QR-login entry from the password login page
  - the target page is still a controlled placeholder instead of a fake demo QR flow
- Responsibility split before implementation:
  - Product: confirm QR login is in scope for the current phase and define trusted confirmation terminal.
  - BFF / contract: define QR generation or session-binding endpoint, polling / subscription status endpoint, expiry semantics, and final auth completion behavior.
  - Auth-service: own QR login challenge state, confirmation result, replay protection, expiry, and audit event.
  - Front-end: keep a controlled placeholder until the above contract is stable, then replace it with the real QR login screen.
- Why this matters:
  - the current page intentionally avoids pretending the feature exists

### 3.5 Forgot Password

- Status: `DEFERRED`
- Front-end current state:
  - `tenant-web` now exposes a controlled notice page instead of a fake reset form
- Responsibility split before implementation:
  - Product: confirm whether self-service password reset is allowed or whether reset must stay administrator-managed.
  - BFF / contract: define reset challenge request, reset verification, password update submission, rate limit, and error semantics.
  - Auth-service / notification-service: own reset token / challenge lifecycle, password update rules, notification delivery, abuse protection, and audit event.
  - Front-end: keep the controlled notice page until the real flow is approved and contracted.
- Why this matters:
  - front-end should not keep a template reset form without a real backend flow

### 3.6 Self-service Registration

- Status: `DEFERRED`
- Front-end current state:
  - `tenant-web` now exposes a controlled notice page instead of a fake self-registration form
- Responsibility split before implementation:
  - Product: confirm whether OES allows self-service registration or only administrator-created users / accounts.
  - BFF / contract: define registration request, verification, tenant/account creation or invitation acceptance boundary, and abuse protection.
  - Auth-service / identity-service: own user credential creation, user-account binding, invitation or tenant bootstrap rules, and audit event.
  - Front-end: keep the controlled notice page until registration semantics are decided.
- Why this matters:
  - current OES direction suggests administrator-managed account opening may be the real model
  - this should be decided explicitly rather than left as a template leftover

### 3.7 Email OTP Login Front-end Flow

- Status: `READY`
- Front-end current state:
  - BFF login and challenge contracts exist
  - `tenant-web` already supports email OTP flow, including:
    - requesting challenge via `POST /auth/challenges/email-otp`
    - submitting OTP via `POST /auth/login` with method `EMAIL_OTP`
- Front-end still needs:
  - no blocking capability for this scenario in the current phase
- Why this matters:
  - email and phone OTP are now both available as first-pass sign-in options

### 3.8 Phone Password Login Front-end Flow

- Status: `READY`
- Front-end current state:
  - `tenant-web` supports phone password login through `POST /auth/login` with method `PHONE_PASSWORD`
  - phone input uses a country / region dial-code selector plus local number input
  - the submitted value remains a normalized international phone number string
- Front-end still needs:
  - no blocking BFF capability for the current phase
- Why this matters:
  - password login now supports both email and phone identifiers without adding a separate product flow

### 3.9 Auth Flow Ordering Rule (Identity Before Account Selection)

- Status: `READY`
- Rule:
  - front-end must only enter account-selection after identity verification has completed
- Front-end current state:
  - `tenant-web` enforces this guard in auth store flow handling
- Back-end contract expectation:
  - if account selection is required, this status should represent a post-auth state
  - if identity verification is still pending, BFF should return the corresponding auth continuation state first
- Proposed `POST /auth/login` account-selection branch:

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
    }
  ]
}
```

### 3.10 Dashboard-ready Auth Shell

- Status: `READY`
- Front-end current state:
  - `tenant-web` can now complete the first-pass flow from login to dashboard to logout
  - dashboard entry now hydrates the authenticated shell from `GET /auth/session/context`
- Back-end follow-up:
  - none required for the current minimal chain itself
  - future improvements should converge on the initialization-context capability listed above

### 3.11 Authentication UI Status

- Status: `READY`
- Front-end current state:
  - password login and OTP login pages both use `phone / email` underline tabs above the identifier input
  - password login keeps page-level routing between email and phone modes
  - OTP login keeps mode switching through the route query
  - password login includes controlled entries for OTP login, QR login, and third-party placeholders
  - password login and OTP login both include a front-end-only slider gate
- Back-end follow-up:
  - none required for the current UI state
  - if slider verification becomes security-relevant, a dedicated BFF challenge contract must be designed before the front-end treats it as authoritative

### 3.12 Third-party Login

- Status: `DEFERRED`
- Front-end current state:
  - password login displays WeChat, QQ, GitHub, and Google as small controlled placeholder entries
  - clicking these entries must not start a fake OAuth / SSO flow
- Responsibility split before implementation:
  - Product: confirm which third-party identity providers are in scope and whether they are tenant-level, platform-level, or both.
  - BFF / contract: define provider discovery, redirect initiation, callback completion, account linking, error, and tenant/account selection continuation contracts.
  - Auth-service / identity-service: own external identity binding, account linking, unlinking rules, session issuance, and audit event.
  - Front-end: keep placeholder icons until provider contracts and callback routes are stable.
- Why this matters:
  - third-party login crosses security, identity binding, tenant context, and audit boundaries; it must not be treated as a purely visual front-end feature.

## 4. Current Front-end Delivery State

At the time of writing, `tenant-web` already supports or partially supports:

- email password login
- phone password login
- email OTP login
- phone OTP login
- MFA completion
- account selection
- session refresh
- logout
- dashboard entry after successful auth

Current auth UX should stay practical and direct. The stable requirement is:

- account selection only after successful identity verification

The following pages are intentionally non-executable placeholders until BFF support is available or the product decision is clarified:

- QR code login
- forgot password
- self-service registration
- third-party login

## 5. Update Rules

When a missing capability changes state:

1. update the item status in this document
2. link the corresponding black-box contract document if one now exists
3. only then should front-end threads remove fallback placeholders and wire the real flow
