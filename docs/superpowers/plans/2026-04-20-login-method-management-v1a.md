# Login Method Management V1A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build V1A login method management so users can view login methods and change their password, while administrators can view target account login methods, require password reset, and enable or disable login methods without ever setting a plaintext password.

**Architecture:** `auth-service` owns login method and credential truth. `api-gateway/auth-bff` exposes self-bound and admin-bound HTTP APIs, resolving admin `accountId -> userId` through `identity-service` before calling `auth-service`. `tenant-web` consumes only BFF APIs and renders self-service controls in the security center plus administrator controls in account management.

**Tech Stack:** NestJS, CQRS handlers, Prisma, gRPC proto generated through `@oes/common`, Vue 3, Ant Design Vue, pnpm, Jest.

---

## File Structure

- Modify `docs/plans/features/login-method-management.md`: keep the feature packet aligned with the final V1A endpoint shape.
- Modify `docs/contracts/api-gateway/auth-bff-self-service.md`: document self-service login method endpoints.
- Modify `docs/contracts/api-gateway/auth-bff-admin-security.md`: document admin login method governance endpoints.
- Modify `docs/contracts/auth-service/login.md`: document new auth-service login method gRPC capabilities.
- Modify `src/common/src/contracts/auth_service/auth.proto`: add login method query and mutation RPCs.
- Modify generated files through `pnpm proto:gen`; do not hand-edit generated code.
- Modify `src/services/system/auth-service/prisma/schema.prisma`: add explicit `PasswordSetupRequirement`.
- Create `src/services/system/auth-service/src/domain/entities/password-setup-requirement.entity.ts`: domain state for explicit password setup requirement.
- Create `src/services/system/auth-service/src/domain/repositories/password-setup-requirement.repository.ts`: repository contract.
- Create `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.password-setup-requirement.repository.ts`: Prisma implementation.
- Modify `src/services/system/auth-service/src/domain/repositories/loginmethod.repository.ts`: add query helpers needed by login method management.
- Modify `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.loginmethod.repository.ts`: implement those helpers.
- Modify `src/services/system/auth-service/src/domain/aggregates/loginmethod.aggregate.ts`: add password replacement and public status helpers.
- Create `src/services/system/auth-service/src/application/queries/login-method/list-login-methods.query.ts`: query input.
- Create `src/services/system/auth-service/src/application/queries/login-method/list-login-methods.handler.ts`: read model handler.
- Create `src/services/system/auth-service/src/application/queries/login-method/login-method-query.result.ts`: login method view model.
- Modify `src/services/system/auth-service/src/application/queries/index.ts`: export and register the query handler.
- Create `src/services/system/auth-service/src/application/commands/auth/change-own-password.command.ts`: self-service password change input.
- Create `src/services/system/auth-service/src/application/commands/auth/change-own-password.handler.ts`: current-password verification and password rotation.
- Create `src/services/system/auth-service/src/application/commands/auth/require-password-setup.command.ts`: admin reset requirement input.
- Create `src/services/system/auth-service/src/application/commands/auth/require-password-setup.handler.ts`: marks password setup required.
- Create `src/services/system/auth-service/src/application/commands/auth/set-login-method-enabled.command.ts`: enable / disable input.
- Create `src/services/system/auth-service/src/application/commands/auth/set-login-method-enabled.handler.ts`: enforces last-method protection.
- Modify `src/services/system/auth-service/src/application/commands/auth/complete-first-login-password-setup.handler.ts`: update password and clear explicit requirement.
- Modify `src/services/system/auth-service/src/application/services/password-setup-requirement.service.ts`: resolve explicit requirement plus first-login missing-password state.
- Modify `src/services/system/auth-service/src/application/services/auth-audit.service.ts`: emit login method and password reset audit events.
- Modify `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`: map new RPCs.
- Modify `src/services/system/auth-service/src/app.module.ts`: register new repository provider if needed.
- Modify `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`: expose new gRPC calls.
- Create `src/services/api-gateway/src/modules/auth-bff/application/use-cases/login-method-self-service.use-case.ts`: self-service orchestration.
- Create `src/services/api-gateway/src/modules/auth-bff/application/use-cases/login-method-admin.use-case.ts`: admin orchestration and account-scope checks.
- Modify `src/services/api-gateway/src/modules/auth-bff/auth-bff.module.ts`: register new use cases.
- Modify `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/self-security.dto.ts`: add change password DTO.
- Modify `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts`: add admin password setup and login method mutation DTOs.
- Modify `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/self-security.view-model.ts`: add login method response models.
- Modify `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts`: add admin login method response models.
- Modify `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`: add self and admin endpoints.
- Modify `app/web/apps/tenant-web/src/api/bff/security/index.ts`: add self-service API wrappers and types.
- Modify `app/web/apps/tenant-web/src/api/bff/admin-security/index.ts`: add admin API wrappers and types.
- Modify `app/web/apps/tenant-web/src/views/_core/profile/security-center.vue`: add login method tab / section.
- Modify `app/web/apps/tenant-web/src/views/admin/account-management.vue`: add login method management drawer section for the selected account.

## Contract Decisions

- Self-service routes follow existing self-service style:
  - `GET /auth/login-methods`
  - `POST /auth/password/change`
  - `POST /auth/login-methods/:methodId/enable`
  - `POST /auth/login-methods/:methodId/disable`
- Admin routes are account-bound to preserve scope checks:
  - `GET /auth/admin/accounts/:accountId/login-methods`
  - `POST /auth/admin/accounts/:accountId/password/setup-required`
  - `POST /auth/admin/accounts/:accountId/login-methods/:methodId/enable`
  - `POST /auth/admin/accounts/:accountId/login-methods/:methodId/disable`
- V1A does not implement login identifier binding / replacement. Email and phone verification endpoints stay in V1B.
- Admin password reset means `passwordSetupRequired = true`; admin never submits or receives a password.

---

## Task 1: Freeze Contracts And Proto

