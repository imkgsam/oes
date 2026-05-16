# Account Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real current-account profile model so the authenticated operator can read and update the current `account`'s `avatar`, `displayName`, and `bio` through `identity-service -> auth-bff -> tenant-web`.

**Architecture:** `identity-service` becomes the source of truth for `UserAccount.avatarUrl`, `UserAccount.displayName`, and the new `UserAccount.bio`. `auth-bff` exposes a black-box read/write contract for the current authenticated account only, and `tenant-web` upgrades the current personal-center account section from read-only placeholder text to an actual account-profile editor.

**Tech Stack:** Prisma, NestJS, gRPC proto contracts, CQRS command/query handlers, Jest, Vue 3, Ant Design Vue, `vue-tsc`.

---

## File Structure

### Existing files to modify

- `docs/contracts/api-gateway/auth-bff-login.md`
  - Freeze the final BFF read/write black-box contract for account profile.
- `docs/plans/features/personal-center.md`
  - Keep the feature packet aligned with the account-profile truth source.
- `src/common/src/contracts/identity_service/identity_query.proto`
  - Extend the identity query / management gRPC contract for account profile reads and writes.
- `src/services/system/identity-service/prisma/schema.prisma`
  - Add the new `bio` field to `UserAccount`.
- `src/services/system/identity-service/src/application/queries/account/account-query.result.ts`
  - Extend account query projections with `avatarUrl` and `bio`.
- `src/services/system/identity-service/src/application/queries/account/get-account-by-id.handler.ts`
  - Return the new account-profile projection fields.
- `src/services/system/identity-service/src/domain/entities/account-summary.entity.ts`
  - Carry the new account-profile fields in the domain summary entity.
- `src/services/system/identity-service/src/domain/repositories/account.repository.ts`
  - Add the write API for current-account profile updates.
- `src/services/system/identity-service/src/infrastructure/mappers/prisma-account.mapper.ts`
  - Map `avatarUrl` and `bio` between Prisma and domain/query shapes.
- `src/services/system/identity-service/src/infrastructure/repositories/prisma/prisma.account.repository.ts`
  - Read / persist the new account-profile fields.
- `src/services/system/identity-service/src/interfaces/grpc/identity-query.grpc.controller.ts`
  - Return account profile fields in `GetAccountById`.
- `src/services/system/identity-service/src/interfaces/grpc/identity-management.grpc.controller.ts`
  - Add the current-account profile update management endpoint.
- `src/services/system/identity-service/src/application/commands/index.ts`
  - Export the new account-profile command and handler.
- `src/services/system/identity-service/src/modules/identity-management/identity-management.module.ts`
  - Register the new command handler.
- `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter.ts`
  - Read the expanded account projection and call the new account-profile mutation.
- `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/personal-center/personal-center-summary.adapter.ts`
  - Move `avatar / displayName / bio` into `accountContext`.
- `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/personal-center.view-model.ts`
  - Reflect the corrected account-profile response shape.
- `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/login.dto.ts`
  - Add the BFF DTO for account-profile updates.
