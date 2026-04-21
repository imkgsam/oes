# Account Management Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `账号管理` into a usable admin lifecycle workspace with conditional tenant presentation, account creation, invitation dispatch, first-login OTP verification, mandatory password setup, and account enable/disable operations.

**Architecture:** Keep account truth in `identity-service`, login bootstrap and first-login gating in `auth-service`, invitation dispatch in `notification-service`, orchestration in `auth-bff`, and UI behavior in `tenant-web`. Avoid frontend role hardcode by rendering tenant information from authenticated runtime scope and avoid patching existing role APIs into account-lifecycle ownership.

**Tech Stack:** Vue 3, Ant Design Vue, Vitest, NestJS, gRPC/proto contracts, Prisma, Jest, permission-service seed sync.

---

### Task 1: Freeze Contracts, Permissions, And Feature Truth

**Files:**
- Modify: `src/common/src/contracts/identity_service/identity_query.proto`
- Modify: `src/common/src/contracts/auth_service/auth.proto`
- Modify: `src/common/src/authorization/permission-codes/identity/account.permission-codes.ts`
- Modify: `src/common/src/authorization/permission-codes/auth/auth-management.permission-codes.ts`
- Modify: `src/services/system/permission-service/src/scripts/role-foundation.ts`
- Modify: `src/services/system/permission-service/src/scripts/sync-permission-codes.ts`
- Modify: `src/services/system/permission-service/test/l1/role-foundation.seed.spec.ts`
- Modify: `docs/plans/features/account-management.md`
- Modify: `docs/contracts/api-gateway/auth-bff-admin-security.md`
- Modify: `docs/contracts/identity-service/query.md`
- Create: `docs/contracts/auth-service/account-bootstrap.md`
- Create: `docs/contracts/auth-service/first-login-password-setup.md`

- [ ] **Step 1: Add the new lifecycle contracts and permission codes to tests/docs first**

```proto
service IdentityManagementService {
  rpc CreateUserAccount(CreateUserAccountRequest) returns (GetAccountByIdResponse);
  rpc SetAccountEnabled(SetAccountEnabledRequest) returns (GetAccountByIdResponse);
}

service AuthService {
  rpc BootstrapUserLoginMethods(BootstrapUserLoginMethodsRequest) returns (BootstrapUserLoginMethodsResponse);
  rpc CompleteFirstLoginPasswordSetup(CompleteFirstLoginPasswordSetupRequest) returns (CompleteFirstLoginPasswordSetupResponse);
}
```

```ts
export const IDENTITY_ACCOUNT_PERMISSION_CODES = {
  LIST_ACCOUNT: 'identity.account.list',
  CREATE_ACCOUNT: 'identity.account.create',
  UPDATE_ACCOUNT_STATUS: 'identity.account.update_status',
  UPDATE_ACCOUNT_PROFILE: 'identity.account.profile.update',
};

export const AUTH_MANAGEMENT_PERMISSION_CODES = {
  VIEW_AUDIT_EVENT: 'auth.audit.list',
  BOOTSTRAP_ACCOUNT_CREDENTIALS: 'auth.account_credentials.bootstrap',
};
```

- [ ] **Step 2: Update built-in role baselines**

```ts
permissionCodes: [
  IDENTITY_ACCOUNT_PERMISSION_CODES.LIST_ACCOUNT,
  IDENTITY_ACCOUNT_PERMISSION_CODES.CREATE_ACCOUNT,
  IDENTITY_ACCOUNT_PERMISSION_CODES.UPDATE_ACCOUNT_STATUS,
  PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_ACCOUNT_ROLE,
  PERMISSION_MANAGEMENT_PERMISSION_CODES.SET_ACCOUNT_ROLES,
]
```

- [ ] **Step 3: Re-run seed-facing unit tests before implementation**

Run:
```bash
pnpm --dir src/services/system/permission-service exec jest --config jest.config.js test/l1/role-foundation.seed.spec.ts --runInBand
```

Expected: permission baseline assertions fail until the new codes and seed wiring are implemented.

### Task 2: Implement Identity-Service Account Creation And Enable/Disable

