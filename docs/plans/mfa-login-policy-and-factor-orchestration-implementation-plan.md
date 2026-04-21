# MFA Login Policy And Factor Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build tenant-level login MFA policy management plus priority-based MFA factor orchestration for the login flow, while keeping the current user self-service MFA management boundary intact.

**Architecture:** Persist one tenant-scoped login MFA policy model and one tenant-scoped factor-priority model inside `auth-service`, expose them through `api-gateway` admin-security APIs, and upgrade the login/MFA contracts so the BFF and `tenant-web` can render one default factor plus a switchable candidate-factor list. Keep runtime orchestration challenge-driven so future “strict MFA” only changes filtering rules instead of rewriting the whole stack.

**Tech Stack:** NestJS, CQRS, Prisma, gRPC/proto, Jest, Vue 3, Vben, Ant Design Vue, Vitest

---

## File Structure Map

### Contracts and docs

- Modify: `docs/contracts/api-gateway/auth-bff-login.md`
- Modify: `docs/contracts/api-gateway/auth-bff-admin-security.md`
- Modify: `docs/contracts/auth-service/login.md`
- Modify: `docs/contracts/auth-service/mfa.md`
- Modify: `src/common/src/contracts/auth_service/auth.proto`
- Modify: `docs/plans/features/mfa-login-policy-and-factor-orchestration.md`
- Modify: `docs/plans/backlog.md`

### Auth service policy persistence and orchestration

- Modify: `src/services/system/auth-service/prisma/schema.prisma`
- Create: `src/services/system/auth-service/src/domain/entities/tenant-mfa-policy.entity.ts`
- Create: `src/services/system/auth-service/src/domain/repositories/tenant-mfa-policy.repository.ts`
- Create: `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.tenant-mfa-policy.repository.ts`
- Create: `src/services/system/auth-service/src/application/services/mfa/login-mfa-orchestration.service.ts`
- Create: `src/services/system/auth-service/src/application/services/mfa/login-mfa-orchestration.service.spec.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/update-tenant-login-mfa-policy.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/update-tenant-login-mfa-policy.handler.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/update-tenant-mfa-factor-policy.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/update-tenant-mfa-factor-policy.handler.ts`
- Create: `src/services/system/auth-service/src/application/queries/mfa/get-tenant-mfa-policy.query.ts`
- Create: `src/services/system/auth-service/src/application/queries/mfa/get-tenant-mfa-policy.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/login-with-email-password.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/login-with-phone-password.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/login-with-email-otp.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/login-with-phone-otp.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/submit-mfa-challenge.command.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/submit-mfa-challenge.handler.ts`
- Modify: `src/services/system/auth-service/src/application/services/mfa/mfa-challenge-verification.service.ts`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts`
- Modify: `src/services/system/auth-service/src/modules/auth/auth.module.ts`

### API gateway BFF

- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/login.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/login.use-case.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/complete-mfa.use-case.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-mfa-policy.use-case.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-mfa-policy.use-case.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/login.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/auth-response.view-model.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`

### Tenant web