- `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
  - Add `PATCH /auth/personal-center/account-profile`.
- `src/services/api-gateway/src/modules/auth-bff/application/use-cases/personal-center.use-case.ts`
  - Return `avatar / displayName / bio` under `accountContext`.
- `src/services/api-gateway/src/modules/auth-bff/auth-bff.module.ts`
  - Wire the new use case.
- `app/web/apps/tenant-web/src/api/bff/personal-center/index.ts`
  - Add the mutation client and update the response types.
- `app/web/apps/tenant-web/src/views/_core/profile/components/personal-account-section.vue`
  - Replace the read-only note with a real editable account-profile form.
- `app/web/apps/tenant-web/src/views/_core/profile/personal-center.vue`
  - Refresh the page after a successful account-profile save.

### New files to create

- `src/services/system/identity-service/prisma/migrations/20260416_user_account_bio/migration.sql`
  - Persist the `bio` column for `UserAccount`.
- `src/services/system/identity-service/src/application/commands/account/update-account-profile.command.ts`
  - Define the write-side account-profile command.
- `src/services/system/identity-service/src/application/commands/account/update-account-profile.handler.ts`
  - Validate, normalize, and persist current-account profile changes.
- `src/services/system/identity-service/src/application/commands/account/index.ts`
  - Local account command barrel.
- `src/services/system/identity-service/test/l1/update-account-profile.handler.spec.ts`
  - Verify normalization and persistence rules for `avatarUrl`, `displayName`, and `bio`.
- `src/services/api-gateway/src/modules/auth-bff/application/use-cases/account-profile.use-case.ts`
  - Handle the current-account profile mutation in BFF.
- `src/services/api-gateway/src/modules/auth-bff/application/use-cases/account-profile.use-case.spec.ts`
  - Verify BFF mutation orchestration.
- `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/account-profile.dto.ts`
  - Define the HTTP request DTO for the account-profile patch endpoint.

### Responsibilities

- `identity-service`
  - Owns the write model for `UserAccount.avatarUrl`, `UserAccount.displayName`, `UserAccount.bio`.
- `auth-bff`
  - Converts the operator's current JWT/account context into a black-box read/write HTTP contract.
- `tenant-web`
  - Lets the current operator edit only the current account profile and keeps `user`-level login identity fields read-only.

## Task 1: Freeze the final contract and packet wording

**Files:**
- Modify: `docs/contracts/api-gateway/auth-bff-login.md`
- Modify: `docs/plans/features/personal-center.md`

- [ ] **Step 1: Write the failing contract expectation**

Add or update the account-profile wording so the read contract explicitly looks like:

```json
{
  "userProfile": {
    "loginEmail": "chen.shuangpeng@meilong-ceramics.com",
    "loginPhone": "+8613900000001",
    "loginMethods": [
      { "type": "EMAIL_PASSWORD", "label": "邮箱密码", "value": "chen.shuangpeng@meilong-ceramics.com" }
    ]
  },
  "accountContext": {
    "accountId": "account-1",
    "accountName": "陈双鹏 / 美隆陶瓷",
    "avatar": "https://cdn.example.com/avatar/account-1.png",
    "displayName": "陈双鹏",
    "bio": "负责美隆陶瓷的外贸协同与重点客户经营。"
  }
}
```

- [ ] **Step 2: Freeze the mutation contract**

Document the stage-one patch request in `docs/contracts/api-gateway/auth-bff-login.md`:

```json
{
  "avatar": "https://cdn.example.com/avatar/account-1.png",
  "displayName": "陈双鹏",
  "bio": "负责美隆陶瓷的外贸协同与重点客户经营。"
}
```

Document the validation baseline:

```md
- `avatar`: optional string, max length `2048`
- `displayName`: optional string, max length `64`, blank normalizes to `null`
- `bio`: optional string, max length `280`, blank normalizes to `null`
```

- [ ] **Step 3: Commit the contract-only change**

Run:

```bash
git add docs/contracts/api-gateway/auth-bff-login.md docs/plans/features/personal-center.md
git commit -m "docs: freeze account profile contract"
```

Expected: one docs-only commit that changes no production code.

## Task 2: Add the identity-service write model for account profile

**Files:**
- Modify: `src/services/system/identity-service/prisma/schema.prisma`
- Create: `src/services/system/identity-service/prisma/migrations/20260416_user_account_bio/migration.sql`
- Modify: `src/services/system/identity-service/src/domain/repositories/account.repository.ts`
- Modify: `src/services/system/identity-service/src/infrastructure/repositories/prisma/prisma.account.repository.ts`
- Test: `src/services/system/identity-service/test/l1/update-account-profile.handler.spec.ts`

- [ ] **Step 1: Write the failing handler test**

Create the test skeleton:

```ts
it('normalizes blank displayName and bio to null before saving the account profile', async () => {
  const accountRepository = {
    findById: jest.fn().mockResolvedValue(existingAccount),
    updateProfile: jest.fn().mockResolvedValue(updatedAccount),
  }

  const handler = new UpdateAccountProfileHandler(accountRepository as any)

  await handler.execute(
    new UpdateAccountProfileCommand({
      accountId: 'account-1',
      avatarUrl: 'https://cdn.example.com/avatar/account-1.png',
      displayName: '   ',
      bio: '   ',
      operatorId: 'account-1',
      operatorScope: { tenantId: 'tenant-1' },
    }),
  )

  expect(accountRepository.updateProfile).toHaveBeenCalledWith('account-1', {
    avatarUrl: 'https://cdn.example.com/avatar/account-1.png',
    displayName: null,
    bio: null,
  })
})
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
pnpm --dir src/services/system/identity-service exec jest test/l1/update-account-profile.handler.spec.ts --runInBand
```

Expected: FAIL because the command / handler / repository method do not exist yet.

- [ ] **Step 3: Add the schema field and migration**

Update the Prisma model to include:

```prisma
model UserAccount {
  id          String   @id @default(uuid())
  displayName String?
  avatarUrl   String?
  bio         String?
}
```

Create a migration:

```sql
ALTER TABLE "UserAccount"
ADD COLUMN IF NOT EXISTS "bio" TEXT;
```

- [ ] **Step 4: Add the repository write contract**

Extend `AccountRepository` with:

```ts
updateProfile(
  accountId: string,
  profile: { avatarUrl: string | null; displayName: null | string; bio: null | string }
): Promise<AccountSummaryEntity>
```

Implement the Prisma save:

```ts
async updateProfile(accountId: string, profile: { avatarUrl: string | null; displayName: string | null; bio: string | null }) {
  const record = await this.prisma.userAccount.update({
    where: { id: accountId },
    data: {
      avatarUrl: profile.avatarUrl,
      displayName: profile.displayName,
      bio: profile.bio,
    },
    select: accountSummarySelect,
  })

  return PrismaAccountSummaryMapper.toDomain(record)
}
```

- [ ] **Step 5: Run the test to verify it still fails for the missing handler**

Run:

```bash
pnpm --dir src/services/system/identity-service exec jest test/l1/update-account-profile.handler.spec.ts --runInBand
```

Expected: FAIL because the write-side command/handler are still missing.

- [ ] **Step 6: Commit the persistence slice**

Run:

```bash
git add src/services/system/identity-service/prisma/schema.prisma src/services/system/identity-service/prisma/migrations/20260416_user_account_bio/migration.sql src/services/system/identity-service/src/domain/repositories/account.repository.ts src/services/system/identity-service/src/infrastructure/repositories/prisma/prisma.account.repository.ts
git commit -m "feat: add account profile persistence"
```

## Task 3: Add identity-service command + gRPC contract for account profile

**Files:**
- Modify: `src/common/src/contracts/identity_service/identity_query.proto`
- Create: `src/services/system/identity-service/src/application/commands/account/update-account-profile.command.ts`
- Create: `src/services/system/identity-service/src/application/commands/account/update-account-profile.handler.ts`
- Create: `src/services/system/identity-service/src/application/commands/account/index.ts`
- Modify: `src/services/system/identity-service/src/application/commands/index.ts`
- Modify: `src/services/system/identity-service/src/interfaces/grpc/identity-management.grpc.controller.ts`
- Modify: `src/services/system/identity-service/src/modules/identity-management/identity-management.module.ts`
- Test: `src/services/system/identity-service/test/l1/update-account-profile.handler.spec.ts`

- [ ] **Step 1: Extend the proto contract**

Add the new RPC and messages:

```proto
rpc UpdateAccountProfile(UpdateAccountProfileRequest) returns (GetAccountByIdResponse);