**Files:**
- Modify: `src/services/system/identity-service/src/domain/repositories/account.repository.ts`
- Modify: `src/services/system/identity-service/src/domain/repositories/user.repository.ts`
- Modify: `src/services/system/identity-service/src/infrastructure/repositories/prisma/prisma.account.repository.ts`
- Modify: `src/services/system/identity-service/src/infrastructure/repositories/prisma/prisma.user.repository.ts`
- Modify: `src/services/system/identity-service/src/application/commands/account/index.ts`
- Create: `src/services/system/identity-service/src/application/commands/account/create-user-account.command.ts`
- Create: `src/services/system/identity-service/src/application/commands/account/create-user-account.handler.ts`
- Create: `src/services/system/identity-service/src/application/commands/account/set-account-enabled.command.ts`
- Create: `src/services/system/identity-service/src/application/commands/account/set-account-enabled.handler.ts`
- Modify: `src/services/system/identity-service/src/interfaces/grpc/identity-management.grpc.controller.ts`
- Modify: `src/services/system/identity-service/src/modules/identity-management/identity-management.module.ts`
- Modify: `src/services/system/identity-service/src/interfaces/grpc/identity-grpc.presenter.ts`
- Test: `src/services/system/identity-service/test/l1/create-user-account.handler.spec.ts`
- Test: `src/services/system/identity-service/test/l1/set-account-enabled.handler.spec.ts`
- Test: `src/services/system/identity-service/test/l1/list-accounts.handler.spec.ts`

- [ ] **Step 1: Write failing tests for tenant-safe create and enable/disable**

```ts
it('creates a tenant account only inside the operator tenant scope', async () => {
  await expect(handler.execute(new CreateUserAccountCommand({
    scopeLevel: 'TENANT',
    tenantId: 'tenant-a',
    displayName: 'Janny',
    email: 'janny@example.com',
    operatorId: 'operator-1',
    operatorScope: { scopeLevel: 'TENANT', tenantId: 'tenant-a' },
  }))).resolves.toMatchObject({
    tenantId: 'tenant-a',
    scopeLevel: 'TENANT',
    isEnabled: true,
  })
})

it('disables an existing account and preserves tenant boundary checks', async () => {
  await expect(handler.execute(new SetAccountEnabledCommand('account-1', false, 'operator-1', {
    scopeLevel: 'TENANT',
    tenantId: 'tenant-a',
  }))).resolves.toMatchObject({ id: 'account-1', isEnabled: false })
})
```

- [ ] **Step 2: Extend repository interfaces with explicit lifecycle methods**

```ts
createUserAccount(input: {
  scopeLevel: 'SYSTEM' | 'TENANT'
  tenantId?: string
  userId: string
  displayName?: string | null
}): Promise<AccountSummaryEntity>

setEnabled(accountId: string, isEnabled: boolean): Promise<AccountSummaryEntity>

create(input: {
  username?: string | null
  email?: string | null
  phone?: string | null
  isActive?: boolean
}): Promise<UserSummaryEntity>
```

- [ ] **Step 3: Implement the command handlers with real validation**

```ts
// create-user-account.handler.ts
// Creates a new human user plus one scoped account while enforcing operator tenant boundaries.

// set-account-enabled.handler.ts
// Toggles one account's enabled state after validating resource scope ownership.
```

Required behavior:
- require at least one of `email` or `phone`
- tenant scope requires `tenantId`
- system scope must not persist `tenantId`
- tenant-bound operators cannot request `SYSTEM`
- reject duplicate `email` / `phone` / `username`
- create `contextKey` as `'SYSTEM'` for system accounts and `tenantId` for tenant accounts
- preserve audit metadata through the gRPC controller

- [ ] **Step 4: Expose guarded gRPC methods**

```ts
@RequirePermission(IDENTITY_ACCOUNT_PERMISSION_CODES.CREATE_ACCOUNT)
async createUserAccount(request: CreateUserAccountRequest): Promise<GetAccountByIdResponse>

@RequirePermission(IDENTITY_ACCOUNT_PERMISSION_CODES.UPDATE_ACCOUNT_STATUS)
async setAccountEnabled(request: SetAccountEnabledRequest): Promise<GetAccountByIdResponse>
```

