# Tenant Onboarding Flow Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the production tenant onboarding flow that creates a tenant, its organization party/root org/tenant-party binding, the first tenant admin user/account/login method, and the tenant.admin grant through owner-service boundaries.

**Architecture:** `tenant-org-service` owns a lightweight Saga / Process Manager for tenant onboarding. Gateway exposes the HTTP BFF contract but does not own flow state. Party, identity, auth, and permission services keep their own truths; `tenant-org-service` stores only onboarding run/step state plus external object references.

**Tech Stack:** NestJS, gRPC, Prisma, PostgreSQL, Jest, Vitest, Vue, Ant Design Vue, `@oes/common`.

---

## 0. Current Status

- Status: runtime-supported as of 2026-05-05.
- This implementation now supports creating the first tenant admin as an HR employee with an initial employment through `hr-service`.
- `tenant-org-service` still owns only onboarding Saga state and external refs; it does not own employee, employment, party, identity, auth, or permission truth.
- Current document closeout does not rerun Jest / Vitest per master-thread direction.

## 1. Required Reading

- [Tenant onboarding feature packet](/Users/acehood/Documents/GitHub/oes/docs/plans/features/tenant-onboarding-flow-hardening.md)
- [Tenant onboarding design workspace](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/tenant-onboarding-flow-hardening.md)
- [tenant-org onboarding contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/tenant-org-service/onboarding.md)
- [permission tenant onboarding grant contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/tenant-onboarding-grant.md)
- [api-gateway tenant onboarding contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/tenant-onboarding.md)
- [party registration contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/registration.md)
- [identity management contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/identity-service/management.md)
- [auth login contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/login.md)

## 2. Ownership Guardrails

- Do not move party, identity, auth, or permission truth into `tenant-org-service`.
- Do not call other services' Prisma clients from `tenant-org-service`.
- Do not put onboarding step state in Gateway.
- Do not reuse `GrantInitialAccessForEmployeeAccount` for tenant first-admin onboarding.
- Do not create account-org membership in this flow.
- First-admin employee / employment support must call `hr-service`; do not persist HR truth in `tenant-org-service`.
- Do not introduce full `workflow-service` in this feature.
- Every new or rewritten class/function/handler/repository must have a one-sentence summary comment per AGENTS.md.

## 3. File Structure Map

### Common contracts

Modify:

- `src/common/src/contracts/tenant_org_service/tenant_org.proto`
- `src/common/src/contracts/permission_service/permission_management.proto`
- `src/common/src/contracts/party_service/party.proto`
- `src/common/src/contracts/identity_service/identity_management.proto`
- `src/common/src/contracts/auth_service/auth.proto` only if generated request metadata or response shape needs alignment
- `src/common/src/contracts/index.ts`

### tenant-org-service

Modify:

- `src/services/system/tenant-org-service/prisma/schema.prisma`
- `src/services/system/tenant-org-service/src/application/services/tenant-org-management.service.ts`
- `src/services/system/tenant-org-service/src/interfaces/grpc/tenant-org-management.grpc.controller.ts`
- `src/services/system/tenant-org-service/src/modules/tenant-org-management/tenant-org-management.module.ts`
- `src/services/system/tenant-org-service/src/infrastructure/repositories/prisma-tenant.repository.ts`

Create:

- `src/services/system/tenant-org-service/src/domain/value-objects/tenant-onboarding.enums.ts`
- `src/services/system/tenant-org-service/src/domain/repositories/tenant-onboarding-run.repository.ts`
- `src/services/system/tenant-org-service/src/application/services/tenant-onboarding.service.ts`
- `src/services/system/tenant-org-service/src/application/ports/party-registration.port.ts`
- `src/services/system/tenant-org-service/src/application/ports/identity-account-onboarding.port.ts`
- `src/services/system/tenant-org-service/src/application/ports/auth-login-onboarding.port.ts`
- `src/services/system/tenant-org-service/src/application/ports/permission-tenant-onboarding.port.ts`
- `src/services/system/tenant-org-service/src/infrastructure/adapters/party-registration.grpc.adapter.ts`
- `src/services/system/tenant-org-service/src/infrastructure/adapters/identity-account-onboarding.grpc.adapter.ts`
- `src/services/system/tenant-org-service/src/infrastructure/adapters/auth-login-onboarding.grpc.adapter.ts`
- `src/services/system/tenant-org-service/src/infrastructure/adapters/permission-tenant-onboarding.grpc.adapter.ts`
- `src/services/system/tenant-org-service/src/infrastructure/repositories/prisma-tenant-onboarding-run.repository.ts`
- `src/services/system/tenant-org-service/test/l1/tenant-onboarding.service.spec.ts`
- `src/services/system/tenant-org-service/test/l2/prisma.tenant-onboarding-run.repository.spec.ts`
- `src/services/system/tenant-org-service/test/l3/tenant-onboarding.grpc.controller.spec.ts`