message UpdateAccountProfileRequest {
  string account_id = 1;
  string avatar_url = 2;
  string display_name = 3;
  string bio = 4;
}
```

- [ ] **Step 2: Implement the command and handler**

Create a command like:

```ts
export class UpdateAccountProfileCommand {
  constructor(
    public readonly payload: {
      accountId: string
      avatarUrl?: string
      displayName?: string
      bio?: string
      operatorId: string
      operatorScope?: OperatorScope
    }
  ) {}
}
```

In the handler normalize fields:

```ts
const displayName = normalizeOptionalText(command.payload.displayName, 64)
const bio = normalizeOptionalText(command.payload.bio, 280)
const avatarUrl = normalizeOptionalText(command.payload.avatarUrl, 2048)

return this.accountRepository.updateProfile(command.payload.accountId, {
  avatarUrl,
  displayName,
  bio,
})
```

- [ ] **Step 3: Expose the gRPC mutation**

Add a controller method:

```ts
@RequirePermissions({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.UPDATE_ACCOUNT_PROFILE] })
async updateAccountProfile(request: UpdateAccountProfileRequest): Promise<GetAccountByIdResponse> {
  const operatorId = getRequiredOperatorId(request)
  const operatorScope = getOptionalOperatorScope(request)
  const account = await this.commandBus.execute(
    new UpdateAccountProfileCommand({
      accountId: request.accountId!,
      avatarUrl: request.avatarUrl || undefined,
      displayName: request.displayName || undefined,
      bio: request.bio || undefined,
      operatorId,
      operatorScope,
    }),
  )

  return {
    account: {
      id: account.id,
      userId: account.userId,
      tenantId: account.tenantId ?? '',
      displayName: account.displayName ?? '',
      isEnabled: account.isEnabled,
      scopeLevel: account.scopeLevel,
    },
  }
}
```

- [ ] **Step 4: Run the handler test and fix until green**

Run:

```bash
pnpm --dir src/services/system/identity-service exec jest test/l1/update-account-profile.handler.spec.ts --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit the identity mutation slice**

