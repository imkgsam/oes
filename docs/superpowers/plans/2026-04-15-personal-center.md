# Personal Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first-stage personal center page that clearly separates `user`-level identity data from current `account`-level work context, while only allowing low-risk profile edits.

**Architecture:** Reuse the existing `auth-bff -> tenant-web` authenticated shell context as the base truth for current account context and roles, and add a minimal user-profile summary contract only for the data the current shell context does not carry. Replace the current template-like profile tabs with a single page composed of three sections: `User` info, current `Account` context, and security/common-entry cards. Keep login-method binding flows and enterprise-assigned work contact editing out of scope for this slice.

**Tech Stack:** Vue 3, Pinia, Vben UI components, NestJS `auth-bff`, existing `GET /auth/session/context`, existing `GET /auth/session/access-summary`, Swagger view models, Vitest, Jest.

---

## File Structure

### Existing files to modify

- `docs/plans/features/personal-center.md`
  - Feature packet truth for goals, scope, and acceptance criteria.
- `docs/contracts/api-gateway/auth-bff-login.md`
  - Existing authenticated shell contract. Update only if the current session context response changes.
- `docs/contracts/api-gateway/auth-bff-self-service.md`
  - Cross-link personal-center security entry usage only if needed.
- `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
  - New personal-center summary endpoint only if required.
- `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/session-context.view-model.ts`
  - Only touch if the chosen design extends existing shell payload.
- `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-context.use-case.ts`
  - Only touch if existing shell context is expanded.
- `app/web/apps/tenant-web/src/api/core/user.ts`
  - Add personal-center summary request typing and client method.
- `app/web/apps/tenant-web/src/store/auth.ts`
  - Reuse existing user info hydration where appropriate; do not let the page invent duplicate identity state.
- `app/web/apps/tenant-web/src/views/_core/profile/index.vue`
  - Replace the current tabbed template shell with the new personal-center page container.
- `app/web/apps/tenant-web/src/views/_core/profile/base-setting.vue`
  - Either retire this template usage or repurpose pieces if still small and clean.
- `app/web/apps/tenant-web/src/modules/workbench/routes.ts`
  - Ensure route title / route component still match the final page.

### New files to create

- `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/personal-center.view-model.ts`
  - Black-box payload returned by the new personal-center summary endpoint.
- `src/services/api-gateway/src/modules/auth-bff/application/use-cases/personal-center.use-case.ts`
  - Aggregates user-level summary plus current account/session context.
- `src/services/api-gateway/src/modules/auth-bff/application/use-cases/personal-center.use-case.spec.ts`
  - Verifies payload assembly and `user` / `account` separation.
- `app/web/apps/tenant-web/src/api/bff/personal-center/index.ts`
  - Page-specific API typing and request wrapper.
- `app/web/apps/tenant-web/src/views/_core/profile/personal-center.vue`
  - Final page composition shell.
- `app/web/apps/tenant-web/src/views/_core/profile/components/personal-user-section.vue`
  - Renders editable `user`-level card.
- `app/web/apps/tenant-web/src/views/_core/profile/components/personal-account-section.vue`
  - Renders current `account`-level context and roles.
- `app/web/apps/tenant-web/src/views/_core/profile/components/personal-security-section.vue`
  - Renders security/common-entry cards.
- `app/web/apps/tenant-web/src/views/_core/profile/personal-center.spec.ts`
  - Focused UI test for section rendering and field separation if the repo pattern supports it; otherwise defer to lighter unit tests around mapping helpers.

### Data responsibilities

- `user`-level summary:
  - avatar
  - display name
  - bio
  - login email
  - login phone
  - login methods summary
- `account`-level summary:
  - account name
  - tenant name
  - scope
  - role list from access summary
  - enterprise-assigned work email
  - enterprise-assigned work phone
- security/common entries:
  - route links only; no new security flows in this plan

## Task 1: Freeze the minimal black-box contract

**Files:**
- Modify: `docs/plans/features/personal-center.md`
- Modify: `docs/contracts/api-gateway/auth-bff-login.md`
- Create: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/personal-center.view-model.ts`

