# Terminal Access Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> 服务设计唯一真相源：[permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。本文只记录历史实现拆分，不作为 Terminal Access Policy 的服务设计真相源。

**Goal:** Implement account-scoped Terminal Access Policy across permission-service, auth-service, api-gateway, and tenant-web.

**Architecture:** `permission-service` owns policy truth and exposes a dedicated internal gRPC runtime resolver. `auth-service` consumes the resolver before MFA/session issuance and during refresh, while terminal-specific BFF routes normalize trusted terminal values. `tenant-web` exposes management and read-only display surfaces without owning policy logic.

**Tech Stack:** NestJS, CQRS, Prisma, gRPC proto contracts, pnpm workspaces, Vue 3 / Pinia tenant-web.

---

## File Map

### Contracts And Docs

- Create `src/common/src/contracts/permission_service/permission_terminal_access.proto`
  - Defines `PermissionTerminalAccessService.ResolveAccountTerminalAccess`.
- Modify `src/common/src/contracts/permission_service/index.ts`
  - Exports generated terminal access contract.
- Modify `src/common/src/contracts/auth_service/auth.proto`
  - Adds terminal and denial reason fields to login/account-selection/MFA/refresh/session validation responses.
- Modify generated contract outputs after running the repo's proto generation command.

### permission-service

- Modify `src/services/system/permission-service/prisma/schema.prisma`
  - Adds `RoleTerminalAccess` and `AccountTerminalAccessOverride`.
- Create `src/services/system/permission-service/src/domain/constants/terminal-access-terminal.ts`
  - Defines valid login terminal constants and normalization helpers.
- Create `src/services/system/permission-service/src/domain/repositories/terminal-access.repository.ts`
  - Repository contract for role terminal access and account override reads/writes.
- Create `src/services/system/permission-service/src/infrastructure/repositories/prisma/prisma.terminal-access.repository.ts`
  - Prisma implementation.
- Create `src/services/system/permission-service/src/domain/services/terminal-access-resolver.service.ts`
  - Resolves account override vs role union.
- Create `src/services/system/permission-service/src/application/queries/terminal-access/resolve-account-terminal-access.*`
  - Runtime query and handler.
- Create management commands/queries under `src/services/system/permission-service/src/application/commands/terminal-access/` and `src/services/system/permission-service/src/application/queries/terminal-access/`
  - Role config read/update.
  - Account effective read.
  - Account override upsert/delete.
- Create `src/services/system/permission-service/src/interfaces/grpc/permission-terminal-access.grpc.controller.ts`
  - Internal runtime gRPC controller.
- Extend permission management gRPC/HTTP adapter path for management UI.
- Modify `src/services/system/permission-service/src/scripts/permission-catalog.ts`
  - Adds terminal access permission codes.
- Modify `src/services/system/permission-service/src/scripts/role-foundation.ts`
  - Adds baseline role terminal access seed.
- Modify `src/services/system/permission-service/src/scripts/navigation-foundation.ts`
  - Adds `pda.home` and `kiosk.home` minimal entries if absent.

### auth-service

- Modify `src/services/system/auth-service/src/application/ports/permission-service.port.ts`
  - Adds terminal access resolver method.
- Modify `src/services/system/auth-service/src/infrastructure/adaptors/permission-service.adaptor.ts`
  - Calls `PermissionTerminalAccessService`.
- Modify login commands:
  - `login-with-email-password.command.ts`
  - `login-with-phone-password.command.ts`
  - OTP login command files if the proto carries terminal through primary login.
  - `select-account.command.ts`
  - `submit-mfa-challenge.command.ts`
  - `refresh-session.command.ts`
- Modify handlers:
  - `select-account.handler.ts`
  - `submit-mfa-challenge.handler.ts`
  - `refresh-session.handler.ts`
  - `validate-access-token.handler.ts`
