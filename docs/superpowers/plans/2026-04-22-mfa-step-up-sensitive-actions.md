# MFA Step-Up Sensitive Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the approved MFA model from login-only MFA into high-risk self-service scenarios: new-device login, password change, and email/phone binding change.

**Architecture:** Keep MFA factor assets at the user layer and MFA policy at the selected account tenant layer. Add an authenticated step-up MFA flow that returns a short-lived grant token for sensitive mutations, while keeping login MFA account-selection/session issuance separate. New-device login depends on an explicit trusted-device model, not raw IP or user-agent matching.

**Tech Stack:** NestJS, CQRS, gRPC/proto contracts, Prisma, API Gateway BFF, Jest, proto lint.

---

## File Structure

- Modify: `src/common/src/contracts/auth_service/auth.proto`
  - Add non-login `MfaScenario` values and step-up MFA RPC messages.
- Modify: `src/services/system/auth-service/prisma/schema.prisma`
  - Extend `TenantMfaScenario` and add trusted-device persistence when the new-device slice is implemented.
- Modify: `src/services/system/auth-service/src/domain/entities/tenant-mfa-policy.entity.ts`
  - Represent scenario requirements beyond `LOGIN` without per-scenario factor priority.
- Modify: `src/services/system/auth-service/src/domain/repositories/tenant-mfa-policy.repository.ts`
  - Expose scenario requirement reads/writes.
- Modify: `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.tenant-mfa-policy.repository.ts`
  - Persist all enabled scenario requirements while keeping global factor ordering tenant-scoped.
- Create: `src/services/system/auth-service/src/application/services/mfa/step-up-mfa-orchestration.service.ts`
  - Issue step-up challenge tokens, request OTP factor challenges, verify factors, and mint short-lived grant tokens.
- Create: `src/services/system/auth-service/src/application/services/mfa/step-up-mfa-orchestration.service.spec.ts`
  - Cover factor ordering, invalid factor rejection, OTP factor challenge requirement, and grant scenario binding.
- Create: `src/services/system/auth-service/src/application/services/mfa/step-up-mfa-grant.service.ts`
  - Verify and consume short-lived grants for password/contact mutations.
- Create: `src/services/system/auth-service/src/application/services/mfa/step-up-mfa-grant.service.spec.ts`
  - Cover wrong-user, wrong-account, wrong-tenant, wrong-scenario, and expired grant rejection.
- Modify: `src/services/system/auth-service/src/application/commands/auth/change-own-password.command.ts`
  - Accept an optional `mfaGrantToken`.
- Modify: `src/services/system/auth-service/src/application/commands/auth/change-own-password.handler.ts`
  - Require a valid `CHANGE_PASSWORD` grant when tenant policy requires that scenario.
- Modify: `src/services/system/auth-service/src/application/commands/auth/verify-email-binding.command.ts`
  - Accept an optional `mfaGrantToken`.
- Modify: `src/services/system/auth-service/src/application/commands/auth/verify-email-binding.handler.ts`
  - Require a valid `CHANGE_CONTACT` grant when tenant policy requires contact-change MFA.
- Modify: `src/services/system/auth-service/src/application/commands/auth/verify-phone-binding.command.ts`
  - Accept an optional `mfaGrantToken`.
- Modify: `src/services/system/auth-service/src/application/commands/auth/verify-phone-binding.handler.ts`
  - Require a valid `CHANGE_CONTACT` grant when tenant policy requires contact-change MFA.
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`
  - Map new step-up MFA RPCs and grant-bearing mutation requests.
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
  - Add step-up challenge, factor challenge, completion, and grant-bearing mutation adapters.
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.ts`
  - Pass `mfaGrantToken` to password changes.
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/self-contact-binding.use-case.ts`
  - Pass `mfaGrantToken` to email/phone binding verification.
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
  - Add authenticated step-up MFA endpoints and accept grants in sensitive mutation DTOs.
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/self-security.dto.ts`
  - Add grant fields and step-up challenge DTOs.
- Modify: `docs/contracts/auth-service/mfa.md`
  - Document step-up MFA challenge, factor challenge, completion, and grant semantics.
- Modify: `docs/contracts/api-gateway/auth-bff-self-service.md`
  - Document BFF step-up endpoints and grant requirements for password/contact mutation.

