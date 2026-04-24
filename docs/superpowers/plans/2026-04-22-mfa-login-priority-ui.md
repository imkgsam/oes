# MFA Login Priority UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align login-scene MFA with the approved model: account-first orchestration, tenant-priority-ordered factor candidates, and a single-factor step UI with fallback switching.

**Architecture:** Keep MFA factor ownership at the user layer, keep MFA requirement and ordering at the selected account's tenant policy layer, and expose that ordering explicitly through auth-service and auth-bff contracts. Tenant-web should consume the ordered factor list as one active factor plus a deferred fallback picker instead of rendering every factor at once.

**Tech Stack:** NestJS, CQRS, gRPC/proto contracts, Vue 3, Pinia, Ant Design Vue, Jest, Vitest.

---

### Task 1: Enrich MFA Factor Challenge Contracts With Priority

**Files:**
- Modify: `src/common/src/contracts/auth_service/auth.proto`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/auth-response.view-model.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/auth-response.mapper.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`

- [ ] **Step 1: Write the failing transport tests for ordered MFA factor metadata**

```ts
it('maps selectAccount MFA_REQUIRED results with factor priority into the grpc response', async () => {
  queryBus.execute = jest.fn().mockResolvedValue({
    status: 'MFA_REQUIRED',
    challengeId: 'login-mfa-flow-token',
    scenario: 'LOGIN',
    defaultFactor: 'EMAIL_OTP',
    availableFactors: [
      { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 },
      { type: 'TOTP', label: '认证器 App', priority: 2 },
    ],
    passwordSetupRequired: false,
  })

  const response = await controller.selectAccount({
    userId: 'user-1',
    accountId: 'account-1',
    loginMethod: 'EMAIL_PASSWORD',
  })

  expect(response.availableFactors).toEqual([
    expect.objectContaining({ type: MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP, priority: 1 }),
    expect.objectContaining({ type: MfaBindingType.MFA_BINDING_TYPE_TOTP, priority: 2 }),
  ])
})
```

```ts
it('maps challenge availableFactors priority into the auth-bff response model', () => {
  const result = toAuthResponseViewModel({
    status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
    challengeId: 'challenge-1',
    availableFactors: [
      { type: MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP, label: '邮箱验证码', priority: 1 },
      { type: MfaBindingType.MFA_BINDING_TYPE_TOTP, label: '认证器 App', priority: 2 },
    ],
  } as any)

  expect(result.challenge?.availableFactors).toEqual([
    { type: MfaFactorTypeViewModel.EMAIL_OTP, label: '邮箱验证码', priority: 1 },
    { type: MfaFactorTypeViewModel.TOTP, label: '认证器 App', priority: 2 },
  ])
})
```

- [ ] **Step 2: Run the focused tests to verify the contract gap fails**

Run:
```bash
pnpm --filter auth-service exec jest src/interfaces/grpc/auth.grpc.controller.spec.ts --runInBand
pnpm --filter api-gateway exec jest src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand --no-cache
```

Expected: FAIL because `LoginMfaFactorOption` and the response mapping do not carry `priority`.

- [ ] **Step 3: Add the priority field through proto and response mappers**

```proto
message LoginMfaFactorOption {
  MfaBindingType type = 1;
  string label = 2;
  int32 priority = 3;
}
```

```ts
availableFactors: result.availableFactors.map((factor) => ({
  type: this.toProtoMfaBindingType(factor.type),
  label: factor.label,
  priority: factor.priority,
}))
```

```ts
export class MfaFactorOptionViewModel {
  @ApiProperty({ enum: MfaFactorTypeViewModel, enumName: 'MfaFactorType' })
  type!: MfaFactorTypeViewModel

  @ApiProperty({ description: 'User-facing factor label.' })
  label!: string