**Files:**
- Modify: `docs/contracts/api-gateway/auth-bff-self-service.md`
- Modify: `docs/contracts/api-gateway/auth-bff-admin-security.md`
- Modify: `docs/contracts/auth-service/login.md`
- Modify: `src/common/src/contracts/auth_service/auth.proto`

- [ ] **Step 1: Update API contract docs**

Add a `Login Methods` section to `docs/contracts/api-gateway/auth-bff-self-service.md`:

```md
### Login Methods

- `GET /auth/login-methods`
  - Purpose: list the current authenticated user's login method status.
  - Downstream: `ListLoginMethods`
  - Stable semantics:
    - derives `userId` from the authenticated session
    - does not expose credential secrets, password hashes, OTP values, or MFA secrets
- `POST /auth/password/change`
  - Purpose: change the current authenticated user's password after verifying the current password.
  - Downstream: `ChangeOwnPassword`
- `POST /auth/login-methods/:methodId/enable`
  - Purpose: enable one current-user login method.
  - Downstream: `SetLoginMethodEnabled`
- `POST /auth/login-methods/:methodId/disable`
  - Purpose: disable one current-user login method.
  - Downstream: `SetLoginMethodEnabled`
  - Stable semantics:
    - rejects disabling the final enabled and verified login method
```

Add an `Admin Login Methods` section to `docs/contracts/api-gateway/auth-bff-admin-security.md`:

```md
### `GET /auth/admin/accounts/:accountId/login-methods`

- 作用：查看当前管理员可见账号对应 user 的登录方式状态。
- 权限模型：需要 `auth.login_method.read`。
- 作用域模型：BFF 先通过 `identity-service` 查询 `accountId`，再按 operator scope 判断可见性。
- 响应不包含 password hash、OTP、credential secret。

### `POST /auth/admin/accounts/:accountId/password/setup-required`

- 作用：要求目标账号对应 user 下次登录后必须设置新密码。
- 权限模型：需要 `auth.password.require_setup`。
- 管理员不提交、不接收、不生成明文密码。

### `POST /auth/admin/accounts/:accountId/login-methods/:methodId/enable`

- 作用：启用目标 user 的一个登录方式。
- 权限模型：需要 `auth.login_method.manage`。

### `POST /auth/admin/accounts/:accountId/login-methods/:methodId/disable`

- 作用：停用目标 user 的一个登录方式。
- 权限模型：需要 `auth.login_method.manage`。
- 稳定语义：不得停用目标 user 最后一个可用登录方式。
```

- [ ] **Step 2: Add auth-service proto RPCs**

In `src/common/src/contracts/auth_service/auth.proto`, add these service methods near the MFA and session management methods:

```proto
  rpc ListLoginMethods(ListLoginMethodsRequest) returns (ListLoginMethodsResponse);
  rpc ChangeOwnPassword(ChangeOwnPasswordRequest) returns (PasswordMutationResponse);
  rpc RequirePasswordSetup(RequirePasswordSetupRequest) returns (PasswordMutationResponse);
  rpc SetLoginMethodEnabled(SetLoginMethodEnabledRequest) returns (LoginMethodMutationResponse);
```

Add messages after `OtpChallengeResponse`:

```proto
message LoginMethodView {
  string method_id = 1;
  string user_id = 2;
  string type = 3;
  string identifier = 4;
  string masked_identifier = 5;
  bool verified = 6;
  bool enabled = 7;
  bool has_password = 8;
  string created_at = 9;
  string updated_at = 10;
}

message ListLoginMethodsRequest {
  string user_id = 1;
}

message ListLoginMethodsResponse {
  repeated LoginMethodView login_methods = 1;
  bool password_setup_required = 2;
}

message ChangeOwnPasswordRequest {
  string user_id = 1;
  string current_password = 2;
  string new_password = 3;
}

message RequirePasswordSetupRequest {
  string user_id = 1;
  string required_by = 2;
  string reason = 3;
  bool revoke_sessions = 4;
}

message SetLoginMethodEnabledRequest {
  string user_id = 1;
  string method_id = 2;
  bool enabled = 3;
  string operator_id = 4;
  string reason = 5;
}

message PasswordMutationResponse {
  bool success = 1;
  bool password_setup_required = 2;
}

message LoginMethodMutationResponse {
  bool success = 1;
  LoginMethodView login_method = 2;
}
```

- [ ] **Step 3: Generate common contracts**

Run:

```bash
pnpm proto:gen
pnpm --filter @oes/common build
```

Expected: both commands exit 0 and generated `@oes/common/generated/auth_service` exposes the new request / response types.

---

## Task 2: Auth-Service Login Method Read Model

**Files:**
- Modify: `src/services/system/auth-service/src/domain/repositories/loginmethod.repository.ts`
- Modify: `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.loginmethod.repository.ts`
- Create: `src/services/system/auth-service/src/application/queries/login-method/login-method-query.result.ts`
- Create: `src/services/system/auth-service/src/application/queries/login-method/list-login-methods.query.ts`
- Create: `src/services/system/auth-service/src/application/queries/login-method/list-login-methods.handler.ts`
- Modify: `src/services/system/auth-service/src/application/queries/index.ts`
- Test: `src/services/system/auth-service/src/application/queries/login-method/list-login-methods.handler.spec.ts`

- [ ] **Step 1: Write failing read-model test**

Create `src/services/system/auth-service/src/application/queries/login-method/list-login-methods.handler.spec.ts`:

```ts
import { LoginMethodType } from '@oes/common/constants'
import { LoginMethod } from '../../../../domain/aggregates/loginmethod.aggregate'
import { Credential } from '../../../../domain/entities/credential.entity'
import { ListLoginMethodsHandler } from './list-login-methods.handler'
import { ListLoginMethodsQuery } from './list-login-methods.query'

describe('ListLoginMethodsHandler', () => {
  it('returns login method status without exposing credential secrets', async () => {
    const password = await Credential.createPasswordCredential('Secret123!')
    const repo = {
      findByUserId: jest.fn().mockResolvedValue([
        new LoginMethod(
          'method-email',
          'user-1',
          LoginMethodType.EMAIL,
          'user@example.com',
          true,
          true,
          new Date('2026-04-20T00:00:00.000Z'),
          new Date('2026-04-20T00:00:00.000Z'),
          [password]
        )
      ])
    }
    const requirementService = { userRequiresPasswordSetup: jest.fn().mockResolvedValue(false) }
    const handler = new ListLoginMethodsHandler(repo as any, requirementService as any)

    const result = await handler.execute(new ListLoginMethodsQuery('user-1'))

    expect(result.passwordSetupRequired).toBe(false)
    expect(result.loginMethods).toEqual([
      expect.objectContaining({
        methodId: 'method-email',
        userId: 'user-1',
        type: 'EMAIL',
        identifier: 'user@example.com',
        maskedIdentifier: 'u***@example.com',
        verified: true,
        enabled: true,
        hasPassword: true
      })
    ])
    expect(JSON.stringify(result)).not.toContain(password.getSecret())
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm --filter auth-service exec jest src/application/queries/login-method/list-login-methods.handler.spec.ts --runInBand
```

Expected: FAIL because `ListLoginMethodsHandler` and query files do not exist.

- [ ] **Step 3: Add repository query contract**

Update `src/services/system/auth-service/src/domain/repositories/loginmethod.repository.ts`:

```ts
  findByUserId(userId: string): Promise<LoginMethod[]>
  findByUserIdAndId(userId: string, methodId: string): Promise<LoginMethod | null>
```

Update `PrismaUserRepository`:

```ts
  async findByUserId(userId: string): Promise<LoginMethod[]> {
    const found = await this.prismaService.loginMethod.findMany({
      where: { userId },
      include: { credentials: true },
      orderBy: [{ type: 'asc' }, { createdAt: 'asc' }]
    })
    return found.map((record) => LoginMethodMapper.toDomain(record))
  }

  async findByUserIdAndId(userId: string, methodId: string): Promise<LoginMethod | null> {
    const found = await this.prismaService.loginMethod.findFirst({
      where: { id: methodId, userId },
      include: { credentials: true }
    })
    return found ? LoginMethodMapper.toDomain(found) : null
  }
```

- [ ] **Step 4: Add query types and handler**

Create `login-method-query.result.ts`:

```ts
export interface LoginMethodView {
  methodId: string
  userId: string
  type: string
  identifier: string
  maskedIdentifier: string
  verified: boolean
  enabled: boolean
  hasPassword: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginMethodListView {
  loginMethods: LoginMethodView[]
  passwordSetupRequired: boolean
}
```

Create `list-login-methods.query.ts`:

```ts
import { IQuery } from '@nestjs/cqrs'
import { IsString, MinLength } from 'class-validator'

// Carries the target user whose login methods should be listed.
export class ListLoginMethodsQuery implements IQuery {
  @IsString()
  @MinLength(1)
  readonly userId: string

  constructor(userId: string) {
    this.userId = userId
  }
}
```

Create `list-login-methods.handler.ts`:

```ts
import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { REPO } from '../../../common/constants'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'
import { PasswordSetupRequirementService } from '../../services/password-setup-requirement.service'
import { LoginMethodListView, LoginMethodView } from './login-method-query.result'
import { ListLoginMethodsQuery } from './list-login-methods.query'

@QueryHandler(ListLoginMethodsQuery)
export class ListLoginMethodsHandler
  implements IQueryHandler<ListLoginMethodsQuery, LoginMethodListView>
{
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository,
    private readonly passwordSetupRequirementService: PasswordSetupRequirementService
  ) {}

  async execute(query: ListLoginMethodsQuery): Promise<LoginMethodListView> {
    const [methods, passwordSetupRequired] = await Promise.all([
      this.loginMethodRepository.findByUserId(query.userId),
      this.passwordSetupRequirementService.userRequiresPasswordSetup(query.userId)
    ])

    return {
      loginMethods: methods.map((method): LoginMethodView => ({
        methodId: method.id,
        userId: method.userId,
        type: method.type,
        identifier: method.identifier,
        maskedIdentifier: maskIdentifier(method.type, method.identifier),
        verified: method.isVerified(),
        enabled: method.isEnabled(),
        hasPassword: Boolean(method.getPasswordCredential()),
        createdAt: method.createdAt.toISOString(),
        updatedAt: method.updatedAt.toISOString()
      })),
      passwordSetupRequired
    }
  }
}

function maskIdentifier(type: string, identifier: string): string {
  if (type === 'EMAIL' && identifier.includes('@')) {
    const [local, domain] = identifier.split('@')
    return `${local.slice(0, 1)}***@${domain}`
  }

  if (type === 'PHONE' && identifier.length >= 7) {
    return `${identifier.slice(0, 3)}****${identifier.slice(-4)}`
  }

  return identifier
}
```

Export the query and handler through `src/services/system/auth-service/src/application/queries/index.ts`.

- [ ] **Step 5: Run GREEN**

Run:

```bash
pnpm --filter auth-service exec jest src/application/queries/login-method/list-login-methods.handler.spec.ts --runInBand
```

Expected: PASS.

---

## Task 3: Explicit Password Setup Requirement

**Files:**
- Modify: `src/services/system/auth-service/prisma/schema.prisma`
- Create: `src/services/system/auth-service/src/domain/entities/password-setup-requirement.entity.ts`
- Create: `src/services/system/auth-service/src/domain/repositories/password-setup-requirement.repository.ts`
- Create: `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.password-setup-requirement.repository.ts`
- Modify: `src/services/system/auth-service/src/application/services/password-setup-requirement.service.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/complete-first-login-password-setup.handler.ts`
- Test: `src/services/system/auth-service/src/application/services/password-setup-requirement.service.spec.ts`

- [ ] **Step 1: Write failing requirement service test**

Create `password-setup-requirement.service.spec.ts`:

```ts
import { LoginMethodType } from '@oes/common/constants'
import { LoginMethod } from '../../domain/aggregates/loginmethod.aggregate'
import { Credential } from '../../domain/entities/credential.entity'
import { PasswordSetupRequirementService } from './password-setup-requirement.service'

describe('PasswordSetupRequirementService', () => {
  it('requires setup when an explicit admin reset requirement is active', async () => {
    const password = await Credential.createPasswordCredential('OldSecret123!')
    const loginRepo = {
      findByUserIdAndType: jest.fn().mockResolvedValue(
        new LoginMethod('method-1', 'user-1', LoginMethodType.EMAIL, 'u@example.com', true, true, new Date(), new Date(), [password])
      )
    }
    const requirementRepo = {
      findActiveByUserId: jest.fn().mockResolvedValue({ userId: 'user-1', required: true })
    }
    const service = new PasswordSetupRequirementService(loginRepo as any, requirementRepo as any)

    await expect(service.userRequiresPasswordSetup('user-1')).resolves.toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm --filter auth-service exec jest src/application/services/password-setup-requirement.service.spec.ts --runInBand
```

Expected: FAIL because the service constructor does not accept a requirement repository.

- [ ] **Step 3: Add Prisma model**

Modify `schema.prisma`:

```prisma
model PasswordSetupRequirement {
  id          String              @id @default(uuid())
  userId      String              @unique
  required    Boolean             @default(true)
  reason      PasswordSetupReason
  requiredBy  String?
  requiredAt  DateTime            @default(now())
  completedAt DateTime?
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

enum PasswordSetupReason {
  FIRST_LOGIN
  ADMIN_RESET
  SECURITY_POLICY
}
```

Run:

```bash
pnpm --filter auth-service prisma:generate
```

Expected: Prisma client includes `passwordSetupRequirement` and `PasswordSetupReason`.

- [ ] **Step 4: Add domain entity and repository**

Create `password-setup-requirement.entity.ts`:

```ts
export type PasswordSetupReason = 'FIRST_LOGIN' | 'ADMIN_RESET' | 'SECURITY_POLICY'

// Represents an explicit password setup gate for one authenticated user.
export class PasswordSetupRequirementEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly reason: PasswordSetupReason,
    public readonly requiredBy: string | null,
    public readonly requiredAt: Date,
    public readonly completedAt: Date | null
  ) {}

  isActive(): boolean {
    return !this.completedAt
  }
}
```

Create `password-setup-requirement.repository.ts`:

```ts
import { PasswordSetupRequirementEntity, PasswordSetupReason } from '../entities/password-setup-requirement.entity'

export interface PasswordSetupRequirementRepository {
  findActiveByUserId(userId: string): Promise<PasswordSetupRequirementEntity | null>
  requireSetup(input: { userId: string; reason: PasswordSetupReason; requiredBy?: string | null }): Promise<PasswordSetupRequirementEntity>
  complete(userId: string): Promise<void>
}
```

- [ ] **Step 5: Implement Prisma repository**

Create `prisma.password-setup-requirement.repository.ts`:

```ts
import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PasswordSetupRequirementEntity, PasswordSetupReason } from '../../../domain/entities/password-setup-requirement.entity'
import { PasswordSetupRequirementRepository } from '../../../domain/repositories/password-setup-requirement.repository'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaPasswordSetupRequirementRepository
  implements PasswordSetupRequirementRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByUserId(userId: string): Promise<PasswordSetupRequirementEntity | null> {
    const record = await this.prisma.passwordSetupRequirement.findFirst({
      where: { userId, required: true, completedAt: null }
    })
    return record ? toDomain(record) : null
  }

  async requireSetup(input: {
    userId: string
    reason: PasswordSetupReason
    requiredBy?: string | null
  }): Promise<PasswordSetupRequirementEntity> {
    const record = await this.prisma.passwordSetupRequirement.upsert({
      where: { userId: input.userId },
      update: {
        required: true,
        reason: input.reason,
        requiredBy: input.requiredBy ?? null,
        requiredAt: new Date(),
        completedAt: null
      },
      create: {
        id: randomUUID(),
        userId: input.userId,
        required: true,
        reason: input.reason,
        requiredBy: input.requiredBy ?? null
      }
    })
    return toDomain(record)
  }

  async complete(userId: string): Promise<void> {
    await this.prisma.passwordSetupRequirement.updateMany({
      where: { userId, required: true, completedAt: null },
      data: { required: false, completedAt: new Date() }
    })
  }
}

function toDomain(record: {
  id: string
  userId: string
  reason: string
  requiredBy: string | null
  requiredAt: Date
  completedAt: Date | null
}): PasswordSetupRequirementEntity {
  return new PasswordSetupRequirementEntity(
    record.id,
    record.userId,
    record.reason as PasswordSetupReason,
    record.requiredBy,
    record.requiredAt,
    record.completedAt
  )
}
```

- [ ] **Step 6: Update password setup service**

Inject the repository and evaluate explicit requirement first:

```ts
constructor(
  @Inject(REPO.LOGIN_METHOD)
  private readonly loginMethodRepository: ILoginMethodRepository,
  @Inject(REPO.PASSWORD_SETUP_REQUIREMENT)
  private readonly passwordSetupRequirementRepository: PasswordSetupRequirementRepository
) {}

async userRequiresPasswordSetup(userId: string): Promise<boolean> {
  const explicit = await this.passwordSetupRequirementRepository.findActiveByUserId(userId)
  if (explicit) return true

  const [phoneMethod, emailMethod] = await Promise.all([
    this.loginMethodRepository.findByUserIdAndType(userId, LoginMethodType.PHONE),
    this.loginMethodRepository.findByUserIdAndType(userId, LoginMethodType.EMAIL)
  ])

  return !phoneMethod?.getPasswordCredential() && !emailMethod?.getPasswordCredential()
}
```

- [ ] **Step 7: Run GREEN**

Run:

```bash
pnpm --filter auth-service exec jest src/application/services/password-setup-requirement.service.spec.ts --runInBand
```

Expected: PASS.

---

## Task 4: Auth-Service Password And Login Method Mutations