### permission-service

Modify:

- `src/services/system/permission-service/prisma/schema.prisma`
- `src/services/system/permission-service/src/domain/repositories/onboarding-grant-request.repository.ts`
- `src/services/system/permission-service/src/infrastructure/repositories/prisma/prisma.onboarding-grant-request.repository.ts`
- `src/services/system/permission-service/src/application/commands/role/index.ts`
- `src/services/system/permission-service/src/interfaces/grpc/permission-management.grpc.controller.ts`
- `src/services/system/permission-service/src/common/constants/exception-enums/onboarding.errors.ts`

Create:

- `src/services/system/permission-service/src/domain/entities/role-instance-ensure-request.entity.ts`
- `src/services/system/permission-service/src/domain/repositories/role-instance-ensure-request.repository.ts`
- `src/services/system/permission-service/src/infrastructure/repositories/prisma/prisma.role-instance-ensure-request.repository.ts`
- `src/services/system/permission-service/src/application/commands/role/ensure-tenant-role-instance-from-template.command.ts`
- `src/services/system/permission-service/src/application/commands/role/ensure-tenant-role-instance-from-template.handler.ts`
- `src/services/system/permission-service/src/application/commands/role/grant-initial-access-for-tenant-account.command.ts`
- `src/services/system/permission-service/src/application/commands/role/grant-initial-access-for-tenant-account.handler.ts`
- `src/services/system/permission-service/test/l1/ensure-tenant-role-instance-from-template.handler.spec.ts`
- `src/services/system/permission-service/test/l1/grant-initial-access-for-tenant-account.handler.spec.ts`

### party-service and identity-service

Modify:

- `src/services/system/party-service/prisma/schema.prisma`
- `src/services/system/party-service/src/application/services/party-registration.service.ts`
- `src/services/system/party-service/src/interfaces/grpc/party-registration.grpc.controller.ts`
- `src/services/system/identity-service/src/application/commands/account/create-user-account.command.ts`
- `src/services/system/identity-service/src/application/commands/account/create-user-account.handler.ts`
- `src/services/system/identity-service/src/interfaces/grpc/identity-management.grpc.controller.ts`
- `src/services/system/identity-service/src/interfaces/grpc/identity-grpc.presenter.ts`
- `src/services/system/identity-service/src/infrastructure/adaptors/party-registration.grpc.adaptor.ts`

Create:

- `src/services/system/party-service/src/domain/repositories/party-registration-idempotency.repository.ts`
- `src/services/system/party-service/src/infrastructure/repositories/prisma-party-registration-idempotency.repository.ts`
- `src/services/system/party-service/test/l1/party-registration-idempotency.spec.ts`
- `src/services/system/identity-service/test/l1/create-user-account-idempotency.spec.ts`

### api-gateway and tenant-web

Modify:

- `src/services/api-gateway/src/modules/tenant-org-service/tenant-management.service.ts`
- `src/services/api-gateway/src/modules/tenant-org-service/adapters/tenant-org-management-grpc.adapter.ts`
- `src/services/api-gateway/src/modules/tenant-org-service/interface/http/controllers/tenant-management.controller.ts`
- `src/services/api-gateway/src/modules/tenant-org-service/tenant-management.service.spec.ts`
- `src/services/api-gateway/src/modules/tenant-org-service/interface/http/controllers/tenant-management.controller.spec.ts`
- `app/web/apps/tenant-web/src/api/bff/tenant-management/index.ts`
- `app/web/apps/tenant-web/src/api/bff/tenant-management/index.spec.ts`
- `app/web/apps/tenant-web/src/views/admin/tenant-management.vue`
- `app/web/apps/tenant-web/src/views/admin/tenant-management.spec.ts`