- Modify: `app/web/apps/tenant-web/src/api/bff/admin-security/index.ts`
- Modify: `app/web/apps/tenant-web/src/api/core/auth.ts`
- Modify: `app/web/apps/tenant-web/src/store/auth.ts`
- Modify: `app/web/apps/tenant-web/src/views/_core/authentication/mfa.vue`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/security-center.vue`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/security-center.helpers.ts`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/security-center.helpers.spec.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/mfa-policy-management.vue`
- Create: `app/web/apps/tenant-web/src/views/admin/mfa-policy-management.spec.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/mfa-policy-management.helpers.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/mfa-policy-management.helpers.spec.ts`
- Modify: `app/web/apps/tenant-web/src/modules/tenant-admin/routes.ts`

## Task 1: Freeze contracts and document the runtime model

**Files:**
- Modify: `docs/contracts/api-gateway/auth-bff-login.md`
- Modify: `docs/contracts/api-gateway/auth-bff-admin-security.md`
- Modify: `docs/contracts/auth-service/login.md`
- Modify: `docs/contracts/auth-service/mfa.md`
- Modify: `src/common/src/contracts/auth_service/auth.proto`
- Modify: `docs/plans/features/mfa-login-policy-and-factor-orchestration.md`

- [ ] **Step 1: Write the failing contract tests / assertions as concrete spec deltas**

Add these concrete request/response examples to the contract docs:

```json
{
  "status": "MFA_REQUIRED",
  "nextStep": "COMPLETE_MFA",
  "loginMethod": "EMAIL_PASSWORD",
  "challenge": {
    "challengeId": "chl_mfa_123",
    "scenario": "LOGIN",
    "defaultFactor": "EMAIL_OTP",
    "availableFactors": [
      { "type": "EMAIL_OTP", "label": "邮箱验证码" },
      { "type": "TOTP", "label": "认证器 App" },
      { "type": "SMS_OTP", "label": "手机验证码" },
      { "type": "BACKUP_CODE", "label": "恢复码" }
    ]
  }
}
```

```json
{
  "challengeId": "chl_mfa_123",
  "factor": "TOTP",
  "code": "123456",
  "loginMethod": "EMAIL_PASSWORD"
}
```

- [ ] **Step 2: Update `auth.proto` to express the new runtime fields**

Add concrete proto fields like:

```proto
enum MfaScenario {
  MFA_SCENARIO_UNSPECIFIED = 0;
  MFA_SCENARIO_LOGIN = 1;
}

message LoginMfaFactorOption {
  MfaBindingType type = 1;
  string label = 2;
}

message LoginChallenge {
  string challenge_id = 1;
  MfaScenario scenario = 2;
  MfaBindingType default_factor = 3;
  repeated LoginMfaFactorOption available_factors = 4;
}
```

and extend the existing login / submit-MFA messages to carry them.

- [ ] **Step 3: Run proto and contract-focused verification**

Run:

```bash
pnpm proto:lint
```

Expected: PASS with no proto lint errors.

- [ ] **Step 4: Self-review spec/contract coverage**

Check that the contract text explicitly covers:

```text
1. LOGIN is the only V1 scenario.
2. Factors are tenant-global, not per-scenario.
3. BACKUP_CODE is ordered like other factors, but one successful use disables the binding and invalidates the full set.
4. Strict MFA is deferred and not silently implied in V1.
```

- [ ] **Step 5: Commit**

```bash
git add docs/contracts/api-gateway/auth-bff-login.md docs/contracts/api-gateway/auth-bff-admin-security.md docs/contracts/auth-service/login.md docs/contracts/auth-service/mfa.md src/common/src/contracts/auth_service/auth.proto docs/plans/features/mfa-login-policy-and-factor-orchestration.md
git commit -m "docs: freeze login mfa orchestration contracts"
```

## Task 2: Add tenant MFA policy persistence in auth-service

**Files:**
- Modify: `src/services/system/auth-service/prisma/schema.prisma`
- Create: `src/services/system/auth-service/src/domain/entities/tenant-mfa-policy.entity.ts`
- Create: `src/services/system/auth-service/src/domain/repositories/tenant-mfa-policy.repository.ts`
- Create: `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.tenant-mfa-policy.repository.ts`
- Create: `src/services/system/auth-service/src/application/queries/mfa/get-tenant-mfa-policy.query.ts`
- Create: `src/services/system/auth-service/src/application/queries/mfa/get-tenant-mfa-policy.handler.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/update-tenant-login-mfa-policy.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/update-tenant-login-mfa-policy.handler.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/update-tenant-mfa-factor-policy.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/update-tenant-mfa-factor-policy.handler.ts`
- Modify: `src/services/system/auth-service/src/modules/auth/auth.module.ts`
- Test: `src/services/system/auth-service/src/application/services/mfa/login-mfa-orchestration.service.spec.ts`

- [ ] **Step 1: Write failing tests for tenant policy read/write behavior**

Create test cases like:

```ts
it('returns login-required false and the default factor ordering when no tenant override exists', async () => {
  const result = await handler.execute(new GetTenantMfaPolicyQuery('tenant-1'));
  expect(result.login.required).toBe(false);
  expect(result.factors.map((factor) => factor.type)).toEqual([
    'EMAIL_OTP',
    'SMS_OTP',
    'TOTP',
    'BACKUP_CODE'
  ]);
});

