# Trusted Device Management Design

## 1. Goal

Freeze the first executable design for `受信设备管理` in personal account security so OES can support `NEW_DEVICE_LOGIN` MFA with a clear user-facing trust model.

This slice is for `长期信任设备管理`, not `在线会话管理`.

## 2. Scope

### In Scope

- personal self-service trusted-device management in `账号安全`
- tenant-policy-driven `NEW_DEVICE_LOGIN` MFA behavior
- explicit `信任当前设备` choice inside the new-device MFA flow
- trusted-device records scoped by `user + tenant + device`
- trusted-device expiry and manual revocation
- clear separation between trusted devices and online sessions
- `tenant-web` UI aligned with the existing security-center framework style

### Out of Scope

- administrator-managed trusted-device operations
- WeChat Mini Program trusted-device support
- forced coupling between trusted-device revocation and session logout
- custom trust duration per user or per tenant
- search, filter, pagination, or device rename
- risk scoring, anomaly detection, or notification expansion
- platform-wide default MFA policy owned by system administrators

## 3. Product Decisions Frozen In This Design

### 3.1 Trusted Device Purpose

- A trusted device means `this device may skip NEW_DEVICE_LOGIN MFA for this user in this tenant until trust expires or is revoked`.
- A trusted device does not mean the device currently has an active online session.
- Trusted devices are a long-lived trust list, not a real-time session list.

### 3.2 Trusted Device And Online Session Are Separate Truths

- `在线会话` answers: `can this logged-in session still access the system now?`
- `受信设备` answers: `will this device be treated as familiar on the next login?`
- Logging out or revoking a session must not automatically delete trusted-device records.
- Revoking a trusted device must not automatically terminate currently active sessions.
- Trusted-device expiry affects future login checks only; it does not invalidate already active sessions.

### 3.3 Tenant Policy Ownership

- Whether `新设备登录` requires MFA is a tenant-level MFA policy decision.
- The tenant administrator controls this in `租户 MFA 配置`.
- Trusted-device records are user-managed data, but their runtime effect depends on the tenant policy.

### 3.4 Trust Scope

- Trust is scoped by `user + tenant + device`.
- Trust must not automatically carry across tenants, even for the same user on the same physical device.
- This keeps multi-tenant MFA boundaries explicit and consistent with tenant-owned policy.

### 3.5 Trust Semantics

- The first phase uses a `混合型` trust model.
- Trust has a default validity window of `30 days`.
- Trust expires automatically.
- Users may manually revoke trust before expiry.
- Trust is never granted automatically just because MFA succeeded on a new device.

### 3.6 Trust Decision UX

- The trust decision must happen inside the `新设备 MFA` page, not after login in a separate popup.
- The page provides an explicit `信任当前设备` checkbox.
- The checkbox is unchecked by default.
- If the user checks it and completes MFA successfully, the device is recorded as trusted.
- If the user leaves it unchecked and completes MFA successfully, login succeeds without writing a trusted-device record.

### 3.7 Channel Support

- Phase 1 supports trusted-device semantics for `Web`, `PDA`, and future native app-style clients with stable device identifiers.
- `微信小程序` is out of scope for phase 1 because its client-instance semantics are not stable enough for this first trusted-device model.

## 4. Candidate Approaches

### Approach A: MFA-Embedded Explicit Trust Choice (Recommended)

- when `NEW_DEVICE_LOGIN` MFA is triggered, the MFA page includes an explicit `信任当前设备` choice
- successful MFA writes trust only when the user opted in
- trusted-device management is exposed later in `账号安全 > 受信设备`

Why this is recommended:

- aligns the trust decision with the security event that just happened
- avoids silently remembering shared or temporary devices
- gives the user a clear and understandable trust moment
- fits the existing MFA flow without introducing a disconnected second popup

### Approach B: Auto-Trust After New-Device MFA

- every successful `NEW_DEVICE_LOGIN` MFA automatically writes a trusted-device record

Why this is not recommended:

- it is too aggressive for shared, public, or temporary devices
- it creates an unexpected persistent trust side effect from a one-time login verification

### Approach C: Post-Login Trust Prompt

- complete login first, then ask whether to trust the current device in a separate prompt

Why this is not recommended:

- it breaks the security flow into two moments
- it feels like an extra interruption after the user has already entered the system
- it is less coherent than making trust part of the MFA decision itself

## 5. Recommended Architecture

### 5.1 Responsibility Split

#### tenant-web

Owns:

- the new-device MFA trust checkbox UI
- personal `受信设备` tab in `账号安全`
- revoke interactions and confirmation dialogs
- framework-aligned presentation and user messaging