- [ ] **Step 1: Write the failing contract expectation as a packet note**

Add this bullet block under `## 4. 当前结论` in `docs/plans/features/personal-center.md`:

```md
- 第一阶段个人中心需要一个独立的黑盒 summary payload，避免前端把 `session/context`、`access-summary` 与未来 `user` 资料字段在页面内临时拼接成伪真相。
- 该 payload 至少应包含：
  - `userProfile.avatar`
  - `userProfile.displayName`
  - `userProfile.bio`
  - `userProfile.loginEmail`
  - `userProfile.loginPhone`
  - `userProfile.loginMethods[]`
  - `accountContext.accountName`
  - `accountContext.tenantName`
  - `accountContext.scopeLevel`
  - `accountContext.roles[]`
  - `accountContext.workEmail`
  - `accountContext.workPhone`
  - `securityEntries[]`
```

- [ ] **Step 2: Update the public contract doc before code**

Append this new endpoint section to `docs/contracts/api-gateway/auth-bff-login.md` after the authenticated session endpoints:

```md
### `GET /auth/personal-center`

- Purpose: return the first-stage personal-center summary for the authenticated user.
- Users: authenticated end users.
- Control model: authenticated session endpoint.
- Composition rules:
  - `userProfile` is `user`-level identity and login-method summary.
  - `accountContext` is current `account`-level work context.
  - `roles` reflect the current authenticated account, not every role the natural person has globally.
  - enterprise-assigned work contacts are read-only in this stage.
- First-stage response:

```json
{
  "userProfile": {
    "avatar": "data-or-url",
    "displayName": "陈双鹏",
    "bio": "外贸与平台协同负责人",
    "loginEmail": "chen.shuangpeng@meilong-ceramics.com",
    "loginPhone": "+8613900000001",
    "loginMethods": [
      { "type": "EMAIL_PASSWORD", "label": "邮箱密码", "value": "chen.shuangpeng@meilong-ceramics.com" },
      { "type": "PHONE_PASSWORD", "label": "手机密码", "value": "+8613900000001" }
    ]
  },
  "accountContext": {
    "accountId": "cb3f1d5d-1406-4fb0-8d53-75a144093001",
    "accountName": "陈双鹏 / 美隆陶瓷",
    "tenantId": "ea06d4a0-6990-4ba0-ae13-fb31485c2001",
    "tenantName": "潮州市美隆陶瓷实业有限公司",
    "scopeLevel": "TENANT",
    "roles": [
      { "roleId": "role-1", "code": "tenant.admin", "name": "租户管理员" }
    ],
    "workEmail": "chen.shuangpeng@meilong-ceramics.com",
    "workPhone": "+8613900000001"
  },
  "securityEntries": [
    { "code": "session-security", "label": "会话管理", "path": "/account/security" }
  ]
}
```
```

- [ ] **Step 3: Define the back-end view model**

Create `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/personal-center.view-model.ts`:

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class PersonalCenterLoginMethodViewModel {
  @ApiProperty()
  type!: string

  @ApiProperty()
  label!: string

  @ApiPropertyOptional()
  value?: string
}

export class PersonalCenterUserProfileViewModel {
  @ApiPropertyOptional()
  avatar?: string

  @ApiPropertyOptional()
  displayName?: string

  @ApiPropertyOptional()
  bio?: string

  @ApiPropertyOptional()
  loginEmail?: string

  @ApiPropertyOptional()
  loginPhone?: string

  @ApiProperty({ type: PersonalCenterLoginMethodViewModel, isArray: true })
  loginMethods!: PersonalCenterLoginMethodViewModel[]
}

export class PersonalCenterRoleViewModel {
  @ApiProperty()
  roleId!: string

  @ApiProperty()
  code!: string

  @ApiProperty()
  name!: string
}

export class PersonalCenterAccountContextViewModel {
  @ApiProperty()
  accountId!: string

