# Account Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver administrator-facing hard deletion for one `account`, with deletion-impact precheck, self-delete protection, cross-service cleanup, and account-management UI confirmation flow.

**Architecture:** Keep account truth and deletion-impact truth in `identity-service`, orchestrate the delete flow in `auth-bff`, reuse `auth-service` session cleanup and `permission-service` role clearing, and expose the final experience in `tenant-web`. The flow must delete only `account`, retain `user`, auto-clean system-owned relations, and block when business-owned blockers exist.

**Tech Stack:** Vue 3, Ant Design Vue, Vitest, NestJS, Jest, Prisma, gRPC/proto contracts, permission-service seed scripts.

---

### Task 1: Freeze Contracts And Permission Truth

**Files:**
- Modify: `src/common/src/contracts/identity_service/identity_query.proto`
- Modify: `src/common/src/authorization/permission-codes/identity/account.permission-codes.ts`
- Modify: `src/services/system/permission-service/src/scripts/sync-permission-codes.ts`
- Modify: `src/services/system/permission-service/src/scripts/role-foundation.ts`
- Test: `src/services/system/permission-service/test/l1/permission-foundation.seed.spec.ts`
- Test: `src/services/system/permission-service/test/l1/role-foundation.seed.spec.ts`

- [ ] **Step 1: Write the failing permission baseline tests**

```ts
expect(IDENTITY_ACCOUNT_PERMISSION_CODES.DELETE_ACCOUNT).toBe('identity.account.delete')
expect(systemAdminCodes).toContain('identity.account.delete')
expect(tenantAdminCodes).toContain('identity.account.delete')
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
pnpm --filter permission-service exec jest test/l1/permission-foundation.seed.spec.ts test/l1/role-foundation.seed.spec.ts --runInBand
```

Expected: FAIL because `identity.account.delete` is not defined or not assigned to administrator role baselines.

- [ ] **Step 3: Add the new permission code and baseline seed wiring**

```ts
export const IDENTITY_ACCOUNT_PERMISSION_CODES = {
  LIST_ACCOUNT: 'identity.account.list',
  CREATE_ACCOUNT: 'identity.account.create',
  UPDATE_ACCOUNT_STATUS: 'identity.account.update_status',
  UPDATE_ACCOUNT_PROFILE: 'identity.account.profile.update',
  DELETE_ACCOUNT: 'identity.account.delete'
} as const
```

```proto
service IdentityManagementService {
  rpc GetAccountDeletionImpact(GetAccountDeletionImpactRequest) returns (GetAccountDeletionImpactResponse);
  rpc DeleteAccount(DeleteAccountRequest) returns (DeleteAccountResponse);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
pnpm --filter permission-service exec jest test/l1/permission-foundation.seed.spec.ts test/l1/role-foundation.seed.spec.ts --runInBand
```

Expected: PASS with the new account-delete permission available to the built-in administrator roles.

### Task 2: Implement Identity-Service Deletion Impact And Terminal Delete

**Files:**
- Modify: `src/services/system/identity-service/src/domain/repositories/account.repository.ts`
- Modify: `src/services/system/identity-service/src/infrastructure/repositories/prisma/prisma.account.repository.ts`
- Modify: `src/services/system/identity-service/src/application/commands/account/index.ts`
- Create: `src/services/system/identity-service/src/application/queries/account/get-account-deletion-impact.query.ts`
- Create: `src/services/system/identity-service/src/application/queries/account/get-account-deletion-impact.handler.ts`
- Create: `src/services/system/identity-service/src/application/commands/account/delete-account.command.ts`
- Create: `src/services/system/identity-service/src/application/commands/account/delete-account.handler.ts`
- Modify: `src/services/system/identity-service/src/interfaces/grpc/identity-management.grpc.controller.ts`
- Modify: `src/services/system/identity-service/src/interfaces/grpc/identity-grpc.presenter.ts`
- Modify: `src/services/system/identity-service/src/modules/identity-management/identity-management.module.ts`
- Test: `src/services/system/identity-service/test/l1/get-account-deletion-impact.handler.spec.ts`
- Test: `src/services/system/identity-service/test/l1/delete-account.handler.spec.ts`
- Test: `src/services/system/identity-service/test/l1/prisma.account.repository.spec.ts`

- [ ] **Step 1: Write the failing deletion-impact and delete-account tests**

