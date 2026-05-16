# Admin User Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an administrator search for a user by `userId`, email, or phone, then open that user's existing session-management view without building a tenant selector, user directory, or name-search model.

**Architecture:** Extend the existing `identity-service -> auth-bff -> tenant-web` path and reuse the current admin session inspection flow. `identity-service` remains the user/account lookup truth, `auth-service` remains the session truth, and `auth-bff` composes a small search result with masked contact fields, account summaries, and active-session counts. This slice deliberately does not add `GetUserByUsername`; `identity.username` is treated as a legacy optional login handle, not as a real name or display-name search field.

**Tech Stack:** NestJS, CQRS, gRPC/proto generated clients already present for identity queries, auth-bff HTTP controller/use case, Vue tenant-web, Jest, pnpm.

---

### File Structure

- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter.ts` to expose existing email and phone lookup calls if not already wrapped.
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-security.use-case.ts` to compose admin user search results.
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts` to add `AdminUserSearchQueryDto`.
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts` to add user-search response models.
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts` to add `GET /auth/admin/users/search`.
- Modify: `app/web/apps/tenant-web/src/api/bff/admin-security/index.ts` to add search API types/client.
- Modify: `app/web/apps/tenant-web/src/views/admin/auth-session-management.vue` to add the admin user-search panel and reuse existing session detail loading.
- Verify docs: `docs/plans/features/admin-user-discovery.md` and `docs/contracts/api-gateway/auth-bff-admin-security.md` remain the feature and API truth sources.

### Task 1: Add auth-bff admin user search composition

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-security.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-security.use-case.spec.ts`

- [ ] **Step 1: Write failing use-case tests**

Add a test for email lookup composition:

```ts
it('searches by email and returns masked contact fields, account summaries, and active session count', async () => {
  identityAdapter.getUserById.mockResolvedValue({ user: undefined })
  identityAdapter.getUserByEmail.mockResolvedValue({
    user: {
      id: 'user-1',
      username: 'legacy-handle',
      personalEmail: 'victor@example.com',
      personalPhone: '+15550000001',
      isActive: true
    }
  })
  identityAdapter.getUserByPhone.mockResolvedValue({ user: undefined })
  identityAdapter.getAccountsByUserId.mockResolvedValue({
    accounts: [{ accountId: 'account-1', tenantId: 'tenant-1', displayName: 'Victor / Tenant', scopeLevel: 'TENANT' }]
  })
  identityAdapter.getTenantById.mockResolvedValue({ tenant: { id: 'tenant-1', name: 'Tenant One' } })
  authAdapter.adminListUserSessions.mockResolvedValue({
    items: [
      { sessionId: 'session-1', isRevoked: false, isAccessExpired: false },
      { sessionId: 'session-2', isRevoked: true, isAccessExpired: false }
    ]
  })

  const result = await useCase.searchUsers({ keyword: 'victor@example.com', limit: 10 }, source)

  expect(result.items).toHaveLength(1)
  expect(result.items[0]).toMatchObject({
    userId: 'user-1',
    displayName: 'Victor / Tenant',
    emailMasked: 'v***@example.com',
    phoneMasked: '+1*******001',
    activeSessionCount: 1,
    isOnline: true
  })
  expect(result.items[0].accountSummaries[0]).toMatchObject({
    accountId: 'account-1',
    tenantId: 'tenant-1',
    tenantName: 'Tenant One',
    scopeLevel: 'TENANT'
  })
})
```

Add a tenant-bound visibility test:

```ts
it('filters account summaries to the current tenant for tenant-scoped operators', async () => {
  const tenantSource = { user: { tid: 'tenant-1', scopeLevel: 'TENANT' } }
  identityAdapter.getUserById.mockResolvedValue({ user: { id: 'user-1', isActive: true } })
  identityAdapter.getAccountsByUserId.mockResolvedValue({
    accounts: [
      { accountId: 'account-1', tenantId: 'tenant-1', displayName: 'Visible', scopeLevel: 'TENANT' },
      { accountId: 'account-2', tenantId: 'tenant-2', displayName: 'Hidden', scopeLevel: 'TENANT' }
    ]
  })
  authAdapter.adminListUserSessions.mockResolvedValue({ items: [] })

  const result = await useCase.searchUsers({ keyword: 'user-1', limit: 10 }, tenantSource as any)

  expect(result.items[0].accountSummaries).toHaveLength(1)
  expect(result.items[0].accountSummaries[0].tenantId).toBe('tenant-1')
})
```

