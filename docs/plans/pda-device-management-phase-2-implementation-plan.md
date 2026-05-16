# PDA Device Management Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the PDA Device Management Phase 2 minimum loop: administrator-issued enrollment, PDA activation, tenant-bound PDA login, device lifecycle control, session revoke, heartbeat runtime snapshot, version policy, and admin device management.

**Architecture:** `terminal-device-service` owns managed terminal device truth. PDA BFF and Admin BFF only adapt HTTP contracts and orchestrate `terminal-device-service`, `auth-service`, and `permission-service`. PDA login tenant is resolved from `TerminalDevice.tenantId`, not chosen by the user.

**Tech Stack:** NestJS services, Prisma, gRPC/proto under `src/common/src/contracts`, API Gateway BFF modules, Vue3/Vite PDA app, tenant-web admin UI, Vitest/Jest service tests, existing pnpm workspace scripts.

---

## 1. Source Of Truth

Implementation must follow these documents:

- [ADR 0006](/Users/acehood/Documents/GitHub/oes/docs/adr/0006-terminal-device-service.md)
- [terminal-device-service truth source](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/terminal-device-service.md)
- [managed terminal device collaboration](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/managed-terminal-device-management.md)
- [feature packet](/Users/acehood/Documents/GitHub/oes/docs/plans/features/pda-device-management-phase-2.md)
- [PDA BFF contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/pda-device-management-bff.md)
- [Admin BFF contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/admin-terminal-device-bff.md)
- [terminal-device-service contracts](/Users/acehood/Documents/GitHub/oes/docs/contracts/terminal-device-service/README.md)

Do not redefine service ownership in implementation notes or code comments. Reference these documents if a boundary question appears.

## 2. Implementation Constraints

- Keep core device governance rules inside `terminal-device-service` application/domain code.
- Do not put lifecycle, version-policy, identity-conflict, or enrollment rules in Gateway controllers, DTOs, Prisma schema, or PDA frontend.
- Do not let `terminal-device-service` own auth session, MFA, trusted login device, login history, Terminal Access Policy, WMS/MES task rules, warehouse, workshop, production line, workstation, zone, or location truth.
- Every new class/function/handler/repository must have a short summary comment per project rule.
- `DECOMMISSIONED` is terminal and cannot be restored to `ACTIVE`.
- PDA login must not allow user-selected tenant after enrollment.
- `lastReportedAccount` is runtime snapshot data, not current login truth.
- Existing unrelated MES changes in the workspace must not be reverted or edited by this work.

## 3. Target File Map

### Shared contracts

- Create `src/common/src/contracts/terminal_device_service/terminal_device.proto`
- Create `src/common/src/contracts/terminal_device_service/index.ts`
- Modify `src/common/src/contracts/index.ts`

### terminal-device-service

- Create service workspace under `src/services/system/terminal-device-service/`
- Create Prisma schema under `src/services/system/terminal-device-service/prisma/schema.prisma`
- Create source tree:
  - `src/application/commands/enrollment/**`
  - `src/application/commands/device/**`
  - `src/application/queries/device/**`
  - `src/application/queries/version-policy/**`
  - `src/application/services/**`
  - `src/domain/entities/**`
  - `src/domain/enums/**`
  - `src/domain/repositories/**`
  - `src/domain/services/**`
  - `src/infrastructure/repositories/prisma/**`
  - `src/infrastructure/repositories/in-memory/**`
  - `src/interfaces/grpc/**`
  - `src/modules/**`
- Create tests under `src/services/system/terminal-device-service/test/`

### permission-service

- Modify permission code catalog in `src/common/src/authorization/permission-codes/**` if present, or the existing permission seed/catalog location discovered during implementation.
- Modify permission-service seed/sync tests for:
  - `terminal-device.enrollment.create`
  - `terminal-device.enrollment.revoke`
  - `terminal-device.read`
  - `terminal-device.sensitive.read`
  - `terminal-device.status.disable`
  - `terminal-device.status.mark-lost`
  - `terminal-device.status.mark-maintenance`
  - `terminal-device.status.restore-active`
  - `terminal-device.version-policy.manage`
  - `terminal-device.audit.read`

### auth-service