- [ ] **Step 5: Run focused identity-service tests**

Run:
```bash
pnpm --dir src/services/system/identity-service exec jest --config jest.config.js test/l1/create-user-account.handler.spec.ts test/l1/set-account-enabled.handler.spec.ts test/l1/list-accounts.handler.spec.ts --runInBand
```

Expected: PASS after implementation, including tenant-scope isolation and enabled-state persistence.

### Task 3: Implement Auth-Service Login Bootstrap And First-Login Password Setup

**Files:**
- Modify: `src/common/src/contracts/auth_service/auth.proto`
- Modify: `src/common/src/generated/auth_service/auth.ts`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/index.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/bootstrap-user-login-methods.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/bootstrap-user-login-methods.handler.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/complete-first-login-password-setup.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/complete-first-login-password-setup.handler.ts`
- Modify: `src/services/system/auth-service/src/modules/auth/auth.module.ts`
- Modify: `src/services/system/auth-service/src/domain/repositories/loginmethod.repository.ts`
- Modify: `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.loginmethod.repository.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/bootstrap-user-login-methods.handler.spec.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/complete-first-login-password-setup.handler.spec.ts`
- Test: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts`

- [ ] **Step 1: Write failing tests for bootstrap semantics**

```ts
it('creates verified phone-first login methods without issuing a plaintext password', async () => {
  const result = await handler.execute(new BootstrapUserLoginMethodsCommand({
    userId: 'user-1',
    phone: '13800138000',
    email: 'janny@example.com',
  }))

  expect(result).toEqual({
    phoneBootstrapped: true,
    emailBootstrapped: true,
    passwordBootstrapped: false,
  })
})
```

- [ ] **Step 2: Add a save/upsert path for login methods and password credentials**

```ts
export interface BootstrapUserLoginMethodsResult {
  emailBootstrapped: boolean
  phoneBootstrapped: boolean
  passwordBootstrapped: boolean
}
```

Required behavior:
- if `phone` exists, create or update a `PHONE` login method with `verified=true` and `enabled=true`
- if `email` exists, create or update an `EMAIL` login method with `verified=true` and `enabled=true`
- do not create an initial plaintext password
- newly invited users without password credentials must be detectable as `password setup required`

- [ ] **Step 3: Write failing tests for first-login password completion**

```ts
it('creates the first enabled password credential for an authenticated invited user', async () => {
  const result = await handler.execute(new CompleteFirstLoginPasswordSetupCommand({
    userId: 'user-1',
    newPassword: 'TempPass123!',
  }))

  expect(result).toEqual({ completed: true })
})
```

- [ ] **Step 4: Expose the bootstrap and first-login RPCs**

```ts
@RequirePermission(AUTH_MANAGEMENT_PERMISSION_CODES.BOOTSTRAP_ACCOUNT_CREDENTIALS)
async bootstrapUserLoginMethods(
  request: BootstrapUserLoginMethodsRequest
): Promise<BootstrapUserLoginMethodsResponse>

@UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
async completeFirstLoginPasswordSetup(
  request: CompleteFirstLoginPasswordSetupRequest
): Promise<CompleteFirstLoginPasswordSetupResponse>
```

- [ ] **Step 5: Extend login/account-selection responses with password-setup gating**

```proto
message LoginResponse {
  ...
  bool password_setup_required = 9;
}

message SelectAccountResponse {
  ...
  string next_step = 10;
  string scope_level = 11;
  bool password_setup_required = 12;
}
```

Required behavior:
- OTP login succeeds as normal identity verification
- if the chosen user still lacks a usable password credential, the auth response marks `password_setup_required=true`
- `next_step` should resolve to a stable value such as `SET_PASSWORD_REQUIRED`
- disabled accounts remain blocked before this stage

- [ ] **Step 6: Run focused auth-service tests**