Create:

- `src/services/api-gateway/src/modules/tenant-org-service/interface/http/dtos/create-tenant-onboarding.dto.ts`
- `src/services/api-gateway/src/modules/tenant-org-service/interface/http/dtos/retry-tenant-onboarding.dto.ts`

## 4. Task 1: Common Contract Realization

**Files:**

- Modify: `src/common/src/contracts/tenant_org_service/tenant_org.proto`
- Modify: `src/common/src/contracts/permission_service/permission_management.proto`
- Modify: `src/common/src/contracts/party_service/party.proto`
- Modify: `src/common/src/contracts/identity_service/identity_management.proto`

- [ ] **Step 1: Add tenant-org onboarding RPCs**

Add to `TenantOrgManagementService`:

```proto
rpc StartTenantOnboarding(StartTenantOnboardingRequest) returns (TenantOnboardingResponse);
rpc GetTenantOnboarding(GetTenantOnboardingRequest) returns (TenantOnboardingResponse);
rpc RetryTenantOnboarding(RetryTenantOnboardingRequest) returns (TenantOnboardingResponse);
```

Define messages:

```proto
message TenantOnboardingTenantInput {
  string code = 1;
  string name = 2;
}

message TenantOnboardingIdentifierInput {
  string identifier_type = 1;
  string raw_value = 2;
  string normalized_value = 3;
  string issuer_country_or_region = 4;
}

message TenantOnboardingOrganizationPartyInput {
  string legal_name = 1;
  string registered_country = 2;
  repeated TenantOnboardingIdentifierInput identifiers = 3;
}

message TenantOnboardingRootOrgInput {
  string name = 1;
}

message TenantOnboardingFirstAdminInput {
  string display_name = 1;
  string email = 2;
  string phone = 3;
  bool require_password_setup = 4;
}

message StartTenantOnboardingRequest {
  string idempotency_key = 1;
  TenantOnboardingTenantInput tenant = 2;
  TenantOnboardingOrganizationPartyInput organization_party = 3;
  TenantOnboardingRootOrgInput root_org = 4;
  TenantOnboardingFirstAdminInput first_admin = 5;
}
```

- [ ] **Step 2: Add tenant-org onboarding response messages**

Add:

```proto
message TenantOnboardingStep {
  string key = 1;
  string status = 2;
  string message = 3;
  int32 attempt_count = 4;
}

message TenantOnboardingFailure {
  string code = 1;
  string message = 2;
  string failed_step = 3;
  bool retryable = 4;
}

message TenantOnboardingOrganizationPartyResult {
  string party_id = 1;
  string tenant_party_id = 2;
}

message TenantOnboardingFirstAdminResult {
  string user_id = 1;
  string account_id = 2;
  string person_party_id = 3;
  string tenant_party_id = 4;
}

message TenantOnboardingAccessResult {
  string role_code = 1;
  string role_id = 2;
  string grant_id = 3;
}

message TenantOnboardingResponse {
  string onboarding_id = 1;
  string status = 2;
  TenantSummary tenant = 3;
  OrgUnitSummary root_org = 4;
  TenantOnboardingOrganizationPartyResult organization_party = 5;
  TenantOnboardingFirstAdminResult first_admin = 6;
  TenantOnboardingAccessResult access = 7;
  repeated TenantOnboardingStep steps = 8;
  TenantOnboardingFailure failure = 9;
}
```

- [ ] **Step 3: Add permission onboarding RPCs**

Add to `PermissionManagementService`:

```proto
rpc EnsureTenantRoleInstanceFromTemplate(EnsureTenantRoleInstanceFromTemplateRequest) returns (EnsureTenantRoleInstanceFromTemplateResponse);
rpc GrantInitialAccessForTenantAccount(GrantInitialAccessForTenantAccountRequest) returns (GrantInitialAccessForTenantAccountResponse);
```

Use request fields exactly from [tenant-onboarding-grant.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/tenant-onboarding-grant.md).

- [ ] **Step 4: Extend party registration requests with idempotency**

Add `string idempotency_key` to:

- `RegisterPersonPartyRequest`
- `RegisterOrganizationPartyRequest`
- `BindExistingPartyToTenantRequest`

Keep existing fields and field numbers stable; add new fields at the end.