Must not own:

- final trusted-device truth
- tenant MFA policy truth
- session or trust lifecycle rules

#### auth-bff

Owns:

- thin HTTP contracts for listing and revoking trusted devices
- propagation of operator, tenant, device, and trace metadata
- stable view models for security-center pages

Must remain thin:

- no core trust decision logic in controllers or DTOs

#### auth-service

Owns:

- trusted-device truth
- trust creation and refresh semantics
- trust expiry and revocation semantics
- runtime recognition for `NEW_DEVICE_LOGIN`

Must keep separate:

- trusted-device lifecycle
- online session lifecycle

### 5.2 Data Ownership Model

One trusted-device record represents:

- one `user`
- in one `tenant`
- on one `deviceId`

It is not a session record and must not be modeled as one.

## 6. Runtime Flows

### 6.1 New-Device Login Flow

Recommended runtime sequence:

1. the user completes the primary login step
2. the user reaches account selection / account-context establishment
3. the system checks whether the tenant requires `NEW_DEVICE_LOGIN` MFA
4. the system checks whether the current `user + tenant + device` is still trusted
5. if not trusted, the frontend shows the `新设备 MFA` page
6. the page shows the selected MFA factor and an unchecked `信任当前设备` checkbox
7. the user completes MFA
8. if the checkbox was selected, the system writes or refreshes the trusted-device record with a 30-day expiry
9. the user enters the tenant context successfully

### 6.2 Trusted-Device Revocation Flow

Recommended runtime sequence:

1. the user opens `账号安全 > 受信设备`
2. the user clicks `撤销信任` on one device or `撤销其他所有受信设备`
3. the system revokes the selected trust record(s)
4. future logins on those devices are treated as new-device logins again
5. current active online sessions remain untouched

## 7. Data Model

The first-phase trusted-device record should contain at least:

- `id`
- `userId`
- `tenantId`
- `deviceId`
- `deviceName`
- `browser`
- `platform`
- `trustedAt`
- `lastActiveAt`
- `expiresAt`
- `revokedAt`

Semantics:

- `trustedAt` records when trust was first established
- `lastActiveAt` records the most recent successful use of that trusted device in the tenant
- `expiresAt` is the trust timeout boundary
- `revokedAt` marks explicit revocation without pretending the record never existed

## 8. UI Design

### 8.1 Security-Center Entry

Add one new independent tab under `账号安全`:

- `受信设备`

This tab sits alongside, not inside, `在线会话`.

### 8.2 Trusted-Device Page Shape

The page should use a compact card-list style, not a heavy operations table.

Each device card shows:

- `当前设备` marker when applicable
- `设备名`
- `浏览器 / 平台`
- `首次信任时间`
- `最近活跃时间`
- `到期时间`

Each card exposes only:

- `撤销信任`

The page header exposes one bulk action:

- `撤销其他所有受信设备`

### 8.3 UI Constraints

The page must visually align with the existing security-center framework language:

- use current `Card / Space / Tag / Button / Tooltip / Modal / Empty` patterns
- avoid introducing a new heavy data-grid style
- keep explanation copy lightweight and concise
- move explanatory detail into `tooltip` when needed
- use calm status indicators rather than loud warning styling

The page must look like a natural extension of the current `账号安全` experience rather than a separate subsystem.

## 9. Contracts

Phase 1 should add personal self-service contracts for:

- listing trusted devices for the current user in the current tenant context
- revoking one trusted device
- revoking all other trusted devices

These contracts belong to the same self-security surface as current session-management capabilities.

## 10. Testing Focus

The implementation plan should cover at least:

- tenant policy on/off behavior for `NEW_DEVICE_LOGIN`
- trust recognition by `user + tenant + device`
- explicit opt-in trust creation from the MFA page
- expiry behavior after the 30-day window
- single-device revoke behavior
- revoke-other-devices behavior
- separation from online-session state
- UI rendering inside the security-center tab structure

## 11. Phase 1 Summary

Phase 1 includes:

- tenant-policy-driven `NEW_DEVICE_LOGIN`
- explicit `信任当前设备` choice inside new-device MFA
- 30-day trust expiry
- personal `受信设备` tab in `账号安全`
- trusted-device card list
- `撤销信任`
- `撤销其他所有受信设备`
- support for `Web / PDA`

Phase 1 excludes:

- WeChat Mini Program trust support
- trust-and-logout combined operation
- admin-managed trusted-device actions
- search, filters, pagination, rename, or risk scoring