**Files:**
- Modify: `src/services/system/auth-service/src/domain/aggregates/loginmethod.aggregate.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/change-own-password.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/change-own-password.handler.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/require-password-setup.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/require-password-setup.handler.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/set-login-method-enabled.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/set-login-method-enabled.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/index.ts`
- Modify: `src/services/system/auth-service/src/application/services/auth-audit.service.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/change-own-password.handler.spec.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/require-password-setup.handler.spec.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/set-login-method-enabled.handler.spec.ts`

- [ ] **Step 1: Write failing change password test**

Create `change-own-password.handler.spec.ts`:

```ts
import { LoginMethodType } from '@oes/common/constants'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { Credential } from '../../../domain/entities/credential.entity'
import { ChangeOwnPasswordCommand } from './change-own-password.command'
import { ChangeOwnPasswordHandler } from './change-own-password.handler'

describe('ChangeOwnPasswordHandler', () => {
  it('verifies current password and replaces password credentials for verified login methods', async () => {
    const oldPassword = await Credential.createPasswordCredential('OldSecret123!')
    const emailMethod = new LoginMethod('email-method', 'user-1', LoginMethodType.EMAIL, 'user@example.com', true, true, new Date(), new Date(), [oldPassword])
    const phoneMethod = new LoginMethod('phone-method', 'user-1', LoginMethodType.PHONE, '+15555550100', true, true, new Date(), new Date(), [])
    const repo = {
      findByUserId: jest.fn().mockResolvedValue([emailMethod, phoneMethod]),
      save: jest.fn(async (method) => method)
    }
    const requirementRepo = { complete: jest.fn().mockResolvedValue(undefined) }
    const audit = { emitPasswordChanged: jest.fn() }
    const handler = new ChangeOwnPasswordHandler(repo as any, requirementRepo as any, audit as any)

    const result = await handler.execute(
      new ChangeOwnPasswordCommand({
        userId: 'user-1',
        currentPassword: 'OldSecret123!',
        newPassword: 'NewSecret123!'
      })
    )

    expect(result).toEqual({ success: true, passwordSetupRequired: false })
    expect(repo.save).toHaveBeenCalledTimes(2)
    await expect(emailMethod.getPasswordCredential()!.validate('NewSecret123!')).resolves.toBe(true)
    await expect(phoneMethod.getPasswordCredential()!.validate('NewSecret123!')).resolves.toBe(true)
    expect(requirementRepo.complete).toHaveBeenCalledWith('user-1')
    expect(audit.emitPasswordChanged).toHaveBeenCalledWith('user-1')
  })
})
```

- [ ] **Step 2: Run mutation tests to verify RED**

Run:

```bash
pnpm --filter auth-service exec jest src/application/commands/auth/change-own-password.handler.spec.ts --runInBand
```

Expected: FAIL because the command and handler do not exist.

- [ ] **Step 3: Add aggregate password helper**

Modify `LoginMethod`:

```ts
  async replacePasswordCredential(plainPassword: string): Promise<void> {
    const credential = await Credential.createPasswordCredential(plainPassword)
    const existing = this.getPasswordCredential()

    if (existing) {
      existing.updateSecret(credential.getSecret())
      return
    }

    this.credentials.push(credential)
  }
```

- [ ] **Step 4: Add change password command and handler**

Create `change-own-password.command.ts`:

```ts
import { ICommand } from '@nestjs/cqrs'
import { IsString, MinLength } from 'class-validator'

// Carries a self-service password change request for the authenticated user.
export class ChangeOwnPasswordCommand implements ICommand {
  @IsString()
  @MinLength(1)
  readonly userId: string

  @IsString()
  @MinLength(1)
  readonly currentPassword: string

  @IsString()
  @MinLength(8)
  readonly newPassword: string

  constructor(input: { userId: string; currentPassword: string; newPassword: string }) {
    this.userId = input.userId
    this.currentPassword = input.currentPassword
    this.newPassword = input.newPassword
  }
}
```

Create `change-own-password.handler.ts`:

```ts
import { Inject, UnauthorizedException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { REPO } from '../../../common/constants'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'
import { PasswordSetupRequirementRepository } from '../../../domain/repositories/password-setup-requirement.repository'
import { AuthAuditService } from '../../services/auth-audit.service'
import { ChangeOwnPasswordCommand } from './change-own-password.command'

@CommandHandler(ChangeOwnPasswordCommand)
export class ChangeOwnPasswordHandler
  implements ICommandHandler<ChangeOwnPasswordCommand, { success: boolean; passwordSetupRequired: boolean }>
{
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository,
    @Inject(REPO.PASSWORD_SETUP_REQUIREMENT)
    private readonly passwordSetupRequirementRepository: PasswordSetupRequirementRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: ChangeOwnPasswordCommand) {
    const methods = await this.loginMethodRepository.findByUserId(command.userId)
    const passwordCredentials = methods
      .map((method) => method.getPasswordCredential())
      .filter(Boolean)

    const currentPasswordMatches = await Promise.all(
      passwordCredentials.map((credential) => credential!.validate(command.currentPassword))
    )
    if (!currentPasswordMatches.some(Boolean)) {
      throw new UnauthorizedException('Current password is invalid')
    }

    const targets = methods.filter((method) => method.isVerified())
    for (const method of targets) {
      await method.replacePasswordCredential(command.newPassword)
      await this.loginMethodRepository.save(method)
    }

    await this.passwordSetupRequirementRepository.complete(command.userId)
    this.authAuditService.emitPasswordChanged(command.userId)
    return { success: true, passwordSetupRequired: false }
  }
}
```

- [ ] **Step 5: Add require password setup handler**

Use this behavior:

```ts
await passwordSetupRequirementRepository.requireSetup({
  userId: command.userId,
  reason: 'ADMIN_RESET',
  requiredBy: command.requiredBy
})
authAuditService.emitPasswordSetupRequired(command.requiredBy, command.userId, command.reason)
return { success: true, passwordSetupRequired: true }
```

The test should assert that no new password is accepted by the command.