Run:

```bash
git add src/common/src/contracts/identity_service/identity_query.proto src/services/system/identity-service/src/application/commands src/services/system/identity-service/src/interfaces/grpc/identity-management.grpc.controller.ts src/services/system/identity-service/src/modules/identity-management/identity-management.module.ts src/services/system/identity-service/test/l1/update-account-profile.handler.spec.ts
git commit -m "feat: add account profile identity mutation"
```

## Task 4: Extend identity-service account reads with avatar and bio

**Files:**
- Modify: `src/services/system/identity-service/src/domain/entities/account-summary.entity.ts`
- Modify: `src/services/system/identity-service/src/application/queries/account/account-query.result.ts`
- Modify: `src/services/system/identity-service/src/infrastructure/mappers/prisma-account.mapper.ts`
- Modify: `src/services/system/identity-service/src/infrastructure/repositories/prisma/prisma.account.repository.ts`
- Modify: `src/services/system/identity-service/src/application/queries/account/get-account-by-id.handler.ts`
- Modify: `src/services/system/identity-service/src/interfaces/grpc/identity-query.grpc.controller.ts`

- [ ] **Step 1: Write the failing query expectation**

Add or update a query/controller test to expect:

```ts
expect(response.account).toEqual(
  expect.objectContaining({
    displayName: '陈双鹏',
    avatarUrl: 'https://cdn.example.com/avatar/account-1.png',
    bio: '负责美隆陶瓷的外贸协同与重点客户经营。',
  }),
)
```

- [ ] **Step 2: Extend the query projection**

Add fields to the result shape:

```ts
export interface AccountSummaryView {
  id: string
  userId: string
  tenantId: string | null
  scopeLevel: 'SYSTEM' | 'TENANT'
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  isEnabled: boolean
}
```

- [ ] **Step 3: Extend the Prisma selects and mapper**

Select:

```ts
select: {
  id: true,
  userId: true,
  tenantId: true,
  scopeLevel: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  isEnable: true,
}
```

- [ ] **Step 4: Run the query tests**

Run:

```bash
pnpm --dir src/services/system/identity-service exec jest test/l1 --runInBand
```

Expected: PASS for the account-query path and no regression in neighboring identity tests.

- [ ] **Step 5: Commit the read-model slice**

Run:

```bash
git add src/services/system/identity-service/src/domain/entities/account-summary.entity.ts src/services/system/identity-service/src/application/queries/account/account-query.result.ts src/services/system/identity-service/src/infrastructure/mappers/prisma-account.mapper.ts src/services/system/identity-service/src/infrastructure/repositories/prisma/prisma.account.repository.ts src/services/system/identity-service/src/application/queries/account/get-account-by-id.handler.ts src/services/system/identity-service/src/interfaces/grpc/identity-query.grpc.controller.ts
git commit -m "feat: expose account profile query fields"
```

## Task 5: Update auth-bff account-profile read and write paths

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/personal-center/personal-center-summary.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/personal-center.view-model.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/account-profile.dto.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/account-profile.use-case.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/account-profile.use-case.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/auth-bff.module.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/account-profile.use-case.spec.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/personal-center.use-case.spec.ts`

- [ ] **Step 1: Write the failing BFF mutation test**

Create:

```ts
it('updates the current authenticated account profile through identity-service', async () => {
  const identityAdapter = {
    updateAccountProfile: jest.fn().mockResolvedValue({
      account: {
        id: 'account-1',
        displayName: '陈双鹏',
        avatarUrl: 'https://cdn.example.com/avatar/account-1.png',
        bio: '负责美隆陶瓷的外贸协同与重点客户经营。',
      },
    }),
  }

  const useCase = new AccountProfileUseCase(identityAdapter as any)

  await expect(
    useCase.execute(
      { avatar: 'https://cdn.example.com/avatar/account-1.png', displayName: '陈双鹏', bio: '负责美隆陶瓷的外贸协同与重点客户经营。' },
      { user: { aid: 'account-1' } } as any,
    ),
  ).resolves.toEqual(
    expect.objectContaining({
      accountContext: expect.objectContaining({
        accountId: 'account-1',
        displayName: '陈双鹏',
      }),
    }),
  )
})
```

- [ ] **Step 2: Run the failing BFF test**

Run:

```bash
pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/account-profile.use-case.spec.ts --runInBand
```

Expected: FAIL because the use case / DTO / adapter method do not exist yet.

- [ ] **Step 3: Add the DTO and use case**

Define the DTO:

```ts
export class AccountProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatar?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayName?: string

  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string
}
```

Map the use case result:

```ts
return {
  accountContext: {
    accountId: result.account?.id ?? accountId,
    accountName: result.account?.displayName ?? undefined,
    avatar: result.account?.avatarUrl ?? undefined,
    displayName: result.account?.displayName ?? undefined,
    bio: result.account?.bio ?? undefined,
  },
}
```

- [ ] **Step 4: Move the personal-center read fields**

Update the personal-center mapper so it returns:

```ts
userProfile: {
  loginEmail,
  loginPhone,
  loginMethods,
},
accountContext: {
  accountId,
  accountName,
  avatar: identitySummary.avatar,
  displayName: sessionContext.operator?.displayName,
  bio: identitySummary.bio,
  roles,
  workEmail,
  workPhone,
}
```

- [ ] **Step 5: Expose the HTTP endpoint**

Add:

```ts
@Patch('personal-center/account-profile')
async updateAccountProfile(
  @Body() dto: AccountProfileDto,
  @DownstreamSource() source: DownstreamRequestSource
) {
  return this.accountProfileUseCase.execute(dto, source)
}
```

- [ ] **Step 6: Run the BFF tests**

Run:

```bash
pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/account-profile.use-case.spec.ts src/modules/auth-bff/application/use-cases/personal-center.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand
```

Expected: PASS.

- [ ] **Step 7: Commit the BFF slice**

Run:

```bash
git add src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter.ts src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/personal-center/personal-center-summary.adapter.ts src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/personal-center.view-model.ts src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/account-profile.dto.ts src/services/api-gateway/src/modules/auth-bff/application/use-cases/account-profile.use-case.ts src/services/api-gateway/src/modules/auth-bff/application/use-cases/account-profile.use-case.spec.ts src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts src/services/api-gateway/src/modules/auth-bff/auth-bff.module.ts
git commit -m "feat: add account profile bff contract"
```

## Task 6: Upgrade tenant-web personal center to edit current account profile

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/bff/personal-center/index.ts`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/components/personal-account-section.vue`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/personal-center.vue`