- Modify services:
  - `account-session-establishment.service.ts`
  - `login-mfa-orchestration.service.ts`
  - `auth-audit.service.ts`
- Modify `src/services/system/auth-service/src/domain/aggregates/usersession.aggregate.ts`
  - Stores terminal in session props.
- Modify auth error constants to add `AUTH_TERMINAL_ACCESS_DENIED`.
- Modify gRPC controller/presenter to include terminal and reason fields.

### api-gateway / BFF

- Modify auth BFF DTO/view models:
  - Add optional `reasonCode` and `message` to auth response view model.
  - Add `terminal` and `allowedTerminals` to session context view model.
- Modify Web auth use cases/adapters to forward fixed `WEB`.
- Add PDA/KIOSK auth controllers or route groups that reuse shared auth use cases with fixed terminal:
  - `/pda/auth/login`
  - `/pda/auth/account-selection`
  - `/pda/auth/mfa/complete`
  - `/pda/auth/mfa/challenges`
  - `/pda/auth/session/refresh`
  - `/pda/auth/session/context`
  - `/kiosk/auth/*` equivalents.
- Extend permission-management HTTP controllers/adapters for terminal access management.

### tenant-web

- Modify auth API types to include `reasonCode`, `message`, `terminal`, and `allowedTerminals`.
- Modify auth store handling for `TERMINAL_ACCESS_DENIED`.
- Modify role management/detail UI to edit role terminal access.
- Modify account management/detail UI to show final terminal access and account-specific override toggle.
- Modify personal center API/view to show read-only final terminal access.

## Tasks

### Task 1: Proto And Shared Contract Skeleton

- [ ] Add `permission_terminal_access.proto` with `ResolveAccountTerminalAccessRequest/Response`.
- [ ] Add terminal fields and denial reason fields to `auth.proto` login/account-selection/MFA/refresh/validation messages.
- [ ] Run proto generation.
- [ ] Verify generated TypeScript exports compile.

Commands:

```bash
pnpm proto:lint
pnpm --filter @oes/common build
```

Expected:

- Proto lint passes.
- Common package builds without generated type errors.

### Task 2: permission-service Data Model And Resolver

- [ ] Add Prisma models for role terminal access and account terminal access override.
- [ ] Add repository contract and Prisma implementation.
- [ ] Add terminal normalization constants.
- [ ] Add resolver service with override-first, role-union fallback.
- [ ] Add L1 unit tests covering:
  - role union allow
  - override replace
  - override empty deny
  - missing role policy deny
  - invalid terminal deny

Commands:

```bash
pnpm --filter permission-service prisma:generate
pnpm --filter permission-service test:l1 -- --runInBand test/l1/terminal-access-resolver.spec.ts
```

Expected:

- Prisma client generation succeeds.
- Resolver tests pass.

### Task 3: permission-service Runtime gRPC

- [ ] Add `ResolveAccountTerminalAccessQuery` and handler.
- [ ] Add `PermissionTerminalAccessGrpcController`.
- [ ] Register controller/module providers.
- [ ] Add L3 gRPC controller tests.

Commands:

```bash
pnpm --filter permission-service test:l3 -- --runInBand test/l3/permission-terminal-access.grpc.controller.spec.ts
```

Expected:

- Runtime gRPC maps request/response fields and rejects invalid scope/terminal cases.

### Task 4: permission-service Management And Seed

- [ ] Add terminal access permission codes to permission catalog.
- [ ] Add management commands/queries for role config and account override.
- [ ] Add management audit emission for writes.
- [ ] Add seed updates:
  - existing Web-capable roles get `WEB`
  - minimal entries `pda.home` and `kiosk.home`
- [ ] Add tests for seed and management handlers.

Commands:

```bash
pnpm --filter permission-service test:l1 -- --runInBand test/l1/role-foundation.seed.spec.ts test/l1/navigation-foundation.seed.spec.ts
pnpm --filter permission-service test:l1 -- --runInBand test/l1/terminal-access-management.handlers.spec.ts
```