- Modify active session model and contracts to carry `terminalDeviceId` for PDA sessions.
- Add revoke-by-terminal-device command in auth-service application layer and gRPC surface.
- Add tests under existing auth-service test structure.

### api-gateway

- Modify `src/services/api-gateway/src/modules/pda-bff/**`
- Add terminal-device-service adapter/module under `src/services/api-gateway/src/modules/terminal-device-service/**` or follow the existing adapter pattern if service adapters are colocated by consumer module.
- Add Admin BFF HTTP endpoints under a focused module such as `src/services/api-gateway/src/modules/terminal-device-admin-bff/**` if no existing admin terminal module exists.

### PDA Web

- Modify `app/pda/web/src/api/pda-bff.client.ts`
- Modify `app/pda/web/src/router/index.ts`
- Modify `app/pda/web/src/stores/session.store.ts`
- Create views:
  - `app/pda/web/src/views/enrollment-view.vue`
  - `app/pda/web/src/views/device-restricted-view.vue`
  - `app/pda/web/src/views/identity-conflict-view.vue`
- Extend existing `version-blocked-view.vue` behavior.
- Modify heartbeat service and tests in `app/pda/web/src/services/pda-heartbeat.ts` and `app/pda/web/src/tests/pda-heartbeat.spec.ts`

### tenant-web

- Add API client under `app/web/apps/tenant-web/src/api/bff/terminal-device/**`
- Add views/components under `app/web/apps/tenant-web/src/views/admin/terminal-device-management/**`
- Add focused tests beside new API/view files.

## 4. Execution Strategy

Recommended execution mode after this plan is approved:

- Use subagent-driven implementation for independent write scopes.
- Keep the main thread as integration owner.
- Do not dispatch workers until Task 1 and Task 2 contract baseline are complete.
- Use separate workers only with disjoint write scopes:
  - Worker A: `terminal-device-service`
  - Worker B: `auth-service` and permission codes
  - Worker C: `api-gateway`
  - Worker D: `app/pda`
  - Worker E: `tenant-web`

## 5. Tasks

### Task 1: Proto And Shared Contract Baseline

**Files:**
- Create: `src/common/src/contracts/terminal_device_service/terminal_device.proto`
- Create: `src/common/src/contracts/terminal_device_service/index.ts`
- Modify: `src/common/src/contracts/index.ts`
- Test: contract generation and existing proto lint/generation command

- [x] **Step 1: Define proto messages for terminal device governance**

Add messages matching the docs:

- `TerminalDeviceType`
- `TerminalDeviceStatus`
- `PresenceStatus`
- `EnrollmentStatus`
- `DeviceAccessRequestPurpose`
- `DeviceAccessDecisionCode`
- `DeviceRequiredAction`
- `TerminalDeviceIdentity`
- `TerminalDeviceSoftware`
- `TerminalDeviceRuntime`
- `TerminalDeviceVersionPolicy`
- `DeviceAccessDecision`
- `TerminalDeviceSummary`
- `TerminalDeviceDetail`
- `TerminalDeviceEnrollment`
- `TerminalDeviceAuditEvent`

The proto must include services:

- `TerminalDeviceEnrollmentService`
- `TerminalDeviceAccessDecisionService`
- `TerminalDeviceManagementService`
- `TerminalDeviceRuntimeSnapshotService`
- `TerminalDeviceVersionPolicyService`

- [x] **Step 2: Export the new contract package**

Add `src/common/src/contracts/terminal_device_service/index.ts` following existing contract package style.

- [x] **Step 3: Export from root contracts index**

Modify `src/common/src/contracts/index.ts` so downstream services can import terminal device contracts.

- [x] **Step 4: Run proto generation / lint**

Run:

```bash
pnpm proto:lint
```

Expected: command exits 0. If generated files are required by the repo pattern, run the existing generation command used by adjacent service contracts and include generated output.

### Task 2: terminal-device-service Workspace Skeleton

**Files:**
- Create: `src/services/system/terminal-device-service/package.json`
- Create: `src/services/system/terminal-device-service/tsconfig.json`
- Create: `src/services/system/terminal-device-service/prisma/schema.prisma`
- Create: `src/services/system/terminal-device-service/src/**`
- Create: `src/services/system/terminal-device-service/test/**`
- Modify: root workspace config if new service packages require registration