  @ApiPropertyOptional()
  accountName?: string

  @ApiPropertyOptional()
  tenantId?: string

  @ApiPropertyOptional()
  tenantName?: string

  @ApiProperty()
  scopeLevel!: 'SYSTEM' | 'TENANT'

  @ApiProperty({ type: PersonalCenterRoleViewModel, isArray: true })
  roles!: PersonalCenterRoleViewModel[]

  @ApiPropertyOptional()
  workEmail?: string

  @ApiPropertyOptional()
  workPhone?: string
}

export class PersonalCenterSecurityEntryViewModel {
  @ApiProperty()
  code!: string

  @ApiProperty()
  label!: string

  @ApiProperty()
  path!: string
}

export class PersonalCenterViewModel {
  @ApiProperty({ type: PersonalCenterUserProfileViewModel })
  userProfile!: PersonalCenterUserProfileViewModel

  @ApiProperty({ type: PersonalCenterAccountContextViewModel })
  accountContext!: PersonalCenterAccountContextViewModel

  @ApiProperty({ type: PersonalCenterSecurityEntryViewModel, isArray: true })
  securityEntries!: PersonalCenterSecurityEntryViewModel[]
}
```

- [ ] **Step 4: Commit**

```bash
git add docs/plans/features/personal-center.md docs/contracts/api-gateway/auth-bff-login.md src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/personal-center.view-model.ts
git commit -m "docs: freeze personal center contract baseline"
```

## Task 2: Add the auth-bff personal-center summary endpoint

**Files:**
- Create: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/personal-center.use-case.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/personal-center.use-case.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/auth-bff.module.ts`

- [ ] **Step 1: Write the failing use-case test**

Create `src/services/api-gateway/src/modules/auth-bff/application/use-cases/personal-center.use-case.spec.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { PersonalCenterUseCase } from './personal-center.use-case'

describe('PersonalCenterUseCase', () => {
  it('separates user-level profile data from current account context', async () => {
    const sessionContextUseCase = {
      execute: vi.fn().mockResolvedValue({
        operator: { userId: 'user-1', displayName: '陈双鹏', scopeLevel: 'TENANT' },
        account: { accountId: 'account-1', name: '陈双鹏 / 美隆陶瓷', scopeLevel: 'TENANT' },
        tenant: { tenantId: 'tenant-1', name: '潮州市美隆陶瓷实业有限公司' },
        scopeLevel: 'TENANT',
      }),
    }
    const accessSummaryUseCase = {
      execute: vi.fn().mockResolvedValue({
        roles: [{ roleId: 'role-1', code: 'tenant.admin', name: '租户管理员' }],
        actionCodes: [],
      }),
    }
    const identitySummaryPort = {
      getPersonalCenterSummary: vi.fn().mockResolvedValue({
        avatar: 'data:image/svg+xml;base64,abc',
        bio: '外贸与平台协同负责人',
        loginEmail: 'chen.shuangpeng@meilong-ceramics.com',
        loginMethods: [{ type: 'EMAIL_PASSWORD', label: '邮箱密码', value: 'chen.shuangpeng@meilong-ceramics.com' }],
        loginPhone: '+8613900000001',
        workEmail: 'chen.shuangpeng@meilong-ceramics.com',
        workPhone: '+8613900000001',
      }),
    }

    const useCase = new PersonalCenterUseCase(
      sessionContextUseCase as any,
      accessSummaryUseCase as any,
      identitySummaryPort as any,
    )

    await expect(useCase.execute({ user: { sub: 'user-1', aid: 'account-1', sid: 'session-1' } } as any))
      .resolves.toEqual({
        userProfile: {
          avatar: 'data:image/svg+xml;base64,abc',
          displayName: '陈双鹏',
          bio: '外贸与平台协同负责人',
          loginEmail: 'chen.shuangpeng@meilong-ceramics.com',
          loginPhone: '+8613900000001',
          loginMethods: [{ type: 'EMAIL_PASSWORD', label: '邮箱密码', value: 'chen.shuangpeng@meilong-ceramics.com' }],
        },
        accountContext: {
          accountId: 'account-1',
          accountName: '陈双鹏 / 美隆陶瓷',
          tenantId: 'tenant-1',
          tenantName: '潮州市美隆陶瓷实业有限公司',
          scopeLevel: 'TENANT',
          roles: [{ roleId: 'role-1', code: 'tenant.admin', name: '租户管理员' }],
          workEmail: 'chen.shuangpeng@meilong-ceramics.com',
          workPhone: '+8613900000001',
        },
        securityEntries: [
          { code: 'session-security', label: '会话管理', path: '/account/security' },
          { code: 'mfa-security', label: 'MFA 与恢复码', path: '/account/security' },
        ],
      })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --dir /Users/acehood/Documents/GitHub/oes/src/services/api-gateway exec vitest run src/modules/auth-bff/application/use-cases/personal-center.use-case.spec.ts
```