it('persists updated factor priority in one tenant-scoped write', async () => {
  const result = await commandHandler.execute(
    new UpdateTenantMfaFactorPolicyCommand('tenant-1', [
      { type: 'TOTP', enabled: true, priority: 1 },
      { type: 'EMAIL_OTP', enabled: true, priority: 2 },
      { type: 'SMS_OTP', enabled: true, priority: 3 },
      { type: 'BACKUP_CODE', enabled: true, priority: 4 }
    ], 'operator-1')
  );
  expect(result.factors[0].type).toBe('TOTP');
});
```

- [ ] **Step 2: Run the auth-service focused tests and verify they fail first**

Run:

```bash
pnpm --filter auth-service exec jest src/application/services/mfa/login-mfa-orchestration.service.spec.ts --runInBand
```

Expected: FAIL because the new policy repository/query/command code does not exist yet.

- [ ] **Step 3: Add Prisma models and repository contracts**

Implement concrete persistence shapes similar to:

```prisma
model TenantMfaScenarioPolicy {
  tenantId   String
  scenario   String
  required   Boolean @default(false)
  updatedBy  String?
  updatedAt  DateTime @updatedAt

  @@id([tenantId, scenario])
}

model TenantMfaFactorPolicy {
  tenantId   String
  factor     String
  enabled    Boolean @default(true)
  priority   Int
  updatedBy  String?
  updatedAt  DateTime @updatedAt

  @@id([tenantId, factor])
}
```

and a repository interface shaped like:

```ts
export interface ITenantMfaPolicyRepository {
  getTenantPolicy(tenantId: string): Promise<TenantMfaPolicyEntity>;
  saveTenantPolicy(policy: TenantMfaPolicyEntity): Promise<TenantMfaPolicyEntity>;
}
```

- [ ] **Step 4: Implement query/command handlers and wire the module**

Concrete handler shape:

```ts
@CommandHandler(UpdateTenantLoginMfaPolicyCommand)
export class UpdateTenantLoginMfaPolicyHandler {
  async execute(command: UpdateTenantLoginMfaPolicyCommand) {
    const policy = await this.repository.getTenantPolicy(command.tenantId);
    policy.setLoginRequired(command.required, command.operatorId);
    return this.repository.saveTenantPolicy(policy);
  }
}
```

- [ ] **Step 5: Run Prisma push/generate and the policy tests**

Run:

```bash
pnpm --filter auth-service prisma:generate
pnpm --filter auth-service prisma:push
pnpm --filter auth-service exec jest src/application/services/mfa/login-mfa-orchestration.service.spec.ts --runInBand
```

Expected: PASS for the new policy tests.

- [ ] **Step 6: Commit**

```bash
git add src/services/system/auth-service/prisma/schema.prisma src/services/system/auth-service/src/domain/entities/tenant-mfa-policy.entity.ts src/services/system/auth-service/src/domain/repositories/tenant-mfa-policy.repository.ts src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.tenant-mfa-policy.repository.ts src/services/system/auth-service/src/application/queries/mfa/get-tenant-mfa-policy.query.ts src/services/system/auth-service/src/application/queries/mfa/get-tenant-mfa-policy.handler.ts src/services/system/auth-service/src/application/commands/auth/update-tenant-login-mfa-policy.command.ts src/services/system/auth-service/src/application/commands/auth/update-tenant-login-mfa-policy.handler.ts src/services/system/auth-service/src/application/commands/auth/update-tenant-mfa-factor-policy.command.ts src/services/system/auth-service/src/application/commands/auth/update-tenant-mfa-factor-policy.handler.ts src/services/system/auth-service/src/modules/auth/auth.module.ts
git commit -m "feat: persist tenant login mfa policy"
```

## Task 3: Move login MFA selection into one auth-service orchestration layer

**Files:**
- Create: `src/services/system/auth-service/src/application/services/mfa/login-mfa-orchestration.service.ts`
- Create: `src/services/system/auth-service/src/application/services/mfa/login-mfa-orchestration.service.spec.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/login-with-email-password.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/login-with-phone-password.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/login-with-email-otp.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/login-with-phone-otp.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/submit-mfa-challenge.command.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/submit-mfa-challenge.handler.ts`
- Modify: `src/services/system/auth-service/src/application/services/mfa/mfa-challenge-verification.service.ts`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/login-with-email-password.handler.spec.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/login-with-phone-password.handler.spec.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/login-with-email-otp.handler.spec.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/login-with-phone-otp.handler.spec.ts`