## Product Rules

- `LOGIN` remains the only session-establishing MFA flow.
- `CHANGE_PASSWORD` and `CHANGE_CONTACT` are authenticated step-up flows.
- `NEW_DEVICE_LOGIN` must wait for a trusted-device model and must not be implemented by raw IP or raw user-agent equality.
- V1B continues to use tenant global factor priority and does not add per-scenario factor priority or whitelist.
- Strict MFA, where a second factor cannot reuse the same factor family as the primary method, remains deferred.
- Platform default policy remains deferred; tenant policy is the source for V1B scenario requirements.
- Backup code stays in the normal priority list and invalidates the whole active backup-code set after a successful use.

## Scenario Model

```proto
enum MfaScenario {
  MFA_SCENARIO_UNSPECIFIED = 0;
  MFA_SCENARIO_LOGIN = 1;
  MFA_SCENARIO_NEW_DEVICE_LOGIN = 2;
  MFA_SCENARIO_CHANGE_PASSWORD = 3;
  MFA_SCENARIO_CHANGE_CONTACT = 4;
}
```

```ts
export type TenantMfaScenario =
  | 'LOGIN'
  | 'NEW_DEVICE_LOGIN'
  | 'CHANGE_PASSWORD'
  | 'CHANGE_CONTACT'
```

## API Shape

```http
POST /api/v1/auth/security/mfa/challenges
POST /api/v1/auth/security/mfa/factor-challenges
POST /api/v1/auth/security/mfa/complete
```

```json
{
  "scenario": "CHANGE_PASSWORD"
}
```

```json
{
  "challengeId": "signed-step-up-flow",
  "scenario": "CHANGE_PASSWORD",
  "defaultFactor": "EMAIL_OTP",
  "availableFactors": [
    { "type": "EMAIL_OTP", "label": "邮箱验证码", "priority": 1 },
    { "type": "TOTP", "label": "认证器 App", "priority": 2 }
  ]
}
```

```json
{
  "challengeId": "signed-step-up-flow",
  "factor": "EMAIL_OTP"
}
```

```json
{
  "factorChallengeId": "otp-id",
  "destination": "v***@example.com",
  "expiresAt": "2026-04-22T10:00:00.000Z"
}
```

```json
{
  "challengeId": "signed-step-up-flow",
  "factor": "TOTP",
  "code": "123456"
}
```

```json
{
  "mfaGrantToken": "signed-step-up-grant",
  "expiresAt": "2026-04-22T10:03:00.000Z"
}
```

## Task 1: Extend Scenario Contracts

**Files:**
- Modify: `src/common/src/contracts/auth_service/auth.proto`
- Modify: `docs/contracts/auth-service/mfa.md`
- Modify: `docs/contracts/api-gateway/auth-bff-self-service.md`

- [ ] **Step 1: Write the failing proto-facing controller tests**

```ts
it('maps authenticated step-up mfa challenge creation requests', async () => {
  commandBus.execute = jest.fn().mockResolvedValue({
    challengeId: 'step-up-flow-token',
    scenario: 'CHANGE_PASSWORD',
    defaultFactor: 'EMAIL_OTP',
    availableFactors: [{ type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 }]
  })

  const result = await controller.createStepUpMfaChallenge({
    userId: 'user-1',
    accountId: 'account-1',
    tenantId: 'tenant-1',
    scenario: MfaScenario.MFA_SCENARIO_CHANGE_PASSWORD
  })

  expect(result.scenario).toBe(MfaScenario.MFA_SCENARIO_CHANGE_PASSWORD)
  expect(result.defaultFactor).toBe(MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP)
})
```

- [ ] **Step 2: Run the controller test to verify it fails**

Run: `pnpm --filter auth-service exec jest src/interfaces/grpc/auth.grpc.controller.spec.ts --runInBand`
Expected: FAIL because step-up MFA RPCs and scenario mappings do not exist.

- [ ] **Step 3: Add proto messages and scenario enum values**