Expected: FAIL because `PersonalCenterUseCase` does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

Create `src/services/api-gateway/src/modules/auth-bff/application/use-cases/personal-center.use-case.ts`:

```ts
import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'

@Injectable()
// Aggregates the first-stage personal-center payload without mixing user identity and account context semantics.
export class PersonalCenterUseCase {
  constructor(
    private readonly sessionContextUseCase: any,
    private readonly sessionAccessSummaryUseCase: any,
    private readonly identitySummaryPort: any,
  ) {}

  async execute(source: DownstreamRequestSource) {
    const [sessionContext, accessSummary, identitySummary] = await Promise.all([
      this.sessionContextUseCase.execute(source),
      this.sessionAccessSummaryUseCase.execute(source),
      this.identitySummaryPort.getPersonalCenterSummary(source.user?.sub ?? '', source.user?.aid ?? ''),
    ])

    return {
      userProfile: {
        avatar: identitySummary.avatar,
        displayName: sessionContext.operator?.displayName,
        bio: identitySummary.bio,
        loginEmail: identitySummary.loginEmail,
        loginPhone: identitySummary.loginPhone,
        loginMethods: identitySummary.loginMethods ?? [],
      },
      accountContext: {
        accountId: sessionContext.account?.accountId ?? '',
        accountName: sessionContext.account?.name,
        tenantId: sessionContext.tenant?.tenantId,
        tenantName: sessionContext.tenant?.name,
        scopeLevel: sessionContext.scopeLevel,
        roles: accessSummary.roles ?? [],
        workEmail: identitySummary.workEmail,
        workPhone: identitySummary.workPhone,
      },
      securityEntries: [
        { code: 'session-security', label: '会话管理', path: '/account/security' },
        { code: 'mfa-security', label: 'MFA 与恢复码', path: '/account/security' },
      ],
    }
  }
}
```

- [ ] **Step 4: Wire the endpoint**

Add this to `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`:

```ts
  @Get('personal-center')
  @ApiOperation({
    summary: 'Get the authenticated personal center summary',
    description:
      'Returns first-stage personal-center data with separate user-level profile information and current account-level work context.'
  })
  @ApiResponse({
    status: 200,
    type: PersonalCenterViewModel,
    description:
      'Returns the user profile summary, current account context, and security/common entry cards for the authenticated session.'
  })
  async getPersonalCenter(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<PersonalCenterViewModel> {
    return this.personalCenterUseCase.execute(source)
  }
```

Also update the controller constructor and module provider list to include `PersonalCenterUseCase`.

- [ ] **Step 5: Run the test to verify it passes**

Run:

```bash
pnpm --dir /Users/acehood/Documents/GitHub/oes/src/services/api-gateway exec vitest run src/modules/auth-bff/application/use-cases/personal-center.use-case.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/api-gateway/src/modules/auth-bff/application/use-cases/personal-center.use-case.ts src/services/api-gateway/src/modules/auth-bff/application/use-cases/personal-center.use-case.spec.ts src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts src/services/api-gateway/src/modules/auth-bff/auth-bff.module.ts
git commit -m "feat: add personal center summary endpoint"
```