- [ ] **Step 5: Extend identity create-account response**

Add response fields so onboarding can persist complete first-admin references:

```proto
message CreateUserAccountResponse {
  AccountSummary account = 1;
  string user_party_id = 2;
  string user_tenant_party_id = 3;
}
```

If the existing proto already has field `1`, append fields `2` and `3` only.

- [ ] **Step 6: Regenerate and verify contracts**

Run:

```bash
pnpm proto:lint
pnpm proto:generate
pnpm --filter @oes/common build
```

Expected:

- proto lint passes
- generated TypeScript contains the new request/response types
- common package builds

## 5. Task 2: Party Registration Idempotency

**Files:**

- Modify: `src/services/system/party-service/prisma/schema.prisma`
- Modify: `src/services/system/party-service/src/application/services/party-registration.service.ts`
- Modify: `src/services/system/party-service/src/interfaces/grpc/party-registration.grpc.controller.ts`
- Create: `src/services/system/party-service/src/domain/repositories/party-registration-idempotency.repository.ts`
- Create: `src/services/system/party-service/src/infrastructure/repositories/prisma-party-registration-idempotency.repository.ts`
- Test: `src/services/system/party-service/test/l1/party-registration-idempotency.spec.ts`

- [ ] **Step 1: Add idempotency model**

Add a Prisma model:

```prisma
model PartyRegistrationIdempotency {
  id             String   @id @default(uuid()) @db.Uuid
  idempotencyKey String   @unique @db.VarChar(255)
  operation      String   @db.VarChar(100)
  fingerprint    String   @db.Text
  partyId        String?  @db.Uuid
  tenantPartyId  String?  @db.Uuid
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([operation])
}
```

- [ ] **Step 2: Write L1 idempotency tests**

Cover:

- same key + same request returns same party / tenant-party
- same key + different fingerprint rejects
- no idempotency key preserves existing behavior

- [ ] **Step 3: Implement repository**

Expose:

```ts
export interface PartyRegistrationIdempotencyRepository {
  findByKey(idempotencyKey: string): Promise<PartyRegistrationIdempotencyRecord | null>
  saveSucceeded(input: SavePartyRegistrationIdempotencyInput): Promise<void>
}
```

- [ ] **Step 4: Wire service logic**

In `PartyRegistrationService`, before creating side effects:

1. Normalize idempotency key.
2. Build a deterministic fingerprint from operation + owner fields.
3. If existing key matches fingerprint and has refs, return hydrated result.
4. If existing key conflicts, throw conflict.
5. After successful write, save refs.

- [ ] **Step 5: Verify party-service**

Run:

```bash
pnpm --filter party-service prisma:generate
pnpm --filter party-service test -- party-registration-idempotency.spec.ts
```

Expected:

- Prisma client generates
- idempotency tests pass

## 6. Task 3: Identity Create Account Onboarding References

**Files:**

- Modify: `src/services/system/identity-service/src/application/commands/account/create-user-account.command.ts`
- Modify: `src/services/system/identity-service/src/application/commands/account/create-user-account.handler.ts`
- Modify: `src/services/system/identity-service/src/interfaces/grpc/identity-management.grpc.controller.ts`
- Modify: `src/services/system/identity-service/src/infrastructure/adaptors/party-registration.grpc.adaptor.ts`
- Test: `src/services/system/identity-service/test/l1/create-user-account-idempotency.spec.ts`

- [ ] **Step 1: Add command idempotency input**

Extend `CreateUserAccountCommand` with optional:

```ts
readonly idempotencyKey?: string
```

Use this key when calling party-service:

```ts
idempotencyKey: command.idempotencyKey
  ? `${command.idempotencyKey}:person-party`
  : undefined
```

- [ ] **Step 2: Return party refs from handler**

Change handler result shape to include:

```ts
{
  account: AccountSummaryEntity
  userPartyId?: string
  userTenantPartyId?: string
}
```

- [ ] **Step 3: Update gRPC controller response**

Map:

```ts
return {
  account: IdentityGrpcPresenter.toAccountSummary(result.account),
  userPartyId: result.userPartyId ?? '',
  userTenantPartyId: result.userTenantPartyId ?? ''
}
```

- [ ] **Step 4: Verify identity tests**

Run:

```bash
pnpm --filter identity-service test -- create-user-account
```

