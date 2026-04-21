# Account Management Phase 2 Design

## 1. Goal

Extend `账号管理` from a read-only account directory plus role assignment tool into the next usable administrator workflow:

- fix the list presentation so tenant information is shown only when it is meaningful
- add account enable / disable operations
- add account creation
- add invitation notification after account creation
- add first-login OTP verification plus mandatory password setup

This slice keeps `账号管理` focused on account governance. It does not absorb tenant governance or full identity lifecycle administration.

## 2. Scope

### In Scope

- account list presentation refinement
- account enable / disable
- account creation for `USER` accounts
- optional initial role assignment at create time
- invitation notification after account creation
- first-login OTP verification
- mandatory password setup on first successful login
- system-scope and tenant-scope behavior differences in the same page model

### Out of Scope

- account deletion
- tenant creation / deletion
- password reset after activation
- invitation resend
- service account creation
- full account detail workspace
- batch operations

## 3. Product Decisions Frozen In This Design

### 3.1 List Presentation

- The primary identity column must no longer concatenate tenant information.
- For tenant-bound operators, the tenant column is hidden because the page is already scoped to the current tenant.
- For system-scope operators, tenant information appears as its own dedicated column.
- The UI must not hardcode role codes to decide this behavior.
- The UI should decide visibility from authenticated session context truth:
  - `scopeLevel === 'SYSTEM'` -> show tenant column
  - `scopeLevel === 'TENANT'` -> hide tenant column

### 3.2 Account Status Operations

- Add `停用账号` and `启用账号`.
- The action is a reversible status transition, not a delete surrogate.
- Disabled accounts must not be allowed to establish new authenticated sessions.
- Existing historical records remain auditable.

### 3.3 Account Creation

- This phase creates `USER` accounts only.
- Tenant administrators may create only tenant accounts for the current tenant.
- System administrators may create:
  - tenant accounts for a selected tenant
  - system accounts without tenant binding
- Create flow may optionally assign initial roles in the same transaction boundary from the page point of view.
- Create flow must also trigger an invitation notification.

### 3.4 Invitation Delivery

- Account creation must send an invitation notification.
- Delivery priority is:
  - `phone` first
  - fallback to `email` when `phone` is absent
- Notification content must not include any plaintext password.
- Notification content should instruct the user to sign in with OTP and complete password setup on first login.

### 3.5 First Login

- First login verification uses OTP:
  - `phone OTP` when `phone` exists
  - `email OTP` when `phone` is absent and `email` exists
- OTP verification is the first identity-proof step for newly created users.
- After OTP succeeds, the user must not enter the normal workspace directly if no password credential exists yet.
- The system must force the user into password setup before the account becomes fully activated for normal use.

### 3.6 No Delete In This Slice

- `删除账号` is explicitly excluded.
- The product reason is not “soft delete later”; it is that this slice only freezes directory and status lifecycle, not terminal disposal semantics.

## 4. Recommended Architecture

### Approach A: Formal Cross-Service Admin Account Lifecycle Slice (Recommended)

Add explicit write contracts for account administration:

- `identity-service` owns identity and account writes
- `auth-service` owns login bootstrap, first-login gating, and password setup
- `notification-service` owns invitation dispatch
- `auth-bff` exposes a thin admin-facing HTTP contract
- `tenant-web` consumes the BFF contract only

Why this is recommended:

- it matches current service ownership
- it keeps tenant isolation and operator audit in the write path
- it avoids pushing account lifecycle logic into the page or gateway

### Approach B: Patch Existing Profile Update Capability

Reuse `UpdateAccountProfile` and bolt on status or creation logic around it.

Why not recommended:

- profile edit and account lifecycle are different responsibilities
- creation cannot be honestly modeled as profile update
- it would produce a misleading contract boundary

### Approach C: Let Permission Or Role Services Drive Account Writes

Put status or create behavior near account-role management because the UI entry already exists there.

Why not recommended:

- account truth does not belong to permission-service
- role binding is attached data, not identity/account master data

## 5. High-Level Design

### 5.1 Frontend

`账号管理` remains the single entry.

The list page becomes:

- filters
- paginated table
- row actions

Row actions:

- `角色配置`
- `停用账号` when enabled
- `启用账号` when disabled

Top-level action:

- `添加账号`

Presentation rules:

- identity column shows account display name and stable account id only
- tenant column is rendered only for system scope
- tenant administrators still see tenant-scoped data only; the hidden column is a presentation choice, not a security mechanism

### 5.2 BFF

Add admin account-management HTTP endpoints under `auth-bff`.

Recommended endpoints:

- `POST /auth/admin/accounts`
- `PATCH /auth/admin/accounts/:accountId/enabled`

Existing endpoint retained:

- `GET /auth/admin/accounts`

The BFF remains thin:

- validates request DTOs
- propagates operator-scoped metadata
- maps downstream responses into page-friendly view models

### 5.3 Identity And Auth Responsibilities

#### identity-service

Owns:

- create user identity
- create account row
- set account enabled status
- query account directory

#### auth-service

Owns:

- first-login OTP path integration
- password credential creation for first-login completion
- downstream state that indicates password setup is still required
- downstream login behavior that rejects disabled accounts

#### notification-service

Owns:

- SMS or email invitation dispatch
- provider selection and idempotent delivery recording

This slice should not fake account creation by only inserting identity rows while ignoring login and invitation semantics.

## 6. Contract Proposal

### 6.1 identity-service gRPC

Add to `IdentityManagementService`:

- `CreateUserAccount(CreateUserAccountRequest) returns (GetAccountByIdResponse)`
- `SetAccountEnabled(SetAccountEnabledRequest) returns (GetAccountByIdResponse)`