## Task 3: Provide the identity-side summary source

**Files:**
- Create: `src/services/api-gateway/src/modules/auth-bff/application/ports/personal-center-summary.port.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter.ts`
- Modify: identity-service query/controller/repository files only if no existing read path can expose login/work contact summaries cleanly
- Test: add or update a focused adapter/use-case spec near the chosen implementation

- [ ] **Step 1: Write the failing adapter contract test**

Add a test that expects the identity-side adapter to return:

```ts
{
  avatar: 'data-or-url',
  bio: '',
  loginEmail: 'chen.shuangpeng@meilong-ceramics.com',
  loginPhone: '+8613900000001',
  loginMethods: [
    { type: 'EMAIL_PASSWORD', label: '邮箱密码', value: 'chen.shuangpeng@meilong-ceramics.com' },
    { type: 'PHONE_PASSWORD', label: '手机密码', value: '+8613900000001' }
  ],
  workEmail: 'chen.shuangpeng@meilong-ceramics.com',
  workPhone: '+8613900000001'
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run the focused spec for the chosen adapter or use case.

Expected: FAIL because no personal-center summary reader exists yet.

- [ ] **Step 3: Add the port definition**

Create `src/services/api-gateway/src/modules/auth-bff/application/ports/personal-center-summary.port.ts`:

```ts
export interface PersonalCenterLoginMethodSummary {
  type: string
  label: string
  value?: string
}

export interface PersonalCenterSummary {
  avatar?: string
  bio?: string
  loginEmail?: string
  loginPhone?: string
  loginMethods: PersonalCenterLoginMethodSummary[]
  workEmail?: string
  workPhone?: string
}

export interface PersonalCenterSummaryPort {
  getPersonalCenterSummary(userId: string, accountId: string): Promise<PersonalCenterSummary>
}
```

- [ ] **Step 4: Implement the minimal data reader**

Implementation rules:

```ts
// In the adapter, compose only the fields already supported by current identity/auth truth.
// Do not invent a writable profile model yet.
// If avatar/bio have no current backend source, return undefined / '' and keep the contract stable.
```

The adapter should:

- read account summary for account name/work contacts if identity-service already owns them
- read login identifiers from the current auth/identity truth source
- map login methods into friendly labels:
  - `EMAIL_PASSWORD` -> `邮箱密码`
  - `PHONE_PASSWORD` -> `手机密码`
  - `EMAIL_OTP` -> `邮箱验证码`
  - `PHONE_OTP` -> `手机验证码`
- return empty `bio` if no real source exists yet rather than fabricating data

- [ ] **Step 5: Run the focused test to verify it passes**

Run the adapter / use-case spec you added in Step 1.

Expected: PASS with stable separation between login methods and work contacts.

- [ ] **Step 6: Commit**

```bash
git add src/services/api-gateway/src/modules/auth-bff/application/ports/personal-center-summary.port.ts src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter.ts
git commit -m "feat: add personal center identity summary reader"
```

## Task 4: Replace the old profile shell with the real personal-center page

**Files:**
- Create: `app/web/apps/tenant-web/src/api/bff/personal-center/index.ts`
- Create: `app/web/apps/tenant-web/src/views/_core/profile/personal-center.vue`
- Create: `app/web/apps/tenant-web/src/views/_core/profile/components/personal-user-section.vue`
- Create: `app/web/apps/tenant-web/src/views/_core/profile/components/personal-account-section.vue`
- Create: `app/web/apps/tenant-web/src/views/_core/profile/components/personal-security-section.vue`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/index.vue`
- Modify: `app/web/apps/tenant-web/src/modules/workbench/routes.ts`

- [ ] **Step 1: Write the failing page-level test or mapping test**

If Vue component tests are already practical in this workspace, add a test that asserts:

```ts
expect(screen.getByText('User 信息')).toBeInTheDocument()
expect(screen.getByText('当前账号上下文')).toBeInTheDocument()
expect(screen.getByText('安全与常用入口')).toBeInTheDocument()
expect(screen.getByText('租户管理员')).toBeInTheDocument()
expect(screen.getByText('工作邮箱')).toBeInTheDocument()
expect(screen.getByText('登录邮箱')).toBeInTheDocument()
```

If component tests are not already established for this view layer, write a focused pure mapping helper test instead and note the manual verification requirement in Task 6.

- [ ] **Step 2: Run the test to verify it fails**

Run the focused UI test or helper test.

Expected: FAIL because the current profile page is still the old tabbed shell.

- [ ] **Step 3: Add the front-end API client**

Create `app/web/apps/tenant-web/src/api/bff/personal-center/index.ts`:

```ts
import { requestClient } from '#/api/request'

export namespace PersonalCenterApi {
  export interface LoginMethod {
    type: string
    label: string
    value?: string
  }

  export interface UserProfile {
    avatar?: string
    bio?: string
    displayName?: string
    loginEmail?: string
    loginMethods: LoginMethod[]
    loginPhone?: string
  }

  export interface RoleSummary {
    roleId: string
    code: string
    name: string
  }

  export interface AccountContext {
    accountId: string
    accountName?: string
    roles: RoleSummary[]
    scopeLevel: 'SYSTEM' | 'TENANT'
    tenantId?: string
    tenantName?: string
    workEmail?: string
    workPhone?: string
  }

  export interface SecurityEntry {
    code: string
    label: string
    path: string
  }

  export interface Summary {
    userProfile: UserProfile
    accountContext: AccountContext
    securityEntries: SecurityEntry[]
  }
}

export async function getPersonalCenterApi() {
  return requestClient.get<PersonalCenterApi.Summary>('/auth/personal-center')
}
```

- [ ] **Step 4: Build the page and sections**

Create `app/web/apps/tenant-web/src/views/_core/profile/personal-center.vue` with this structure:

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Card, Spin } from 'ant-design-vue'
import { getPersonalCenterApi } from '#/api/bff/personal-center'
import PersonalUserSection from './components/personal-user-section.vue'
import PersonalAccountSection from './components/personal-account-section.vue'
import PersonalSecuritySection from './components/personal-security-section.vue'

const loading = ref(false)
const summary = ref()

async function loadSummary() {
  loading.value = true
  try {
    summary.value = await getPersonalCenterApi()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadSummary()
})
</script>

<template>
  <div class="space-y-5 p-5">
    <Spin :spinning="loading">
      <PersonalUserSection :profile="summary?.userProfile" />
      <PersonalAccountSection :context="summary?.accountContext" />
      <PersonalSecuritySection :entries="summary?.securityEntries ?? []" />
    </Spin>
  </div>
</template>
```

Required rendering rules:

- `PersonalUserSection`
  - editable: avatar, display name, bio
  - read-only: login email, login phone, login methods
- `PersonalAccountSection`
  - read-only: account name, tenant name, scope, role tags, work email, work phone
  - include switch-account entry button
- `PersonalSecuritySection`
  - render navigation cards/buttons only
  - do not inline MFA/session management forms here

- [ ] **Step 5: Replace the old profile index**

Update `app/web/apps/tenant-web/src/views/_core/profile/index.vue` to:

```vue
<script setup lang="ts">
import PersonalCenter from './personal-center.vue'
</script>

<template>
  <PersonalCenter />
</template>
```

- [ ] **Step 6: Run the focused test to verify it passes**

Run the focused UI/helper test you added in Step 1.

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/web/apps/tenant-web/src/api/bff/personal-center/index.ts app/web/apps/tenant-web/src/views/_core/profile/index.vue app/web/apps/tenant-web/src/views/_core/profile/personal-center.vue app/web/apps/tenant-web/src/views/_core/profile/components/personal-user-section.vue app/web/apps/tenant-web/src/views/_core/profile/components/personal-account-section.vue app/web/apps/tenant-web/src/views/_core/profile/components/personal-security-section.vue
git commit -m "feat: add personal center page shell"
```