Expected:

- existing create-account tests pass
- new tests prove party refs are surfaced

## 7. Task 4: Permission Tenant Onboarding Grant

**Files:**

- Modify: `src/services/system/permission-service/prisma/schema.prisma`
- Create: `src/services/system/permission-service/src/application/commands/role/ensure-tenant-role-instance-from-template.command.ts`
- Create: `src/services/system/permission-service/src/application/commands/role/ensure-tenant-role-instance-from-template.handler.ts`
- Create: `src/services/system/permission-service/src/application/commands/role/grant-initial-access-for-tenant-account.command.ts`
- Create: `src/services/system/permission-service/src/application/commands/role/grant-initial-access-for-tenant-account.handler.ts`
- Modify: `src/services/system/permission-service/src/interfaces/grpc/permission-management.grpc.controller.ts`
- Test: `src/services/system/permission-service/test/l1/ensure-tenant-role-instance-from-template.handler.spec.ts`
- Test: `src/services/system/permission-service/test/l1/grant-initial-access-for-tenant-account.handler.spec.ts`

- [ ] **Step 1: Add role ensure idempotency persistence**

Add:

```prisma
model RoleInstanceEnsureRequest {
  id             String   @id @default(uuid())
  idempotencyKey String   @unique
  tenantId       String
  templateCode   String
  roleId         String
  fingerprint    String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([tenantId, templateCode])
}
```

- [ ] **Step 2: Implement ensure command**

Behavior:

- Resolve template by `templateRoleCode`.
- If tenant instance already exists for template code, return existing role.
- If no instance exists, create tenant instance from template permissions and navigation.
- Persist idempotency result.
- Same key + different fingerprint throws idempotency conflict.

- [ ] **Step 3: Implement tenant grant command**

Use the existing employee grant handler as a reference, but do not reuse the class or public method name.

Required behavior:

- Validate `tenantId`, `accountId`, `idempotencyKey`.
- Verify account exists and belongs to tenant via identity account reference port.
- Verify all role IDs are enabled `TENANT_INSTANCE` roles in the same tenant.
- Assign account roles idempotently.
- Persist `OnboardingGrantRequest` with a `reason` or operation marker that distinguishes tenant onboarding from employee onboarding.

- [ ] **Step 4: Add gRPC methods**

In `PermissionManagementGrpcController`, add:

- `ensureTenantRoleInstanceFromTemplate`
- `grantInitialAccessForTenantAccount`

Each method must record audit mutation events.

- [ ] **Step 5: Verify permission-service**

Run:

```bash
pnpm --filter permission-service prisma:generate
pnpm --filter permission-service test -- ensure-tenant-role-instance-from-template grant-initial-access-for-tenant-account
```

Expected:

- ensure is idempotent
- grant is idempotent
- account tenant mismatch is rejected
- disabled or wrong-tenant role is rejected

## 8. Task 5: Tenant-Org Onboarding Persistence

**Files:**

- Modify: `src/services/system/tenant-org-service/prisma/schema.prisma`
- Create: `src/services/system/tenant-org-service/src/domain/value-objects/tenant-onboarding.enums.ts`
- Create: `src/services/system/tenant-org-service/src/domain/repositories/tenant-onboarding-run.repository.ts`
- Create: `src/services/system/tenant-org-service/src/infrastructure/repositories/prisma-tenant-onboarding-run.repository.ts`
- Test: `src/services/system/tenant-org-service/test/l2/prisma.tenant-onboarding-run.repository.spec.ts`

- [ ] **Step 1: Add Prisma models**

Add:

```prisma
enum TenantOnboardingRunStatus {
  PENDING
  RUNNING
  FAILED_RETRYABLE
  FAILED_NEEDS_MANUAL_REVIEW
  SUCCEEDED
}

enum TenantOnboardingStepStatus {
  NOT_STARTED
  RUNNING
  SUCCEEDED
  FAILED
}

model TenantOnboardingRun {
  id                         String                    @id @default(uuid()) @db.Uuid
  idempotencyKey             String                    @unique @db.VarChar(255)
  requestFingerprint         String                    @db.Text
  status                     TenantOnboardingRunStatus @default(PENDING)
  tenantId                   String?                   @db.Uuid
  rootOrgId                  String?                   @db.Uuid
  organizationPartyId        String?                   @db.Uuid
  organizationTenantPartyId  String?                   @db.Uuid
  firstAdminUserId           String?
  firstAdminAccountId        String?
  firstAdminPersonPartyId    String?                   @db.Uuid
  firstAdminTenantPartyId    String?                   @db.Uuid
  tenantAdminRoleId          String?
  tenantAdminGrantId         String?
  failureCode                String?
  failureMessage             String?
  createdBy                  String?
  completedAt                DateTime?
  createdAt                  DateTime                  @default(now())
  updatedAt                  DateTime                  @updatedAt
  steps                      TenantOnboardingStep[]
}

model TenantOnboardingStep {
  id               String                     @id @default(uuid()) @db.Uuid
  runId            String                     @db.Uuid
  stepKey          String                     @db.VarChar(100)
  status           TenantOnboardingStepStatus @default(NOT_STARTED)
  attemptCount     Int                        @default(0)
  lastErrorCode    String?
  lastErrorMessage String?
  externalRefJson  Json?
  startedAt        DateTime?
  completedAt      DateTime?
  createdAt        DateTime                   @default(now())
  updatedAt        DateTime                   @updatedAt
  run              TenantOnboardingRun        @relation(fields: [runId], references: [id], onDelete: Cascade)

  @@unique([runId, stepKey])
}
```

- [ ] **Step 2: Implement repository contract**

Expose:

```ts
export interface TenantOnboardingRunRepository {
  findById(id: string): Promise<TenantOnboardingRunRecord | null>
  findByIdempotencyKey(key: string): Promise<TenantOnboardingRunRecord | null>
  createPending(input: CreateTenantOnboardingRunInput): Promise<TenantOnboardingRunRecord>
  markStepRunning(runId: string, stepKey: string): Promise<void>
  markStepSucceeded(input: MarkTenantOnboardingStepSucceededInput): Promise<void>
  markStepFailed(input: MarkTenantOnboardingStepFailedInput): Promise<void>
  updateRefs(input: UpdateTenantOnboardingRefsInput): Promise<TenantOnboardingRunRecord>
  markSucceeded(runId: string): Promise<TenantOnboardingRunRecord>
}
```

- [ ] **Step 3: Verify repository behavior**

Run:

```bash
pnpm --filter tenant-org-service prisma:generate
pnpm --filter tenant-org-service test -- prisma.tenant-onboarding-run.repository.spec.ts
```

Expected:

- unique idempotency key enforced
- step statuses update independently
- external refs persist and reload

## 9. Task 6: Tenant-Org Downstream Ports And Adapters

**Files:**

- Create all four onboarding port files under `src/services/system/tenant-org-service/src/application/ports`
- Create all four gRPC adapters under `src/services/system/tenant-org-service/src/infrastructure/adapters`
- Modify: `src/services/system/tenant-org-service/src/modules/tenant-org-management/tenant-org-management.module.ts`
- Test: `src/services/system/tenant-org-service/test/l1/tenant-onboarding.service.spec.ts`

- [ ] **Step 1: Define ports**

Ports:

- `PartyRegistrationPort.registerOrganizationParty`
- `PartyRegistrationPort.bindExistingPartyToTenant`
- `IdentityAccountOnboardingPort.createUserAccount`
- `AuthLoginOnboardingPort.bootstrapUserLoginMethods`
- `AuthLoginOnboardingPort.requirePasswordSetup`
- `PermissionTenantOnboardingPort.ensureTenantAdminRole`
- `PermissionTenantOnboardingPort.grantTenantAdmin`

- [ ] **Step 2: Implement adapters**

Each adapter must:

- use generated gRPC clients
- propagate operator-scoped metadata
- call `safeGrpcCall`
- map empty string responses to `undefined`
- never access downstream databases

- [ ] **Step 3: Wire module**

Register adapters in `TenantOrgManagementModule` providers.

## 10. Task 7: Tenant-Org Saga Service And gRPC Controller

**Files:**

- Create: `src/services/system/tenant-org-service/src/application/services/tenant-onboarding.service.ts`
- Modify: `src/services/system/tenant-org-service/src/interfaces/grpc/tenant-org-management.grpc.controller.ts`
- Modify: `src/services/system/tenant-org-service/src/application/services/index.ts`
- Test: `src/services/system/tenant-org-service/test/l1/tenant-onboarding.service.spec.ts`
- Test: `src/services/system/tenant-org-service/test/l3/tenant-onboarding.grpc.controller.spec.ts`

