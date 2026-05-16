# Terminal-aware Account Security Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement terminal-aware account security across auth-service, api-gateway, PDA auth, and tenant-web/platform administration without changing each frontend's fixed login flow.

**Architecture:** `auth-service` owns terminal entry login policy, terminal MFA policy, session truth, login history, trusted login device boundaries, and session cleanup execution. `permission-service` owns Terminal Access Policy and authorization checks. `terminal-device-service` owns managed terminal state and publishes device state facts; `auth-service` consumes those facts and revokes matching sessions.

**Tech Stack:** NestJS, CQRS, Prisma, Redis session repository, gRPC/proto contracts in `src/common`, Jest, Vue tenant-web, PDA Vue app, pnpm workspace scripts.

---

## Scope Check

This feature touches multiple bounded contexts, so implement it as ordered slices. Each slice must be independently testable and should not assume unrelated slices are already deployed unless the task explicitly says so.

Do not include these in this implementation plan:

- tenant-level primary login method configuration
- single terminal-device login method overrides
- PDA account selection
- SSO / passkey / Google / WeChat full implementation
- employee code + PIN / badge + PIN full identity and credential implementation
- WMS / MES supervisor approval or business step-up flows

## File Structure

Create or modify these groups:

- `src/common/src/contracts/auth_service/auth.proto`
  - Add proto fields/RPCs for terminal login policy, terminal MFA policy, terminal-aware session metadata, and PDA account resolution.
- `src/common/src/auth/types/login-method.type.ts`
  - Keep existing login method constants and add stable terminal login flow constants if not already present.
- `src/services/system/auth-service/prisma/schema.prisma`
  - Add terminal login policy and terminal MFA persistence.
  - Extend session persistence only if active session truth is backed by Prisma in this branch; otherwise keep session metadata in Redis repository mapping.
- `src/services/system/auth-service/src/domain/**`
  - Add terminal policy entities and repository ports.
  - Extend `Session` aggregate with `loginFlow`, `terminalDeviceId`, and `deviceBoundTenantId`.
- `src/services/system/auth-service/src/application/**`
  - Add terminal login policy checks before primary credential validation.
  - Add terminal MFA resolution.
  - Add PDA unique account resolution.
  - Add terminal-device unavailable session cleanup handler.
- `src/services/system/auth-service/src/infrastructure/**`
  - Add Prisma repositories and event consumer adapters.
  - Extend Redis session serialization.
- `src/services/system/auth-service/src/interfaces/grpc/**`
  - Map new proto messages and extend current login/session/MFA endpoints.
- `src/services/api-gateway/src/modules/auth-bff/**`
  - Add platform auth security BFF endpoints.
  - Extend account security/session views.
  - Update PDA terminal auth flow to use device-bound tenant.
- `app/web/apps/tenant-web/src/**`
  - Add platform security configuration UI and terminal MFA tenant settings UI.
  - Extend account security session/login-history views when present.
- `app/pda/web/src/**`
  - Keep fixed PDA login flow and ensure no tenant/account selection UI appears.
- `src/services/system/terminal-device-service/**`
  - Publish managed terminal unavailable events from status transitions.

## Task 1: Contract And Shared Type Foundation

**Files:**
- Modify: `src/common/src/contracts/auth_service/auth.proto`
- Modify: `src/common/src/auth/types/login-method.type.ts`
- Modify: `src/common/src/contracts/index.ts`
- Verify generated outputs according to the existing common contract generation workflow.

- [ ] **Step 1: Add terminal login flow and terminal policy proto contracts**

Add RPCs to `AuthService`:

```proto
rpc GetPlatformTerminalLoginPolicy(GetPlatformTerminalLoginPolicyRequest) returns (GetPlatformTerminalLoginPolicyResponse);
rpc UpdatePlatformTerminalLoginPolicy(UpdatePlatformTerminalLoginPolicyRequest) returns (UpdatePlatformTerminalLoginPolicyResponse);
rpc GetPlatformDefaultTerminalMfaPolicy(GetPlatformDefaultTerminalMfaPolicyRequest) returns (GetPlatformDefaultTerminalMfaPolicyResponse);
rpc UpdatePlatformDefaultTerminalMfaPolicy(UpdatePlatformDefaultTerminalMfaPolicyRequest) returns (UpdatePlatformDefaultTerminalMfaPolicyResponse);
rpc GetTenantTerminalMfaPolicy(GetTenantTerminalMfaPolicyRequest) returns (GetTenantTerminalMfaPolicyResponse);
rpc UpdateTenantTerminalMfaPolicy(UpdateTenantTerminalMfaPolicyRequest) returns (UpdateTenantTerminalMfaPolicyResponse);
rpc HandleTerminalDeviceUnavailable(HandleTerminalDeviceUnavailableRequest) returns (HandleTerminalDeviceUnavailableResponse);
```