- [ ] **Step 6: Add set login method enabled handler**

Required behavior:

```ts
const method = await loginMethodRepository.findByUserIdAndId(command.userId, command.methodId)
if (!method) throw new NotFoundException('Login method not found')

if (!command.enabled) {
  const methods = await loginMethodRepository.findByUserId(command.userId)
  const enabledOthers = methods.filter((item) =>
    item.id !== command.methodId && item.isEnabled() && item.isVerified()
  )
  if (enabledOthers.length === 0) {
    throw new BadRequestException('Cannot disable the last available login method')
  }
  method.disable()
} else {
  method.enable()
}

await loginMethodRepository.save(method)
authAuditService.emitLoginMethodEnabledChanged(command.operatorId, command.userId, command.methodId, command.enabled)
return { success: true, loginMethod: toView(method) }
```

- [ ] **Step 7: Register handlers**

Export and include the new handlers in `src/services/system/auth-service/src/application/commands/auth/index.ts`.

- [ ] **Step 8: Run auth-service command tests**

Run:

```bash
pnpm --filter auth-service exec jest src/application/commands/auth/change-own-password.handler.spec.ts src/application/commands/auth/require-password-setup.handler.spec.ts src/application/commands/auth/set-login-method-enabled.handler.spec.ts --runInBand
```

Expected: PASS.

---

## Task 5: Auth-Service gRPC Controller

**Files:**
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`
- Test: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts`

- [ ] **Step 1: Add controller mapping tests**

Extend `auth.grpc.controller.spec.ts` with:

```ts
it('maps listLoginMethods into ListLoginMethodsQuery', async () => {
  queryBus.execute.mockResolvedValue({
    loginMethods: [{
      methodId: 'method-1',
      userId: 'user-1',
      type: 'EMAIL',
      identifier: 'user@example.com',
      maskedIdentifier: 'u***@example.com',
      verified: true,
      enabled: true,
      hasPassword: true,
      createdAt: '2026-04-20T00:00:00.000Z',
      updatedAt: '2026-04-20T00:00:00.000Z'
    }],
    passwordSetupRequired: false
  })

  const result = await controller.listLoginMethods({ userId: 'user-1' })

  expect(result.loginMethods[0].methodId).toBe('method-1')
  expect(result.passwordSetupRequired).toBe(false)
})
```

Add equivalent tests for `changeOwnPassword`, `requirePasswordSetup`, and `setLoginMethodEnabled`.

- [ ] **Step 2: Run controller test to verify RED**

Run:

```bash
pnpm --filter auth-service exec jest src/interfaces/grpc/auth.grpc.controller.spec.ts --runInBand
```

Expected: FAIL because new controller methods do not exist.

- [ ] **Step 3: Add controller methods**

In `AuthGrpcController`, add methods:

```ts
async listLoginMethods(request: ListLoginMethodsRequest): Promise<ListLoginMethodsResponse> {
  const result = await this.queryBus.execute(
    new ListLoginMethodsQuery(request.userId ?? '')
  )
  return {
    loginMethods: result.loginMethods.map((method) => ({
      methodId: method.methodId,
      userId: method.userId,
      type: method.type,
      identifier: method.identifier,
      maskedIdentifier: method.maskedIdentifier,
      verified: method.verified,
      enabled: method.enabled,
      hasPassword: method.hasPassword,
      createdAt: method.createdAt,
      updatedAt: method.updatedAt
    })),
    passwordSetupRequired: result.passwordSetupRequired
  }
}
```

Map mutations to the new command handlers. Use `request.requiredBy` for admin operator identity and `request.operatorId || request.userId` for enable / disable audit operator.

- [ ] **Step 4: Run controller test to verify GREEN**

Run:

```bash
pnpm --filter auth-service exec jest src/interfaces/grpc/auth.grpc.controller.spec.ts --runInBand
```

Expected: PASS.

---

## Task 6: API Gateway BFF Use Cases And HTTP Endpoints

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/login-method-self-service.use-case.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/login-method-admin.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/auth-bff.module.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/self-security.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/self-security.view-model.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/login-method-self-service.use-case.spec.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/login-method-admin.use-case.spec.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`

- [ ] **Step 1: Write failing self-service use case test**

Create `login-method-self-service.use-case.spec.ts`:

```ts
import { LoginMethodSelfServiceUseCase } from './login-method-self-service.use-case'

describe('LoginMethodSelfServiceUseCase', () => {
  it('derives userId from source when listing login methods', async () => {
    const authAdapter = {
      listLoginMethods: jest.fn().mockResolvedValue({
        loginMethods: [{ methodId: 'method-1', type: 'EMAIL', maskedIdentifier: 'u***@example.com', verified: true, enabled: true, hasPassword: true }],
        passwordSetupRequired: false
      })
    }
    const useCase = new LoginMethodSelfServiceUseCase(authAdapter as any)

    const result = await useCase.list({ user: { sub: 'user-1' } } as any)

    expect(authAdapter.listLoginMethods).toHaveBeenCalledWith('user-1', expect.anything())
    expect(result.loginMethods[0].methodId).toBe('method-1')
  })
})
```

- [ ] **Step 2: Write failing admin use case test**

Create `login-method-admin.use-case.spec.ts`:

```ts
import { ForbiddenException } from '@nestjs/common'
import { LoginMethodAdminUseCase } from './login-method-admin.use-case'