- [ ] **Step 1: Write failing orchestration tests**

Add tests that lock the new runtime behavior:

```ts
it('returns the highest-priority available factor as the default factor', async () => {
  const result = await service.resolveLoginChallenge({
    tenantId: 'tenant-1',
    userId: 'user-1',
    loginMethod: 'EMAIL_PASSWORD',
    primaryFactorFamily: 'PASSWORD'
  });

  expect(result.defaultFactor).toBe('EMAIL_OTP');
  expect(result.availableFactors.map((item) => item.type)).toEqual([
    'EMAIL_OTP',
    'TOTP',
    'SMS_OTP',
    'BACKUP_CODE'
  ]);
});

it('returns no MFA challenge when login policy is disabled for the tenant', async () => {
  await repository.saveTenantPolicy(TenantMfaPolicyEntity.defaults('tenant-1'));
  await expect(service.resolveLoginChallenge({...})).resolves.toBeNull();
});
```

- [ ] **Step 2: Verify the existing login-handler tests fail after the new expectation is added**

Run:

```bash
pnpm --filter auth-service exec jest src/application/commands/auth/login-with-email-password.handler.spec.ts src/application/commands/auth/login-with-phone-password.handler.spec.ts src/application/commands/auth/login-with-email-otp.handler.spec.ts src/application/commands/auth/login-with-phone-otp.handler.spec.ts --runInBand
```

Expected: FAIL because handlers still hardcode `TOTP -> EMAIL_OTP -> SMS_OTP`.

- [ ] **Step 3: Implement one orchestration service and remove handler-local ordering**

Use one entry point shaped like:

```ts
export interface ResolvedLoginMfaChallenge {
  challengeId: string;
  scenario: 'LOGIN';
  defaultFactor: MfaType;
  availableFactors: Array<{ type: MfaType; label: string }>;
}

async resolveLoginChallenge(input: ResolveLoginMfaInput): Promise<ResolvedLoginMfaChallenge | null> {
  const policy = await this.tenantPolicyRepository.getTenantPolicy(input.tenantId);
  if (!policy.isLoginRequired()) return null;

  const availableFactors = await this.collectAvailableFactors(input.userId, policy);
  if (availableFactors.length === 0) {
    throw ExceptionFactory.domain(AUTH_MFA_LOGIN_METHOD_UNAVAILABLE, { userId: input.userId });
  }

  return this.createChallenge(input, availableFactors);
}
```

- [ ] **Step 4: Extend MFA submission to accept the selected factor**

Update the command/handler contract to use:

```ts
export class SubmitMfaChallengeCommand {
  constructor(
    public readonly challengeId: string,
    public readonly factor: MfaType,
    public readonly code: string
  ) {}
}
```

and route verification by `factor`, not just by a generic code path.

- [ ] **Step 5: Enforce the V1 recovery-code rule**

Update verification logic so a successful backup-code completion performs:

```ts
if (factor === MfaType.BACKUP_CODE) {
  binding.disable();
  binding.clearBackupCodes();
  await this.mfaBindingRepo.save(binding);
}
```

The expected behavior is “one successful use disables the binding and invalidates the full set”.

- [ ] **Step 6: Run the auth-service login/MFA test suite**

Run:

```bash
pnpm --filter auth-service exec jest src/application/services/mfa/login-mfa-orchestration.service.spec.ts src/application/commands/auth/login-with-email-password.handler.spec.ts src/application/commands/auth/login-with-phone-password.handler.spec.ts src/application/commands/auth/login-with-email-otp.handler.spec.ts src/application/commands/auth/login-with-phone-otp.handler.spec.ts src/interfaces/grpc/auth.grpc.controller.spec.ts --runInBand
```

Expected: PASS with no remaining hardcoded-order assertions.

- [ ] **Step 7: Commit**

```bash
git add src/services/system/auth-service/src/application/services/mfa/login-mfa-orchestration.service.ts src/services/system/auth-service/src/application/services/mfa/login-mfa-orchestration.service.spec.ts src/services/system/auth-service/src/application/commands/auth/login-with-email-password.handler.ts src/services/system/auth-service/src/application/commands/auth/login-with-phone-password.handler.ts src/services/system/auth-service/src/application/commands/auth/login-with-email-otp.handler.ts src/services/system/auth-service/src/application/commands/auth/login-with-phone-otp.handler.ts src/services/system/auth-service/src/application/commands/auth/submit-mfa-challenge.command.ts src/services/system/auth-service/src/application/commands/auth/submit-mfa-challenge.handler.ts src/services/system/auth-service/src/application/services/mfa/mfa-challenge-verification.service.ts src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts
git commit -m "feat: orchestrate login mfa factors by tenant policy"
```

## Task 4: Expose admin MFA policy and enriched login MFA responses in api-gateway

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/login.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/login.use-case.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/complete-mfa.use-case.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-mfa-policy.use-case.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-mfa-policy.use-case.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/login.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/auth-response.view-model.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`

- [ ] **Step 1: Write failing BFF tests for the new HTTP shapes**

Example assertions:

```ts
it('maps MFA_REQUIRED login responses with defaultFactor and availableFactors', async () => {
  const result = await useCase.execute({
    method: 'EMAIL_PASSWORD',
    identifier: 'alice@example.com',
    credential: 'secret'
  });

  expect(result.challenge).toEqual({
    challengeId: 'chl_mfa_123',
    scenario: 'LOGIN',
    defaultFactor: 'EMAIL_OTP',
    availableFactors: [
      { type: 'EMAIL_OTP', label: '邮箱验证码' },
      { type: 'TOTP', label: '认证器 App' }
    ]
  });
});
```

```ts
it('accepts factor when completing an MFA challenge', async () => {
  await controller.completeMfa({
    challengeId: 'chl_mfa_123',
    factor: 'TOTP',
    code: '123456',
    loginMethod: 'EMAIL_PASSWORD'
  });
  expect(authService.submitMfaChallenge).toHaveBeenCalledWith(
    expect.objectContaining({ factor: 'MFA_BINDING_TYPE_TOTP' })
  );
});
```

- [ ] **Step 2: Run the gateway tests and confirm the new assertions fail**

Run:

```bash
pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/login.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand
```

Expected: FAIL because current DTOs/view-models do not expose the new fields yet.

- [ ] **Step 3: Add one admin-security use case for tenant MFA policy**

Implement concrete methods such as:

```ts
async getTenantMfaPolicy(operator: AuthenticatedOperator, tenantId?: string) { ... }
async updateTenantLoginMfaPolicy(operator: AuthenticatedOperator, dto: AdminTenantLoginMfaPolicyDto) { ... }
async updateTenantMfaFactorPolicy(operator: AuthenticatedOperator, dto: AdminTenantMfaFactorPolicyDto) { ... }
```

and keep tenant resolution inside the BFF scope boundary.

- [ ] **Step 4: Expand login and MFA DTO/view-model definitions**

Concrete DTO/view-model shape:

```ts
export class CompleteMfaDto {
  challengeId!: string;
  factor!: 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP' | 'BACKUP_CODE';
  code!: string;
  loginMethod!: LoginMethodDto;
}
```

```ts
export interface LoginChallengeViewModel {
  challengeId: string;
  scenario: 'LOGIN';
  defaultFactor: string;
  availableFactors: Array<{ type: string; label: string }>;
}
```

- [ ] **Step 5: Run the gateway test suite for login and admin policy**

Run:

```bash
pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/login.use-case.spec.ts src/modules/auth-bff/application/use-cases/admin-mfa-policy.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand
```

Expected: PASS with the new MFA response/admin policy coverage.

- [ ] **Step 6: Commit**

```bash
git add src/services/api-gateway/src/modules/auth-bff/application/use-cases/login.use-case.ts src/services/api-gateway/src/modules/auth-bff/application/use-cases/login.use-case.spec.ts src/services/api-gateway/src/modules/auth-bff/application/use-cases/complete-mfa.use-case.ts src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-mfa-policy.use-case.ts src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-mfa-policy.use-case.spec.ts src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/login.dto.ts src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/auth-response.view-model.ts src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts
git commit -m "feat: expose tenant login mfa policy through auth bff"
```

## Task 5: Build the tenant-admin MFA policy page

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/bff/admin-security/index.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/mfa-policy-management.vue`
- Create: `app/web/apps/tenant-web/src/views/admin/mfa-policy-management.spec.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/mfa-policy-management.helpers.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/mfa-policy-management.helpers.spec.ts`
- Modify: `app/web/apps/tenant-web/src/modules/tenant-admin/routes.ts`