```proto
rpc CreateStepUpMfaChallenge(CreateStepUpMfaChallengeRequest) returns (StepUpMfaChallengeResponse);
rpc RequestStepUpMfaFactorChallenge(RequestStepUpMfaFactorChallengeRequest) returns (MfaFactorChallengeResponse);
rpc CompleteStepUpMfaChallenge(CompleteStepUpMfaChallengeRequest) returns (StepUpMfaGrantResponse);

message CreateStepUpMfaChallengeRequest {
  string user_id = 1;
  string account_id = 2;
  string tenant_id = 3;
  MfaScenario scenario = 4;
}

message StepUpMfaChallengeResponse {
  string challenge_id = 1;
  MfaScenario scenario = 2;
  MfaBindingType default_factor = 3;
  repeated LoginMfaFactorOption available_factors = 4;
}

message RequestStepUpMfaFactorChallengeRequest {
  string challenge_id = 1;
  MfaBindingType factor = 2;
}

message MfaFactorChallengeResponse {
  string factor_challenge_id = 1;
  string destination = 2;
  string expires_at = 3;
}

message CompleteStepUpMfaChallengeRequest {
  string challenge_id = 1;
  MfaBindingType factor = 2;
  string code = 3;
  string factor_challenge_id = 4;
}

message StepUpMfaGrantResponse {
  string mfa_grant_token = 1;
  string expires_at = 2;
}
```

- [ ] **Step 4: Re-run proto lint and the controller test**

Run: `pnpm proto:lint`
Expected: PASS

Run: `pnpm --filter auth-service exec jest src/interfaces/grpc/auth.grpc.controller.spec.ts --runInBand`
Expected: PASS

## Task 2: Generalize Tenant Scenario Requirements

**Files:**
- Modify: `src/services/system/auth-service/prisma/schema.prisma`
- Modify: `src/services/system/auth-service/src/domain/entities/tenant-mfa-policy.entity.ts`
- Modify: `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.tenant-mfa-policy.repository.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/update-tenant-mfa-policy.command.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/update-tenant-mfa-policy.handler.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/update-tenant-mfa-policy.command.spec.ts`
- Test: `src/services/system/auth-service/src/application/services/mfa/login-mfa-orchestration.service.spec.ts`

- [ ] **Step 1: Write failing policy tests for non-login scenario requirements**

```ts
it('stores required flags for each managed scenario while preserving global factor order', () => {
  const policy = TenantMfaPolicyEntity.defaults('tenant-1')

  policy.setScenarioRequired('LOGIN', true)
  policy.setScenarioRequired('CHANGE_PASSWORD', true)
  policy.setScenarioRequired('CHANGE_CONTACT', true)

  expect(policy.isScenarioRequired('LOGIN')).toBe(true)
  expect(policy.isScenarioRequired('CHANGE_PASSWORD')).toBe(true)
  expect(policy.isScenarioRequired('CHANGE_CONTACT')).toBe(true)
  expect(policy.getFactors().map((item) => item.factor)).toEqual([
    MfaType.EMAIL_OTP,
    MfaType.SMS_OTP,
    MfaType.TOTP,
    MfaType.BACKUP_CODE
  ])
})
```

- [ ] **Step 2: Run the policy tests to verify they fail**

Run: `pnpm --filter auth-service exec jest src/application/commands/auth/update-tenant-mfa-policy.command.spec.ts src/application/services/mfa/login-mfa-orchestration.service.spec.ts --runInBand`
Expected: FAIL because only `loginRequired` exists.

- [ ] **Step 3: Implement scenario requirement storage**

```ts
const MANAGED_SCENARIOS: TenantMfaScenario[] = [
  'LOGIN',
  'NEW_DEVICE_LOGIN',
  'CHANGE_PASSWORD',
  'CHANGE_CONTACT'
]

export class TenantMfaPolicyEntity {
  constructor(
    public readonly tenantId: string,
    private readonly scenarioRequirements: Map<TenantMfaScenario, boolean>,
    private readonly factors: TenantMfaFactorPolicySnapshot[]
  ) {}

  isScenarioRequired(scenario: TenantMfaScenario): boolean {
    return Boolean(this.scenarioRequirements.get(scenario))
  }

  setScenarioRequired(scenario: TenantMfaScenario, required: boolean): void {
    this.scenarioRequirements.set(scenario, required)
  }

  isLoginRequired(): boolean {
    return this.isScenarioRequired('LOGIN')
  }

  setLoginRequired(required: boolean): void {
    this.setScenarioRequired('LOGIN', required)
  }
}
```