Use explicit messages for:

```proto
message TerminalLoginPolicyEntry {
  string terminal = 1;
  repeated string enabled_login_flows = 2;
  repeated string supported_login_flows = 3;
  string updated_at = 4;
  string updated_by = 5;
}

message TerminalMfaPolicyEntry {
  string terminal = 1;
  bool login_mfa_required = 2;
  bool new_device_mfa_required = 3;
  repeated MfaBindingType allowed_factors = 4;
  repeated MfaBindingType factor_priority = 5;
  string source = 6;
}
```

- [ ] **Step 2: Extend login/session request and response messages**

Add optional PDA/session metadata fields where current messages already carry `terminal`:

```proto
string terminal_device_id = 20;
string device_bound_tenant_id = 21;
string login_flow = 22;
```

Apply to the login, select account, session list, validate token, refresh response, and session view messages that need terminal-aware display.

- [ ] **Step 3: Add TypeScript constants**

Extend `src/common/src/auth/types/login-method.type.ts` with stable terminal login flow values:

```ts
export enum TerminalLoginFlow {
  EmailPassword = 'EMAIL_PASSWORD',
  EmailOtp = 'EMAIL_OTP',
  PhonePassword = 'PHONE_PASSWORD',
  PhoneOtp = 'PHONE_OTP',
  Password = 'PASSWORD',
  EmployeeCodePin = 'EMPLOYEE_CODE_PIN',
  BadgePin = 'BADGE_PIN',
  Sso = 'SSO',
  Passkey = 'PASSKEY'
}
```

Keep unsupported flows out of enabled policy defaults until their runtime handlers exist.

- [ ] **Step 4: Run contract verification**

Run:

```bash
pnpm proto:lint
pnpm --filter auth-service build
pnpm --filter api-gateway build
```

Expected:

- proto lint passes
- auth-service and api-gateway compile against the new generated contract shape

## Task 2: Auth-service Persistence And Domain Policies

**Files:**
- Modify: `src/services/system/auth-service/prisma/schema.prisma`
- Create: `src/services/system/auth-service/src/domain/entities/terminal-login-policy.entity.ts`
- Create: `src/services/system/auth-service/src/domain/entities/terminal-mfa-policy.entity.ts`
- Create: `src/services/system/auth-service/src/domain/repositories/terminal-login-policy.repository.ts`
- Create: `src/services/system/auth-service/src/domain/repositories/terminal-mfa-policy.repository.ts`
- Modify: `src/services/system/auth-service/src/common/constants/symbols/repo.symbols.ts`
- Create tests under `src/services/system/auth-service/src/domain/entities/*.spec.ts`

- [ ] **Step 1: Write entity tests**

Add tests that verify:

- WEB defaults include implemented Web flows.
- PDA defaults include `PASSWORD` only.
- KIOSK defaults have no enabled Phase 2 flow.
- unsupported login flows cannot be enabled.
- platform default terminal MFA is not a minimum baseline.
- tenant terminal MFA overrides platform defaults.

Run:

```bash
pnpm --filter auth-service exec jest domain/entities/terminal-login-policy.entity.spec.ts domain/entities/terminal-mfa-policy.entity.spec.ts --runInBand
```

Expected before implementation:

- tests fail because entities do not exist

- [ ] **Step 2: Add Prisma models**

Add models with explicit owner semantics:

```prisma
model TerminalLoginPolicy {
  id                String   @id @default(uuid())
  terminal          String   @unique
  enabledLoginFlows Json
  updatedBy         String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model PlatformTerminalMfaPolicy {
  id                   String   @id @default(uuid())
  terminal             String   @unique
  loginMfaRequired     Boolean  @default(false)
  newDeviceMfaRequired Boolean  @default(false)
  allowedFactors       Json
  factorPriority       Json
  updatedBy            String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

model TenantTerminalMfaPolicy {
  id                   String   @id @default(uuid())
  tenantId             String
  terminal             String
  loginMfaRequired     Boolean  @default(false)
  newDeviceMfaRequired Boolean  @default(false)
  allowedFactors       Json
  factorPriority       Json
  updatedBy            String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@unique([tenantId, terminal])
  @@index([tenantId])
}
```