- [ ] **Step 1: Write L1 service tests**

Cover:

- happy path executes steps in order
- duplicate idempotency key with same fingerprint returns existing result
- duplicate idempotency key with different fingerprint rejects
- party failure marks `FAILED_RETRYABLE`
- permission grant failure preserves account refs and marks `FAILED_RETRYABLE`
- retry skips succeeded steps

- [ ] **Step 2: Implement `TenantOnboardingService`**

Use deterministic step execution:

```ts
const STEPS = [
  'REGISTER_ORGANIZATION_PARTY',
  'CREATE_TENANT_WITH_ROOT_ORG',
  'BIND_ORGANIZATION_TENANT_PARTY',
  'CREATE_FIRST_ADMIN_ACCOUNT',
  'BOOTSTRAP_FIRST_ADMIN_LOGIN_METHODS',
  'REQUIRE_FIRST_LOGIN_PASSWORD_SETUP',
  'ENSURE_TENANT_ADMIN_ROLE',
  'GRANT_TENANT_ADMIN_ROLE'
] as const
```

Each step must:

- mark running before calling downstream
- call owner service through a port
- persist returned external refs immediately after success
- mark succeeded
- on failure mark failed with error details and return retryable status

- [ ] **Step 3: Update tenant creation step**

Root org must be created with `organizationPartyId`.

If current `TenantRepository.createWithRootOrg` lacks that input, extend it to:

```ts
createWithRootOrg(input: {
  code: string
  name: string
  rootOrgName: string
  organizationPartyId?: string
})
```

- [ ] **Step 4: Add gRPC controller methods**

Map:

- `startTenantOnboarding`
- `getTenantOnboarding`
- `retryTenantOnboarding`

Responses must include run, steps, refs, and failure state.

- [ ] **Step 5: Verify tenant-org-service**

Run:

```bash
pnpm --filter tenant-org-service test -- tenant-onboarding
```

Expected:

- L1 and L3 onboarding tests pass

## 11. Task 8: API Gateway BFF Contract

**Files:**

- Create: `src/services/api-gateway/src/modules/tenant-org-service/interface/http/dtos/create-tenant-onboarding.dto.ts`
- Create: `src/services/api-gateway/src/modules/tenant-org-service/interface/http/dtos/retry-tenant-onboarding.dto.ts`
- Modify: `src/services/api-gateway/src/modules/tenant-org-service/adapters/tenant-org-management-grpc.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/tenant-org-service/tenant-management.service.ts`
- Modify: `src/services/api-gateway/src/modules/tenant-org-service/interface/http/controllers/tenant-management.controller.ts`
- Test: `src/services/api-gateway/src/modules/tenant-org-service/tenant-management.service.spec.ts`
- Test: `src/services/api-gateway/src/modules/tenant-org-service/interface/http/controllers/tenant-management.controller.spec.ts`

- [ ] **Step 1: Add DTO validation**

DTOs must enforce:

- idempotency key required
- tenant code/name required
- organization legal name required
- root org name required
- first admin display name required
- first admin email or phone required
- phone canonical format when present

- [ ] **Step 2: Add adapter methods**

Add:

- `startTenantOnboarding`
- `getTenantOnboarding`
- `retryTenantOnboarding`

Each must propagate operator-scoped metadata.

- [ ] **Step 3: Add service methods**

In `TenantManagementService`, assert system scope before each onboarding method.

- [ ] **Step 4: Add HTTP routes**

Under existing `tenant-management/tenants` controller or a sibling controller path, expose:

- `POST /tenant-management/onboardings`
- `GET /tenant-management/onboardings/:onboardingId`
- `POST /tenant-management/onboardings/:onboardingId/retry`

- [ ] **Step 5: Verify API Gateway tests**

Run:

```bash
pnpm --filter api-gateway exec jest src/modules/tenant-org-service/tenant-management.service.spec.ts src/modules/tenant-org-service/interface/http/controllers/tenant-management.controller.spec.ts --runInBand
```

Expected:

- non-system scope rejected
- valid request maps to gRPC adapter
- retry maps to gRPC adapter
- response shape matches contract