- [ ] **Step 4: Re-run the policy tests and Prisma generation**

Run: `pnpm --filter auth-service prisma:generate`
Expected: PASS

Run: `pnpm --filter auth-service exec jest src/application/commands/auth/update-tenant-mfa-policy.command.spec.ts src/application/services/mfa/login-mfa-orchestration.service.spec.ts --runInBand`
Expected: PASS

## Task 3: Implement Auth-Service Step-Up MFA Orchestration

**Files:**
- Create: `src/services/system/auth-service/src/application/services/mfa/step-up-mfa-orchestration.service.ts`
- Create: `src/services/system/auth-service/src/application/services/mfa/step-up-mfa-orchestration.service.spec.ts`
- Create: `src/services/system/auth-service/src/application/services/mfa/step-up-mfa-grant.service.ts`
- Create: `src/services/system/auth-service/src/application/services/mfa/step-up-mfa-grant.service.spec.ts`
- Modify: `src/services/system/auth-service/src/modules/auth/auth.module.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/index.ts`

- [ ] **Step 1: Write failing orchestration tests**

```ts
it('creates a step-up challenge from tenant priority and active user factors', async () => {
  tenantMfaPolicyRepository.getTenantPolicy = jest.fn().mockResolvedValue(
    tenantPolicyRequiredFor('tenant-1', 'CHANGE_PASSWORD')
  )
  mfaBindingManagementService.listBindings = jest.fn().mockResolvedValue([
    { type: MfaType.TOTP, enabled: true, available: true },
    { type: MfaType.EMAIL_OTP, enabled: true, available: true }
  ])

  const result = await service.createChallenge({
    userId: 'user-1',
    accountId: 'account-1',
    tenantId: 'tenant-1',
    scenario: 'CHANGE_PASSWORD'
  })

  expect(result.defaultFactor).toBe(MfaType.EMAIL_OTP)
  expect(result.availableFactors.map((item) => item.type)).toEqual([
    MfaType.EMAIL_OTP,
    MfaType.TOTP
  ])
})
```

```ts
it('mints a scenario-bound grant only after a selected factor verifies', async () => {
  mfaChallengeVerificationService.verifySelectedFactor = jest.fn().mockResolvedValue(true)

  const result = await service.completeChallenge({
    challengeId: signedStepUpFlowToken,
    factor: MfaType.TOTP,
    code: '123456'
  })

  expect(jwtService.signAccessToken).toHaveBeenCalledWith(
    expect.objectContaining({
      tokenType: 'mfa_step_up_grant',
      scenario: 'CHANGE_PASSWORD',
      sub: 'user-1',
      aid: 'account-1',
      tid: 'tenant-1'
    }),
    { expiresIn: '3m' }
  )
  expect(result.mfaGrantToken).toBe('signed-grant-token')
})
```

- [ ] **Step 2: Run the new service tests to verify they fail**

Run: `pnpm --filter auth-service exec jest src/application/services/mfa/step-up-mfa-orchestration.service.spec.ts src/application/services/mfa/step-up-mfa-grant.service.spec.ts --runInBand`
Expected: FAIL because the services do not exist.

- [ ] **Step 3: Implement the orchestration service**

```ts
export interface StepUpMfaFlowPayload {
  aid: string
  scenario: Exclude<TenantMfaScenario, 'LOGIN'>
  sub: string
  tid: string
  tokenType: 'mfa_step_up_flow'
}

export interface StepUpMfaGrantPayload {
  aid: string
  scenario: Exclude<TenantMfaScenario, 'LOGIN'>
  sub: string
  tid: string
  tokenType: 'mfa_step_up_grant'
}
```

```ts
async createChallenge(input: StepUpMfaChallengeInput): Promise<StepUpMfaChallengeView> {
  const policy = await this.tenantMfaPolicyRepository.getTenantPolicy(input.tenantId)
  if (!policy.isScenarioRequired(input.scenario)) {
    return {
      challengeId: '',
      scenario: input.scenario,
      defaultFactor: undefined,
      availableFactors: []
    }
  }

  const availableFactors = await this.resolveAvailableFactors(input.userId, policy)
  if (availableFactors.length === 0) {
    throw ExceptionFactory.domain(AUTH_MFA_LOGIN_METHOD_UNAVAILABLE, {
      userId: input.userId,
      tenantId: input.tenantId,
      scenario: input.scenario
    })
  }

  const challengeId = this.jwtService.signAccessToken(
    {
      sub: input.userId,
      aid: input.accountId,
      tid: input.tenantId,
      scenario: input.scenario,
      tokenType: 'mfa_step_up_flow'
    },
    { expiresIn: '10m' }
  )

  return {
    challengeId,
    scenario: input.scenario,
    defaultFactor: availableFactors[0].type,
    availableFactors
  }
}
```

