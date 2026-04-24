# Platform MFA Policy Design

## 1. Goal

Freeze the first executable design for `平台 MFA 配置` so `SYSTEM` accounts use a system-administrator-owned MFA policy instead of falling through tenant-only logic.

## 2. Scope

### In Scope

- platform-owned MFA policy for `SYSTEM` accounts
- separate governance from tenant MFA policy
- same factor and scenario model as tenant MFA policy
- runtime policy selection by account `scopeLevel`
- system-account support for `LOGIN / NEW_DEVICE_LOGIN / CHANGE_PASSWORD / CHANGE_CONTACT`
- system-scope trusted-device support so `NEW_DEVICE_LOGIN` can work for platform accounts
- one system-admin page aligned with the existing tenant MFA settings UI

### Out Of Scope

- per-system-account MFA overrides
- inheritance or merging between tenant and platform policies
- strict MFA reuse rules
- platform-wide risk scoring or dynamic MFA decisions

## 3. Root Cause

Current MFA orchestration is still tenant-first:

- login MFA resolution returns `null` for `SYSTEM` accounts
- step-up MFA checks read only tenant policy truth
- trusted-device persistence is still tenant-scoped
- the admin UI exposes only tenant MFA governance

So adding a platform page alone would create configuration without runtime effect.

## 4. Frozen Decisions

### 4.1 Governance Boundary

- `TENANT` account -> only `租户 MFA 配置`
- `SYSTEM` account -> only `平台 MFA 配置`
- no inheritance
- no merge
- no stacking

### 4.2 Policy Model

Platform MFA policy uses the same managed factors and scenarios as tenant MFA policy:

- factors:
  - `EMAIL_OTP`
  - `SMS_OTP`
  - `TOTP`
  - `BACKUP_CODE`
- scenarios:
  - `LOGIN`
  - `NEW_DEVICE_LOGIN`
  - `CHANGE_PASSWORD`
  - `CHANGE_CONTACT`

### 4.3 Runtime Selection Rule

At runtime, MFA policy resolution must select one policy surface by account scope:

- `scopeLevel = SYSTEM` -> load platform MFA policy
- `scopeLevel = TENANT` -> load tenant MFA policy

### 4.4 Trusted Device Truth

Trusted-device records are no longer tenant-only.

They must support both:

- tenant-scoped trust for tenant accounts
- platform-scoped trust for system accounts

The trust scope is represented by:

- `scopeLevel`
- `scopeKey`
- optional `tenantId`

Rules:

- tenant trust uses `scopeLevel = TENANT`, `scopeKey = tenantId`
- platform trust uses `scopeLevel = SYSTEM`, `scopeKey = __SYSTEM__`
- unique identity is `user + scopeKey + deviceId`

### 4.5 UI Placement

Platform MFA configuration is exposed as a dedicated system-admin page under platform governance, separate from tenant settings.

## 5. Implementation Shape

### 5.1 Auth-Service

- add platform MFA policy persistence truth
- add platform MFA read/write commands and queries
- update login orchestration to resolve platform policy for `SYSTEM`
- update step-up enforcement to resolve the correct policy by scope
- update trusted-device service and repository to support system scope

### 5.2 Auth-BFF

- add platform MFA policy endpoints
- keep tenant and platform endpoints separate
- propagate `scopeLevel` into trusted-device self-service and step-up flows

### 5.3 Tenant-Web

- add `平台 MFA 配置` page for system administrators
- keep `租户 MFA 配置` page for tenant administrators
- reuse the same visual language and factor/scenario presentation model

## 6. Contract Impact

The following contract surfaces must be updated:

- `auth-service` proto:
  - `GetPlatformMfaPolicy`
  - `UpdatePlatformMfaPolicy`
  - scope-aware trusted-device requests
  - scope-aware step-up and self-service sensitive-operation requests
- BFF admin-security HTTP contract:
  - platform MFA policy endpoints and view models

## 7. Why This Is The Formal Fix

This is not a temporary patch because it fixes the actual missing boundary:

- platform accounts get their own authoritative MFA truth
- runtime selection no longer ignores `SYSTEM` scope
- new-device MFA works for system accounts instead of being configurable-but-dead
- tenant and platform policies stay structurally aligned but operationally isolated