Add a guard test that proves login-handle search is not attempted:

```ts
it('does not call username or login-handle lookup for plain words', async () => {
  identityAdapter.getUserById.mockResolvedValue({ user: undefined })
  identityAdapter.getUserByEmail.mockResolvedValue({ user: undefined })
  identityAdapter.getUserByPhone.mockResolvedValue({ user: undefined })

  await useCase.searchUsers({ keyword: 'victor', limit: 10 }, source)

  expect(identityAdapter.getUserById).not.toHaveBeenCalledWith('victor', expect.anything())
  expect(identityAdapter.getUserByEmail).not.toHaveBeenCalled()
  expect(identityAdapter.getUserByPhone).not.toHaveBeenCalled()
  expect(identityAdapter.getUserByUsername).toBeUndefined()
})
```

- [ ] **Step 2: Run the focused BFF use-case test and confirm it fails**

Run: `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/admin-security.use-case.spec.ts --runInBand`

Expected: FAIL because `searchUsers` and some downstream lookup wrappers are missing.

- [ ] **Step 3: Add downstream identity lookup methods**

In `identity-query-grpc.adapter.ts`, add methods for existing identity-service lookup RPCs if they are not already wrapped. Use operator-scoped metadata for admin user discovery.

```ts
getUserByEmail(email: string, source: DownstreamRequestSource): Promise<GetUserByEmailResponse> {
  // Queries identity-service for one user by personal email under the current operator context.
  return firstValueFrom(this.client.getUserByEmail({ email }, this.operatorMetadata(source)))
}

getUserByPhone(phone: string, source: DownstreamRequestSource): Promise<GetUserByPhoneResponse> {
  // Queries identity-service for one user by personal phone under the current operator context.
  return firstValueFrom(this.client.getUserByPhone({ phone }, this.operatorMetadata(source)))
}
```

Do not add `getUserByUsername` in this slice.

- [ ] **Step 4: Add DTO and view models**

Add `AdminUserSearchQueryDto`:

```ts
export class AdminUserSearchQueryDto {
  @IsString()
  @IsNotEmpty()
  keyword!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number
}
```

Add response models with these fields:

```ts
export class AdminUserSearchAccountSummaryViewModel {
  @ApiProperty() accountId!: string
  @ApiPropertyOptional() accountDisplayName?: string
  @ApiPropertyOptional() tenantId?: string
  @ApiPropertyOptional() tenantName?: string
  @ApiProperty({ enum: ['SYSTEM', 'TENANT'] }) scopeLevel!: 'SYSTEM' | 'TENANT'
}

export class AdminUserSearchItemViewModel {
  @ApiProperty() userId!: string
  @ApiPropertyOptional() displayName?: string
  @ApiPropertyOptional() emailMasked?: string
  @ApiPropertyOptional() phoneMasked?: string
  @ApiProperty({ type: [AdminUserSearchAccountSummaryViewModel] })
  accountSummaries!: AdminUserSearchAccountSummaryViewModel[]
  @ApiProperty() isOnline!: boolean
  @ApiProperty() activeSessionCount!: number
}

export class AdminUserSearchListViewModel {
  @ApiProperty({ type: [AdminUserSearchItemViewModel] })
  items!: AdminUserSearchItemViewModel[]
}
```

- [ ] **Step 5: Implement `AdminSecurityUseCase.searchUsers`**

Implement search as a deterministic fan-out over the supported stable identifiers:

```ts
async searchUsers(
  query: AdminUserSearchQueryDto,
  source: DownstreamRequestSource
): Promise<AdminUserSearchListViewModel> {
  // Composes identity lookups, account summaries, and session counts into the admin user-search result.
  const keyword = normalize(query.keyword)
  if (!keyword) {
    return { items: [] }
  }

  const limit = Math.min(Math.max(query.limit ?? 10, 1), 10)
  const candidates = await this.findUserCandidates(keyword, source)
  const uniqueCandidates = this.uniqueUsers(candidates).slice(0, limit)
  const items = await Promise.all(uniqueCandidates.map((user) => this.toUserSearchItem(user, source)))

  return { items: items.filter((item) => item.accountSummaries.length > 0) }
}
```

Helper expectations:
- Try `getUserById` only when keyword looks like a user id / UUID.
- Try `getUserByEmail` only when keyword contains `@`.
- Try `getUserByPhone` only when keyword looks phone-like after trimming spaces.
- Do not try username, display name, real name, account display name, or fuzzy search.
- Deduplicate by `user.id`.
- Mask email and phone in BFF before returning.
- Derive `displayName` from the first visible `accountSummaries[].accountDisplayName`, falling back to `userId`.
- Count active sessions from `adminListUserSessions(userId, source)` using `!isRevoked && !isAccessExpired`.
- For tenant-scoped operators, keep only account summaries whose `tenantId` equals `source.user.tenantId || source.user.tid`.
- For system-scoped operators, keep all visible account summaries.

- [ ] **Step 6: Re-run focused BFF use-case tests**

Run: `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/admin-security.use-case.spec.ts --runInBand`

Expected: PASS for existing admin session behavior and new admin user search.

### Task 2: Expose the BFF HTTP route

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`

- [ ] **Step 1: Write failing controller tests**

Add a controller test that calls `adminSearchUsers` and verifies it passes query/source through to the use case:

```ts
it('delegates admin user search to AdminSecurityUseCase', async () => {
  adminSecurityUseCase.searchUsers.mockResolvedValue({ items: [] })

  const result = await controller.adminSearchUsers({ keyword: 'victor@example.com', limit: 10 } as any, source as any)

  expect(adminSecurityUseCase.searchUsers).toHaveBeenCalledWith({ keyword: 'victor@example.com', limit: 10 }, source)
  expect(result).toEqual({ items: [] })
})
```

- [ ] **Step 2: Run the focused controller test and confirm it fails**

Run: `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand`

Expected: FAIL because the route method is not implemented.

- [ ] **Step 3: Add the controller method before `admin/users/:userId/sessions`**

Place the static route before the parameterized `admin/users/:userId/sessions` route:

```ts
@Get('admin/users/search')
@RequirePermissions({ all: [AUTH_SESSION_PERMISSION_CODES.ADMIN_VIEW_USER_SESSIONS] })
@ApiOperation({ summary: 'Search users for admin session management' })
@ApiQuery({ name: 'keyword', required: true })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiOkResponse({ type: AdminUserSearchListViewModel })
adminSearchUsers(
  @Query() query: AdminUserSearchQueryDto,
  @DownstreamSource() source: DownstreamRequestSource
): Promise<AdminUserSearchListViewModel> {
  // Finds a small set of user candidates for administrator session inspection.
  return this.adminSecurityUseCase.searchUsers(query, source)
}
```

- [ ] **Step 4: Re-run focused controller tests**

Run: `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand`

Expected: PASS and no regression in existing admin session controller tests.

### Task 3: Add tenant-web API client and search UI

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/bff/admin-security/index.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/auth-session-management.vue`

- [ ] **Step 1: Add tenant-web API types and client**

Add a focused client shape:

```ts
export namespace AdminSecurityApi {
  export interface UserSearchAccountSummary {
    accountId: string
    accountDisplayName?: string
    tenantId?: string
    tenantName?: string
    scopeLevel: 'SYSTEM' | 'TENANT'
  }

  export interface UserSearchItem {
    userId: string
    displayName?: string
    emailMasked?: string
    phoneMasked?: string
    accountSummaries: UserSearchAccountSummary[]
    isOnline: boolean
    activeSessionCount: number
  }

  export interface UserSearchListResult {
    items: UserSearchItem[]
  }

  export interface UserSearchQuery {
    keyword: string
    limit?: number
  }
}

export function searchAdminUsersApi(params: AdminSecurityApi.UserSearchQuery) {
  return requestClient.get<AdminSecurityApi.UserSearchListResult>('/auth/admin/users/search', { params })
}
```