- [ ] **Step 3: Implement domain entities**

Each new class must have a one-sentence summary comment per AGENTS.md.

`TerminalLoginPolicyEntity` must expose:

```ts
isFlowAllowed(flow: string): boolean
replaceEnabledFlows(flows: string[], supportedFlows: string[]): void
defaults(): TerminalLoginPolicyEntity[]
```

`TerminalMfaPolicyEntity` must expose:

```ts
requiresLoginMfa(): boolean
replaceFactors(factors: MfaBindingType[], priority: MfaBindingType[]): void
platformDefaults(): TerminalMfaPolicyEntity[]
tenantOverride(tenantId: string, terminal: string, input: TerminalMfaPolicyInput): TerminalMfaPolicyEntity
```

- [ ] **Step 4: Add repository ports and tokens**

Add repository interfaces for policy lookup and save. Register tokens in `REPO`.

- [ ] **Step 5: Run entity tests and Prisma generation**

Run:

```bash
pnpm --filter auth-service prisma:generate
pnpm --filter auth-service exec jest domain/entities/terminal-login-policy.entity.spec.ts domain/entities/terminal-mfa-policy.entity.spec.ts --runInBand
```

Expected:

- Prisma client generation passes
- entity tests pass

## Task 3: Auth-service Repositories And Policy Application Services

**Files:**
- Create: `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.terminal-login-policy.repository.ts`
- Create: `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.terminal-mfa-policy.repository.ts`
- Create: `src/services/system/auth-service/src/application/services/terminal-login-policy.service.ts`
- Create: `src/services/system/auth-service/src/application/services/terminal-mfa-policy.service.ts`
- Modify: `src/services/system/auth-service/src/modules/auth/auth.module.ts`
- Create repository and service specs.

- [ ] **Step 1: Write repository tests**

Tests must cover:

- missing terminal login policy returns platform defaults
- save and reload preserves enabled flows
- missing tenant terminal MFA policy falls back to platform default
- tenant override wins over platform default

Run:

```bash
pnpm --filter auth-service exec jest infrastructure/repositories/prisma/prisma.terminal-login-policy.repository.spec.ts infrastructure/repositories/prisma/prisma.terminal-mfa-policy.repository.spec.ts --runInBand
```

Expected before implementation:

- tests fail because repositories do not exist

- [ ] **Step 2: Implement Prisma repositories**

Repositories must serialize JSON arrays defensively:

```ts
const flows = Array.isArray(record.enabledLoginFlows) ? record.enabledLoginFlows.map(String) : []
```

Do not parse policy JSON with ad hoc string manipulation.

- [ ] **Step 3: Write service tests**

`TerminalLoginPolicyService` tests:

- rejects disabled `PHONE_OTP` on `WEB` before credential validation
- accepts enabled `EMAIL_PASSWORD` on `WEB`
- rejects unsupported enabled flow updates

`TerminalMfaPolicyService` tests:

- resolves tenant override for `WEB`
- resolves platform default when tenant policy is absent
- PDA default resolves `loginMfaRequired=false`

- [ ] **Step 4: Implement services**

`TerminalLoginPolicyService` exposes:

```ts
assertFlowAllowed(terminal: string, loginFlow: string): Promise<void>
getPlatformPolicy(): Promise<TerminalLoginPolicyEntity[]>
updatePlatformPolicy(input: UpdateTerminalLoginPolicyInput): Promise<TerminalLoginPolicyEntity>
```

`TerminalMfaPolicyService` exposes:

```ts
resolve(input: { tenantId?: string; terminal: string }): Promise<TerminalMfaPolicyResolution>
getPlatformDefaults(): Promise<TerminalMfaPolicyEntity[]>
updatePlatformDefault(input: UpdateTerminalMfaPolicyInput): Promise<TerminalMfaPolicyEntity>
getTenantPolicy(tenantId: string): Promise<TerminalMfaPolicyResolution[]>
updateTenantPolicy(input: UpdateTenantTerminalMfaPolicyInput): Promise<TerminalMfaPolicyEntity>
```

- [ ] **Step 5: Register providers**

Register repositories and services in `auth.module.ts`.

- [ ] **Step 6: Run targeted tests**

Run:

```bash
pnpm --filter auth-service exec jest terminal-login-policy terminal-mfa-policy --runInBand
```

Expected:

- all new policy tests pass

## Task 4: Runtime Login Flow Enforcement

**Files:**
- Modify: `src/services/system/auth-service/src/application/commands/auth/login-with-email-password.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/login-with-phone-password.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/login-with-email-otp.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/login-with-phone-otp.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/request-email-otp-login-challenge.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/request-phone-otp-login-challenge.handler.ts`
- Modify corresponding command classes and specs.

- [ ] **Step 1: Write failing handler tests**

For each primary login path, add one test proving policy is checked before credential work:

```ts
expect(terminalLoginPolicyService.assertFlowAllowed).toHaveBeenCalledWith('WEB', 'EMAIL_PASSWORD')
expect(authStrategyFactory.get).not.toHaveBeenCalled()
```

Use the disabled policy case to assert stable denial code:

```text
LOGIN_FLOW_NOT_ALLOWED_FOR_TERMINAL
```

- [ ] **Step 2: Inject policy service into login handlers**

Each handler must call `assertFlowAllowed` before:

- password login throttling
- OTP challenge lookup
- OTP send
- credential validation

- [ ] **Step 3: Preserve fixed frontend flows**

Do not add a new generic "choose login method" flow. Existing Web and PDA BFF flows continue to submit their fixed login method payloads.

- [ ] **Step 4: Run login handler tests**

Run:

```bash
pnpm --filter auth-service exec jest application/commands/auth/login-with-email-password.handler.spec.ts application/commands/auth/login-with-phone-password.handler.spec.ts application/commands/auth/login-with-email-otp.handler.spec.ts application/commands/auth/login-with-phone-otp.handler.spec.ts --runInBand
```

Expected:

- disabled terminal login flow is denied before credential validation
- existing successful login behavior remains unchanged when flow is enabled

## Task 5: Terminal MFA Runtime Resolution

**Files:**
- Modify: `src/services/system/auth-service/src/application/services/account-session-establishment.service.ts`
- Modify: `src/services/system/auth-service/src/application/services/mfa/login-mfa-orchestration.service.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/select-account.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/submit-mfa-challenge.handler.ts`
- Create or update specs for the files above.

- [ ] **Step 1: Write MFA resolution tests**

Cover:

- WEB tenant override `loginMfaRequired=true` returns `MFA_REQUIRED`
- PDA default `loginMfaRequired=false` establishes session without MFA
- PDA explicit tenant override `loginMfaRequired=true` returns `MFA_REQUIRED`
- platform default is used when tenant override is absent

- [ ] **Step 2: Replace global login MFA checks with terminal resolution**

The runtime decision must use:

```ts
await terminalMfaPolicyService.resolve({
  tenantId: account.tenantId,
  terminal
})
```

Do not use a global `loginRequired` flag as the final source for Phase 2 paths.

- [ ] **Step 3: Keep existing factor orchestration**

Factor binding, priority, OTP factor challenge, TOTP, backup code, and recovery code behavior remain in existing MFA services. This task only changes whether login MFA is required for the current terminal.

- [ ] **Step 4: Run MFA tests**

Run:

```bash
pnpm --filter auth-service exec jest application/services/mfa/login-mfa-orchestration.service.spec.ts application/commands/auth/select-account.handler.spec.ts application/commands/auth/submit-mfa-challenge.handler.spec.ts --runInBand
```

Expected:

- terminal-aware MFA decisions pass
- legacy MFA factor behavior remains green

## Task 6: Terminal-aware Session Metadata And Login History

**Files:**
- Modify: `src/services/system/auth-service/src/domain/aggregates/usersession.aggregate.ts`
- Modify: `src/services/system/auth-service/src/infrastructure/repositories/redis/session/redis-user-session.repository.ts`
- Modify: `src/services/system/auth-service/src/application/services/account-session-establishment.service.ts`
- Modify: `src/services/system/auth-service/src/application/services/auth-audit.service.ts`
- Modify: `src/services/system/auth-service/src/application/queries/session/list-sessions.handler.ts`
- Modify: `src/services/system/auth-service/src/application/queries/session/admin-list-user-sessions.handler.ts`
- Modify: `src/services/system/auth-service/src/application/queries/audit/login-history-query.result.ts`
- Update corresponding specs.

- [ ] **Step 1: Write session aggregate tests**

Cover:

- creates WEB session with `terminal`, `loginFlow`, `userId`, `accountId`, `tenantId`
- creates PDA session with `terminalDeviceId` and `deviceBoundTenantId`
- serializes and deserializes optional terminal device fields without dropping them

- [ ] **Step 2: Extend session aggregate and Redis mapping**

Add getters:

```ts
getLoginFlow(): string
getTerminalDeviceId(): string | undefined
getDeviceBoundTenantId(): string | undefined
```

Redis serialization must keep backward compatibility for old sessions missing these fields.

- [ ] **Step 3: Extend audit context**

`AuthAuditService.buildSessionContext` must include:

```ts
terminal: session.getTerminal()
loginFlow: session.getLoginFlow()
terminalDeviceId: session.getTerminalDeviceId()
deviceBoundTenantId: session.getDeviceBoundTenantId()
```

- [ ] **Step 4: Update session query views**

Self-service and admin session lists must expose:

- terminal
- loginFlow
- account/tenant fields already available
- terminalDeviceId
- deviceBoundTenantId
- display summaries only, not full device registry truth

- [ ] **Step 5: Update login history view mapping**

Map auth audit events into login history with:

- login success
- login failure
- login denied
- MFA result

Exclude ordinary refresh success and access token validation events from the ordinary login history view.

- [ ] **Step 6: Run session and audit tests**

Run:

```bash
pnpm --filter auth-service exec jest domain/aggregates/usersession.aggregate.spec.ts infrastructure/repositories/redis/session/redis-user-session.repository.spec.ts application/queries/session/list-sessions.handler.spec.ts application/queries/session/admin-list-user-sessions.handler.spec.ts application/queries/audit/list-login-history.handler.spec.ts --runInBand
```

Expected:

- terminal-aware session metadata is preserved
- login history excludes ordinary refresh/validate events