- [ ] **Step 1: Scaffold service with standard layers**

Create:

- `application/`
- `domain/`
- `infrastructure/`
- `interfaces/`
- `modules/`

Each new class/function must include a one-sentence summary comment.

- [ ] **Step 2: Add Prisma models**

Add models:

- `TerminalDevice`
- `TerminalDeviceEnrollment`
- `TerminalDeviceRuntimeSnapshot`
- `TerminalDeviceVersionPolicy`
- `TerminalDeviceAuditEvent`

Required invariants:

- `TerminalDevice.tenantId` is required.
- `TerminalDevice.terminalDeviceType` supports at least `PDA`.
- `TerminalDevice.status` supports `PENDING_APPROVAL / ACTIVE / DISABLED / LOST / MAINTENANCE / DECOMMISSIONED`.
- Enrollment status supports `ISSUED / USED / EXPIRED / REVOKED`.
- Runtime snapshot is one current snapshot per terminal device.
- Version policy is unique by `tenantId + terminalDeviceType`.

- [ ] **Step 3: Add domain entities and repository ports**

Create focused domain files for:

- enrollment lifecycle
- terminal device lifecycle
- version policy
- runtime snapshot
- audit event

Repository ports must be in `domain/repositories`, not in controllers.

- [ ] **Step 4: Add module wiring**

Wire Nest modules following nearby system service conventions.

- [ ] **Step 5: Add baseline tests**

Create tests that instantiate the module and verify repository in-memory adapters can create an enrollment and device.

Run:

```bash
pnpm --filter terminal-device-service test
```

Expected: baseline tests pass.

### Task 3: Enrollment Use Cases

**Files:**
- Create: `src/services/system/terminal-device-service/src/application/commands/enrollment/create-enrollment.command.ts`
- Create: `src/services/system/terminal-device-service/src/application/commands/enrollment/activate-enrollment.command.ts`
- Create: `src/services/system/terminal-device-service/src/application/commands/enrollment/revoke-enrollment.command.ts`
- Create: corresponding tests under `src/services/system/terminal-device-service/test/`

- [ ] **Step 1: Write failing tests for create enrollment**

Cover:

- creates `ISSUED` enrollment for tenant + `PDA`;
- returns code only in command response;
- stores code hash / digest, not plaintext;
- writes audit event.

- [ ] **Step 2: Implement create enrollment**

Implementation belongs in application command handler; domain object owns status invariants.

- [ ] **Step 3: Write failing tests for activation**

Cover:

- valid `ISSUED` enrollment creates `TerminalDevice(status=ACTIVE)`;
- marks enrollment `USED`;
- rejects expired enrollment;
- rejects used enrollment;
- rejects revoked enrollment;
- rejects expected serial mismatch;
- does not auto-recover old device on possible match.

- [ ] **Step 4: Implement activation**

Activation must create the formal `TerminalDevice` only after valid enrollment.

- [ ] **Step 5: Write failing tests for revoke**

Cover:

- can revoke `ISSUED`;
- cannot revoke `USED`;
- requires reason;
- writes audit event.

- [ ] **Step 6: Implement revoke**

Keep reason and operator context in audit.

- [ ] **Step 7: Run enrollment tests**

Run:

```bash
pnpm --filter terminal-device-service test -- enrollment
```

Expected: enrollment test suite passes.

### Task 4: DeviceAccessDecision, Lifecycle, Version Policy, Runtime Snapshot

**Files:**
- Create: `src/services/system/terminal-device-service/src/application/services/device-access-decision.service.ts`
- Create: `src/services/system/terminal-device-service/src/application/commands/device/change-terminal-device-status.command.ts`
- Create: `src/services/system/terminal-device-service/src/application/commands/runtime/record-heartbeat.command.ts`
- Create: `src/services/system/terminal-device-service/src/application/commands/version-policy/upsert-version-policy.command.ts`
- Create: `src/services/system/terminal-device-service/src/application/queries/version-policy/get-version-policy.query.ts`
- Test: focused service tests

- [ ] **Step 1: Write failing tests for lifecycle decisions**

Cover:

- `ACTIVE` allows `LOGIN / BOOTSTRAP / BUSINESS_REQUEST` when version passes.
- `PENDING_APPROVAL / DISABLED / LOST / MAINTENANCE / DECOMMISSIONED` deny login and business request.
- `HEARTBEAT / DIAGNOSTIC_LOG` may return governance response for non-active states.
- `DECOMMISSIONED` returns `shouldClearLocalSession=true` and `shouldClearLocalTerminalDeviceId=true`.

- [ ] **Step 2: Implement DeviceAccessDecision**

The service must return `resolvedTenantId`, status, presence, version policy, required action and cleanup flags.

- [ ] **Step 3: Write failing tests for version rules**

Cover:

- below min returns `APP_VERSION_UNSUPPORTED`;
- below latest but above min allows and recommends upgrade;
- heartbeat still accepted when app version is unsupported.

- [ ] **Step 4: Implement version policy handling**

Version comparison must be centralized in `terminal-device-service`.

- [ ] **Step 5: Write failing tests for lifecycle transitions**

Cover:

- `DISABLED / LOST / MAINTENANCE` can restore to `ACTIVE`;
- `DECOMMISSIONED` cannot restore to `ACTIVE`;
- non-active status transitions produce session revoke intent;
- high-risk transitions require reason and audit.

- [ ] **Step 6: Implement lifecycle transition command**

Return session revoke intent to caller or event publisher.

- [ ] **Step 7: Write failing tests for heartbeat runtime snapshot**

Cover:

- heartbeat updates runtime snapshot;
- heartbeat updates presence from `lastHeartbeatAt`;
- heartbeat does not change lifecycle status;
- `lastReportedAccountId` is stored only as runtime diagnostic data.

- [ ] **Step 8: Implement runtime snapshot command/query**

Use server receive time for `lastHeartbeatAt`.

- [ ] **Step 9: Run tests**

Run:

```bash
pnpm --filter terminal-device-service test
```

Expected: terminal-device-service tests pass.

### Task 5: terminal-device-service gRPC Interfaces

**Files:**
- Create: `src/services/system/terminal-device-service/src/interfaces/grpc/*.ts`
- Create: presenter/mapper files under `src/services/system/terminal-device-service/src/interfaces/grpc/`
- Test: gRPC surface tests under `src/services/system/terminal-device-service/test/`

- [ ] **Step 1: Write failing gRPC surface tests**

Cover:

- `CreateEnrollment`
- `ActivateEnrollment`
- `ResolveDeviceAccessDecision`
- `RecordHeartbeat`
- `GetVersionPolicy`
- `UpsertVersionPolicy`
- `ListTerminalDevices`
- `GetTerminalDevice`
- `ChangeTerminalDeviceStatus`

- [ ] **Step 2: Implement gRPC controllers**

Controllers must map proto requests to application commands/queries and must not contain domain rules.

- [ ] **Step 3: Implement presenters**

Presenters handle enum/string response mapping and null-safe response fields.

- [ ] **Step 4: Run gRPC tests**

Run:

```bash
pnpm --filter terminal-device-service test -- grpc
```

Expected: gRPC surface tests pass.

### Task 6: permission-service Permission Codes

**Files:**
- Modify existing permission code catalog and seed files
- Modify permission-service tests

- [ ] **Step 1: Add terminal device management permission codes**

Add:

- `terminal-device.enrollment.create`
- `terminal-device.enrollment.revoke`
- `terminal-device.read`
- `terminal-device.sensitive.read`
- `terminal-device.status.disable`
- `terminal-device.status.mark-lost`
- `terminal-device.status.mark-maintenance`
- `terminal-device.status.restore-active`
- `terminal-device.version-policy.manage`
- `terminal-device.audit.read`

- [ ] **Step 2: Add seed/sync tests**

Assert all new permission codes are registered in runtime catalog.

- [ ] **Step 3: Run permission tests**

Run:

```bash
pnpm --filter permission-service test
```

Expected: permission-service tests pass.

### Task 7: auth-service PDA terminalDeviceId Session Metadata And Revoke

**Files:**
- Modify `src/common/src/contracts/auth_service/auth.proto`
- Modify auth-service session domain/application files
- Modify auth-service gRPC interfaces
- Modify auth-service Prisma schema if session persistence requires schema changes
- Test: auth-service session/revoke tests