## Task 5: Enable low-risk profile editing only

**Files:**
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/components/personal-user-section.vue`
- Modify: `app/web/apps/tenant-web/src/api/bff/personal-center/index.ts`
- Modify: back-end contract files if a write endpoint is required
- Test: front-end save-state test or mapping helper test

- [ ] **Step 1: Write the failing edit-behavior test**

Test expectations:

```ts
expect(saveButton).toBeEnabled()
expect(screen.getByLabelText('显示名')).toBeEnabled()
expect(screen.getByLabelText('个人简介')).toBeEnabled()
expect(screen.getByText('登录邮箱')).toBeInTheDocument()
expect(screen.getByText('工作邮箱')).toBeInTheDocument()
expect(loginEmailField).toBeDisabled()
expect(workEmailField).toBeDisabled()
```

- [ ] **Step 2: Run the test to verify it fails**

Run the focused UI test.

Expected: FAIL because the editable/read-only boundary is not fully implemented yet.

- [ ] **Step 3: Implement the minimal edit surface**

Rules for `personal-user-section.vue`:

```ts
const editableFields = ['avatar', 'displayName', 'bio']
const readOnlyFields = ['loginEmail', 'loginPhone']
```

UI rules:

- show inline save button for `displayName` / `bio`
- avatar upload/change control may be a placeholder button if upload backend is not frozen yet
- login methods render as a read-only list
- work contacts must never appear in the editable form

If no stable write API exists yet:

- wire save button to a disabled state or placeholder banner
- document the blocker in the feature packet before merging consumer code

- [ ] **Step 4: Run the test to verify it passes**

Run the focused UI test again.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/web/apps/tenant-web/src/views/_core/profile/components/personal-user-section.vue
git commit -m "feat: enforce personal center edit boundaries"
```

## Task 6: Verification, docs sync, and manual walkthrough

**Files:**
- Modify: `docs/plans/features/personal-center.md`
- Modify: contract docs touched in earlier tasks

- [ ] **Step 1: Run the back-end focused tests**

Run:

```bash
pnpm --dir /Users/acehood/Documents/GitHub/oes/src/services/api-gateway exec vitest run src/modules/auth-bff/application/use-cases/personal-center.use-case.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run the front-end focused tests**

Run:

```bash
pnpm --dir /Users/acehood/Documents/GitHub/oes/app/web exec vitest run apps/tenant-web/src/store/test-user-avatar.spec.ts apps/tenant-web/src/views/_core/profile/personal-center.spec.ts --dom
```

Expected: PASS, or if no page component spec exists, replace the second path with the actual helper/component spec created in Tasks 4-5.

- [ ] **Step 3: Run tenant-web typecheck**

Run:

```bash
pnpm --dir /Users/acehood/Documents/GitHub/oes/app/web --filter @oes/tenant-web typecheck
```

Expected: PASS.

- [ ] **Step 4: Manual walkthrough**

Verify:

- the page shows a dedicated `User` info section
- the page shows a dedicated current `Account` context section
- current role tags come from the current account only
- login email/phone and work email/phone are visually separated
- only avatar/display name/bio appear editable
- account switching entry still routes to the existing context-switch path
- security cards route to existing security flows instead of embedding new ones

- [ ] **Step 5: Sync packet status**

Update `docs/plans/features/personal-center.md`:

```md
## 13. 当前实现状态

- 已补个人中心黑盒 summary contract。
- 已实现单页分区式个人中心页面。
- 已明确 `user` 级登录方式与 `account` 级工作联系方式分离展示。
- 第一阶段仅开放头像、显示名、个人简介编辑。
```

- [ ] **Step 6: Commit**

```bash
git add docs/plans/features/personal-center.md docs/contracts/api-gateway/auth-bff-login.md
git commit -m "docs: record personal center implementation status"
```