## 12. Task 9: Tenant-Web Wizard

**Files:**

- Modify: `app/web/apps/tenant-web/src/api/bff/tenant-management/index.ts`
- Modify: `app/web/apps/tenant-web/src/api/bff/tenant-management/index.spec.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/tenant-management.vue`
- Modify: `app/web/apps/tenant-web/src/views/admin/tenant-management.spec.ts`

- [ ] **Step 1: Add frontend API client**

Add:

- `createTenantOnboardingApi`
- `getTenantOnboardingApi`
- `retryTenantOnboardingApi`

Use paths from [api-gateway tenant onboarding contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/tenant-onboarding.md).

- [ ] **Step 2: Replace create modal with wizard**

Wizard steps:

- tenant basics
- organization party
- root org
- first admin
- review
- result

- [ ] **Step 3: Add validation and result states**

Validation:

- tenant code/name required
- legal name required
- root org name required
- first admin display name required
- email or phone required

Result states:

- succeeded summary
- failed retryable summary
- failed needs manual review summary

- [ ] **Step 4: Add frontend tests**

Cover:

- wizard submits expected payload
- missing first admin contact blocks submit
- failed retryable response shows retry button
- retry calls `retryTenantOnboardingApi`

- [ ] **Step 5: Verify tenant-web**

Run:

```bash
pnpm --dir app/web exec vitest run apps/tenant-web/src/api/bff/tenant-management/index.spec.ts apps/tenant-web/src/views/admin/tenant-management.spec.ts --dom
pnpm --dir app/web --filter @oes/tenant-web typecheck
```

Expected:

- tenant-management API and page tests pass
- tenant-web typecheck passes

## 13. Task 10: Multi-Service Smoke

**Files:**

- Create: `src/services/system/tenant-org-service/test/l3/tenant-onboarding.integration.spec.ts` only if the repo’s current L3 pattern supports multi-adapter stubs cleanly.
- Optional script: `src/services/system/tenant-org-service/scripts/tenant-onboarding-smoke.mjs`

- [ ] **Step 1: Add service-level integration with fake downstream ports**

Test:

- complete onboarding result
- failure at auth bootstrap
- retry after auth bootstrap failure
- failure at permission grant
- retry after permission grant failure

- [ ] **Step 2: Add local smoke script if shared env is available**

Smoke sequence:

1. Create tenant onboarding through Gateway.
2. Query onboarding result.
3. Verify tenant detail.
4. Verify account appears in account directory.
5. Verify account roles include `tenant.admin`.

- [ ] **Step 3: Run focused backend validation**

Run:

```bash
pnpm --filter tenant-org-service test -- tenant-onboarding
pnpm --filter permission-service test -- tenant-onboarding
pnpm --filter identity-service test -- create-user-account
pnpm --filter party-service test -- party-registration-idempotency
pnpm --filter api-gateway exec jest src/modules/tenant-org-service --runInBand
```

Expected:

- focused service tests pass

## 14. Final Verification

Run after all implementation tasks:

```bash
pnpm proto:lint
pnpm --filter party-service test -- party-registration
pnpm --filter identity-service test -- create-user-account
pnpm --filter auth-service test -- bootstrap-user-login-methods require-password-setup
pnpm --filter permission-service test -- tenant-onboarding
pnpm --filter tenant-org-service test -- tenant-onboarding
pnpm --filter api-gateway exec jest src/modules/tenant-org-service --runInBand
pnpm --dir app/web exec vitest run apps/tenant-web/src/api/bff/tenant-management/index.spec.ts apps/tenant-web/src/views/admin/tenant-management.spec.ts --dom
pnpm --dir app/web --filter @oes/tenant-web typecheck
```

Expected:

- all listed commands exit 0
- tenant onboarding success, idempotency, failure, and retry paths are covered

## 15. Implementation Order

Recommended order:

1. Common proto changes.
2. Party idempotency.
3. Identity party-ref response.
4. Permission ensure/grant.
5. Tenant-org onboarding persistence.
6. Tenant-org downstream adapters.
7. Tenant-org Saga service and gRPC.
8. Gateway BFF.
9. Tenant-web wizard.
10. Multi-service smoke.

This order keeps owner-service capabilities available before the tenant-org Saga depends on them.
