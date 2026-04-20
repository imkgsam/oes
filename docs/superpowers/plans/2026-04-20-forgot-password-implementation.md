# Forgot Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first executable self-service forgot-password flow for `tenant-web` using verified login email or phone, fixed mock OTP `123456`, mock notification delivery through `notification-service`, and a step-by-step recovery UI.

**Architecture:** Keep password-recovery truth in `auth-service`, expose a thin public HTTP flow in `auth-bff`, and render a stepper-style public page in `tenant-web`. Reuse existing OTP and notification dispatch foundations, but add an explicit password-recovery grant so OTP verification and password reset completion stay auditable and decoupled.

**Tech Stack:** NestJS, CQRS, Prisma, gRPC/proto generated through `@oes/common`, Redis-backed session repository, Vue 3, Pinia, Ant Design Vue, pnpm, Jest.

---

### File Structure

- Modify: `docs/contracts/api-gateway/auth-bff-login.md` to document the new public password-recovery HTTP flow.
- Modify: `docs/contracts/auth-service/login.md` to document the downstream auth-service recovery semantics.
- Modify: `src/common/src/contracts/auth_service/auth.proto` to add password-recovery RPCs and message shapes.
- Modify: `src/services/system/auth-service/prisma/schema.prisma` to add `PasswordRecoveryGrant`.
- Modify: `src/services/system/auth-service/src/common/constants/symbols/repo.symbols.ts` to register the new repository token.
- Modify: `src/services/system/auth-service/src/common/constants/exception-enums/auth.errors.ts` to add stable recovery-specific error semantics if existing OTP errors are insufficient.
- Create: `src/services/system/auth-service/src/domain/entities/password-recovery-grant.entity.ts` for the verified reset grant state.
- Create: `src/services/system/auth-service/src/domain/repositories/password-recovery-grant.repository.ts` for the repository contract.
- Create: `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.password-recovery-grant.repository.ts` for Prisma persistence.
- Create: `src/services/system/auth-service/src/application/services/password-recovery.service.ts` to centralize challenge creation and OTP verification.
- Create: `src/services/system/auth-service/src/application/services/password-recovery.service.spec.ts` for focused service tests.
- Create: `src/services/system/auth-service/src/application/commands/auth/request-password-recovery-challenge.command.ts` and `.handler.ts`.
- Create: `src/services/system/auth-service/src/application/commands/auth/verify-password-recovery-challenge.command.ts` and `.handler.ts`.
- Create: `src/services/system/auth-service/src/application/commands/auth/complete-password-recovery.command.ts` and `.handler.ts`.
- Create: `src/services/system/auth-service/src/application/commands/auth/request-password-recovery-challenge.handler.spec.ts`.
- Create: `src/services/system/auth-service/src/application/commands/auth/verify-password-recovery-challenge.handler.spec.ts`.
- Create: `src/services/system/auth-service/src/application/commands/auth/complete-password-recovery.handler.spec.ts`.
- Modify: `src/services/system/auth-service/src/application/commands/auth/index.ts` to export/register the new handlers.
- Modify: `src/services/system/auth-service/src/application/services/auth-audit.service.ts` to emit password-recovery audit events.
- Modify: `src/services/system/auth-service/src/modules/auth/auth.module.ts` to wire the new repo/service/handlers.
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts` and `.spec.ts` to expose/map the new RPCs.
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts` to wrap the new gRPC calls.
- Create: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/password-recovery.use-case.ts` for public flow orchestration.
- Create: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/password-recovery.use-case.spec.ts`.
- Create: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/password-recovery.dto.ts`.
- Create: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/password-recovery.view-model.ts`.
- Modify: `src/services/api-gateway/src/modules/auth-bff/auth-bff.module.ts` to register the new use case.
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts` and `.spec.ts` to add the public routes.
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.integration.spec.ts` to cover the end-to-end controller contract.
- Modify: `app/web/apps/tenant-web/src/api/core/auth.ts` to add password-recovery API types and clients.
- Modify: `app/web/apps/tenant-web/src/store/auth.ts` to add password-recovery helpers used by the page.
- Modify: `app/web/apps/tenant-web/src/views/_core/authentication/forget-password.vue` to replace the placeholder notice with the stepper flow.
- No `notification-service` code change is required in V1; reuse the existing mock providers through `auth-service -> notification-service` dispatch.

### Task 1: Freeze contracts and proto for the public recovery flow

**Files:**
- Modify: `docs/contracts/api-gateway/auth-bff-login.md`
- Modify: `docs/contracts/auth-service/login.md`
- Modify: `src/common/src/contracts/auth_service/auth.proto`

- [ ] **Step 1: Update the public auth-bff login contract**

Append a `Password Recovery` section to `docs/contracts/api-gateway/auth-bff-login.md`:

```md
### `POST /auth/password-recovery/challenges`

- Purpose: start one forgot-password recovery attempt after the frontend captcha gate succeeds.
- Users: unauthenticated end users.
- Control model: public authentication endpoint; no `checkPermission`.
- Downstream: `RequestPasswordRecoveryChallenge`
- Stable semantics:
  - request identifies one channel and one submitted identifier
  - response remains generic to reduce account enumeration risk
  - current V1 frontend captcha is a client-side gate, not a third-party reCAPTCHA integration

### `POST /auth/password-recovery/challenges/:challengeId/verify`

- Purpose: verify one forgot-password OTP and receive a short-lived reset grant token.
- Users: unauthenticated end users in an active recovery flow.
- Downstream: `VerifyPasswordRecoveryChallenge`

### `POST /auth/password-recovery/complete`

- Purpose: set a new unified password and revoke all existing sessions for the recovered user.
- Users: unauthenticated end users holding a verified reset grant token.
- Downstream: `CompletePasswordRecovery`
```

- [ ] **Step 2: Document auth-service recovery semantics**

Append to `docs/contracts/auth-service/login.md`:

```md
### `RequestPasswordRecoveryChallenge`

- 作用：为忘记密码流程创建一个找回 challenge，并在可恢复时触发 OTP 投递。
- 使用场景：
  - 登录页自助找回密码第一步
- 请求关键字段：
  - `channel`
  - `identifier`
- 响应关键字段：
  - `accepted`
  - `challenge_id`
  - `expires_at`
  - `masked_destination`
- 稳定语义：
  - 返回通用 accepted 语义，避免暴露账号存在性
  - OTP 真相归 `auth-service`
  - Notification 仅负责模拟投递

### `VerifyPasswordRecoveryChallenge`

- 作用：校验找回密码 OTP，并签发一次性 reset grant token。
- 请求关键字段：
  - `challenge_id`
  - `otp`
- 响应关键字段：
  - `verified`
  - `reset_token`

### `CompletePasswordRecovery`

- 作用：使用已验证的 reset grant token 设置新密码并吊销全部既有 session。
- 请求关键字段：
  - `reset_token`
  - `new_password`
- 响应关键字段：
  - `success`
  - `sessions_revoked`
```

- [ ] **Step 3: Add the proto RPCs and messages**

Update `src/common/src/contracts/auth_service/auth.proto` near the existing OTP login methods:

```proto
  rpc RequestPasswordRecoveryChallenge(RequestPasswordRecoveryChallengeRequest) returns (PasswordRecoveryChallengeResponse);
  rpc VerifyPasswordRecoveryChallenge(VerifyPasswordRecoveryChallengeRequest) returns (PasswordRecoveryVerificationResponse);
  rpc CompletePasswordRecovery(CompletePasswordRecoveryRequest) returns (PasswordRecoveryCompletionResponse);
```

Add messages near `OtpChallengeResponse`:

```proto
enum PasswordRecoveryChannel {
  PASSWORD_RECOVERY_CHANNEL_UNSPECIFIED = 0;
  PASSWORD_RECOVERY_CHANNEL_EMAIL = 1;
  PASSWORD_RECOVERY_CHANNEL_PHONE = 2;
}

message RequestPasswordRecoveryChallengeRequest {
  PasswordRecoveryChannel channel = 1;
  string identifier = 2;
}

message PasswordRecoveryChallengeResponse {
  bool accepted = 1;
  string challenge_id = 2;
  string expires_at = 3;
  string masked_destination = 4;
}

message VerifyPasswordRecoveryChallengeRequest {
  string challenge_id = 1;
  string otp = 2;
}

message PasswordRecoveryVerificationResponse {
  bool verified = 1;
  string reset_token = 2;
}

message CompletePasswordRecoveryRequest {
  string reset_token = 1;
  string new_password = 2;
}

message PasswordRecoveryCompletionResponse {
  bool success = 1;
  bool sessions_revoked = 2;
}
```

- [ ] **Step 4: Generate and build the shared contract package**

Run:

```bash
pnpm proto:gen
pnpm --filter @oes/common build
```

Expected: both commands exit `0`, and generated `@oes/common/generated/auth_service` exposes the new password-recovery types.

### Task 2: Add auth-service challenge creation and OTP verification

**Files:**
- Modify: `src/services/system/auth-service/prisma/schema.prisma`
- Modify: `src/services/system/auth-service/src/common/constants/symbols/repo.symbols.ts`
- Modify: `src/services/system/auth-service/src/modules/auth/auth.module.ts`
- Create: `src/services/system/auth-service/src/domain/entities/password-recovery-grant.entity.ts`
- Create: `src/services/system/auth-service/src/domain/repositories/password-recovery-grant.repository.ts`
- Create: `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.password-recovery-grant.repository.ts`
- Create: `src/services/system/auth-service/src/application/services/password-recovery.service.ts`
- Create: `src/services/system/auth-service/src/application/services/password-recovery.service.spec.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/request-password-recovery-challenge.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/request-password-recovery-challenge.handler.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/request-password-recovery-challenge.handler.spec.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/verify-password-recovery-challenge.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/verify-password-recovery-challenge.handler.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/verify-password-recovery-challenge.handler.spec.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/index.ts`

- [ ] **Step 1: Add failing password-recovery service tests**

Create `src/services/system/auth-service/src/application/services/password-recovery.service.spec.ts`:

```ts
describe('PasswordRecoveryService', () => {
  it('creates a reset challenge for one verified email login method and dispatches notification', async () => {
    loginMethodRepository.findValidOneByTypeAndIdentifier.mockResolvedValue(
      buildVerifiedLoginMethod('user-1', 'method-email', 'EMAIL', 'user@example.com')
    )
    notificationDispatchPort.sendAuthOtpEmail.mockResolvedValue({ accepted: true })

    const result = await service.requestChallenge('EMAIL', 'user@example.com')

    expect(result.accepted).toBe(true)
    expect(result.challengeId).toBeTruthy()
    expect(notificationDispatchPort.sendAuthOtpEmail).toHaveBeenCalled()
  })

  it('returns a neutral accepted response for an unknown identifier without dispatching notification', async () => {
    loginMethodRepository.findValidOneByTypeAndIdentifier.mockResolvedValue(null)

    const result = await service.requestChallenge('EMAIL', 'missing@example.com')

    expect(result.accepted).toBe(true)
    expect(result.challengeId).toBeTruthy()
    expect(notificationDispatchPort.sendAuthOtpEmail).not.toHaveBeenCalled()
  })

  it('verifies OTP 123456 in mock mode and creates a one-time recovery grant', async () => {
    const otp = OneTimeToken.createResetPasswordOtp({
      type: OTP_TYPES.EMAIL,
      identifier: 'user@example.com',
      code: '123456',
      expiredAt: new Date(Date.now() + 5 * 60 * 1000)
    })
    otpRepository.findById.mockResolvedValue(otp)
    passwordRecoveryGrantRepository.save.mockImplementation(async (grant) => grant)

    const result = await service.verifyChallenge('challenge-1', '123456')

    expect(result.verified).toBe(true)
    expect(result.resetToken).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the focused service test and confirm it fails**

Run:

```bash
pnpm --dir src/services/system/auth-service exec jest src/application/services/password-recovery.service.spec.ts --runInBand
```

Expected: FAIL because the recovery service and grant persistence do not exist yet.

- [ ] **Step 3: Add the password-recovery grant model and repository token**

In `schema.prisma`, add:

```prisma
model PasswordRecoveryGrant {
  id            String   @id @default(uuid())
  userId        String
  loginMethodId String
  challengeId   String   @unique
  expiresAt     DateTime
  verifiedAt    DateTime
  consumedAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

In `repo.symbols.ts`, add:

```ts
  PASSWORD_RECOVERY_GRANT: Symbol('PasswordRecoveryGrantRepository'),
```

Create the entity with one clear responsibility:

```ts
export class PasswordRecoveryGrant {
  static create(input: {
    challengeId: string
    expiresAt: Date
    loginMethodId: string
    userId: string
  }): PasswordRecoveryGrant {
    const now = new Date()
    return new PasswordRecoveryGrant(
      randomUUID(),
      input.userId,
      input.loginMethodId,
      input.challengeId,
      input.expiresAt,
      now,
      null,
      now,
      now,
    )
  }

  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly loginMethodId: string,
    public readonly challengeId: string,
    private expiresAt: Date,
    private verifiedAt: Date,
    private consumedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  isExpired(now: Date = new Date()): boolean {
    return now > this.expiresAt
  }

  isConsumed(): boolean {
    return Boolean(this.consumedAt)
  }

  consume(at: Date = new Date()): void {
    this.consumedAt = at
  }
}
```

- [ ] **Step 4: Implement the Prisma repository and module wiring**

Create `prisma.password-recovery-grant.repository.ts`:

```ts
@Injectable()
export class PrismaPasswordRecoveryGrantRepository
  implements PasswordRecoveryGrantRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PasswordRecoveryGrant | null> {
    const record = await this.prisma.passwordRecoveryGrant.findUnique({ where: { id } })
    return record ? PasswordRecoveryGrantMapper.toDomain(record) : null
  }

  async save(grant: PasswordRecoveryGrant): Promise<PasswordRecoveryGrant> {
    const record = PasswordRecoveryGrantMapper.toPersistence(grant)
    await this.prisma.passwordRecoveryGrant.upsert({
      where: { id: record.id },
      create: record,
      update: record,
    })
    return grant
  }
}
```

Register it in `auth.module.ts`:

```ts
    {
      provide: REPO.PASSWORD_RECOVERY_GRANT,
      useClass: PrismaPasswordRecoveryGrantRepository,
    },
```

- [ ] **Step 5: Implement `PasswordRecoveryService`**

Create `password-recovery.service.ts` with the same OTP pattern already used by login and contact binding:

```ts
@Injectable()
export class PasswordRecoveryService {
  async requestChallenge(channel: 'EMAIL' | 'PHONE', rawIdentifier: string) {
    const type = channel === 'EMAIL' ? LoginMethodType.EMAIL : LoginMethodType.PHONE
    const identifier = AuthIdentifierNormalizer.normalize(type, rawIdentifier)
    const loginMethod = await this.loginMethodRepository.findValidOneByTypeAndIdentifier(type, identifier)

    if (!loginMethod || !loginMethod.isVerified() || !loginMethod.isEnabled()) {
      return {
        accepted: true,
        challengeId: randomUUID(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        maskedDestination: '',
      }
    }

    await this.otpRiskThrottleService.assertCanSend(identifier, OTP_USAGES.RESET_PASSWORD)

    const otp = OneTimeToken.createResetPasswordOtp({
      type: type === LoginMethodType.EMAIL ? OTP_TYPES.EMAIL : OTP_TYPES.PHONE,
      identifier,
      code: this.resolveOtpCode(),
      expiredAt: new Date(Date.now() + 5 * 60 * 1000),
    })
    await this.otpRepository.save(otp)

    const dispatch = type === LoginMethodType.EMAIL
      ? await this.notificationDispatchPort.sendAuthOtpEmail({ recipient: identifier, code: otp.getProps().code, challengeId: otp.getProps().id, maskedDestination: identifier, ttlMinutes: 5 })
      : await this.notificationDispatchPort.sendAuthOtpSms({ recipient: identifier, code: otp.getProps().code, challengeId: otp.getProps().id, maskedDestination: identifier, ttlMinutes: 5 })

    if (!dispatch.accepted) throw ExceptionFactory.infrastructure(AUTH_OTP_DELIVERY_REJECTED)
    await this.otpRiskThrottleService.recordSend(identifier, OTP_USAGES.RESET_PASSWORD)

    return {
      accepted: true,
      challengeId: otp.getProps().id,
      expiresAt: otp.getProps().expiredAt,
      maskedDestination: identifier,
    }
  }

  async verifyChallenge(challengeId: string, otpCode: string) {
    const otp = await this.otpRepository.findById(challengeId)
    if (!otp || otp.getUsage() !== OTP_USAGES.RESET_PASSWORD) {
      throw ExceptionFactory.domain(AUTH_OTP_INVALID)
    }

    const valid = otp.verify(otpCode)
    if (!valid) {
      await this.otpRepository.save(otp)
      throw ExceptionFactory.domain(AUTH_OTP_INVALID)
    }

    const loginMethod = await this.loginMethodRepository.findValidOneByTypeAndIdentifier(
      otp.getType() === OTP_TYPES.EMAIL ? LoginMethodType.EMAIL : LoginMethodType.PHONE,
      otp.getIdentifier(),
    )
    if (!loginMethod) {
      throw ExceptionFactory.domain(AUTH_OTP_INVALID)
    }

    await this.otpRepository.markUsed(otp.getProps().id)
    const grant = PasswordRecoveryGrant.create({
      userId: loginMethod.userId,
      loginMethodId: loginMethod.id,
      challengeId: otp.getProps().id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })
    await this.passwordRecoveryGrantRepository.save(grant)
    return { verified: true, resetToken: grant.id }
  }

  private resolveOtpCode(): string {
    return process.env.AUTH_FORGOT_PASSWORD_OTP_MODE === 'mock'
      ? '123456'
      : Math.floor(100000 + Math.random() * 900000).toString()
  }
}
```

- [ ] **Step 6: Add the command handlers and register them**

Create the commands:

```ts
export class RequestPasswordRecoveryChallengeCommand implements ICommand {
  constructor(
    public readonly channel: 'EMAIL' | 'PHONE',
    public readonly identifier: string,
  ) {}
}

export class VerifyPasswordRecoveryChallengeCommand implements ICommand {
  constructor(
    public readonly challengeId: string,
    public readonly otp: string,
  ) {}
}
```

Create the handlers as thin delegators:

```ts
@CommandHandler(RequestPasswordRecoveryChallengeCommand)
export class RequestPasswordRecoveryChallengeHandler
  implements ICommandHandler<RequestPasswordRecoveryChallengeCommand>
{
  constructor(private readonly passwordRecoveryService: PasswordRecoveryService) {}

  execute(command: RequestPasswordRecoveryChallengeCommand) {
    return this.passwordRecoveryService.requestChallenge(command.channel, command.identifier)
  }
}
```

```ts
@CommandHandler(VerifyPasswordRecoveryChallengeCommand)
export class VerifyPasswordRecoveryChallengeHandler
  implements ICommandHandler<VerifyPasswordRecoveryChallengeCommand>
{
  constructor(private readonly passwordRecoveryService: PasswordRecoveryService) {}

  execute(command: VerifyPasswordRecoveryChallengeCommand) {
    return this.passwordRecoveryService.verifyChallenge(command.challengeId, command.otp)
  }
}
```

- [ ] **Step 7: Re-run the focused auth-service request/verify tests**

Run:

```bash
pnpm --dir src/services/system/auth-service exec jest \
  src/application/services/password-recovery.service.spec.ts \
  src/application/commands/auth/request-password-recovery-challenge.handler.spec.ts \
  src/application/commands/auth/verify-password-recovery-challenge.handler.spec.ts \
  --runInBand
```

Expected: PASS.

### Task 3: Add auth-service password completion, session revocation, and gRPC exposure

**Files:**
- Modify: `src/services/system/auth-service/src/application/services/auth-audit.service.ts`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/complete-password-recovery.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/complete-password-recovery.handler.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/complete-password-recovery.handler.spec.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/index.ts`

- [ ] **Step 1: Add the failing completion handler test**

Create `complete-password-recovery.handler.spec.ts`:

```ts
it('replaces password across verified login methods, consumes the grant, and revokes all sessions', async () => {
  passwordRecoveryGrantRepository.findById.mockResolvedValue(
    buildVerifiedGrant('grant-1', 'user-1', 'method-email')
  )
  loginMethodRepository.findByUserId.mockResolvedValue([
    buildVerifiedLoginMethod('user-1', 'method-email', 'EMAIL', 'user@example.com'),
    buildVerifiedLoginMethod('user-1', 'method-phone', 'PHONE', '+15550000001'),
  ])

  const result = await handler.execute(
    new CompletePasswordRecoveryCommand({ resetToken: 'grant-1', newPassword: 'NewSecret123!' })
  )

  expect(result).toEqual({ success: true, sessionsRevoked: true })
  expect(userSessionRepository.deleteAllByUserId).toHaveBeenCalledWith('user-1')
  expect(passwordRecoveryGrantRepository.save).toHaveBeenCalled()
})
```

Add an expiry guard:

```ts
it('rejects an expired or already consumed grant', async () => {
  passwordRecoveryGrantRepository.findById.mockResolvedValue(buildExpiredGrant('grant-2', 'user-1'))

  await expect(
    handler.execute(new CompletePasswordRecoveryCommand({ resetToken: 'grant-2', newPassword: 'NewSecret123!' }))
  ).rejects.toThrow()
})
```

- [ ] **Step 2: Run the focused completion test and confirm it fails**

Run:

```bash
pnpm --dir src/services/system/auth-service exec jest src/application/commands/auth/complete-password-recovery.handler.spec.ts --runInBand
```

Expected: FAIL because the command and handler do not exist yet.

- [ ] **Step 3: Implement the completion command and handler**

Create the command:

```ts
export class CompletePasswordRecoveryCommand implements ICommand {
  constructor(
    public readonly payload: {
      resetToken: string
      newPassword: string
    },
  ) {}
}
```

Create the handler by reusing the same user-level password replacement semantics as `ChangeOwnPasswordHandler`:

```ts
@CommandHandler(CompletePasswordRecoveryCommand)
export class CompletePasswordRecoveryHandler
  implements ICommandHandler<CompletePasswordRecoveryCommand, { success: boolean; sessionsRevoked: boolean }>
{
  async execute(command: CompletePasswordRecoveryCommand) {
    const grant = await this.passwordRecoveryGrantRepository.findById(command.payload.resetToken)
    if (!grant || grant.isExpired() || grant.isConsumed()) {
      throw ExceptionFactory.domain(AUTH_OTP_INVALID, { reason: 'PASSWORD_RECOVERY_GRANT_INVALID' })
    }

    const methods = await this.loginMethodRepository.findByUserId(grant.userId)
    const targets = methods.filter((method) => method.isVerified())
    for (const method of targets) {
      await method.replacePasswordCredential(command.payload.newPassword)
      await this.loginMethodRepository.save(method)
    }

    grant.consume()
    await this.passwordRecoveryGrantRepository.save(grant)
    await this.passwordSetupRequirementRepository.complete(grant.userId)
    await this.userSessionRepository.deleteAllByUserId(grant.userId)
    this.authAuditService.emitPasswordRecoveryCompleted(grant.userId)

    return { success: true, sessionsRevoked: true }
  }
}
```

- [ ] **Step 4: Emit recovery audit events**

Extend `auth-audit.service.ts`:

```ts
emitPasswordRecoveryRequested(identifier: string, channel: 'EMAIL' | 'PHONE'): void {
  this.emit('PASSWORD_RECOVERY_REQUESTED', 'auth', {
    operator: this.systemOperator(),
    scope: this.emptyScope(),
    resource: { resourceType: 'password_recovery', resourceId: null },
    details: { identifier, channel },
  })
}

emitPasswordRecoveryVerified(userId: string, challengeId: string): void {
  this.emit('PASSWORD_RECOVERY_VERIFIED', 'auth', {
    operator: this.userOperator(userId),
    scope: this.emptyScope(),
    resource: { resourceType: 'password_recovery', resourceId: challengeId },
    details: { userId, challengeId },
  })
}

emitPasswordRecoveryCompleted(userId: string): void {
  this.emit('PASSWORD_RECOVERY_COMPLETED', 'auth', {
    operator: this.userOperator(userId),
    scope: this.emptyScope(),
    resource: { resourceType: 'user_password', resourceId: userId },
    details: { userId },
  })
}
```

- [ ] **Step 5: Expose the new RPCs in the gRPC controller**

Add methods in `auth.grpc.controller.ts`:

```ts
async requestPasswordRecoveryChallenge(
  request: RequestPasswordRecoveryChallengeRequest
): Promise<PasswordRecoveryChallengeResponse> {
  const result = await this.commandBus.execute(
    new RequestPasswordRecoveryChallengeCommand(
      request.channel === PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_PHONE ? 'PHONE' : 'EMAIL',
      request.identifier ?? '',
    ),
  )
  return {
    accepted: result.accepted,
    challengeId: result.challengeId,
    expiresAt: result.expiresAt.toISOString(),
    maskedDestination: result.maskedDestination ?? '',
  }
}

async verifyPasswordRecoveryChallenge(
  request: VerifyPasswordRecoveryChallengeRequest
): Promise<PasswordRecoveryVerificationResponse> {
  return this.commandBus.execute(
    new VerifyPasswordRecoveryChallengeCommand(request.challengeId ?? '', request.otp ?? '')
  )
}

async completePasswordRecovery(
  request: CompletePasswordRecoveryRequest
): Promise<PasswordRecoveryCompletionResponse> {
  return this.commandBus.execute(
    new CompletePasswordRecoveryCommand({
      resetToken: request.resetToken ?? '',
      newPassword: request.newPassword ?? '',
    })
  )
}
```

- [ ] **Step 6: Extend the controller spec and run focused auth-service verification**

Add controller mapping tests, then run:

```bash
pnpm --dir src/services/system/auth-service exec jest \
  src/application/commands/auth/complete-password-recovery.handler.spec.ts \
  src/interfaces/grpc/auth.grpc.controller.spec.ts \
  --runInBand

pnpm --dir src/services/system/auth-service build
```

Expected: tests PASS and build succeeds.

### Task 4: Add auth-bff public password-recovery endpoints

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/password-recovery.use-case.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/password-recovery.use-case.spec.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/password-recovery.dto.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/password-recovery.view-model.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.integration.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/auth-bff.module.ts`

- [ ] **Step 1: Add failing BFF use-case tests**

Create `password-recovery.use-case.spec.ts`:

```ts
it('returns a generic accepted response after requesting one recovery challenge', async () => {
  authAdapter.requestPasswordRecoveryChallenge.mockResolvedValue({
    accepted: true,
    challengeId: 'challenge-1',
    expiresAt: '2026-04-20T09:30:00.000Z',
    maskedDestination: 'u***@example.com',
  })

  const result = await useCase.requestChallenge(
    { channel: 'EMAIL', identifier: 'user@example.com', captchaPassed: true },
    source,
  )

  expect(result).toEqual({
    accepted: true,
    challengeId: 'challenge-1',
    expiresAt: '2026-04-20T09:30:00.000Z',
    maskedDestination: 'u***@example.com',
    message: '如果该方式可用于找回，我们已发送验证码，请注意查收。',
  })
})

it('rejects requestChallenge when the frontend captcha gate is not passed', async () => {
  await expect(
    useCase.requestChallenge({ channel: 'EMAIL', identifier: 'user@example.com', captchaPassed: false }, source)
  ).rejects.toThrow()
})
```

- [ ] **Step 2: Run the focused BFF use-case test and confirm it fails**

Run:

```bash
pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/password-recovery.use-case.spec.ts --runInBand
```

Expected: FAIL because the DTOs, use case, and adapter wrappers do not exist.

- [ ] **Step 3: Add adapter methods and public DTO/view models**

In `auth-grpc.adapter.ts`, add:

```ts
requestPasswordRecoveryChallenge(
  request: { channel: 'EMAIL' | 'PHONE'; identifier: string },
  source: DownstreamRequestSource,
) {
  return this.call(
    'requestPasswordRecoveryChallenge',
    this.svc.requestPasswordRecoveryChallenge(
      {
        channel: request.channel === 'PHONE'
          ? PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_PHONE
          : PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_EMAIL,
        identifier: request.identifier,
      },
      this.metadata(source),
    ),
  )
}
```

Create `password-recovery.dto.ts`:

```ts
export class PasswordRecoveryChallengeDto {
  @IsIn(['EMAIL', 'PHONE'])
  channel!: 'EMAIL' | 'PHONE'

  @IsString()
  @IsNotEmpty()
  identifier!: string

  @IsBoolean()
  captchaPassed!: boolean
}

export class PasswordRecoveryVerificationDto {
  @IsString()
  @Length(6, 6)
  otp!: string
}

export class PasswordRecoveryCompletionDto {
  @IsString()
  @IsNotEmpty()
  resetToken!: string

  @IsString()
  @MinLength(6)
  newPassword!: string

  @IsString()
  @MinLength(6)
  confirmPassword!: string
}
```

- [ ] **Step 4: Implement `PasswordRecoveryUseCase`**

Create one use case class with three methods:

```ts
@Injectable()
export class PasswordRecoveryUseCase {
  constructor(private readonly authAdapter: AuthGrpcAdapter) {}

  async requestChallenge(dto: PasswordRecoveryChallengeDto, source: DownstreamRequestSource) {
    if (!dto.captchaPassed) {
      throw new BadRequestException('CAPTCHA_REQUIRED')
    }

    const result = await this.authAdapter.requestPasswordRecoveryChallenge(
      { channel: dto.channel, identifier: dto.identifier.trim() },
      source,
    )

    return {
      accepted: Boolean(result.accepted),
      challengeId: result.challengeId ?? '',
      expiresAt: result.expiresAt ?? '',
      maskedDestination: result.maskedDestination ?? '',
      message: '如果该方式可用于找回，我们已发送验证码，请注意查收。',
    }
  }

  async verifyChallenge(challengeId: string, dto: PasswordRecoveryVerificationDto, source: DownstreamRequestSource) {
    return this.authAdapter.verifyPasswordRecoveryChallenge({ challengeId, otp: dto.otp.trim() }, source)
  }

  async complete(dto: PasswordRecoveryCompletionDto, source: DownstreamRequestSource) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('PASSWORD_CONFIRMATION_MISMATCH')
    }
    return this.authAdapter.completePasswordRecovery({ resetToken: dto.resetToken, newPassword: dto.newPassword }, source)
  }
}
```

- [ ] **Step 5: Add the controller routes and integration coverage**

In `auth.controller.ts`, add public endpoints near the login/public flow:

```ts
@Post('password-recovery/challenges')
@Public()
async requestPasswordRecoveryChallenge(
  @Body() dto: PasswordRecoveryChallengeDto,
  @DownstreamSource() source: DownstreamRequestSource,
): Promise<PasswordRecoveryChallengeViewModel> {
  return this.passwordRecoveryUseCase.requestChallenge(dto, source)
}

@Post('password-recovery/challenges/:challengeId/verify')
@Public()
async verifyPasswordRecoveryChallenge(
  @Param('challengeId') challengeId: string,
  @Body() dto: PasswordRecoveryVerificationDto,
  @DownstreamSource() source: DownstreamRequestSource,
): Promise<PasswordRecoveryVerificationViewModel> {
  return this.passwordRecoveryUseCase.verifyChallenge(challengeId, dto, source)
}

@Post('password-recovery/complete')
@Public()
async completePasswordRecovery(
  @Body() dto: PasswordRecoveryCompletionDto,
  @DownstreamSource() source: DownstreamRequestSource,
): Promise<PasswordRecoveryCompletionViewModel> {
  return this.passwordRecoveryUseCase.complete(dto, source)
}
```

Add one integration-spec request/response assertion per new route.

- [ ] **Step 6: Re-run focused BFF verification**

Run:

```bash
pnpm --dir src/services/api-gateway exec jest \
  src/modules/auth-bff/application/use-cases/password-recovery.use-case.spec.ts \
  src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts \
  src/modules/auth-bff/interfaces/http/controllers/auth.integration.spec.ts \
  --runInBand

pnpm --dir src/services/api-gateway build
```

Expected: tests PASS and build succeeds.

### Task 5: Replace the placeholder page with a stepper-style tenant-web recovery flow

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/core/auth.ts`
- Modify: `app/web/apps/tenant-web/src/store/auth.ts`
- Modify: `app/web/apps/tenant-web/src/views/_core/authentication/forget-password.vue`

- [ ] **Step 1: Add failing tenant-web page tests or page-local behavior assertions**

If the page already has a spec file pattern nearby, create `forget-password.spec.ts`; otherwise add a focused component test beside the view with cases for:

```ts
it('does not request one challenge before the captcha gate succeeds', async () => {})
it('moves from identifier step to otp step after one accepted challenge request', async () => {})
it('submits password recovery completion and returns to login after success', async () => {})
```

Mock the store methods rather than the network client directly.

- [ ] **Step 2: Extend the core auth API client**

In `api/core/auth.ts`, add:

```ts
export interface PasswordRecoveryChallengeParams {
  captchaPassed: boolean
  channel: 'EMAIL' | 'PHONE'
  identifier: string
}

export interface PasswordRecoveryChallengeResult {
  accepted: boolean
  challengeId: string
  expiresAt?: string
  maskedDestination?: string
  message: string
}

export interface PasswordRecoveryVerificationResult {
  verified: boolean
  resetToken: string
}

export interface PasswordRecoveryCompletionParams {
  confirmPassword: string
  newPassword: string
  resetToken: string
}
```

Add the client methods:

```ts
export async function requestPasswordRecoveryChallengeApi(data: PasswordRecoveryChallengeParams) {
  return requestClient.post<PasswordRecoveryChallengeResult>('/auth/password-recovery/challenges', data)
}

export async function verifyPasswordRecoveryChallengeApi(challengeId: string, otp: string) {
  return requestClient.post<PasswordRecoveryVerificationResult>(`/auth/password-recovery/challenges/${challengeId}/verify`, { otp })
}

export async function completePasswordRecoveryApi(data: PasswordRecoveryCompletionParams) {
  return requestClient.post<{ redirectToLogin: boolean; sessionsRevoked: boolean; success: boolean }>(
    '/auth/password-recovery/complete',
    data,
  )
}
```

- [ ] **Step 3: Add store helpers for the recovery flow**

In `store/auth.ts`, add three helpers:

```ts
async function requestPasswordRecoveryChallenge(params: AuthApi.PasswordRecoveryChallengeParams) {
  const result = await requestPasswordRecoveryChallengeApi({
    ...params,
    identifier: params.identifier.trim(),
  })
  return result
}

async function verifyPasswordRecoveryChallenge(challengeId: string, otp: string) {
  return verifyPasswordRecoveryChallengeApi(challengeId, otp.trim())
}

async function completePasswordRecovery(params: AuthApi.PasswordRecoveryCompletionParams) {
  return completePasswordRecoveryApi(params)
}
```

Expose them in the returned store API.

- [ ] **Step 4: Replace `forget-password.vue` with the stepper page**

Replace the placeholder `AuthNotice` with page-local state:

```ts
type RecoveryChannel = 'EMAIL' | 'PHONE'
type RecoveryStep = 'IDENTIFIER' | 'CAPTCHA' | 'OTP' | 'PASSWORD' | 'DONE'

const step = ref<RecoveryStep>('IDENTIFIER')
const channel = ref<RecoveryChannel>('EMAIL')
const challengeId = ref('')
const resetToken = ref('')
const captchaVerified = ref(false)
const formState = reactive({
  identifier: '',
  otp: '',
  newPassword: '',
  confirmPassword: '',
  maskedDestination: '',
})
```

Use the existing framework captcha component before challenge creation:

```vue
<SliderCaptcha
  v-if="step === 'CAPTCHA'"
  v-model="captchaVerified"
  success-text="验证通过"
  text="请按住滑块拖动"
  @success="handleCaptchaSuccess"
/>
```

Drive the steps with methods:

```ts
async function handleCaptchaSuccess() {
  const result = await authStore.requestPasswordRecoveryChallenge({
    captchaPassed: true,
    channel: channel.value,
    identifier: formState.identifier,
  })
  challengeId.value = result.challengeId
  formState.maskedDestination = result.maskedDestination ?? ''
  step.value = 'OTP'
}

async function submitOtp() {
  const result = await authStore.verifyPasswordRecoveryChallenge(challengeId.value, formState.otp)
  resetToken.value = result.resetToken
  step.value = 'PASSWORD'
}

async function submitNewPassword() {
  await authStore.completePasswordRecovery({
    resetToken: resetToken.value,
    newPassword: formState.newPassword,
    confirmPassword: formState.confirmPassword,
  })
  step.value = 'DONE'
  setTimeout(() => router.replace({ name: 'Login' }), 1200)
}
```

- [ ] **Step 5: Re-run focused tenant-web verification**

Run:

```bash
pnpm --dir app/web/apps/tenant-web exec vitest run src/views/_core/authentication/forget-password.spec.ts
pnpm --dir app/web/apps/tenant-web build
```

Expected: the focused page test passes and the tenant-web build succeeds.

### Task 6: Run end-to-end verification and capture the dev-mode assumptions

**Files:**
- Verify only: no new source files

- [ ] **Step 1: Run the full focused backend test set**

Run:

```bash
pnpm --dir src/services/system/auth-service exec jest \
  src/application/services/password-recovery.service.spec.ts \
  src/application/commands/auth/request-password-recovery-challenge.handler.spec.ts \
  src/application/commands/auth/verify-password-recovery-challenge.handler.spec.ts \
  src/application/commands/auth/complete-password-recovery.handler.spec.ts \
  src/interfaces/grpc/auth.grpc.controller.spec.ts \
  --runInBand

pnpm --dir src/services/api-gateway exec jest \
  src/modules/auth-bff/application/use-cases/password-recovery.use-case.spec.ts \
  src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts \
  src/modules/auth-bff/interfaces/http/controllers/auth.integration.spec.ts \
  --runInBand
```

Expected: PASS.

- [ ] **Step 2: Build all touched apps/services**

Run:

```bash
pnpm --filter auth-service build
pnpm --filter api-gateway build
pnpm --dir app/web/apps/tenant-web build
```

Expected: all three builds exit `0`.

- [ ] **Step 3: Verify the local dev assumptions manually**

During manual testing, confirm:

```md
- auth-service runs with `AUTH_FORGOT_PASSWORD_OTP_MODE=mock`
- auth-service routes notification dispatch with `AUTH_NOTIFICATION_TRANSPORT=grpc`
- forgot-password page is no longer a placeholder
- user cannot request a recovery OTP before passing the existing captcha widget
- both email and phone channels can request a challenge
- in mock mode, OTP `123456` completes verification for the recovery flow
- completion revokes all current sessions for the recovered user
- `notification-service` receives mock dispatch requests and does not perform real delivery
```

- [ ] **Step 4: Commit the feature in focused slices**

Commit sequence:

```bash
git add docs/contracts/api-gateway/auth-bff-login.md docs/contracts/auth-service/login.md src/common/src/contracts/auth_service/auth.proto
git commit -m "docs: add forgot password contracts"

git add src/services/system/auth-service
git commit -m "feat: add auth-service password recovery flow"

git add src/services/api-gateway
git commit -m "feat: expose password recovery bff endpoints"

git add app/web/apps/tenant-web/src/api/core/auth.ts app/web/apps/tenant-web/src/store/auth.ts app/web/apps/tenant-web/src/views/_core/authentication/forget-password.vue
git commit -m "feat: add tenant web forgot password flow"
```

Expected: each commit contains one coherent slice.
