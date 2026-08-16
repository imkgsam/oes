# PDA Employee Code + Terminal PIN Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a closed-loop PDA employeeCode + user-scoped TERMINAL_PIN login flow, including Web PIN management, backend contracts/runtime, PDA BFF mapping, and PDA login UI.

**Architecture:** PDA BFF owns only terminal/device trust and calls auth-service. Auth-service owns TERMINAL_PIN credential, login risk, audit, and EMPLOYEE_CODE_PIN orchestration. HR resolves active employee by tenant employeeCode, and identity resolves the employee's unique bound account plus enabled state via existing UserAccountEmployeeBinding.

**Tech Stack:** NestJS, CQRS, gRPC/proto in `src/common/src/contracts`, Prisma, Jest, Vue3/Vite/Pinia/Vant, Kotlin Android Shell unchanged unless verification finds bridge gaps.

**Status:** Completed on 2026-05-19. Android Shell / JS Bridge did not require changes; PDA Web consumes the existing scanner bridge event.

---

## Task 1: HR Active Employee Code Query

**Files:**
- Modify: `src/common/src/contracts/hr_service/hr.proto`
- Modify: `src/services/system/hr-service/src/application/services/hr-query.service.ts`
- Modify: `src/services/system/hr-service/src/interfaces/grpc/hr-query.grpc.controller.ts`
- Test: `src/services/system/hr-service/test/l1/hr-query.service.spec.ts`
- Test: `src/services/system/hr-service/test/l3/hr-query.grpc.controller.spec.ts`

- [x] Step 1: Add failing service and gRPC tests for `ResolveActiveEmployeeByCode(tenantId, employeeCode)` returning employee + active employment.
- [x] Step 2: Run `pnpm --filter hr-service test:l1 -- hr-query.service.spec.ts` and `pnpm --filter hr-service test:l3 -- hr-query.grpc.controller.spec.ts`; verify red failures are missing method/RPC behavior.
- [x] Step 3: Add proto RPC/message, service method, and controller mapping. Keep HR owner limited to employee lifecycle + active employment.
- [x] Step 4: Run the same HR tests until green.

## Task 2: Identity Employee Login Account Query

**Files:**
- Modify: `src/common/src/contracts/identity_service/identity_query.proto`
- Modify: `src/services/system/identity-service/src/application/queries/employee-binding/*`
- Modify: `src/services/system/identity-service/src/interfaces/grpc/identity-query.grpc.controller.ts`
- Modify: `src/services/system/identity-service/src/interfaces/grpc/identity-grpc.presenter.ts`
- Test: `src/services/system/identity-service/test/l1/employee-binding.handler.spec.ts`
- Test: `src/services/system/identity-service/test/l1/identity-query-optional-result.spec.ts` or a new focused l1 test if existing shape is unsuitable

- [x] Step 1: Add failing tests for `ResolveEmployeeLoginAccount(tenantId, employeeId)`.
- [x] Step 2: Verify tests fail because the query/RPC does not exist.
- [x] Step 3: Implement query handler using existing `UserAccountEmployeeBinding`, then load and validate `UserAccount` enabled state and tenant match.
- [x] Step 4: Run focused identity tests until green.

## Task 3: Shared Proto Generation And Common Types

**Files:**
- Modify: `src/common/src/auth/types/login-method.type.ts`
- Modify generated files under `src/common/src/generated/**` after proto regeneration
- Modify any generated barrel/types touched by `pnpm proto:gen`

- [x] Step 1: Add failing compile/test evidence for missing `LoginMethodType.TERMINAL_PIN`, `LoginMethodEnum.EmployeeCodePin`, `CredentialType.TERMINAL_PIN`, and new gRPC messages.
- [x] Step 2: Update shared enums and proto definitions.
- [x] Step 3: Run `pnpm proto:gen` and `pnpm proto:lint`.
- [x] Step 4: Run `pnpm --filter @oes/common build`.

## Task 4: Auth TERMINAL_PIN Credential Management