- [ ] **Step 4: Implement grant verification**

```ts
assertGrant(input: {
  accountId: string
  mfaGrantToken?: string
  scenario: Exclude<TenantMfaScenario, 'LOGIN'>
  tenantId: string
  userId: string
}): StepUpMfaGrantPayload {
  if (!input.mfaGrantToken) {
    throw ExceptionFactory.domain(AUTH_MFA_STEP_UP_REQUIRED, {
      userId: input.userId,
      accountId: input.accountId,
      tenantId: input.tenantId,
      scenario: input.scenario
    })
  }

  const payload = this.jwtService.verify<StepUpMfaGrantPayload>(input.mfaGrantToken)
  if (
    payload.tokenType !== 'mfa_step_up_grant' ||
    payload.sub !== input.userId ||
    payload.aid !== input.accountId ||
    payload.tid !== input.tenantId ||
    payload.scenario !== input.scenario
  ) {
    throw ExceptionFactory.domain(AUTH_MFA_STEP_UP_REQUIRED, {
      userId: input.userId,
      accountId: input.accountId,
      tenantId: input.tenantId,
      scenario: input.scenario
    })
  }

  return payload
}
```

- [ ] **Step 5: Re-run the service tests**

Run: `pnpm --filter auth-service exec jest src/application/services/mfa/step-up-mfa-orchestration.service.spec.ts src/application/services/mfa/step-up-mfa-grant.service.spec.ts --runInBand`
Expected: PASS

## Task 4: Protect Password Change With Step-Up Grant

**Files:**
- Modify: `src/services/system/auth-service/src/application/commands/auth/change-own-password.command.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/change-own-password.handler.ts`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/self-security.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/change-own-password.handler.spec.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts`

- [ ] **Step 1: Write failing handler tests**

```ts
it('requires a change-password MFA grant when the tenant scenario is required', async () => {
  tenantMfaPolicyRepository.getTenantPolicy = jest.fn().mockResolvedValue(
    tenantPolicyRequiredFor('tenant-1', 'CHANGE_PASSWORD')
  )

  await expect(
    handler.execute(
      new ChangeOwnPasswordCommand({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        currentPassword: 'old-password',
        newPassword: 'new-password'
      })
    )
  ).rejects.toMatchObject({
    code: 'AUTH_MFA_STEP_UP_REQUIRED'
  })
})
```

- [ ] **Step 2: Run password-change tests to verify failure**

Run: `pnpm --filter auth-service exec jest src/application/commands/auth/change-own-password.handler.spec.ts --runInBand`
Expected: FAIL because password change does not inspect tenant MFA policy.

- [ ] **Step 3: Add grant fields and validation**

```ts
export class ChangeOwnPasswordCommand implements ICommand {
  readonly accountId?: string
  readonly tenantId?: string
  readonly mfaGrantToken?: string
}
```

```ts
if (command.accountId && command.tenantId) {
  const policy = await this.tenantMfaPolicyRepository.getTenantPolicy(command.tenantId)
  if (policy.isScenarioRequired('CHANGE_PASSWORD')) {
    this.stepUpMfaGrantService.assertGrant({
      accountId: command.accountId,
      mfaGrantToken: command.mfaGrantToken,
      scenario: 'CHANGE_PASSWORD',
      tenantId: command.tenantId,
      userId: command.userId
    })
  }
}
```

- [ ] **Step 4: Re-run auth-service and BFF password tests**

Run: `pnpm --filter auth-service exec jest src/application/commands/auth/change-own-password.handler.spec.ts --runInBand`
Expected: PASS

Run: `pnpm --filter api-gateway exec jest src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts --runInBand --no-cache`
Expected: PASS

## Task 5: Protect Email and Phone Binding Replacement With Step-Up Grant

**Files:**
- Modify: `src/services/system/auth-service/src/application/commands/auth/verify-email-binding.command.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/verify-email-binding.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/verify-phone-binding.command.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/verify-phone-binding.handler.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/self-security.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/self-contact-binding.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
- Test: `src/services/system/auth-service/src/application/services/contact-binding-verification.service.spec.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/self-contact-binding.use-case.spec.ts`