```ts
it('returns cleanup counts and no blockers for a deletable account', async () => {
  await expect(handler.execute(new GetAccountDeletionImpactQuery('account-1', operatorScope)))
    .resolves.toMatchObject({
      accountId: 'account-1',
      canDelete: true,
      userRetained: true,
      cleanupPlan: {
        willDeleteSessions: true,
        willClearRoles: true,
        willDeleteOrgMemberships: true,
        willDeleteContactAssets: true
      },
      blockingReasons: []
    })
})

it('hard deletes only the account and reports cascade counts', async () => {
  await expect(handler.execute(new DeleteAccountCommand('account-1', operatorId, operatorScope)))
    .resolves.toMatchObject({
      accountId: 'account-1',
      deletedOrgMembershipCount: 1,
      deletedContactAssetCount: 2,
      userRetained: true
    })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
pnpm --filter identity-service exec jest test/l1/get-account-deletion-impact.handler.spec.ts test/l1/delete-account.handler.spec.ts test/l1/prisma.account.repository.spec.ts --runInBand
```

Expected: FAIL because the query/command, repository methods, and gRPC exposure do not exist yet.

- [ ] **Step 3: Extend repository truth for deletion impact and deletion**

```ts
getDeletionImpact(accountId: string): Promise<{
  account: AccountSummaryEntity | null
  orgMembershipCount: number
  contactAssetCount: number
  blockingReasons: Array<{
    resourceType: string
    resourceCount: number
    message: string
  }>
}>

delete(accountId: string): Promise<{
  deletedOrgMembershipCount: number
  deletedContactAssetCount: number
}>
```

Required behavior:
- load and scope-check the target account before returning impact or deleting
- count `UserAccountOrgMembership` and `AccountContactAsset`
- return an explicit business-blocker list, even when empty in the first slice
- delete `UserAccount` only and rely on Prisma cascades for account-owned identity relations
- never delete `User`

- [ ] **Step 4: Implement query/command handlers and gRPC controller methods**

```ts
@RequirePermissions({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.DELETE_ACCOUNT] })
async getAccountDeletionImpact(
  request: GetAccountDeletionImpactRequest
): Promise<GetAccountDeletionImpactResponse>

@RequirePermissions({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.DELETE_ACCOUNT] })
async deleteAccount(request: DeleteAccountRequest): Promise<DeleteAccountResponse>
```

- [ ] **Step 5: Run focused identity-service tests**

Run:
```bash
pnpm --filter identity-service exec jest test/l1/get-account-deletion-impact.handler.spec.ts test/l1/delete-account.handler.spec.ts test/l1/prisma.account.repository.spec.ts --runInBand
```

Expected: PASS with tenant-scope enforcement, user retention, and identity cascade counts captured in the response.

### Task 3: Implement Auth-BFF Orchestration And HTTP Surface

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/permission-service/permission.grpc.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-security.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-security.use-case.spec.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`

- [ ] **Step 1: Write the failing BFF orchestration tests**

```ts
it('returns deletion impact for a deletable account', async () => {
  await expect(useCase.getAccountDeletionImpact('account-1', source)).resolves.toMatchObject({
    accountId: 'account-1',
    canDelete: true,
    blockingReasons: []
  })
})

it('rejects deleting the current login account', async () => {
  await expect(useCase.deleteAccount('account-current', currentSource))
    .rejects.toThrow('Current login account cannot be deleted')
})