Run:
```bash
pnpm --dir src/services/system/auth-service exec jest src/application/commands/auth/bootstrap-user-login-methods.handler.spec.ts src/application/commands/auth/complete-first-login-password-setup.handler.spec.ts src/interfaces/grpc/auth.grpc.controller.spec.ts --runInBand
```

Expected: PASS with phone/email bootstrap, first-login password creation, and password-setup-required auth responses.

### Task 4: Implement Invitation Dispatch

**Files:**
- Modify: `src/common/src/contracts/notification_service/notification.proto`
- Modify: `src/common/src/generated/notification_service/notification.ts`
- Modify: `src/services/system/auth-service/src/domain/services/notification-dispatch.port.ts`
- Modify: `src/services/system/auth-service/src/infrastructure/adaptors/notification-service.grpc.adaptor.ts`
- Modify: `src/services/system/auth-service/src/infrastructure/adaptors/local-notification-dispatch.adaptor.ts`
- Create: `src/services/system/auth-service/src/application/services/account-invitation.service.ts`
- Test: `src/services/system/auth-service/src/application/services/account-invitation.service.spec.ts`
- Create: `docs/contracts/notification-service/account-invitation.md`

- [ ] **Step 1: Write failing tests for phone-priority invite dispatch**

```ts
it('sends SMS when phone is present and falls back to email otherwise', async () => {
  await service.sendInvitation({
    userId: 'user-1',
    phone: '13800138000',
    email: 'janny@example.com',
  })

  expect(notificationPort.sendSms).toHaveBeenCalled()
  expect(notificationPort.sendEmail).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Implement one invitation service with explicit channel priority**

Required behavior:
- prefer `phone`
- fallback to `email`
- include no plaintext password
- message content instructs OTP login and mandatory password setup
- use idempotency keys tied to account creation

- [ ] **Step 3: Run invitation-focused tests**

Run:
```bash
pnpm --dir src/services/system/auth-service exec jest src/application/services/account-invitation.service.spec.ts --runInBand
```

Expected: PASS with SMS-first routing and email fallback.

### Task 5: Expose Account Lifecycle Through Auth-BFF

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/permission-service/permission-management-grpc.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-security.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-security.use-case.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/auth-response.view-model.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/first-login-password.dto.ts`

- [ ] **Step 1: Add request DTOs and response view-models**

```ts
export class CreateAdminAccountDto {
  scopeLevel!: 'SYSTEM' | 'TENANT'
  tenantId?: string
  displayName!: string
  email?: string
  phone?: string
  username?: string
  initialRoleIds?: string[]
}

export class SetAdminAccountEnabledDto {
  isEnabled!: boolean
}

export class FirstLoginPasswordSetupDto {
  newPassword!: string
  confirmPassword!: string
}
```

- [ ] **Step 2: Implement the BFF orchestration flow**

```ts
async createAccount(dto: CreateAdminAccountDto, source: DownstreamRequestSource) {
  const account = await this.identityAdapter.createUserAccount(...)
  await this.authAdapter.bootstrapUserLoginMethods(...)
  await this.authAdapter.sendAccountInvitation(...)
  if ((dto.initialRoleIds ?? []).length > 0) {
    await this.permissionAdapter.setAccountRoles(...)
  }
  return mapAccount(account)
}
```

Required behavior:
- tenant operators cannot override `tenantId` or request `SYSTEM`
- system operators may omit `tenantId` only when `scopeLevel === 'SYSTEM'`
- empty `initialRoleIds` skips role assignment
- account directory listing moves off `permission.account.get_roles` and onto the new account-list permission
- enable/disable endpoint is guarded separately from role assignment
- create-account success means invitation dispatch succeeded
- expose one authenticated endpoint to complete first-login password setup

- [ ] **Step 3: Add controller endpoints**

```ts
@Get('admin/accounts')
@PermissionCheckAll([IDENTITY_ACCOUNT_PERMISSION_CODES.LIST_ACCOUNT])

@Post('admin/accounts')
@PermissionCheckAll([IDENTITY_ACCOUNT_PERMISSION_CODES.CREATE_ACCOUNT])

@Patch('admin/accounts/:accountId/enabled')
@PermissionCheckAll([IDENTITY_ACCOUNT_PERMISSION_CODES.UPDATE_ACCOUNT_STATUS])

@Post('first-login/password')
async completeFirstLoginPasswordSetup(
  @Body() dto: FirstLoginPasswordSetupDto,
  @DownstreamSource() source: DownstreamRequestSource,
)
```