## Task 7: PDA Device-bound Tenant And Unique PDA Account Resolution

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/terminal-auth.controller.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/login.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/terminal-device-service/terminal-device-access.adapter.ts`
- Modify: `src/services/system/auth-service/src/application/ports/identity-service.port.ts`
- Create: `src/services/system/auth-service/src/application/services/pda-account-resolution.service.ts`
- Update specs.

- [ ] **Step 1: Write PDA BFF tests**

Add tests proving:

- `/pda/auth/login` sends `terminal=PDA`
- PDA login calls terminal-device access decision before auth-service login
- PDA login passes `terminalDeviceId` and `deviceBoundTenantId`
- PDA login request does not accept user-selected tenant

- [ ] **Step 2: Add terminal-device access adapter**

Adapter method:

```ts
resolveLoginDeviceContext(input: {
  terminalDeviceId: string
  deviceMetadata: Record<string, unknown>
}): Promise<{ terminalDeviceId: string; deviceBoundTenantId: string; allowed: boolean; reasonCode?: string }>
```

If terminal-device-service denies login, BFF returns a stable denial response and does not call auth-service.

- [ ] **Step 3: Write auth-service PDA resolution tests**

`PdaAccountResolutionService` must cover:

- no candidate account in device-bound tenant -> denied
- two PDA-allowed candidate accounts -> denied
- one PDA-allowed account -> returns account

- [ ] **Step 4: Implement PDA unique account resolution**

The service must:

1. query identity-service accounts for `userId`
2. filter to `tenantId === deviceBoundTenantId`
3. call permission-service terminal access decision for `PDA`
4. require exactly one allowed account

- [ ] **Step 5: Wire PDA login path**

After primary authentication, PDA path must call `PdaAccountResolutionService` instead of returning account options.

- [ ] **Step 6: Run PDA auth tests**

Run:

```bash
pnpm --dir app/pda/web test
pnpm --filter api-gateway exec jest auth-bff/interfaces/http/controllers/terminal-auth.controller.spec.ts auth-bff/application/use-cases/login.use-case.spec.ts --runInBand
pnpm --filter auth-service exec jest application/services/pda-account-resolution.service.spec.ts --runInBand
```

Expected:

- PDA does not expose account selection
- PDA logs in only when one PDA-eligible account exists in the device-bound tenant

## Task 8: Managed Terminal Device Unavailable Event Cleanup

**Files:**
- Modify: `src/services/system/terminal-device-service/src/application/commands/device/change-terminal-device-status.command.ts`
- Modify or create terminal-device domain event publisher in `src/services/system/terminal-device-service/src/application/**`
- Create: `src/services/system/auth-service/src/application/commands/auth/handle-terminal-device-unavailable.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/handle-terminal-device-unavailable.handler.ts`
- Modify: `src/services/system/auth-service/src/domain/repositories/user-session.repository.ts`
- Modify: `src/services/system/auth-service/src/infrastructure/repositories/redis/session/redis-user-session.repository.ts`
- Update specs.

- [ ] **Step 1: Write terminal-device event tests**

Status transitions to `DISABLED`, `LOST`, `UNBOUND`, or `RETIRED` must publish a device-unavailable event containing:

- terminalDeviceId
- tenantId
- previousStatus
- newStatus
- operator context
- trace context

- [ ] **Step 2: Add session repository lookup**

Add repository method:

```ts
findActiveByTerminalDeviceId(terminalDeviceId: string): Promise<Session[]>
```

and a delete/revoke method that can be called idempotently for each matching session.

- [ ] **Step 3: Write auth cleanup handler tests**

Cover:

- event revokes all active sessions for one terminalDeviceId
- repeated event is idempotent
- sessions for other terminalDeviceId values remain active
- audit event is emitted with terminalDeviceId and reason

- [ ] **Step 4: Implement cleanup handler**

The handler must not call terminal-device-service synchronously. It consumes the event fact and changes only auth session truth.

- [ ] **Step 5: Keep runtime state checks**

PDA login / refresh / bootstrap paths must still query terminal-device-service for current device access state. Event cleanup is not the only protection.

- [ ] **Step 6: Run event cleanup tests**

Run:

```bash
pnpm --filter terminal-device-service test
pnpm --filter auth-service exec jest handle-terminal-device-unavailable redis-user-session.repository --runInBand
```

Expected:

- device unavailable events are emitted
- auth-service cleanup is idempotent and audited

## Task 9: gRPC Controllers, Presenters, And BFF Management Endpoints

**Files:**
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth-grpc.presenter.ts`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-security.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
- Update specs.

- [ ] **Step 1: Write auth gRPC controller tests**

Cover mapping for:

- get/update platform terminal login policy
- get/update platform default terminal MFA policy
- get/update tenant terminal MFA policy
- handle terminal device unavailable

- [ ] **Step 2: Implement controller mappings**

Controllers must only map request/response shape and dispatch commands/queries. They must not contain policy rules.

- [ ] **Step 3: Write BFF tests**

Cover:

- platform endpoints require platform permission metadata
- tenant terminal MFA endpoints use current operator tenant, not frontend tenant input
- PDA/KIOSK MFA update requires an explicit confirmation flag in DTO when enabling
- BFF does not expose tenant primary login method settings

- [ ] **Step 4: Implement BFF DTOs and view models**

Add DTO fields that mirror docs:

```ts
enabledLoginFlows: string[]
loginMfaRequired: boolean
newDeviceMfaRequired: boolean
allowedFactors: string[]
factorPriority: string[]
reason?: string
confirmOperationalImpact?: boolean
```

- [ ] **Step 5: Implement use-case and adapter methods**

Use permission guarded controller patterns already used by admin security endpoints. BFF forwards policy writes to auth-service and never persists policy locally.

- [ ] **Step 6: Run controller and BFF tests**

Run:

```bash
pnpm --filter auth-service exec jest interfaces/grpc/auth.grpc.controller.spec.ts --runInBand
pnpm --filter api-gateway exec jest auth-bff/application/use-cases/admin-security.use-case.spec.ts auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand
```

Expected:

- new RPC mappings pass
- platform and tenant admin BFF behavior passes

## Task 10: Account Security And Admin Session UX/API Hardening

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/self-security.view-model.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-security.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts`
- Modify tenant-web files under `app/web/apps/tenant-web/src/**` after locating the existing account-security and admin-security pages.

- [ ] **Step 1: Extend self-service session view**

Expose:

- terminal
- loginFlow
- accountSummary
- tenantSummary
- terminalDeviceSummary
- current-session marker

- [ ] **Step 2: Extend admin session filters**

DTO supports:

- userId / keyword
- accountId
- tenantId
- terminal
- terminalDeviceId
- status
- lastSeen range

Do not add a "revoke filtered sessions" endpoint.

- [ ] **Step 3: Keep admin write operations narrow**

Only expose:

- revoke one session
- revoke all sessions for a selected user

- [ ] **Step 4: Implement tenant-web platform policy page**

Page behavior:

- platform admin can view WEB/PDA/KIOSK terminal login flows
- platform admin can enable/disable implemented flows only
- disabling all flows for one terminal requires confirmation
- unsupported flows render as disabled or are not shown

- [ ] **Step 5: Implement tenant terminal MFA page**

Page behavior:

- tenant admin sees each terminal's effective MFA setting and source
- tenant admin can override each terminal
- enabling PDA/KIOSK MFA shows an operational impact warning
- no primary login method controls appear on the tenant page

- [ ] **Step 6: Run API gateway and tenant-web tests**

Run:

```bash
pnpm --filter api-gateway exec jest auth-bff/application/use-cases/session-self-service.use-case.spec.ts auth-bff/application/use-cases/admin-security.use-case.spec.ts --runInBand
pnpm --dir app/web test
```

Expected:

- session list includes terminal-aware metadata
- admin filters work without broad batch revoke
- tenant-web pages show only allowed controls

## Task 11: Migration, Seed, And Backward Compatibility

**Files:**
- Modify: `src/services/system/auth-service/prisma/schema.prisma`
- Create migration files under the auth-service Prisma migration path used by the repo.
- Create or update seed scripts if the repo has auth-service seed infrastructure.
- Update docs only if implementation diverges from frozen design.

- [ ] **Step 1: Add seed defaults**

Seed platform terminal login policy:

```text
WEB: EMAIL_PASSWORD, EMAIL_OTP, PHONE_PASSWORD, PHONE_OTP
PDA: PASSWORD
KIOSK: empty
MOBILE: empty
```

Seed platform terminal MFA defaults:

```text
WEB: loginMfaRequired=false
PDA: loginMfaRequired=false
KIOSK: loginMfaRequired=false
MOBILE: loginMfaRequired=false
```

- [ ] **Step 2: Backfill active sessions safely**

Existing sessions without `loginFlow` should default to:

```text
loginFlow = existing loginMethod if present, otherwise UNKNOWN_LEGACY
terminal = existing terminal if present, otherwise WEB
```

Do not make old sessions invalid solely because they lack new optional PDA fields.

- [ ] **Step 3: Verify database sync**

Run:

```bash
pnpm --filter auth-service prisma:generate
pnpm --filter auth-service prisma:push
```

Expected:

- Prisma client generation succeeds
- schema pushes in local development DB

## Task 12: End-to-end Verification

**Files:**
- No new source files; this task validates the full slice.

- [ ] **Step 1: Run focused service tests**

Run:

```bash
pnpm --filter auth-service exec jest terminal-login-policy terminal-mfa-policy pda-account-resolution handle-terminal-device-unavailable --runInBand
pnpm --filter api-gateway exec jest auth-bff --runInBand
```

Expected:

- focused auth-service and api-gateway suites pass

- [ ] **Step 2: Run service builds**

Run:

```bash
pnpm --filter auth-service build
pnpm --filter api-gateway build
pnpm --filter terminal-device-service build
```

Expected:

- all three builds pass

- [ ] **Step 3: Run terminal smoke checks**

Run existing smoke commands appropriate to the changed services:

```bash
pnpm --filter auth-service test:l2
pnpm --filter permission-service test:l2
pnpm --filter api-gateway exec jest --runInBand
```

Expected:

- terminal access still gates account access
- terminal login policy gates only login flow availability
- MFA resolution is terminal-specific
- PDA does not expose account selection

- [ ] **Step 4: Update feature packet status**

Update `docs/plans/features/terminal-aware-account-security-phase-2.md` with implementation status, verification commands, and residual risks after the code lands.

## Self-review Checklist

- [ ] Every frozen requirement in `docs/plans/features/terminal-aware-account-security-phase-2.md` maps to at least one task above.
- [ ] No task introduces tenant primary login method configuration.
- [ ] No task introduces PDA account selection.
- [ ] No task makes PDA/KIOSK a personal trusted login device.
- [ ] No task exposes admin "revoke filtered sessions" behavior.
- [ ] PDA device unavailable cleanup remains an auth-service session change triggered by terminal-device facts.
- [ ] Platform defaults for terminal MFA are not treated as a minimum security baseline.

## Execution Recommendation

Use subagent-driven development only after the current worktree is clean or after this plan is copied into an isolated worktree. The current workspace contains unrelated changes in `permission-service` and `terminal-device-service`; do not revert or overwrite them while implementing this plan.