- [ ] **Step 1: Write the failing front-end type expectation**

Update the personal-center API types so `AccountContext` carries:

```ts
export interface AccountContext {
  accountId: string;
  accountName?: string;
  avatar?: string;
  displayName?: string;
  bio?: string;
  roles: Role[];
}
```

Add the mutation client:

```ts
export async function updateAccountProfileApi(payload: {
  avatar?: string;
  displayName?: string;
  bio?: string;
}) {
  return requestClient.patch('/auth/personal-center/account-profile', payload);
}
```

- [ ] **Step 2: Replace the read-only alert with an editable form**

In `personal-account-section.vue`, use a local form model:

```ts
const formState = reactive({
  avatar: props.accountContext.avatar ?? '',
  displayName: props.accountContext.displayName ?? '',
  bio: props.accountContext.bio ?? '',
})
```

Emit save:

```ts
const emit = defineEmits<{
  saved: [payload: { avatar?: string; displayName?: string; bio?: string }]
}>()
```

- [ ] **Step 3: Wire the page-level mutation**

In `personal-center.vue`:

```ts
async function handleAccountProfileSaved(payload: {
  avatar?: string;
  displayName?: string;
  bio?: string;
}) {
  await updateAccountProfileApi(payload)
  await loadSummary()
}
```

Template:

```vue
<PersonalAccountSection
  :account-context="summary.accountContext"
  @saved="handleAccountProfileSaved"
/>
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
pnpm --dir app/web/apps/tenant-web typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit the front-end slice**

Run:

```bash
git add app/web/apps/tenant-web/src/api/bff/personal-center/index.ts app/web/apps/tenant-web/src/views/_core/profile/components/personal-account-section.vue app/web/apps/tenant-web/src/views/_core/profile/personal-center.vue
git commit -m "feat: edit current account profile"
```

## Task 7: Final verification and packet closure

**Files:**
- Modify: `docs/plans/features/personal-center.md`

- [ ] **Step 1: Run identity-service verification**

Run:

```bash
pnpm --dir src/services/system/identity-service exec jest test/l1/update-account-profile.handler.spec.ts --runInBand
```

Expected: PASS.

- [ ] **Step 2: Run auth-bff verification**

Run:

```bash
pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/account-profile.use-case.spec.ts src/modules/auth-bff/application/use-cases/personal-center.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand
```

Expected: PASS.

- [ ] **Step 3: Run tenant-web verification**

Run:

```bash
pnpm --dir app/web/apps/tenant-web typecheck
```

Expected: PASS.

- [ ] **Step 4: Update the feature packet execution status**

Add a short note under the current slice or closure section:

```md
- `account profile` 读写 contract 已实现并联通：
  - `identity-service.UserAccount.avatarUrl`
  - `identity-service.UserAccount.displayName`
  - `identity-service.UserAccount.bio`
  - `GET /auth/personal-center`
  - `PATCH /auth/personal-center/account-profile`
```

- [ ] **Step 5: Commit the verification / packet closure**

Run:

```bash
git add docs/plans/features/personal-center.md
git commit -m "docs: close account profile delivery status"
```