- [ ] **Step 1: Write failing contact-binding tests**

```ts
it('requires a change-contact MFA grant before applying a verified email replacement', async () => {
  tenantMfaPolicyRepository.getTenantPolicy = jest.fn().mockResolvedValue(
    tenantPolicyRequiredFor('tenant-1', 'CHANGE_CONTACT')
  )

  await expect(
    handler.execute(
      new VerifyEmailBindingCommand({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        email: 'new@example.com',
        otp: '123456'
      })
    )
  ).rejects.toMatchObject({
    code: 'AUTH_MFA_STEP_UP_REQUIRED'
  })
})
```

- [ ] **Step 2: Run contact-binding tests to verify failure**

Run: `pnpm --filter auth-service exec jest src/application/services/contact-binding-verification.service.spec.ts --runInBand`
Expected: FAIL because contact verification does not require step-up MFA.

- [ ] **Step 3: Add grant consumption to email/phone binding verification commands**

```ts
this.stepUpMfaGrantService.assertGrant({
  accountId: command.accountId,
  mfaGrantToken: command.mfaGrantToken,
  scenario: 'CHANGE_CONTACT',
  tenantId: command.tenantId,
  userId: command.userId
})
```

- [ ] **Step 4: Re-run auth-service and BFF contact tests**

Run: `pnpm --filter auth-service exec jest src/application/services/contact-binding-verification.service.spec.ts --runInBand`
Expected: PASS

Run: `pnpm --filter api-gateway exec jest src/modules/auth-bff/application/use-cases/self-contact-binding.use-case.spec.ts --runInBand --no-cache`
Expected: PASS

## Task 6: Add Trusted-Device Foundation Before NEW_DEVICE_LOGIN

**Files:**
- Create: `src/services/system/auth-service/src/domain/entities/trusted-device.entity.ts`
- Create: `src/services/system/auth-service/src/domain/repositories/trusted-device.repository.ts`
- Create: `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.trusted-device.repository.ts`
- Modify: `src/services/system/auth-service/prisma/schema.prisma`
- Modify: `src/services/system/auth-service/src/application/commands/auth/select-account.handler.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/select-account.handler.spec.ts`

- [ ] **Step 1: Write failing new-device tests**

```ts
it('requires MFA for tenant login when the selected device is not trusted and NEW_DEVICE_LOGIN is required', async () => {
  trustedDeviceRepository.findTrustedDevice = jest.fn().mockResolvedValue(null)
  tenantMfaPolicyRepository.getTenantPolicy = jest.fn().mockResolvedValue(
    tenantPolicyRequiredFor('tenant-1', 'NEW_DEVICE_LOGIN')
  )

  const result = await handler.execute(
    new SelectAccountCommand({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      deviceId: 'browser-device-1',
      loginMethod: LoginMethodEnum.EMAIL_PASSWORD
    })
  )

  expect(result.status).toBe('MFA_REQUIRED')
  expect(result.scenario).toBe('NEW_DEVICE_LOGIN')
})
```

- [ ] **Step 2: Run select-account tests to verify failure**

Run: `pnpm --filter auth-service exec jest src/application/commands/auth/select-account.handler.spec.ts --runInBand`
Expected: FAIL because trusted-device lookup is not part of account selection.

- [ ] **Step 3: Add trusted-device persistence and lookup**

```prisma
model TrustedDevice {
  id          String   @id @default(uuid())
  userId      String
  accountId   String
  tenantId    String
  deviceId    String
  deviceName  String?
  userAgent   String?
  trustedAt   DateTime @default(now())
  lastSeenAt  DateTime @default(now())
  revokedAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, accountId, tenantId, deviceId])
  @@index([userId, tenantId])
}
```

- [ ] **Step 4: Mark device trusted only after successful login MFA or non-MFA login**