- [ ] **Step 1: Write failing tests for PDA session metadata**

Cover:

- PDA login/session issuance stores `terminalDeviceId`.
- Non-PDA sessions may omit `terminalDeviceId`.
- session context can return `terminalDeviceId` for PDA.

- [ ] **Step 2: Implement metadata propagation**

Propagate `terminalDeviceId` from PDA BFF login call into auth session truth.

- [ ] **Step 3: Write failing tests for revoke by terminal device**

Cover:

- revoke by `terminal=PDA + terminalDeviceId` revokes only matching PDA sessions;
- sessions for other devices remain active;
- revoke writes auth audit.

- [ ] **Step 4: Implement revoke command and contract**

Expose internal command for api-gateway or terminal-device-service collaboration.

- [ ] **Step 5: Run auth-service tests**

Run:

```bash
pnpm --filter auth-service test
```

Expected: auth-service tests pass.

### Task 8: API Gateway PDA BFF

**Files:**
- Modify `src/services/api-gateway/src/modules/pda-bff/**`
- Add terminal-device-service adapter under API Gateway
- Modify PDA BFF tests

- [ ] **Step 1: Add terminal-device-service adapter**

Adapter methods:

- `activateEnrollment`
- `resolveDeviceAccessDecision`
- `recordHeartbeat`

- [ ] **Step 2: Write failing tests for `/pda/device/enroll`**

Cover:

- sends enrollment code and identity signals to terminal-device-service;
- returns `terminalDeviceId` and decision;
- maps enrollment failure to PDA-friendly response;
- does not decode tenant from QR payload.

- [ ] **Step 3: Implement `/pda/device/enroll`**

Controller only validates DTO and calls use case. Use case orchestrates adapter calls.

- [ ] **Step 4: Write failing tests for PDA login tenant resolution**

Cover:

- PDA login requires `terminalDeviceId`;
- BFF resolves tenant from `DeviceAccessDecision`;
- BFF calls auth-service with resolved tenant, `terminal=PDA`, and `terminalDeviceId`;
- BFF rejects device denial before auth call.

- [ ] **Step 5: Implement login orchestration update**

Do not expose tenant selection in PDA login request.

- [ ] **Step 6: Update bootstrap, heartbeat and logs**

Each must consume `DeviceAccessDecision` and return cleanup flags to PDA.

- [ ] **Step 7: Run api-gateway PDA BFF tests**

Run:

```bash
pnpm --filter api-gateway exec jest src/modules/pda-bff
```

Expected: PDA BFF tests pass.

### Task 9: API Gateway Admin BFF

**Files:**
- Create `src/services/api-gateway/src/modules/terminal-device-admin-bff/**`
- Add module registration in API Gateway root module
- Add tests for controller/use cases/DTOs

- [ ] **Step 1: Add adapters**

Adapters:

- terminal-device-service management/enrollment/version/audit adapter
- auth-service session query/revoke adapter
- permission-service authorization path using existing gateway guard/pattern

- [ ] **Step 2: Write failing tests for enrollment management endpoints**

Cover:

- create enrollment requires permission;
- revoke enrollment requires reason;
- list enrollment maps service response.

- [ ] **Step 3: Implement enrollment endpoints**

Endpoints:

- `POST /admin/terminal-devices/enrollments`
- `GET /admin/terminal-devices/enrollments`
- `POST /admin/terminal-devices/enrollments/{enrollmentId}/revoke`

- [ ] **Step 4: Write failing tests for device list/detail/status**

Cover:

- list omits sensitive fields;
- detail requires sensitive permission for full identity;
- status change returns session revoke result;
- `DECOMMISSIONED` is represented as terminal state.

- [ ] **Step 5: Implement device endpoints**

Endpoints:

- `GET /admin/terminal-devices`
- `GET /admin/terminal-devices/{terminalDeviceId}`
- `PATCH /admin/terminal-devices/{terminalDeviceId}`
- `PATCH /admin/terminal-devices/{terminalDeviceId}/status`

- [ ] **Step 6: Add version policy and audit endpoints**

Endpoints:

- `GET /admin/terminal-devices/version-policy`
- `PUT /admin/terminal-devices/version-policy`
- `GET /admin/terminal-devices/{terminalDeviceId}/audit-events`