- [ ] **Step 4: Run focused auth-bff tests**

Run:
```bash
pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/admin-security.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand
```

Expected: PASS for list/create/enable-disable permissions, tenant coercion, and role-assignment orchestration.

### Task 6: Upgrade Tenant-Web Account Management UI

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/bff/admin-security/index.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/account-management.helpers.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/account-management.helpers.spec.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/account-management.vue`
- Modify: `app/web/apps/tenant-web/src/views/admin/account-management.spec.ts`
- Reuse: `app/web/apps/tenant-web/src/api/bff/role-management/index.ts`

- [ ] **Step 1: Extend the admin-security API client**

```ts
export async function createAdminAccountApi(data: AdminSecurityApi.CreateAccountPayload)
export async function setAdminAccountEnabledApi(accountId: string, data: { isEnabled: boolean })
```

- [ ] **Step 2: Add helper coverage before changing the page**

```ts
expect(buildAccountRows([...], { showTenantColumn: false })[0].tenantLabel).toBeUndefined()
expect(getAccountActionItems({ isEnabled: true })).toContainEqual({ key: 'disable', label: '停用账号' })
expect(getAccountActionItems({ isEnabled: false })).toContainEqual({ key: 'enable', label: '启用账号' })
```

- [ ] **Step 3: Refactor the page to match the navigation-management shell**

```ts
const showTenantColumn = computed(() => authContextStore.isPlatformScope)
const canCreateAccounts = computed(() =>
  authContextStore.actionCodes.includes('identity.account.create'),
)
const canToggleAccountStatus = computed(() =>
  authContextStore.actionCodes.includes('identity.account.update_status'),
)
```

Required UI behavior:
- main identity column shows only display name + account id
- tenant column renders only for system scope
- row actions move into dropdown menu: `角色配置`, `停用账号` / `启用账号`
- top-level primary action: `添加账号`
- create account uses a modal, not a drawer
- system scope shows `scopeLevel` selector and tenant selector
- tenant scope locks `scopeLevel='TENANT'` and current tenant silently
- create form requires `phone` or `email`, and must explain neither via visible helper copy nor long instructions
- creation success refreshes page 1, closes modal, and reflects “邀请已发送”
- enable/disable success refreshes the current page

- [ ] **Step 4: Reuse the existing tenant option source**

```ts
const tenantOptions = await listRoleTenantOptionsApi({ keyword, pageSize: 20 })
```

Reason: this avoids inventing a second tenant-selector contract in the same admin slice.

- [ ] **Step 5: Run focused tenant-web tests**

Run:
```bash
pnpm --dir app/web exec vitest run apps/tenant-web/src/views/admin/account-management.helpers.spec.ts apps/tenant-web/src/views/admin/account-management.spec.ts --dom
```

Expected: PASS for tenant-column visibility, create modal flow, and enable/disable refresh behavior.

### Task 7: Add Tenant-Web First-Login Password Setup Flow

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/bff/auth/index.ts`
- Modify: `app/web/apps/tenant-web/src/api/core/auth.ts`
- Modify: `app/web/apps/tenant-web/src/store/auth.ts`
- Modify: `app/web/apps/tenant-web/src/router/guard.ts`
- Create: `app/web/apps/tenant-web/src/views/_core/authentication/first-login-password-setup.vue`
- Test: `app/web/apps/tenant-web/src/router/access.spec.ts`
- Test: `app/web/apps/tenant-web/src/views/_core/authentication/first-login-password-setup.spec.ts`

- [ ] **Step 1: Write failing UI tests for password-setup-required redirect**

```ts
it('redirects authenticated users with passwordSetupRequired to first-login password setup', async () => {
  expect(resolveHomeRoute({ passwordSetupRequired: true })).toBe('/auth/first-login-password')
})
```