  @ApiProperty({ description: 'Tenant-policy priority for this factor within the selected account context.' })
  priority!: number
}
```

- [ ] **Step 4: Re-run the focused tests to verify the contract passes**

Run:
```bash
pnpm --filter auth-service exec jest src/interfaces/grpc/auth.grpc.controller.spec.ts --runInBand
pnpm --filter api-gateway exec jest src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand --no-cache
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/common/src/contracts/auth_service/auth.proto src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/auth-response.view-model.ts src/services/api-gateway/src/modules/auth-bff/application/use-cases/auth-response.mapper.ts src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts
git commit -m "feat: expose ordered login mfa factors"
```

### Task 2: Keep Auth-Service MFA Orchestration Explicitly Ordered By Selected Account Policy

**Files:**
- Modify: `src/services/system/auth-service/src/application/services/mfa/login-mfa-orchestration.service.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/select-account.handler.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/select-account.handler.spec.ts`
- Test: `src/services/system/auth-service/src/application/services/mfa/login-mfa-orchestration.service.spec.ts`

- [ ] **Step 1: Write failing service tests for priority-preserving factor resolution**

```ts
it('returns only available user factors in tenant priority order', async () => {
  tenantMfaPolicyRepository.getTenantPolicy = jest.fn().mockResolvedValue(
    TenantMfaPolicyEntity.defaults('tenant-1')
  )
  mfaBindingManagementService.listBindings = jest.fn().mockResolvedValue([
    { type: 'EMAIL_OTP', enabled: true, available: true, bindingId: 'b1', destination: 'a***@x.com' },
    { type: 'SMS_OTP', enabled: false, available: false, bindingId: 'b2', destination: '' },
    { type: 'TOTP', enabled: true, available: true, bindingId: 'b3', destination: '' },
    { type: 'BACKUP_CODE', enabled: true, available: false, bindingId: 'b4', destination: '' },
  ])

  const challenge = await service.resolveChallengeForSelectedAccount({
    userId: 'user-1',
    accountId: 'account-1',
    tenantId: 'tenant-1',
    scopeLevel: 'TENANT',
    loginMethod: LoginMethodEnum.EMAIL_PASSWORD,
  })

  expect(challenge?.defaultFactor).toBe('EMAIL_OTP')
  expect(challenge?.availableFactors).toEqual([
    { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 },
    { type: 'TOTP', label: '认证器 App', priority: 3 },
  ])
})
```

- [ ] **Step 2: Run the focused auth-service tests to verify failure**

Run:
```bash
pnpm --filter auth-service exec jest src/application/commands/auth/select-account.handler.spec.ts src/application/services/mfa/login-mfa-orchestration.service.spec.ts --runInBand
```

Expected: FAIL because `LoginMfaFactorOption` does not yet include explicit priority assertions.

- [ ] **Step 3: Add priority to the orchestration result without changing the account-first decision order**

```ts
export interface LoginMfaFactorOption {
  type: TenantMfaFactor
  label: string
  priority: number
}
```

```ts
return policy
  .getFactors()
  .filter((factorPolicy) => factorPolicy.enabled)
  .map((factorPolicy) => {
    const binding = bindingMap.get(factorPolicy.factor)
    if (!binding || !binding.enabled || !binding.available) {
      return null
    }
    return {
      type: factorPolicy.factor,
      label: labelForFactor(factorPolicy.factor),
      priority: factorPolicy.priority,
    }
  })
  .filter((value): value is LoginMfaFactorOption => Boolean(value))
```

- [ ] **Step 4: Re-run the focused auth-service tests**

Run:
```bash
pnpm --filter auth-service exec jest src/application/commands/auth/select-account.handler.spec.ts src/application/services/mfa/login-mfa-orchestration.service.spec.ts --runInBand
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/system/auth-service/src/application/services/mfa/login-mfa-orchestration.service.ts src/services/system/auth-service/src/application/commands/auth/select-account.handler.ts src/services/system/auth-service/src/application/commands/auth/select-account.handler.spec.ts src/services/system/auth-service/src/application/services/mfa/login-mfa-orchestration.service.spec.ts
git commit -m "feat: preserve tenant priority in login mfa orchestration"
```

### Task 3: Refactor Tenant-Web Store Into Single-Factor MFA Step State

**Files:**
- Modify: `app/web/apps/tenant-web/src/store/auth.ts`
- Test: `app/web/apps/tenant-web/src/store/auth.spec.ts`

- [ ] **Step 1: Write failing store tests for ordered fallback MFA state**

```ts
it('stores the default factor as the active step and keeps ordered fallback factors separately', async () => {
  loginApiMock.mockResolvedValue({
    status: 'MFA_REQUIRED',
    nextStep: 'COMPLETE_MFA',
    challenge: {
      challengeId: 'challenge-1',
      defaultFactor: 'EMAIL_OTP',
      availableFactors: [
        { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 },
        { type: 'TOTP', label: '认证器 App', priority: 2 },
      ],
      factorChallengeId: 'factor-1',
      destination: 'a***@x.com',
    },
  })

  const store = useAuthStore()
  await store.authLogin({ username: 'a@example.com', password: 'secret' })

  expect(store.pendingMfaFactor).toBe('EMAIL_OTP')
  expect(store.pendingMfaAvailableFactors.map((item) => item.type)).toEqual(['EMAIL_OTP', 'TOTP'])
})
```

```ts
it('keeps factor order stable when switching to a fallback factor', async () => {
  const store = useAuthStore()
  store.pendingChallengeId = 'challenge-1'
  store.pendingMfaFactor = 'EMAIL_OTP'
  store.pendingMfaAvailableFactors = [
    { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 },
    { type: 'TOTP', label: '认证器 App', priority: 2 },
  ]

  await store.switchPendingMfaFactor('TOTP')

  expect(store.pendingMfaFactor).toBe('TOTP')
  expect(store.pendingMfaAvailableFactors.map((item) => item.priority)).toEqual([1, 2])
})
```

- [ ] **Step 2: Run the store tests to verify failure**

Run:
```bash
pnpm --dir app/web/apps/tenant-web exec vitest run src/store/auth.spec.ts
```

Expected: FAIL because store factor entries currently do not include `priority`.

- [ ] **Step 3: Add priority-aware pending MFA state in the auth store**

```ts
const pendingMfaAvailableFactors = ref<
  Array<{
    label: string;
    type: AuthApi.MfaFactor;
    priority: number;
  }>