- [ ] **Step 7: Run API Gateway admin tests**

Run:

```bash
pnpm --filter api-gateway exec jest src/modules/terminal-device-admin-bff
```

Expected: Admin BFF tests pass.

### Task 10: PDA Web Experience

**Files:**
- Modify `app/pda/web/src/api/pda-bff.client.ts`
- Modify `app/pda/web/src/router/index.ts`
- Modify `app/pda/web/src/stores/session.store.ts`
- Modify `app/pda/web/src/services/pda-heartbeat.ts`
- Create `app/pda/web/src/views/enrollment-view.vue`
- Create `app/pda/web/src/views/device-restricted-view.vue`
- Create `app/pda/web/src/views/identity-conflict-view.vue`
- Modify `app/pda/web/src/views/login-view.vue`
- Modify `app/pda/web/src/views/version-blocked-view.vue`
- Add/modify tests under `app/pda/web/src/tests/`

- [ ] **Step 1: Add API client methods**

Methods:

- `enrollDevice`
- `heartbeat` with managed decision response
- `bootstrap` with `terminalDeviceId`
- PDA login with `terminalDeviceId`

- [ ] **Step 2: Add device governance store state**

State:

- `terminalDeviceId`
- `deviceStatus`
- `decisionCode`
- `versionPolicy`
- `shouldClearLocalSession`
- `shouldClearLocalTerminalDeviceId`

- [ ] **Step 3: Write routing tests**

Cover:

- no `terminalDeviceId` routes to enrollment;
- denied device routes to restricted page;
- unsupported version routes to version blocked page;
- identity conflict routes to contact-admin page.

- [ ] **Step 4: Implement views**

Views:

- enrollment view supports scan result or manual code input;
- restricted view shows status, reason/message key, retry and diagnostic upload;
- identity conflict view asks user to contact administrator;
- version blocked view consumes version policy.

- [ ] **Step 5: Implement cleanup actions**

When response has `shouldClearLocalSession`, clear access token and refresh token through Bridge.

When response has `shouldClearLocalTerminalDeviceId`, clear local terminal device binding and route to enrollment.

- [ ] **Step 6: Run PDA web tests**

Run:

```bash
pnpm --dir app/pda/web test
pnpm --dir app/pda/web build
```

Expected: tests and build pass.

### Task 11: tenant-web Admin UI

**Files:**
- Create `app/web/apps/tenant-web/src/api/bff/terminal-device/index.ts`
- Create `app/web/apps/tenant-web/src/views/admin/terminal-device-management/**`
- Modify tenant-web route/menu registration only where existing admin route patterns require it
- Add tests beside API and view files

- [ ] **Step 1: Add API client**

Client methods:

- `createEnrollment`
- `listEnrollments`
- `revokeEnrollment`
- `listTerminalDevices`
- `getTerminalDevice`
- `updateTerminalDevice`
- `changeTerminalDeviceStatus`
- `getVersionPolicy`
- `updateVersionPolicy`
- `listAuditEvents`

- [ ] **Step 2: Write API client tests**

Assert endpoint paths and request/response mapping match Admin BFF contract.

- [ ] **Step 3: Build management views**

Minimum UI:

- enrollment create/list/revoke
- device list
- device detail
- status operation dialog requiring reason
- version policy form
- audit event list

- [ ] **Step 4: Protect sensitive display**

UI must label `lastReportedAccount` as recently reported account, not current user.

Full serial/android id display must depend on sensitive read capability.

- [ ] **Step 5: Run tenant-web focused tests**

Run the relevant tenant-web test command for new files. If no narrow command exists, run the existing tenant-web unit test suite used by adjacent admin pages.

Expected: tests pass.

### Task 12: Integration And Smoke

**Files:**
- Add or update smoke scripts if the repo has service smoke conventions
- Update feature packet with completion evidence after implementation

- [ ] **Step 1: Push schemas**

Run Prisma push/generate commands for affected services:

```bash
pnpm --filter terminal-device-service prisma:push
pnpm --filter auth-service prisma:push
```

Expected: schemas apply to local database.

- [ ] **Step 2: Start required services**

Start:

- auth-service
- permission-service
- terminal-device-service
- api-gateway
- app/pda web if testing browser shell