Expected:

- Web role baseline is explicit.
- PDA/KIOSK entries are present.
- Management writes are audited.

### Task 5: auth-service Login / Refresh Enforcement

- [ ] Extend permission-service adaptor with terminal access call.
- [ ] Carry terminal through BFF -> gRPC -> commands.
- [ ] Check terminal access in `SelectAccountHandler` after tenant lifecycle and before MFA.
- [ ] Include terminal in MFA flow token and re-check before session establishment.
- [ ] Store terminal in session aggregate and token claims.
- [ ] Re-check terminal access during refresh and revoke/delete session on denial.
- [ ] Return terminal from `ValidateAccessTokenResponse`.
- [ ] Add audit events for login denial and refresh denial.
- [ ] Add tests for:
  - denial before MFA
  - no token/session on denial
  - refresh denial revokes session
  - terminal appears in token/session validation

Commands:

```bash
pnpm --filter auth-service test:l1 -- --runInBand src/application/commands/auth/select-account.handler.spec.ts src/application/commands/auth/refresh-session.handler.spec.ts
pnpm --filter auth-service test:l3 -- --runInBand src/interfaces/grpc/auth.grpc.controller.spec.ts
```

Expected:

- Auth-service blocks terminal-denied sessions before MFA/session issuance.
- Refresh rejects stale terminal access.

### Task 6: api-gateway Web/PDA/KIOSK BFF

- [ ] Add fixed terminal to existing Web auth use cases.
- [ ] Add shared terminal-aware auth use case wrapper or endpoint-specific controller methods for PDA/KIOSK.
- [ ] Add `reasonCode/message` to auth responses.
- [ ] Add session context `terminal` and `allowedTerminals`.
- [ ] Add permission-management routes/adapters for role terminal access and account override.
- [ ] Add controller/use-case tests for Web/PDA/KIOSK terminal propagation.

Commands:

```bash
pnpm --filter api-gateway exec jest src/modules/auth-bff/interfaces/http/controllers/auth.integration.spec.ts --runInBand
pnpm --filter api-gateway exec jest src/modules/permission-service --runInBand
```

Expected:

- Web/PDA/KIOSK endpoints forward fixed terminals.
- HTTP denial shape includes `TERMINAL_ACCESS_DENIED`.

### Task 7: tenant-web UI

- [ ] Extend auth API types for reason/message and terminal access fields.
- [ ] Handle terminal access denial in login store.
- [ ] Add role terminal access controls in role management/detail.
- [ ] Add account terminal access display and override switch in account management/detail.
- [ ] Add read-only allowed terminals in personal center.
- [ ] Add tests for API types/store and management helpers.

Commands:

```bash
pnpm --dir app/web test -- tenant-web/src/store/auth.spec.ts
pnpm --dir app/web test -- tenant-web/src/views/admin/role-management.spec.ts
pnpm --dir app/web test -- tenant-web/src/views/admin/account-management.spec.ts
```

Expected:

- UI displays only `WEB/PDA/KIOSK`.
- Override switch maps to create/update/delete semantics.
- Personal center is read-only.

### Task 8: Integration Verification

- [ ] Run targeted service tests.
- [ ] Run proto lint.
- [ ] Run smoke tests that are available for touched services.
- [ ] Manually inspect final git diff for unrelated edits.

Commands:

```bash
pnpm proto:lint
pnpm --filter permission-service test:l1
pnpm --filter auth-service test:l2
pnpm --filter api-gateway exec jest src/modules/auth-bff --runInBand
```

Expected:

- All targeted tests pass, or failures are documented with root cause and next fix.

## Execution Mode

Default execution is inline in the main thread. Use subagents only for bounded review tasks such as:

- checking auth-service token/session impact
- checking tenant-web UI integration points
- checking contract docs against proto changes

Subagents must not change overlapping files unless explicitly assigned a disjoint write set.