**Files:**
- Modify: `src/services/system/auth-service/prisma/schema.prisma`
- Modify: `src/services/system/auth-service/src/domain/entities/credential.entity.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/*`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`
- Modify: `src/common/src/contracts/auth_service/auth.proto`
- Test: focused auth l1/l3 specs under `src/services/system/auth-service/src/**`

- [x] Step 1: Add failing tests for user self-service set/reset/change/enable/disable TERMINAL_PIN with step-up proof represented by command input.
- [x] Step 2: Add failing tests for admin require reset / disable without accepting plaintext PIN.
- [x] Step 3: Implement minimal credential/login-method model support, hashing, weak PIN rejection, reset-required state, and audit events.
- [x] Step 4: Run focused auth tests until green.

## Task 5: Auth EMPLOYEE_CODE_PIN Login Flow

**Files:**
- Modify: `src/services/system/auth-service/src/application/commands/auth/*`
- Modify: `src/services/system/auth-service/src/application/ports/identity-service.port.ts`
- Add/modify HR port/adaptor in `src/services/system/auth-service/src/application/ports` and `src/services/system/auth-service/src/infrastructure/adaptors`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`
- Test: focused auth handler/controller specs

- [x] Step 1: Add failing tests for successful employeeCode + PIN PDA login and for denial cases: employee not found, inactive, binding missing, PIN not set, invalid PIN, locked PIN, terminal access denied.
- [x] Step 2: Verify red failures.
- [x] Step 3: Implement `LoginWithEmployeeCodePin` handler and gRPC mapping. Use HR and identity facts; do not let BFF or auth own HR/identity truth.
- [x] Step 4: Run focused auth tests until green.

## Task 6: API Gateway PDA Auth BFF

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/login.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/login.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/terminal-auth.controller.spec.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/login.use-case.spec.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.spec.ts`

- [x] Step 1: Add failing tests for `method=EMPLOYEE_CODE_PIN` DTO validation and mapping to auth-service with terminal/device context.
- [x] Step 2: Verify red failures.
- [x] Step 3: Implement BFF DTO and mapping. BFF must not call HR/identity directly.
- [x] Step 4: Run focused gateway tests until green.

## Task 7: Web Personal Center TERMINAL_PIN Management

**Files:**
- Modify auth-bff self-security DTO/use-case/controller files under `src/services/api-gateway/src/modules/auth-bff/**`
- Modify tenant-web personal center security UI under `app/web/apps/tenant-web/src/**` after locating existing self-security entry
- Test: focused API Gateway and tenant-web tests where present

- [x] Step 1: Add failing BFF tests for user set/reset/change/enable/disable terminal PIN.
- [x] Step 2: Add or update tenant-web checks for showing terminal PIN status and actions.
- [x] Step 3: Implement BFF mapping and UI using existing personal center/security patterns.
- [x] Step 4: Run focused BFF and tenant-web checks.

## Task 8: PDA Web Employee Code PIN UI

**Files:**
- Modify: `app/pda/web/src/views/login-view.vue` or split into new login views/components if router clarity requires
- Modify: `app/pda/web/src/api/pda-bff.client.ts`
- Modify: `app/pda/web/src/router/index.ts`
- Test: add/update PDA web tests if test harness exists; otherwise run typecheck/build

- [x] Step 1: Add failing tests or type-level checks for scan parsing and employeeCode PIN payload.
- [x] Step 2: Implement scan parser supporting pure `employeeCode` and `OES:EMPLOYEE:<employeeCode>`.
- [x] Step 3: Replace default login with employeeCode scan/manual entry + PIN popup/password input, 6-digit auto-submit, retained employeeCode on failure, and rescan action.
- [x] Step 4: Move existing password login to linked fallback view or mode, preserving existing behavior.
- [x] Step 5: Run PDA web build/typecheck.

## Task 9: Integration Verification

**Files:**
- Modify only if verification reveals integration defects.

- [x] Step 1: Run `pnpm proto:lint`.
- [x] Step 2: Run focused service tests: HR, identity, auth, API Gateway.
- [x] Step 3: Run PDA web build.
- [x] Step 4: Existing PDA smoke against local services was not run because this session did not start the full local service stack or seed data; covered with service tests, BFF tests, PDA web tests, typecheck, and build.
- [x] Step 5: Review implementation against the PDA login contracts and current runtime behavior.