describe('LoginMethodAdminUseCase', () => {
  it('rejects tenant admin access to accounts outside the current tenant', async () => {
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: { id: 'account-1', userId: 'user-1', tenantId: 'tenant-other', scopeLevel: 'TENANT' }
      })
    }
    const useCase = new LoginMethodAdminUseCase({} as any, identityAdapter as any)

    await expect(
      useCase.listAccountLoginMethods('account-1', {
        user: { scopeLevel: 'TENANT', tenantId: 'tenant-current' }
      } as any)
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
```

- [ ] **Step 3: Run BFF tests to verify RED**

Run:

```bash
pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/login-method-self-service.use-case.spec.ts src/modules/auth-bff/application/use-cases/login-method-admin.use-case.spec.ts --runInBand
```

Expected: FAIL because the use cases do not exist.

- [ ] **Step 4: Add auth adapter methods**

In `AuthGrpcAdapter`, add:

```ts
listLoginMethods(userId: string, source: DownstreamRequestSource) {
  return this.call('listLoginMethods', this.svc.listLoginMethods({ userId }, this.metadata(source)))
}

changeOwnPassword(request: { userId: string; currentPassword: string; newPassword: string }, source: DownstreamRequestSource) {
  return this.call('changeOwnPassword', this.svc.changeOwnPassword(request, this.operatorMetadata(source)))
}

requirePasswordSetup(request: { userId: string; requiredBy: string; reason: string; revokeSessions?: boolean }, source: DownstreamRequestSource) {
  return this.call('requirePasswordSetup', this.svc.requirePasswordSetup(request, this.operatorMetadata(source)))
}

setLoginMethodEnabled(request: { userId: string; methodId: string; enabled: boolean; operatorId: string; reason?: string }, source: DownstreamRequestSource) {
  return this.call('setLoginMethodEnabled', this.svc.setLoginMethodEnabled(request, this.operatorMetadata(source)))
}
```

- [ ] **Step 5: Add self-service use case**

Use `source.user?.sub || source.user?.userId` as the only user identifier. Throw `UnauthorizedException` if missing. Map downstream fields into the HTTP view model without exposing `identifier` unless the contract explicitly allows it; V1A frontend can display `maskedIdentifier`.

- [ ] **Step 6: Add admin use case**

Use this scope guard:

```ts
private async resolveVisibleAccount(accountId: string, source: DownstreamRequestSource) {
  const account = (await this.identityAdapter.getAccountById(accountId, source)).account
  if (!account?.id || !account.userId) throw new NotFoundException('Account not found')

  const isSystemOperator = source.user?.scopeLevel === 'SYSTEM'
  const operatorTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)

  if (!isSystemOperator) {
    if (account.scopeLevel !== 'TENANT' || normalize(account.tenantId) !== operatorTenantId) {
      throw new ForbiddenException('Forbidden resource')
    }
  }

  return account
}
```

All admin methods call `resolveVisibleAccount(accountId, source)` before calling auth-service with `account.userId`.

- [ ] **Step 7: Add HTTP DTOs and view models**

Add to `self-security.dto.ts`:

```ts
export class ChangePasswordDto {
  @ApiProperty({ maxLength: 256 })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  currentPassword!: string

  @ApiProperty({ maxLength: 256, minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(256)
  newPassword!: string
}
```

Add to `admin-security.dto.ts`:

```ts
export class AdminRequirePasswordSetupDto {
  @ApiPropertyOptional({ maxLength: 512 })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  reason?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  revokeSessions?: boolean
}
```

Add view models with fields:

```ts
methodId: string
type: string
maskedIdentifier: string
verified: boolean
enabled: boolean
hasPassword: boolean
createdAt?: string
updatedAt?: string
```

- [ ] **Step 8: Add controller endpoints**

In `AuthController`, add self endpoints without permission decorators:

```ts
@Get('login-methods')
async listLoginMethods(@DownstreamSource() source: DownstreamRequestSource) {
  return this.loginMethodSelfServiceUseCase.list(source)
}

@Post('password/change')
async changeOwnPassword(@Body() dto: ChangePasswordDto, @DownstreamSource() source: DownstreamRequestSource) {
  return this.loginMethodSelfServiceUseCase.changePassword(dto, source)
}
```

Add admin endpoints with permission decorators using the new auth permission codes:

```ts
@Get('admin/accounts/:accountId/login-methods')
async adminListAccountLoginMethods(@Param('accountId') accountId: string, @DownstreamSource() source: DownstreamRequestSource) {
  return this.loginMethodAdminUseCase.listAccountLoginMethods(accountId, source)
}
```

- [ ] **Step 9: Run BFF tests**

Run:

```bash
pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/login-method-self-service.use-case.spec.ts src/modules/auth-bff/application/use-cases/login-method-admin.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand
```

Expected: PASS.

---

## Task 7: Tenant-Web Self-Service UI

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/bff/security/index.ts`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/security-center.vue`
- Test: `app/web/apps/tenant-web/src/views/_core/profile/security-center.spec.ts`

- [ ] **Step 1: Add failing UI integration test**

If the repo has Vue test helpers available for this page, add a test that stubs `listLoginMethodsApi` and asserts the page renders `登录方式与密码`. If no helper exists for this page, add a focused helper test for the label / data mapping functions and rely on build verification for the SFC.

Example expected assertion:

```ts
expect(screen.getByText('登录方式与密码')).toBeTruthy()
expect(screen.getByText('u***@example.com')).toBeTruthy()
```

- [ ] **Step 2: Add API wrappers**

In `app/web/apps/tenant-web/src/api/bff/security/index.ts`, add:

```ts
export interface LoginMethod {
  createdAt?: string
  enabled: boolean
  hasPassword: boolean
  maskedIdentifier: string
  methodId: string
  type: 'EMAIL' | 'PHONE' | 'OAUTH_OPENID' | string
  updatedAt?: string
  verified: boolean
}

export interface LoginMethodListResult {
  loginMethods: LoginMethod[]
  passwordSetupRequired: boolean
}

export async function listSelfLoginMethodsApi() {
  return requestClient.get<SelfSecurityApi.LoginMethodListResult>('/auth/login-methods')
}

export async function changeOwnPasswordApi(data: { currentPassword: string; newPassword: string }) {
  return requestClient.post<{ success: boolean; passwordSetupRequired: boolean }>('/auth/password/change', data)
}
```

Place the interfaces inside `SelfSecurityApi` to match existing API style.

- [ ] **Step 3: Add security-center tab**

In `security-center.vue`, add `loginMethods` state, `passwordForm`, and load login methods together with sessions and MFA:

```ts
const loginMethods = ref<SelfSecurityApi.LoginMethod[]>([])
const passwordChanging = ref(false)
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
```

Update `loadSecuritySnapshot()`:

```ts
const [sessionResult, mfaResult, loginMethodResult] = await Promise.all([
  listSelfSessionsApi(),
  listMfaBindingsApi(),
  listSelfLoginMethodsApi(),
])
loginMethods.value = loginMethodResult.loginMethods ?? []
```

Add a tab:

```vue
<TabPane key="login-methods" tab="登录方式与密码">
  <Card :bordered="false">
    <template #title>登录方式与密码</template>
    <List :data-source="loginMethods">
      <template #renderItem="{ item }">
        <ListItem>
          <div>
            <div>{{ getLoginMethodTypeLabel(item.type) }}</div>
            <div>{{ item.maskedIdentifier || '未绑定' }}</div>
          </div>
          <Tag :color="item.enabled ? 'green' : 'default'">{{ item.enabled ? '已启用' : '已停用' }}</Tag>
        </ListItem>
      </template>
    </List>
  </Card>
</TabPane>
```

Add password change modal with current password, new password, confirm password, and call `changeOwnPasswordApi`.

- [ ] **Step 4: Run frontend verification**

Run:

```bash
pnpm --dir app/web --filter @oes/tenant-web typecheck
pnpm --dir app/web --filter @oes/tenant-web build
```

Expected: both commands exit 0.

---

## Task 8: Tenant-Web Admin UI

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/bff/admin-security/index.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/account-management.vue`
- Test: `app/web/apps/tenant-web/src/views/admin/account-management.spec.ts`

- [ ] **Step 1: Add admin API wrappers**

In `admin-security/index.ts`, add:

```ts
export interface AccountLoginMethod {
  createdAt?: string
  enabled: boolean
  hasPassword: boolean
  maskedIdentifier: string
  methodId: string
  type: string
  updatedAt?: string
  verified: boolean
}

export interface AccountLoginMethodListResult {
  accountId: string
  loginMethods: AccountLoginMethod[]
  passwordSetupRequired: boolean
  userId: string
}

export async function listAdminAccountLoginMethodsApi(accountId: string) {
  return requestClient.get<AdminSecurityApi.AccountLoginMethodListResult>(
    `/auth/admin/accounts/${encodeURIComponent(accountId)}/login-methods`,
  )
}

export async function requireAdminPasswordSetupApi(accountId: string, data: { reason?: string; revokeSessions?: boolean }) {
  return requestClient.post<{ success: boolean; passwordSetupRequired: boolean }>(
    `/auth/admin/accounts/${encodeURIComponent(accountId)}/password/setup-required`,
    data,
  )
}
```

- [ ] **Step 2: Add account-management drawer section**

Add state:

```ts
const loginMethodDrawerOpen = ref(false)
const loginMethodLoading = ref(false)
const selectedLoginMethods = ref<AdminSecurityApi.AccountLoginMethod[]>([])
const selectedLoginMethodAccount = ref<AccountManagementRow | null>(null)
```

Add action button in account row actions:

```ts
{
  key: 'login-methods',
  label: '登录方式',
}
```

Add handler:

```ts
async function openLoginMethodManagement(account: AccountManagementRow) {
  selectedLoginMethodAccount.value = account
  loginMethodDrawerOpen.value = true
  loginMethodLoading.value = true
  try {
    const result = await listAdminAccountLoginMethodsApi(account.accountId)
    selectedLoginMethods.value = result.loginMethods ?? []
  } finally {
    loginMethodLoading.value = false
  }
}
```

Add “要求重设密码” button:

```ts
async function requirePasswordSetupForSelectedAccount() {
  if (!selectedLoginMethodAccount.value) return
  await requireAdminPasswordSetupApi(selectedLoginMethodAccount.value.accountId, {
    reason: '管理员要求用户重新设置密码',
    revokeSessions: true,
  })
  message.success('已要求该用户下次登录重新设置密码')
}
```

- [ ] **Step 3: Run frontend verification**

Run:

```bash
pnpm --dir app/web --filter @oes/tenant-web typecheck
pnpm --dir app/web --filter @oes/tenant-web build
```

Expected: both commands exit 0.

---

## Task 9: End-To-End Verification And Docs Closure

**Files:**
- Modify: `docs/plans/features/login-method-management.md`

- [ ] **Step 1: Run full focused verification**

Run:

```bash
pnpm proto:gen
pnpm --filter @oes/common build
pnpm --filter auth-service build
pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/login-method-self-service.use-case.spec.ts src/modules/auth-bff/application/use-cases/login-method-admin.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand
pnpm --filter api-gateway build
pnpm --dir app/web --filter @oes/tenant-web typecheck
pnpm --dir app/web --filter @oes/tenant-web build
```

Expected: every command exits 0.

- [ ] **Step 2: Update feature packet status**

In `docs/plans/features/login-method-management.md`, update:

```md
## 7. 当前 slice

- slice:
  - V1A: implemented and verified
```

Add an implementation status section:

```md
## 18. V1A 实现状态

- 自助登录方式只读模型已落地。
- 自助修改密码已落地。
- 管理员账号登录方式查看已落地。
- 管理员要求重设密码已落地。
- 登录方式启停已落地，并保护最后一个可用登录方式。
- 邮箱 / 手机号绑定和更换仍保留在 V1B。
```

- [ ] **Step 3: Record residual risks**

Append:

```md
## 19. V1A 残余风险

- 管理员要求重设密码后的 session 撤销策略需要在真实联调中观察用户体验；若撤销过激，可改为只让 refresh 后上下文进入 password setup gate。
- 当前密码仍兼容 `Credential` 挂在 `LoginMethod` 下的 schema；未来如要做 user-level password credential，需要单独 ADR。
- 登录邮箱 / 手机号更换需要 V1B OTP 验证流程，不能通过账号资料编辑接口绕过。
```

- [ ] **Step 4: Do not auto-commit unless requested**

Because this repository often has many concurrent thread edits, only stage or commit when explicitly requested by the user.