Use existing repo service start commands.

- [ ] **Step 3: Validate enrollment loop**

Scenario:

1. Admin creates enrollment.
2. PDA enrolls with code.
3. `TerminalDevice(status=ACTIVE)` exists.
4. Enrollment is `USED`.

- [ ] **Step 4: Validate PDA login tenant binding**

Scenario:

1. PDA login request contains `terminalDeviceId`.
2. User does not select tenant.
3. BFF resolves tenant from device.
4. Auth session contains `terminal=PDA` and `terminalDeviceId`.

- [ ] **Step 5: Validate disable and revoke**

Scenario:

1. Admin sets device `DISABLED`.
2. Related PDA sessions are revoked.
3. PDA heartbeat/bootstrap returns cleanup decision.
4. PDA clears local session and shows restricted page.

- [ ] **Step 6: Validate decommission**

Scenario:

1. Admin sets device `DECOMMISSIONED`.
2. Related PDA sessions are revoked.
3. PDA clears session and `terminalDeviceId`.
4. PDA returns to enrollment flow.
5. Old device record cannot restore to `ACTIVE`.

- [ ] **Step 7: Validate version policy**

Scenario:

1. Admin sets `minSupportedAppVersion` above PDA app version.
2. Login/business requests are blocked.
3. Heartbeat/diagnostic logs still work.
4. PDA shows version blocked page.

- [ ] **Step 8: Record verification evidence**

Update [feature packet](/Users/acehood/Documents/GitHub/oes/docs/plans/features/pda-device-management-phase-2.md) only with final implementation status and verification evidence after code is implemented.

## 6. Verification Matrix

| Area | Command | Expected |
| --- | --- | --- |
| Proto | `pnpm proto:lint` | exit 0 |
| terminal-device-service | `pnpm --filter terminal-device-service test` | exit 0 |
| permission-service | `pnpm --filter permission-service test` | exit 0 |
| auth-service | `pnpm --filter auth-service test` | exit 0 |
| api-gateway PDA/Admin BFF | `pnpm --filter api-gateway exec jest src/modules/pda-bff src/modules/terminal-device-admin-bff` | exit 0 |
| PDA web | `pnpm --dir app/pda/web test` and `pnpm --dir app/pda/web build` | exit 0 |
| tenant-web | existing focused tenant-web test command for new terminal-device files | exit 0 |

## 7. Commit Strategy

Recommended commits:

1. `feat: add terminal device shared contracts`
2. `feat: scaffold terminal device service`
3. `feat: implement terminal device enrollment`
4. `feat: add terminal device access decisions`
5. `feat: add pda terminal device session revoke`
6. `feat: wire pda device management bff`
7. `feat: add admin terminal device bff`
8. `feat: add pda device governance screens`
9. `feat: add terminal device admin UI`
10. `test: add pda device management smoke coverage`

Each commit should include its own focused tests.

## 8. Parallelization Notes

Do not parallelize before Task 1 is complete.

After Task 1:

- Task 2-5 are mostly owned by `terminal-device-service`.
- Task 6 and Task 7 can run in parallel with terminal-device-service after shared proto names are stable.
- Task 8 depends on Task 1, Task 4, and Task 7 contract names.
- Task 10 depends on PDA BFF response shape from Task 8.
- Task 11 depends on Admin BFF response shape from Task 9.
- Task 12 must run after all implementation tasks.

## 9. Open Risks

- A new service workspace may require updates to pnpm workspace filters, Docker compose, local env, health checks, and CI scripts. Follow existing system service patterns rather than inventing a separate runtime shape.
- Auth session persistence may be Redis-backed, database-backed, or hybrid in current implementation. Add `terminalDeviceId` at the active session truth boundary, not only in token claims.
- Admin BFF may need a consistent route namespace with existing tenant-web admin patterns. Keep HTTP path aligned with [admin-terminal-device-bff.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/admin-terminal-device-bff.md).
- Existing Phase 1 in-memory PDA heartbeat/log stores in API Gateway must be retired or narrowed once `terminal-device-service` owns runtime snapshot and diagnostic governance.
- If implementation exposes current active PDA sessions in device detail, source them from `auth-service`; do not derive them from heartbeat.