```ts
await this.trustedDeviceRepository.markTrusted({
  userId: input.userId,
  accountId: input.accountId,
  tenantId: input.tenantId,
  deviceId: input.deviceId,
  deviceName: input.deviceName,
  userAgent: input.userAgent
})
```

- [ ] **Step 5: Re-run select-account tests**

Run: `pnpm --filter auth-service exec jest src/application/commands/auth/select-account.handler.spec.ts --runInBand`
Expected: PASS

## Task 7: Add Authenticated BFF Step-Up Endpoints

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/self-security.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/self-security.view-model.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`

- [ ] **Step 1: Write failing BFF controller tests**

```ts
it('creates authenticated step-up mfa challenges from operator context', async () => {
  await controller.createStepUpMfaChallenge(
    { scenario: 'CHANGE_PASSWORD' },
    authenticatedRequestSource
  )

  expect(useCase.createStepUpMfaChallenge).toHaveBeenCalledWith(
    { scenario: 'CHANGE_PASSWORD' },
    authenticatedRequestSource
  )
})
```

- [ ] **Step 2: Run the BFF controller tests to verify failure**

Run: `pnpm --filter api-gateway exec jest src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand --no-cache`
Expected: FAIL because authenticated step-up MFA endpoints do not exist.

- [ ] **Step 3: Add the authenticated endpoints**

```ts
@Post('security/mfa/challenges')
async createStepUpMfaChallenge(
  @Body() dto: CreateStepUpMfaChallengeDto,
  @DownstreamSource() source: DownstreamRequestSource
) {
  return this.selfSecurityUseCase.createStepUpMfaChallenge(dto, source)
}

@Post('security/mfa/factor-challenges')
async requestStepUpMfaFactorChallenge(
  @Body() dto: RequestStepUpMfaFactorChallengeDto,
  @DownstreamSource() source: DownstreamRequestSource
) {
  return this.selfSecurityUseCase.requestStepUpMfaFactorChallenge(dto, source)
}

@Post('security/mfa/complete')
async completeStepUpMfaChallenge(
  @Body() dto: CompleteStepUpMfaChallengeDto,
  @DownstreamSource() source: DownstreamRequestSource
) {
  return this.selfSecurityUseCase.completeStepUpMfaChallenge(dto, source)
}
```

- [ ] **Step 4: Re-run BFF controller tests**

Run: `pnpm --filter api-gateway exec jest src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand --no-cache`
Expected: PASS

## Task 8: Final Backend Verification

**Files:**
- Verify only

- [ ] **Step 1: Run proto lint**

Run: `pnpm proto:lint`
Expected: PASS

- [ ] **Step 2: Run auth-service MFA and self-service tests**

Run: `pnpm --filter auth-service exec jest src/application/services/mfa/login-mfa-orchestration.service.spec.ts src/application/services/mfa/step-up-mfa-orchestration.service.spec.ts src/application/services/mfa/step-up-mfa-grant.service.spec.ts src/application/commands/auth/change-own-password.handler.spec.ts src/application/services/contact-binding-verification.service.spec.ts src/interfaces/grpc/auth.grpc.controller.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 3: Run API Gateway BFF tests**

Run: `pnpm --filter api-gateway exec jest src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts src/modules/auth-bff/application/use-cases/self-contact-binding.use-case.spec.ts --runInBand --no-cache`
Expected: PASS

- [ ] **Step 4: Skip frontend tests by product-owner instruction**

Expected: No frontend Vitest or typecheck commands are run for this V1B backend-contract slice unless explicitly requested later.

## Self-Review

- Spec coverage:
  - New-device login is covered only after the trusted-device foundation task; this avoids treating IP/user-agent as a formal device model.
  - Password change is covered by a `CHANGE_PASSWORD` grant before mutation.
  - Email/phone replacement is covered by a `CHANGE_CONTACT` grant before final binding replacement.
  - Strict MFA and platform default policy are intentionally not implemented here and remain deferred.
- Placeholder scan:
  - No `TBD`, `TODO`, or vague “add tests” instructions remain; every task names concrete files and verification commands.
- Type consistency:
  - `MfaScenario`, `TenantMfaScenario`, `challengeId`, `factorChallengeId`, and `mfaGrantToken` names stay consistent across proto, auth-service, and BFF tasks.