- [ ] **Step 1: Write failing helper/UI tests for the admin page**

Add tests that lock the UX contract:

```ts
it('orders factor rows by priority and preserves BACKUP_CODE as a normal sortable item', () => {
  const rows = buildFactorRows([
    { type: 'EMAIL_OTP', enabled: true, priority: 2 },
    { type: 'BACKUP_CODE', enabled: true, priority: 4 },
    { type: 'TOTP', enabled: true, priority: 1 }
  ]);
  expect(rows.map((row) => row.type)).toEqual(['TOTP', 'EMAIL_OTP', 'BACKUP_CODE']);
});

it('exposes one login-required toggle and no per-scenario factor matrix', () => {
  const view = buildPolicyFormView(policy);
  expect(view.sections).toEqual(['login-toggle', 'factor-priority']);
});
```

- [ ] **Step 2: Run the tenant-web tests first**

Run:

```bash
pnpm --dir app/web exec vitest run app/web/apps/tenant-web/src/views/admin/mfa-policy-management.helpers.spec.ts app/web/apps/tenant-web/src/views/admin/mfa-policy-management.spec.ts
```

Expected: FAIL because the new admin MFA page and helpers do not exist yet.

- [ ] **Step 3: Implement the admin API client and page**

Use a focused API client shape like:

```ts
export async function getTenantMfaPolicyApi() {
  return requestClient.get('/auth/admin/tenants/current/mfa-policy');
}

export async function updateTenantMfaFactorPolicyApi(payload: {
  factors: Array<{ type: string; enabled: boolean; priority: number }>;
}) {
  return requestClient.put('/auth/admin/tenants/current/mfa-policy/factors', payload);
}
```

and render one concise page with:

```ts
const sections = [
  { key: 'login-toggle', title: '登录保护' },
  { key: 'factor-priority', title: 'MFA 因子优先级' }
];
```

- [ ] **Step 4: Register the route**

Add a tenant-admin route entry similar to:

```ts
{
  name: 'AdminMfaPolicyManagement',
  path: '/admin/mfa-policy-management',
  component: () => import('#/views/admin/mfa-policy-management.vue'),
  meta: {
    entryKey: 'admin.mfa-policy-management',
    icon: 'lucide:shield-alert',
    title: 'MFA 策略'
  }
}
```

- [ ] **Step 5: Run UI tests and typecheck**

Run:

```bash
pnpm --dir app/web exec vitest run app/web/apps/tenant-web/src/views/admin/mfa-policy-management.helpers.spec.ts app/web/apps/tenant-web/src/views/admin/mfa-policy-management.spec.ts
pnpm --dir app/web --filter @oes/tenant-web typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/web/apps/tenant-web/src/api/bff/admin-security/index.ts app/web/apps/tenant-web/src/views/admin/mfa-policy-management.vue app/web/apps/tenant-web/src/views/admin/mfa-policy-management.spec.ts app/web/apps/tenant-web/src/views/admin/mfa-policy-management.helpers.ts app/web/apps/tenant-web/src/views/admin/mfa-policy-management.helpers.spec.ts app/web/apps/tenant-web/src/modules/tenant-admin/routes.ts
git commit -m "feat: add tenant admin mfa policy page"
```

## Task 6: Upgrade the login MFA page to default-and-switch factor orchestration

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/core/auth.ts`
- Modify: `app/web/apps/tenant-web/src/store/auth.ts`
- Modify: `app/web/apps/tenant-web/src/views/_core/authentication/mfa.vue`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/security-center.vue`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/security-center.helpers.ts`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/security-center.helpers.spec.ts`
- Test: `app/web/apps/tenant-web/src/store/auth.spec.ts`

- [ ] **Step 1: Write failing store/UI tests for factor-aware MFA continuation**

Add tests like:

```ts
it('stores defaultFactor and availableFactors when login returns MFA_REQUIRED', async () => {
  await store.login({ method: 'EMAIL_PASSWORD', identifier: 'alice@example.com', credential: 'secret' });
  expect(store.pendingMfaChallenge).toEqual({
    challengeId: 'chl_mfa_123',
    scenario: 'LOGIN',
    defaultFactor: 'EMAIL_OTP',
    availableFactors: [
      { type: 'EMAIL_OTP', label: '邮箱验证码' },
      { type: 'TOTP', label: '认证器 App' }
    ]
  });
});

it('submits the selected factor when completing MFA', async () => {
  store.selectMfaFactor('TOTP');
  await store.completeMfa('123456');
  expect(authApi.completeMfa).toHaveBeenCalledWith(
    expect.objectContaining({ factor: 'TOTP' })
  );
});
```

- [ ] **Step 2: Run the front-end auth tests first**

Run:

```bash
pnpm --dir app/web exec vitest run app/web/apps/tenant-web/src/store/auth.spec.ts app/web/apps/tenant-web/src/views/_core/profile/security-center.helpers.spec.ts
```

Expected: FAIL because the store and MFA page do not understand factor selection yet.

- [ ] **Step 3: Extend the auth store and API types**

Add concrete state like:

```ts
type PendingMfaChallenge = {
  challengeId: string;
  scenario: 'LOGIN';
  defaultFactor: 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP' | 'BACKUP_CODE';
  availableFactors: Array<{ type: string; label: string }>;
  selectedFactor: string;
};
```

and initialize it from the login response.

- [ ] **Step 4: Rebuild `mfa.vue` around factor switching**

The page should:

```ts
const selectedFactor = computed(() => authStore.pendingMfaChallenge?.selectedFactor);
const candidateFactors = computed(() => authStore.pendingMfaChallenge?.availableFactors ?? []);
```

and render:

```text
1. Highest-priority default factor by default
2. A lightweight “换一种方式” action
3. TOTP as authenticator-code input
4. EMAIL_OTP / SMS_OTP as OTP code input
5. BACKUP_CODE with explicit “一次性应急备用” copy
```

- [ ] **Step 5: Keep the security center wording aligned**

Update `security-center.vue` / helpers so TOTP and recovery-code copy matches the new login semantics:

```ts
getMfaDisplayDestination(binding) // keep TOTP and BACKUP_CODE visibly separate
getRecoveryCodePanelMeta(...) // mention one successful use disables the binding
```

- [ ] **Step 6: Run front-end verification**

Run:

```bash
pnpm --dir app/web exec vitest run app/web/apps/tenant-web/src/store/auth.spec.ts app/web/apps/tenant-web/src/views/_core/profile/security-center.helpers.spec.ts
pnpm --dir app/web --filter @oes/tenant-web typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/web/apps/tenant-web/src/api/core/auth.ts app/web/apps/tenant-web/src/store/auth.ts app/web/apps/tenant-web/src/store/auth.spec.ts app/web/apps/tenant-web/src/views/_core/authentication/mfa.vue app/web/apps/tenant-web/src/views/_core/profile/security-center.vue app/web/apps/tenant-web/src/views/_core/profile/security-center.helpers.ts app/web/apps/tenant-web/src/views/_core/profile/security-center.helpers.spec.ts
git commit -m "feat: add factor-aware login mfa continuation"
```