- [ ] **Step 2: Implement the dedicated first-login password screen**

Required behavior:
- collect new password + confirm password
- call `POST /auth/first-login/password`
- on success, clear the password-setup-required gate and continue to the normal home route
- keep the user out of the main workspace until this completes

- [ ] **Step 3: Run first-login UI tests**

Run:
```bash
pnpm --dir app/web exec vitest run apps/tenant-web/src/router/access.spec.ts apps/tenant-web/src/views/_core/authentication/first-login-password-setup.spec.ts --dom
```

Expected: PASS with redirect gating and password setup completion.

### Task 8: Integrate, Document, And Sync Data

**Files:**
- Modify: `docs/plans/features/account-management.md`
- Modify: `docs/contracts/api-gateway/auth-bff-admin-security.md`
- Modify: `docs/contracts/identity-service/query.md`
- Create: `docs/contracts/auth-service/account-bootstrap.md`
- Create: `docs/contracts/auth-service/first-login-password-setup.md`
- Create: `docs/contracts/notification-service/account-invitation.md`

- [ ] **Step 1: Update the feature packet close-out**

```md
- 当前 slice 已包含：账号创建、账号启用/停用、邀请通知、首登 OTP + 强制设密码、租户列按 scope 条件展示。
- 当前 slice 仍不包含：删除账号、租户治理、服务账号目录。
```

- [ ] **Step 2: Regenerate generated contract bindings**

Run:
```bash
pnpm proto:gen
```

Expected: updated generated TypeScript bindings under `src/common/src/generated/**`.

- [ ] **Step 3: Sync permission and role baselines into the local database**

Run:
```bash
pnpm --filter permission-service permission-codes:sync
```

Expected: built-in template and built-in role-instance backfill include the new account lifecycle permissions.

### Task 9: Full Verification

**Files:**
- No new files; verification only

- [ ] **Step 1: Run backend test suites touched by this slice**

Run:
```bash
pnpm --dir src/services/system/identity-service exec jest --config jest.config.js test/l1/create-user-account.handler.spec.ts test/l1/set-account-enabled.handler.spec.ts test/l1/list-accounts.handler.spec.ts --runInBand
pnpm --dir src/services/system/auth-service exec jest src/application/commands/auth/bootstrap-user-login-methods.handler.spec.ts src/application/commands/auth/complete-first-login-password-setup.handler.spec.ts src/application/services/account-invitation.service.spec.ts src/interfaces/grpc/auth.grpc.controller.spec.ts --runInBand
pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/admin-security.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand
pnpm --dir src/services/system/permission-service exec jest --config jest.config.js test/l1/role-foundation.seed.spec.ts --runInBand
```

Expected: PASS.

- [ ] **Step 2: Run frontend verification**

Run:
```bash
pnpm --dir app/web exec vitest run apps/tenant-web/src/views/admin/account-management.helpers.spec.ts apps/tenant-web/src/views/admin/account-management.spec.ts --dom
pnpm --dir app/web exec vitest run apps/tenant-web/src/router/access.spec.ts apps/tenant-web/src/views/_core/authentication/first-login-password-setup.spec.ts --dom
pnpm --dir app/web --filter @oes/tenant-web typecheck
pnpm --dir app/web --filter @oes/tenant-web build
```

Expected: PASS.

- [ ] **Step 3: Run service builds and diff hygiene**

Run:
```bash
pnpm --dir src/services/system/identity-service build
pnpm --dir src/services/system/auth-service build
pnpm --dir src/services/api-gateway build
git diff --check
```

Expected: PASS with no malformed diffs.

- [ ] **Step 4: Manual smoke checklist**

Verify in the browser:
- system admin sees tenant column and can create both system and tenant accounts
- tenant admin does not see tenant column and can create only current-tenant accounts
- disabling an account removes it from auth-service account selection for new sessions
- enabling restores it
- account creation dispatches SMS when `phone` exists and email only when `phone` is absent
- invited user can log in with OTP and is forced to set a password before entering the workspace
- account creation with initial roles shows the new roles in `角色配置`