>([])
```

```ts
pendingMfaAvailableFactors.value = [...(result.challenge?.availableFactors ?? [])]
  .sort((left, right) => left.priority - right.priority)
```

- [ ] **Step 4: Re-run the store tests**

Run:
```bash
pnpm --dir app/web/apps/tenant-web exec vitest run src/store/auth.spec.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/web/apps/tenant-web/src/store/auth.ts app/web/apps/tenant-web/src/store/auth.spec.ts
git commit -m "feat: keep ordered login mfa factor state"
```

### Task 4: Rebuild MFA Page As One Active Factor Plus Deferred Alternatives

**Files:**
- Modify: `app/web/apps/tenant-web/src/views/_core/authentication/mfa.vue`
- Test: `app/web/apps/tenant-web/src/views/_core/authentication/mfa.spec.ts`

- [ ] **Step 1: Write failing component tests for the single-factor step UI**

```ts
it('renders only the active factor by default and hides fallback options behind the switcher', async () => {
  authStore.pendingMfaFactor = 'EMAIL_OTP'
  authStore.pendingMfaAvailableFactors = [
    { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 },
    { type: 'TOTP', label: '认证器 App', priority: 2 },
  ]

  const wrapper = mount(MfaView, { global: { plugins: [pinia] } })

  expect(wrapper.text()).toContain('邮箱验证码')
  expect(wrapper.text()).toContain('使用其他验证方式')
  expect(wrapper.text()).not.toContain('认证器 App')
})

it('reveals lower-priority factors in order after opening the fallback picker', async () => {
  const wrapper = mount(MfaView, { global: { plugins: [pinia] } })
  await wrapper.find('button[data-role="mfa-switcher"]').trigger('click')

  const optionLabels = wrapper.findAll('[data-role="mfa-factor-option"]').map((node) => node.text())
  expect(optionLabels).toEqual(['认证器 App'])
})
```

- [ ] **Step 2: Run the MFA component tests to verify failure**

Run:
```bash
pnpm --dir app/web/apps/tenant-web exec vitest run src/views/_core/authentication/mfa.spec.ts
```

Expected: FAIL because the current page renders all factor buttons immediately.

- [ ] **Step 3: Implement the one-factor step UI**

```vue
<template>
  <div class="mfa-step">
    <AuthenticationCodeLogin
      :form-schema="formSchema"
      :loading="authStore.loginLoading"
      :show-back="true"
      :sub-title="subTitle"
      title="完成二次验证"
      @submit="handleSubmit"
    />

    <div class="mfa-step__meta">
      <Tag color="blue">{{ factorLabel }}</Tag>
      <div v-if="authStore.pendingMfaDestination" class="mfa-step__destination">
        当前验证码已发送至 {{ authStore.pendingMfaDestination }}
      </div>
    </div>

    <Button
      data-role="mfa-switcher"
      type="link"
      @click="factorPickerOpen = !factorPickerOpen"
    >
      使用其他验证方式
    </Button>

    <div v-if="factorPickerOpen" class="mfa-step__fallbacks">
      <Button
        v-for="factor in fallbackFactors"
        :key="factor.type"
        data-role="mfa-factor-option"
        block
        @click="handleSwitchFactor(factor.type)"
      >
        {{ factor.label }}
      </Button>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Re-run the MFA component tests**

Run:
```bash
pnpm --dir app/web/apps/tenant-web exec vitest run src/views/_core/authentication/mfa.spec.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/web/apps/tenant-web/src/views/_core/authentication/mfa.vue app/web/apps/tenant-web/src/views/_core/authentication/mfa.spec.ts
git commit -m "feat: simplify login mfa factor switching"
```

### Task 5: Run Final MFA-Focused Verification

**Files:**
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`
- Modify: `app/web/apps/tenant-web/src/store/auth.spec.ts`
- Modify: `app/web/apps/tenant-web/src/views/_core/authentication/mfa.spec.ts`

- [ ] **Step 1: Run the combined targeted test set**

Run:
```bash
pnpm --filter auth-service exec jest src/interfaces/grpc/auth.grpc.controller.spec.ts src/application/commands/auth/select-account.handler.spec.ts src/application/services/mfa/login-mfa-orchestration.service.spec.ts --runInBand
pnpm --filter api-gateway exec jest src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand --no-cache
pnpm --dir app/web/apps/tenant-web exec vitest run src/store/auth.spec.ts src/views/_core/authentication/mfa.spec.ts
pnpm --dir app/web/apps/tenant-web exec vue-tsc --noEmit
```

Expected: PASS on all targeted suites.

- [ ] **Step 2: Commit**

```bash
git add src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts src/services/system/auth-service/src/application/commands/auth/select-account.handler.spec.ts src/services/system/auth-service/src/application/services/mfa/login-mfa-orchestration.service.spec.ts src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts app/web/apps/tenant-web/src/store/auth.spec.ts app/web/apps/tenant-web/src/views/_core/authentication/mfa.spec.ts
git commit -m "test: cover account-priority login mfa flow"
```