## Task 7: Close the loop with verification and docs

**Files:**
- Modify: `docs/plans/backlog.md`
- Modify: `docs/plans/index.md`
- Modify: `docs/plans/features/mfa-login-policy-and-factor-orchestration.md`

- [ ] **Step 1: Record the deferred strict-MFA follow-up**

Add one backlog entry with this concrete judgment:

```text
条目：严格型登录 MFA
分类：Product Deferred
当前判断：当前 V1 已冻结为务实型 MFA；后续仅在 challenge 上下文过滤层排除与主登录同类因子复用。
触发条件：登录场景 MFA 已稳定上线，且产品确认需要更高强度的第二因子独立性。
目标落点：独立 feature / contract 增强或当前 packet 的 V1B。
```

- [ ] **Step 2: Add the implementation-plan navigation entry**

Insert one index line such as:

```md
19. `mfa-login-policy-and-factor-orchestration-implementation-plan.md`
    - 登录场景 MFA 策略、因子优先级与登录续流编排实施计划
```

- [ ] **Step 3: Run the focused end-to-end verification commands**

Run:

```bash
pnpm proto:lint
pnpm --filter auth-service exec jest src/application/services/mfa/login-mfa-orchestration.service.spec.ts src/application/commands/auth/login-with-email-password.handler.spec.ts src/application/commands/auth/login-with-phone-password.handler.spec.ts src/application/commands/auth/login-with-email-otp.handler.spec.ts src/application/commands/auth/login-with-phone-otp.handler.spec.ts src/interfaces/grpc/auth.grpc.controller.spec.ts --runInBand
pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/login.use-case.spec.ts src/modules/auth-bff/application/use-cases/admin-mfa-policy.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand
pnpm --dir app/web exec vitest run app/web/apps/tenant-web/src/store/auth.spec.ts app/web/apps/tenant-web/src/views/admin/mfa-policy-management.helpers.spec.ts app/web/apps/tenant-web/src/views/admin/mfa-policy-management.spec.ts app/web/apps/tenant-web/src/views/_core/profile/security-center.helpers.spec.ts
pnpm --dir app/web --filter @oes/tenant-web typecheck
```

Expected:

```text
1. proto lint passes
2. auth-service tests pass
3. api-gateway tests pass
4. tenant-web tests pass
5. tenant-web typecheck passes
```

- [ ] **Step 4: Commit**

```bash
git add docs/plans/backlog.md docs/plans/index.md docs/plans/features/mfa-login-policy-and-factor-orchestration.md
git commit -m "docs: record mfa orchestration implementation plan"
```

## Self-Review

- Spec coverage:
  - `LOGIN` only in V1A: covered by Tasks 1, 2, 3, 4, 5, 6.
  - Tenant-admin-only configuration: covered by Tasks 4 and 5.
  - Global factor enable/priority, not per-scenario: covered by Tasks 1, 2, 4, 5.
  - Default factor plus candidate switching during login: covered by Tasks 1, 3, 4, 6.
  - `TOTP` as an equal factor: covered by Tasks 3 and 6.
  - Recovery-code full-set invalidation after one successful use: covered by Tasks 1, 3, 6.
  - Strict-MFA deferred: covered by Task 7 backlog write-back.
- Placeholder scan:
  - No unresolved placeholders remain in the task steps.
- Type consistency:
  - Factor names are consistently `EMAIL_OTP`, `SMS_OTP`, `TOTP`, `BACKUP_CODE`.
  - Scenario name is consistently `LOGIN`.
  - Runtime challenge fields are consistently `challengeId`, `scenario`, `defaultFactor`, `availableFactors`, `selectedFactor`.