- [ ] **Step 2: Update the page state and actions**

Add state beside the existing online-users/session state:

```ts
const userSearchKeyword = ref('')
const userSearchLoading = ref(false)
const userSearchItems = ref<AdminSecurityApi.UserSearchItem[]>([])
```

Add search behavior:

```ts
async function searchUsers() {
  // Searches a small user candidate set before opening the existing session detail panel.
  const keyword = userSearchKeyword.value.trim()
  if (!keyword) {
    userSearchItems.value = []
    return
  }

  userSearchLoading.value = true
  try {
    const result = await searchAdminUsersApi({ keyword, limit: 10 })
    userSearchItems.value = result.items
  } finally {
    userSearchLoading.value = false
  }
}
```

When the admin clicks a result, call the existing session detail loader:

```ts
async function inspectSearchedUser(item: AdminSecurityApi.UserSearchItem) {
  // Reuses the existing per-user session inspection flow after user discovery.
  await inspectUserSessions({
    userId: item.userId,
    displayName: item.displayName || item.userId,
    tenantName: item.accountSummaries[0]?.tenantName
  })
}
```

- [ ] **Step 3: Add the user-search panel without building a tenant selector**

Place the panel above the current online-user overview in `auth-session-management.vue`.

The UI must:
- Show one keyword input with placeholder `搜索用户 ID、邮箱或手机号`.
- Show one primary search button.
- Show up to 10 results.
- Display masked email/phone only.
- Display account summary chips using `tenantName || tenantId || 'System'`.
- Display `activeSessionCount` and online/offline state.
- Open the existing session-detail table when a result is selected.
- Keep the current online-user overview and audit tab behavior intact.

- [ ] **Step 4: Run tenant-web verification**

Run: `pnpm --dir app/web/apps/tenant-web typecheck`

Expected: PASS with no type errors in admin-security API types or `auth-session-management.vue`.

### Task 4: Cross-slice verification and docs closeout

**Files:**
- Verify: `docs/plans/features/admin-user-discovery.md`
- Verify: `docs/contracts/api-gateway/auth-bff-admin-security.md`
- Modify only if implementation semantics differ from the current docs.

- [ ] **Step 1: Run backend focused tests**

Run:

```bash
pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/admin-security.use-case.spec.ts --runInBand
pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand
```

Expected: PASS for BFF composition and controller route coverage.

- [ ] **Step 2: Run frontend focused verification**

Run: `pnpm --dir app/web/apps/tenant-web typecheck`

Expected: PASS.

- [ ] **Step 3: Re-read contract and feature packet**

Confirm these statements are still true:
- `GET /auth/admin/users/search` returns only a small candidate set, not a full directory.
- Search supports `userId`, email, and phone only.
- Search does not support username, login handle, real name, display name, or fuzzy matching.
- Result includes `accountSummaries[]`, `isOnline`, and `activeSessionCount`.
- Email and phone are masked.
- Frontend does not call `identity-service` directly.
- Tenant selector remains deferred.

- [ ] **Step 4: Mark feature packet complete when all checks pass**

Update `docs/plans/features/admin-user-discovery.md` task states only after implementation and verification are complete:
- Producer owner: `completed`
- Consumer owner: `completed`
- Review / integration: `completed`

Do not mark the feature complete if any verification command was skipped or failed.

### Risks and Guardrails

- Do not add username/login-handle search in this implementation slice; that would prematurely freeze identity login handle semantics.
- Do not treat `identity.username` as real name, display name, or account display name.
- Real-name search belongs to a future `party-service` collaboration because real names are not globally unique and are not identity-service truth.
- `activeSessionCount` is an N-call aggregation for at most 10 users in phase one. Keep it simple now; only introduce a batch auth-service endpoint if this becomes a measured performance issue.
- Tenant-bound operators must not see account summaries outside their current tenant. Use `source.user.tenantId || source.user.tid` as the BFF-side safety filter even if downstream also enforces visibility.
- Do not add roles, permissions, full user directory pagination, tenant selector, display-name fuzzy search, or real-name search in this implementation slice.