it('orchestrates session cleanup, role clearing, and identity delete in order', async () => {
  await expect(useCase.deleteAccount('account-1', source)).resolves.toMatchObject({
    accountId: 'account-1',
    success: true,
    deletedSessionCount: 3,
    clearedRoleCount: 2,
    deletedOrgMembershipCount: 1,
    deletedContactAssetCount: 2,
    userRetained: true
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
pnpm --filter api-gateway exec jest src/modules/auth-bff/application/use-cases/admin-security.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand --no-cache
```

Expected: FAIL because the adapters, use-case methods, controller endpoints, and response models do not exist yet.

- [ ] **Step 3: Implement the formal deletion precheck and delete flow**

```ts
async getAccountDeletionImpact(
  accountId: string,
  source: DownstreamRequestSource
): Promise<AdminAccountDeletionImpactViewModel>

async deleteAccount(
  accountId: string,
  source: DownstreamRequestSource
): Promise<AdminAccountDeletionResultViewModel>
```

Required behavior:
- resolve the target account first and return `404` when missing
- forbid deleting `source.accountId`
- stop before cleanup when `blockingReasons.length > 0`
- call auth cleanup before permission cleanup
- clear roles with replacement semantics (`roleIds: []`)
- call identity delete last
- return structured cleanup counts, not just `success: true`

- [ ] **Step 4: Expose HTTP endpoints with delete permission**

```ts
@Get('admin/accounts/:accountId/deletion-impact')
@RequirePermissions({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.DELETE_ACCOUNT] })

@Delete('admin/accounts/:accountId')
@RequirePermissions({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.DELETE_ACCOUNT] })
```

- [ ] **Step 5: Run focused BFF tests**

Run:
```bash
pnpm --filter api-gateway exec jest src/modules/auth-bff/application/use-cases/admin-security.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand --no-cache
```

Expected: PASS with self-delete protection, blocker propagation, and ordered downstream orchestration covered.

### Task 4: Implement Tenant-Web Delete Action And Confirmation Flow

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/bff/admin-security/index.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/account-management.helpers.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/account-management.vue`
- Test: `app/web/apps/tenant-web/src/views/admin/account-management.spec.ts`

- [ ] **Step 1: Write the failing UI tests**

```ts
it('does not render delete for the current login account row', async () => {
  expect(queryRowAction('删除账号', currentAccountRow)).toBeNull()
})

it('shows blocker reasons returned by deletion impact and does not delete', async () => {
  mockGetAdminAccountDeletionImpactApi.mockResolvedValue({
    accountId: 'account-2',
    canDelete: false,
    blockingReasons: [{ resourceType: 'sales_order_owner', resourceCount: 4, message: '账号仍有业务归属' }]
  })

  await openDeleteFlow('account-2')

  expect(screen.getByText('账号仍有业务归属')).toBeInTheDocument()
  expect(mockDeleteAdminAccountApi).not.toHaveBeenCalled()
})

it('confirms delete, calls the delete api, and refreshes the directory', async () => {
  await openDeleteFlow('account-3')
  await confirmDelete()

  expect(mockDeleteAdminAccountApi).toHaveBeenCalledWith('account-3')
  expect(mockListAdminAccountsApi).toHaveBeenCalledTimes(2)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
pnpm --dir app/web/apps/tenant-web exec vitest run src/views/admin/account-management.spec.ts
```

Expected: FAIL because the API client methods and delete confirmation UI do not exist yet.

- [ ] **Step 3: Add the API methods and UI flow**

```ts
export async function getAdminAccountDeletionImpactApi(accountId: string)
export async function deleteAdminAccountApi(accountId: string)
```

Required behavior:
- hide `删除账号` for the current account row
- load deletion impact on click
- show blocker modal when `canDelete` is false
- show irreversible confirmation when `canDelete` is true
- refresh the table and clear selection state after successful delete
- keep the flow concise and aligned with the existing admin page style

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
pnpm --dir app/web/apps/tenant-web exec vitest run src/views/admin/account-management.spec.ts
```

Expected: PASS with the destructive action hidden for the current row and the delete flow fully exercised.

### Task 5: End-To-End Verification And Final Safety Pass

**Files:**
- Review only: `docs/superpowers/specs/2026-04-21-account-deletion-design.md`

- [ ] **Step 1: Run the backend verification suite**

Run:
```bash
pnpm --filter permission-service exec jest test/l1/permission-foundation.seed.spec.ts test/l1/role-foundation.seed.spec.ts --runInBand
pnpm --filter identity-service exec jest test/l1/get-account-deletion-impact.handler.spec.ts test/l1/delete-account.handler.spec.ts test/l1/prisma.account.repository.spec.ts --runInBand
pnpm --filter api-gateway exec jest src/modules/auth-bff/application/use-cases/admin-security.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand --no-cache
```

Expected: PASS for all focused backend account-deletion tests.

- [ ] **Step 2: Run the frontend verification suite**

Run:
```bash
pnpm --dir app/web/apps/tenant-web exec vitest run src/views/admin/account-management.spec.ts
pnpm --dir app/web/apps/tenant-web exec vue-tsc --noEmit
```

Expected: PASS with no type regressions in the account-management page.

- [ ] **Step 3: Reconcile the implementation against the frozen design**

Checklist:
- delete only `account`, not `user`
- current login account is not deletable in UI and backend
- sessions are deleted before roles are cleared
- identity delete runs last
- blocker payload is structured and UI-visible
- result payload contains cleanup counts and `userRetained: true`

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-04-21-account-deletion.md src/common/src/contracts/identity_service/identity_query.proto src/common/src/authorization/permission-codes/identity/account.permission-codes.ts src/services/system/identity-service src/services/system/permission-service src/services/api-gateway app/web/apps/tenant-web
git commit -m "feat: add account deletion flow"
```