Recommended request shape:

#### `CreateUserAccountRequest`

- `scope_level`
- `tenant_id`
- `display_name`
- `username` optional
- `email` optional
- `phone` optional

Validation rules:

- at least one of `email` or `phone` must be present
- tenant account requires `tenant_id`
- system account must not carry `tenant_id`
- tenant-bound operator cannot request system scope

#### `SetAccountEnabledRequest`

- `account_id`
- `is_enabled`

### 6.2 auth-bff HTTP

Add:

- `POST /auth/admin/accounts`
- `PATCH /auth/admin/accounts/:accountId/enabled`
- `POST /auth/first-login/password`

List endpoint stays:

- `GET /auth/admin/accounts`

Recommended HTTP create payload:

- `scopeLevel`
- `tenantId`
- `displayName`
- `email`
- `phone`
- `username`
- `initialRoleIds[]`

Recommended status payload:

- `isEnabled`

### 6.3 auth-service gRPC

Add:

- `BootstrapUserLoginMethods(BootstrapUserLoginMethodsRequest) returns (BootstrapUserLoginMethodsResponse)`
- `CompleteFirstLoginPasswordSetup(CompleteFirstLoginPasswordSetupRequest) returns (CompleteFirstLoginPasswordSetupResponse)`

Recommended responsibilities:

- create or enable `EMAIL` / `PHONE` login methods for the created user
- do not create a plaintext initial password
- detect when the authenticated user still lacks a usable password credential
- accept one authenticated first-login password setup command and remove the setup requirement

### 6.4 notification-service gRPC

Use existing notification dispatch channels:

- `SendSms` for phone-priority invitations
- `SendEmail` for email fallback invitations

Recommended template semantics:

- invitation message
- login identifier hint
- instruction to use OTP login
- instruction that first login requires password setup

## 7. First-Login Assumption

This design no longer assumes admin-supplied initial passwords as the default activation path.

The frozen first-login model is:

- create account with `phone` or `email`
- send invitation notification with phone priority
- user signs in with OTP
- if no password credential exists yet, the session is marked `password setup required`
- user must complete password setup before entering the normal workspace

Why this is acceptable:

- it avoids distributing initial passwords
- it uses the existing OTP-capable authentication model
- it keeps first identity proof tied to possession of the configured phone or email
- it makes later password login available without weakening the invitation path

## 8. Authorization And Isolation

### 8.1 Tenant Isolation

- tenant-bound operator reads and writes must always resolve to current tenant scope
- tenant filtering is enforced in backend query / command scope, never by frontend-only filtering
- system-scope operators may see or create cross-tenant data

### 8.2 UI Conditional Rendering

The tenant column is hidden or shown from authenticated session context:

- source of truth: `session/context.scopeLevel`
- not from role code strings
- not from visible entry names

This keeps presentation coupled to resolved runtime scope, not to frontend role assumptions.

## 9. Login UX Consequence

- Account creation success in admin UI means “account created and invitation dispatched”, not merely “row inserted”.
- The end-user login page does not need a separate invite-only entry.
- Existing login entry should remain the single entry point:
  - phone users request OTP first
  - email users request OTP when phone is absent
- After account selection / login completion, the auth response must be able to tell tenant-web that password setup is still required.
- Tenant-web must redirect such users to a dedicated first-login password setup screen instead of the normal post-login home route.

### 8.3 Permissions

Recommended permission split:

- create account
- update account status
- view account directory
- manage account roles

If the current permission taxonomy does not yet expose dedicated account lifecycle codes, this slice should add them rather than overloading unrelated codes.

## 9. UX Notes

### 9.1 Create Modal

Fields for tenant admin:

- display name
- email
- phone
- username optional
- initial password optional
- initial roles optional

Fields for system admin:

- scope
- tenant selector when `TENANT`
- display name
- email
- phone
- username optional
- initial password optional
- initial roles optional

### 9.2 Status Action

- action should live in row action menu, not as a standalone button column explosion
- enabling / disabling should confirm before mutation
- after success, the table refreshes in place

## 10. Error Handling

- duplicate email / phone / username must surface as stable validation errors
- tenant-bound operator creating outside current tenant must be rejected as authorization failure
- disabling the current operator’s own active account should be rejected in this slice
- backend remains source of truth for all scope and state validation

## 11. Testing Strategy

### Frontend

- tenant scope hides tenant column
- system scope shows tenant column
- enable / disable action refreshes the row state
- create modal renders the correct tenant selector behavior by scope

### BFF

- create endpoint propagates operator metadata and request payload correctly
- set-enabled endpoint propagates operator metadata and request payload correctly
- tenant-bound source cannot escalate scope

### identity-service

- tenant-bound create is restricted to current tenant
- system create supports tenant and system account modes
- set-enabled respects operator scope
- list query still enforces tenant isolation

### auth-service

- disabled accounts are rejected on login
- credential bootstrap path behaves correctly for password vs OTP-ready creation

## 12. Implementation Sequence

1. freeze new account lifecycle contracts
2. add backend tests first
3. implement identity-service writes
4. implement auth-bff admin endpoints
5. wire tenant-web page changes
6. verify tenant isolation, status semantics, and UI behavior

## 13. Risks

- creation crosses identity and auth concerns; contract boundaries must remain explicit
- existing local data may contain accounts without clean login identifiers, so migration and validation behavior must be defensive
- if dedicated permission codes are postponed, lifecycle operations may end up reusing overly broad permissions

## 14. Recommendation

Proceed with this as `account-management phase 2`, but keep it explicitly scoped to:

- view-model correction
- enable / disable
- create

Do not re-expand this slice to deletion, tenant governance, or full lifecycle tooling.
