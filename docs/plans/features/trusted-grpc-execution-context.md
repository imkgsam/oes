# Trusted gRPC Execution Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Global Command must assign each lane before execution; this packet does not dispatch implementation.

**Goal:** Replace every repository gRPC request-body/operator-header trust path with mTLS workload identity, Auth / STS ExecutionToken, explicit RPC authorization mode and trusted multi-hop propagation.

**Architecture:** Common supplies one generated metadata signature and one client/server runtime. Migration proceeds target service by target service: prepare all callers, switch one target to Token-only enforcement, run service-level acceptance, delete that target’s legacy trust path, then continue. Only an irreducible strongly connected service group may share one server cutover; all 21 services and the current 560-RPC baseline plus five frozen MACHINE RPCs must reach zero legacy references before the capability closes.

**Tech Stack:** NestJS, gRPC, `ts-proto` / Buf, TypeScript, JWT / JWKS, Prisma, Jest, W3C Trace Context, deployment-managed mTLS.

---

```text
status: DESIGN_FROZEN_IMPLEMENTATION_NOT_DISPATCHED
freezeToken: FROZEN_TRUSTED_GRPC_METADATA
decisionAdr: docs/adr/0015-workload-identity-and-execution-token.md
architectureTruthSource: docs/architecture/14-grpc-metadata-and-service-trust-architecture.md
migrationClosure: 21 services / 51 existing controllers plus the frozen MACHINE Auth surface / 565 planned RPCs / zero legacy trust references
resolvedDesignGates:
  - DG-1: docs/architecture/services/auth-service.md
  - DG-3: docs/architecture/collaborations/external-api-key-security.md
  - Principal issuance decisions: docs/contracts/permission-service/principal-authorization.md
  - MACHINE workload source credential: docs/contracts/auth-service/machine-workload-source-credential.md
  - Machine Principal resolution: docs/contracts/identity-service/machine-principal-resolution.md
  - MACHINE wire/schema: docs/contracts/auth-service/machine-workload-source-credential.md + docs/contracts/identity-service/machine-principal-resolution.md
```

## 1. Frozen Scope

This capability now includes the complete current gRPC repository boundary:

- Common generated metadata signatures and trusted client/server runtime.
- Deployment workload identity and channel authentication.
- Auth / STS issuance, local validation support and process-local Token cache.
- Auth MACHINE source credential, Identity Machine Principal/workload binding ownership and Permission principal authorization integration.
- API Gateway and every service-to-service caller.
- Current integrated baseline of 21 gRPC services, 51 Controller files and 560 proto RPCs, plus the frozen Auth MACHINE controller and five MACHINE RPCs defined by the owner contracts.
- Cron, Robot, AI and technical callers represented in current or newly frozen contracts.
- All tests, fixtures and generated-call compatibility repairs.
- Final deletion of shared signed operator context, self-reported service identity and body identity fields.

Asset + Site remain the first business-unblock chain, but they are no longer the program closure boundary.

No implementation lane may add Token-to-body fallback, shared Bearer Token storage, wildcard audience, Permission-to-Scope mapping, shared signing key or feature-specific metadata factory.

## 2. Required Deferred Design Tasks

The following five items are required but intentionally moved to separate design tasks. “Deferred” does not authorize an implementation owner to invent the answer.

| Gate | Required design | Blocks |
| --- | --- | --- |
| DG-1 | Token cryptography and workload identity interoperability: allowed algorithm, issuer / audience registry, JWKS endpoint, `cnf` representation, trust domain and rotation | Production TG-0/TG-1/TG-2 security configuration |
| DG-2 | Emergency ExecutionToken revocation event: owner, CloudEvents type/version, payload, ordering, delivery, deny-cache update and recovery | Emergency revoke implementation and production security acceptance |
| DG-3 | **FROZEN**: [External API Key Security Collaboration](../../architecture/collaborations/external-api-key-security.md), [ADR 0017](../../adr/0017-protected-external-api-key-verifier-provider.md), Auth/Gateway contracts, and `auth_service/external_api_key.proto` define identifier/secret, HTTP/internal exchange, protected HMAC verifier provider, confirmed-version compromise CQRS/RPC, rate protection, rotation, audit, leak response and Integration Machine boundary. | Credential implementation may resume only against the operation-oriented protected verifier port/provider and the provider-disabled-before-transaction compromise workflow; the preliminary material-returning Pepper seam and partial bulk revocation are prohibited. Gateway locally validates five-minute external access tokens; DG-2 remains scoped to internal ExecutionToken revocation. |
| DG-4 | **FROZEN**: [DELEGATED execution and ActionGrant](../../architecture/collaborations/delegated-execution-and-action-grant.md) defines delegation lifecycle, tool upper bound, step-up, exact binding, one-time consumption and forbidden operations. The first concrete slice is [Task ActionGrant](./delegated-task-action-grant.md). | AI delegation and RPCs requiring one-time high-risk authorization; implementation still consumes DG-1 binding and must use the paired capability command. |
| DG-5 | PrincipalRoleBinding persistence: uniqueness, effective-window overlap, revoke idempotency, migration invariants and rollback | Permission schema migration from AccountRole |

Global Command must create independent design owners for DG-1 through DG-5. A blocked capability remains disabled; ordinary implementers cannot substitute local choices.

Marketplace is cancelled. The system does not reserve a shared third-party App principal, installation model, developer platform or cross-tenant App authorization path.

## 3. Verified Repository Inventory

| Service | Controller files | Current proto RPCs |
| --- | ---: | ---: |
| `asset-service` | 1 | 5 |
| `auth-service` | 1 | 70 |
| `browser-activity-service` | 1 | 13 |
| `collaboration-service` | 4 | 16 |
| `crm-service` | 3 | 15 |
| `finance-service` | 2 | 27 |
| `hr-service` | 2 | 15 |
| `identity-service` | 3 | 41 |
| `item-master-service` | 2 | 50 |
| `mes-service` | 4 | 32 |
| `notification-service` | 1 | 2 |
| `party-service` | 2 | 6 |
| `permission-service` | 8 | 66 |
| `procurement-service` | 2 | 21 |
| `public-entry-service` | 2 | 23 |
| `sales-service` | 4 | 27 |
| `site-service` | 2 | 66 |
| `srm-service` | 2 | 13 |
| `tenant-org-service` | 2 | 20 |
| `terminal-device-service` | 1 | 17 |
| `wms-service` | 2 | 15 |
| **Total** | **51** | **560** |

Additional baseline:

- Approximately 360 RPCs currently lack any server-entry Guard.
- Only 44 RPCs use Common `RequirePermissions`; Permission Service has about 61 custom management gates.
- 556 generated client call sites were inspected; 19 currently pass only request.
- Generator currently uses `addGrpcMetadata=false`.
- Current trust paths include shared signed operator context, self-reported service name and body tenant/operator fields.

The implementation inventory script at `scripts/architecture/trusted-grpc-signature-inventory.mjs` becomes the machine-verifiable source for updated counts; this packet records the freeze baseline, not a permanently hard-coded repository metric.

## 4. Per-service Migration State Machine

Every target service advances through exactly these states:

```text
LEGACY
  -> CONTRACT_CLASSIFIED
  -> ALL_CALLERS_READY
  -> TOKEN_ONLY_SERVER_CUTOVER
  -> SERVICE_ACCEPTED
  -> LEGACY_REFERENCES_ZERO
```

Rules:

- `CONTRACT_CLASSIFIED`: the service owner has mapped every RPC to BUSINESS, SELF_SERVICE or INTERNAL in its service truth source / black-box contract. The cross-cutting platform owner cannot guess service business semantics.
- `ALL_CALLERS_READY`: every Gateway, service, worker and fixture caller can send the target audience Token and metadata required by that exact RPC.
- Before server cutover, the legacy target may continue consuming its existing contract. Caller preparation may attach new metadata early, but it cannot use Token failure as a reason to manufacture broader legacy authority.
- At `TOKEN_ONLY_SERVER_CUTOVER`, the target’s proto/body identity, Controller guards, application context and fixtures change in one service slice. The server accepts only the new trust path.
- A migrated method never performs `try ExecutionToken -> on failure read legacy body/header`.
- If any caller is not ready, the target remains `LEGACY`; schedule pressure cannot introduce a fallback.
- Each target receives its own build, focused tests, black-box negative tests and legacy-reference-zero scan before the next target begins.
- A strongly connected group can share server activation only when static call-graph evidence proves caller preparation cannot safely break the cycle. Group activation does not remove per-service review and tests.

This permits gradual delivery without a dual-trust resource server.

## 5. Platform Foundation Lanes

| Lane | Owner | Allowed write paths | Required output |
| --- | --- | --- | --- |
| TG-0 | Deployment / SRE | `docker-compose.yml`, new `docker/grpc-trust/**`, new `docs/runbooks/trusted-grpc-workload-identity.md`, new `scripts/local/trusted-grpc-transport-smoke.mjs`, assigned production deployment repository | Per-workload certificates / SPIFFE-compatible identity, trust bundle, rotation and transport acceptance; DG-1 gates production values |
| TG-1 | Common platform / contract owner | `src/common/src/contracts/buf.gen.yaml`, `src/common/src/generated/**`, `src/common/src/authorization/trusted-execution/**`, `src/common/src/transport/grpc/**`, reviewed exports and focused tests | `addGrpcMetadata=true`, decorators, verifier, immutable context, provider, mode scanner, process-local cache and inventory script |
| TG-2 | Auth Service owner | `src/common/src/contracts/auth_service/execution_token.proto`, `src/services/system/auth-service/src/{application,domain,infrastructure,interfaces,modules}/**`, Auth Prisma and tests | STS exchange, signed single-audience Token, JWKS, cache-compatible TTL, audited issuance and dedicated MACHINE source-credential lifecycle/verifier; the MACHINE sub-slice may write only the exact §5.1 manifest; DG-1/DG-2 gate production completion |
| TG-3 | Identity + Auth credential migration owners | `src/common/src/contracts/identity_service/identity_query.proto`, Identity Machine Principal/binding paths, Auth credential paths, Identity/Auth `prisma/**` and focused tests | `FROZEN_PENDING_IMPLEMENTATION`: Machine Principal and `MachineWorkloadBinding` remain Identity-owned; implementation will add `ResolveMachinePrincipalForAuth` on the existing Identity surface; the MACHINE sub-slice may write only the exact §5.1 manifest; API Key remains a distinct Auth-owned profile; DG-3 gates external opening |
| TG-4 | Permission + Common Permission owners | `src/common/src/authorization/permission-codes/**`, `src/common/src/contracts/permission_service/permission_check.proto`, generated output, Permission source / Prisma / tests | Existing `PermissionCheckService` gains Auth-only `ResolveWorkloadIssuance` mTLS bootstrap decision and ExecutionToken-protected `ResolvePrincipalAuthorization`; exact INTERNAL Codes including `identity.internal.machine_principal.resolve`, all-or-nothing decisions, audit and catalog sync; the MACHINE sub-slice may write only the exact §5.1 manifest; DG-5 gates schema migration |
| TG-5 | API Gateway owner | `src/services/api-gateway/src/common/grpc/**`, tenant-aware permission guard, all target-specific downstream adapters and tests | Session/root execution construction and target-specific producer preparation for every migrated service |
| TG-VERIFY | Integration / Security owner | `scripts/local/trusted-grpc-*.mjs`, target-specific fixtures and deployment test configuration | Per-service acceptance evidence plus final repository-wide proof |

`src/common/src/generated/**` is changed only through `pnpm proto:regen`. Shared paths remain single-writer.

### 5.1 MACHINE root exact implementation lease

Status is `FROZEN_PENDING_IMPLEMENTATION`. This manifest registers path ownership only; exact proto field numbers, JWS profile, Prisma invariants, actors, error mapping and audit semantics are frozen in the Auth/Identity MACHINE contracts named above. Runtime class names, implementation algorithms and implementation sequencing remain implementation concerns. For this MACHINE sub-slice, every tracked path not listed under `trackedWriterPaths` is protected by default. `EXISTING` means the file exists at base `1ca24f417a2d06bce8be79d4c8ed67bc6c518a65`; `NEW_TARGET` is the one exact permitted future file and must not be replaced by a sibling name or directory-wide lease.

```yaml
machineWorkloadImplementationLease:
  trackedWriterPaths:
    commonTrustedTransport:
      - { state: EXISTING, path: src/common/src/transport/grpc/grpc-workload-identity.provider.ts }
      - { state: EXISTING, path: src/common/src/transport/grpc/grpc-workload-identity.provider.spec.ts }

    commonContracts:
      - { state: NEW_TARGET, path: src/common/src/contracts/auth_service/machine_workload_source_credential.proto }
      - { state: NEW_TARGET, path: src/common/src/contracts/auth_service/machine_workload_source_credential.contract.spec.ts }
      - { state: EXISTING, path: src/common/src/contracts/identity_service/identity_query.proto }

    authService:
      - { state: EXISTING, path: src/services/system/auth-service/prisma/schema.prisma }
      - { state: NEW_TARGET, path: src/services/system/auth-service/prisma/migrations/20260806_machine_workload_source_credential/migration.sql }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/domain/entities/machine-workload-source-credential.entity.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/domain/repositories/machine-workload-source-credential.repository.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/application/commands/auth/issue-machine-workload-source-credential.command.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/application/commands/auth/issue-machine-workload-source-credential.handler.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/application/commands/auth/issue-machine-workload-source-credential.handler.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/application/commands/auth/revoke-machine-workload-source-credential.command.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/application/commands/auth/revoke-machine-workload-source-credential.handler.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/application/commands/auth/revoke-machine-workload-source-credential.handler.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/commands/auth/index.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/application/services/machine-workload-source-credential.service.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/application/services/machine-workload-source-credential.service.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/ports/identity-service.port.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/common/constants/exception-enums/auth.errors.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/adaptors/identity-service.adaptor.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/adaptors/identity-service.adaptor.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.machine-workload-source-credential.repository.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.machine-workload-source-credential.repository.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/execution-token-signer/machine-workload-source-credential.verifier.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/execution-token-signer/machine-workload-source-credential.verifier.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/execution-token-signer/verified-execution-token-context.provider.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/execution-token-signer/verified-execution-token-context.provider.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/interfaces/grpc/machine-workload-source-credential.grpc.controller.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/interfaces/grpc/machine-workload-source-credential.grpc.controller.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/modules/auth/auth.module.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/modules/token/execution-token.module.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/modules/token/execution-token.module.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/main.ts }

    identityService:
      - { state: EXISTING, path: src/services/system/identity-service/prisma/schema.prisma }
      - { state: NEW_TARGET, path: src/services/system/identity-service/prisma/migrations/20260806_machine_workload_binding/migration.sql }
      - { state: EXISTING, path: src/services/system/identity-service/src/common/constants/symbols/repo.symbols.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/domain/entities/machine-workload-binding.entity.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/domain/repositories/machine-workload-binding.repository.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/infrastructure/mappers/prisma-machine-workload-binding.mapper.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/infrastructure/repositories/prisma/prisma.machine-workload-binding.repository.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/application/commands/service-account/enroll-machine-workload-binding.command.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/application/commands/service-account/enroll-machine-workload-binding.handler.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/application/commands/service-account/disable-machine-workload-binding.command.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/application/commands/service-account/disable-machine-workload-binding.handler.ts }
      - { state: EXISTING, path: src/services/system/identity-service/src/application/commands/service-account/index.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/application/queries/service-account/resolve-machine-principal-for-auth.query.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/application/queries/service-account/resolve-machine-principal-for-auth.handler.ts }
      - { state: EXISTING, path: src/services/system/identity-service/src/application/queries/service-account/index.ts }
      - { state: EXISTING, path: src/services/system/identity-service/src/interfaces/grpc/identity-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/identity-service/src/interfaces/grpc/identity-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/identity-service/src/modules/identity-management/identity-management.module.ts }
      - { state: EXISTING, path: src/services/system/identity-service/src/modules/identity-query/identity-query.module.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/test/l1/machine-workload-binding-management.handlers.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/test/l1/machine-workload-binding-management.grpc-controller.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/test/l1/resolve-machine-principal-for-auth.handler.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/test/l1/resolve-machine-principal-for-auth.grpc-controller.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/test/l2/prisma.machine-workload-binding.repository.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/test/l2/machine-workload-binding-database-constraints.spec.ts }

    permissionAndTrackedCommonCode:
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/permission-catalog.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/generate-common-permission-codes.ts }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/auth/auth-management.permission-codes.ts }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/identity/machine.permission-codes.ts }
      - { state: NEW_TARGET, path: src/common/src/authorization/permission-codes/identity/internal.permission-codes.ts }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/identity/index.ts }
      - { state: EXISTING, path: src/services/system/permission-service/test/l1/common-permission-code-generator.spec.ts }
      - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-foundation.seed.spec.ts }
      - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-service-seed.spec.ts }

  generatedOutputs:
    trackedAndCommitted:
      source:
        - src/services/system/permission-service/src/scripts/permission-catalog.ts
        - src/services/system/permission-service/src/scripts/generate-common-permission-codes.ts
      outputs:
        - src/common/src/authorization/permission-codes/auth/auth-management.permission-codes.ts
        - src/common/src/authorization/permission-codes/identity/machine.permission-codes.ts
        - src/common/src/authorization/permission-codes/identity/internal.permission-codes.ts
        - src/common/src/authorization/permission-codes/identity/index.ts
      command: pnpm --filter permission-service permission-codes:generate-common

    ignoredNotCommitted:
      proto:
        inputs:
          - src/common/src/contracts/auth_service/machine_workload_source_credential.proto
          - src/common/src/contracts/identity_service/identity_query.proto
        outputs:
          - src/common/src/generated/auth_service/machine_workload_source_credential.ts
          - src/common/src/generated/auth_service/index.ts
          - src/common/src/generated/identity_service/identity_query.ts
          - src/common/src/generated/identity_service/index.ts
          - src/common/src/generated/index.ts
        command: pnpm proto:regen
      prisma:
        inputs:
          - src/services/system/auth-service/prisma/schema.prisma
          - src/services/system/identity-service/prisma/schema.prisma
        outputRoots:
          - src/services/system/auth-service/prisma/generated/prisma/
          - src/services/system/identity-service/prisma/generated/prisma/
        commands:
          - pnpm --filter auth-service prisma:generate
          - pnpm --filter identity-service prisma:generate

  protectedPaths:
    denyByDefault: every tracked path not present in trackedWriterPaths
    humanSessionExamples:
      - src/services/system/auth-service/src/application/queries/session/validate-access-token.query.ts
      - src/services/system/auth-service/src/application/queries/session/validate-access-token.handler.ts
      - src/services/system/auth-service/src/application/queries/session/validate-access-token.handler.spec.ts
    externalApiKeyExamples:
      - src/common/src/contracts/auth_service/external_api_key.proto
      - src/services/system/auth-service/src/domain/api-key/api-key.credential.ts
      - src/services/system/auth-service/src/application/services/external-api-key-credential.service.ts
      - src/services/system/auth-service/src/infrastructure/execution-token-signer/api-key-root-execution-context.ts
      - src/services/system/identity-service/src/application/queries/service-account/resolve-integration-machine-for-auth.query.ts
      - src/services/system/identity-service/src/application/queries/service-account/resolve-integration-machine-for-auth.handler.ts
    grpcAssetExamples:
      - src/common/src/contracts/asset_service/asset.proto
      - docs/architecture/services/asset-service.md
      - docs/architecture/collaborations/site-asset-media.md
    aiActionGrantExamples:
      - docs/adr/0016-delegated-execution-and-action-grant.md
      - docs/architecture/collaborations/delegated-execution-and-action-grant.md
      - docs/contracts/auth-service/delegated-execution-and-action-grant.md
      - docs/plans/features/delegated-task-action-grant.md
    sharedPathRestrictions:
      - path: src/common/src/transport/grpc/grpc-workload-identity.provider.ts
        restriction: derive certificateNotAfter only from the same transport-verified leaf DER used for the thumbprint, return it only as an issuance structural extension, keep generic VerifiedWorkloadIdentity stable, and fail closed on parse, invalid-date or expired-leaf evidence
      - path: src/services/system/auth-service/src/modules/token/execution-token.module.ts
        restriction: add MACHINE composition without changing AuthSessionSourceCredentialVerifier HUMAN behavior
      - path: src/services/system/auth-service/src/infrastructure/adaptors/identity-service.adaptor.ts
        restriction: add the new machine resolver call without changing ResolveIntegrationMachineForAuth or its external API-key path
      - path: src/common/src/contracts/identity_service/identity_query.proto
        restriction: add only the frozen machine resolver surface; preserve existing RPC semantics and field numbers
      - path: src/services/system/identity-service/src/interfaces/grpc/identity-query.grpc.controller.ts
        restriction: add only the new protected resolver mapping; preserve external Integration and ordinary query behavior
      - path: src/services/system/permission-service/src/scripts/permission-catalog.ts
        restriction: add only identity.internal.machine_principal.resolve, identity.machine.workload_binding.manage and auth.machine_workload_source_credential.revoke with the frozen owner/kind/scope metadata

  verificationCommands:
    generation:
      - pnpm --filter permission-service permission-codes:generate-common
      - pnpm proto:regen
      - pnpm proto:lint
      - pnpm --filter auth-service prisma:generate
      - pnpm --filter identity-service prisma:generate
    build:
      - pnpm --filter @oes/common build
      - pnpm --filter auth-service build
      - pnpm --filter identity-service build
      - pnpm --filter permission-service build
    focusedTests:
      - pnpm exec jest --runInBand --runTestsByPath src/common/src/transport/grpc/grpc-workload-identity.provider.spec.ts
      - pnpm exec jest --runInBand --runTestsByPath src/common/src/contracts/auth_service/machine_workload_source_credential.contract.spec.ts
      - pnpm --filter auth-service exec jest --runInBand
      - pnpm --filter identity-service exec jest --config jest.config.js --runInBand test/l1/machine-workload-binding-management.handlers.spec.ts test/l1/machine-workload-binding-management.grpc-controller.spec.ts test/l1/resolve-machine-principal-for-auth.handler.spec.ts test/l1/resolve-machine-principal-for-auth.grpc-controller.spec.ts test/l2/prisma.machine-workload-binding.repository.spec.ts test/l2/machine-workload-binding-database-constraints.spec.ts
      - pnpm --filter permission-service exec jest --config jest.config.js --runInBand test/l1/common-permission-code-generator.spec.ts test/l1/permission-foundation.seed.spec.ts test/l1/permission-service-seed.spec.ts
    ownership:
      - git diff --name-only <base>..<candidate>
      - git status --short
```

The manifest is closed rather than advisory and contains exactly 68 tracked writer paths: adding another tracked file, renaming a `NEW_TARGET`, tracking ignored generated output, touching a protected path, or needing a contract/schema/runtime path not listed here is a design-scope change and must return to Unified Design before implementation continues. Shared files remain single-writer under the registered capability owner.

Audit reuse does not add another tracked writer path. Auth reuses `src/services/system/auth-service/prisma/schema.prisma` model `AuditEvent`; the leased new `prisma.machine-workload-source-credential.repository.ts` owns the transaction that writes credential state and its audit row together. Identity follows the same pattern with its existing `AuditEvent` model and leased new `prisma.machine-workload-binding.repository.ts`. Existing generic audit repositories/listeners remain protected and need no modification; no new audit table, event bus, outbox or central-audit owner is introduced by this MACHINE slice.

## 6. Static Dependency Evidence And Recommended Order

Static generated-contract imports currently show these service-to-service edges:

- Auth -> HR, Identity, Notification, Permission, TenantOrg.
- Collaboration -> CRM, Identity, Permission.
- CRM -> Party.
- HR -> Auth, Identity, Party, Permission, TenantOrg.
- Identity -> HR, Party, TenantOrg.
- MES -> Item Master.
- Permission -> Identity.
- Procurement -> Item Master, SRM.
- Public Entry -> HR, Identity, Permission, TenantOrg.
- SRM -> Item Master, Party.
- TenantOrg -> Auth, HR, Identity, Party, Permission.
- WMS -> Item Master, Procurement.
- Site -> Asset is the frozen new Site Media edge.

Gateway edges, dynamic client lookup, Cron/worker callers and tests are added by the inventory script and must be included before each target cutover.

For every target, the static caller inventory must distinguish pure root MACHINE callers from multi-hop callers. A Cron/Robot/worker with no inbound HUMAN/session or subject ExecutionToken blocks that target's `ALL_CALLERS_READY` until the frozen MACHINE source credential + Identity binding resolution path is implemented and verified. A service call that already carries a verified upstream ExecutionToken, such as the current Site -> Asset flow, remains multi-hop and does not become a MACHINE root merely because the caller runs in a service process.

Recommended implementation/verification order:

1. TG-0 through TG-5 foundation and full generated-signature compile repair.
2. `asset-service`.
3. `site-service`.
4. `browser-activity-service`.
5. `notification-service`.
6. `terminal-device-service`.
7. `party-service`.
8. `item-master-service`.
9. Foundation identity/authz group: `auth-service`, `identity-service`, `permission-service`, `hr-service`, `tenant-org-service`. Review and test one service at a time; if the cycle remains irreducible after caller preparation, activate these five servers as the smallest atomic group.
10. `crm-service`.
11. `srm-service`.
12. `procurement-service`.
13. `wms-service`.
14. `mes-service`.
15. `collaboration-service`.
16. `public-entry-service`.
17. `finance-service`.
18. `sales-service`.
19. Final Gateway/Common legacy deletion and repository-wide acceptance.

Independent services may change order when Global Command has fresh call-graph evidence, but only one target service slice has server cutover in progress at a time. The five-service foundation group is the only currently identified atomic candidate; implementation must try caller preparation before accepting the group exception.

## 7. Service Owner Registry

| Target | Proto path | Runtime owner path | Known downstream targets |
| --- | --- | --- | --- |
| Asset | `src/common/src/contracts/asset_service/asset.proto` | `src/services/system/asset-service/**` | none; Site Media adds storage/provider ports, not another OES gRPC owner |
| Auth | `src/common/src/contracts/auth_service/auth.proto` and new execution-token contract | `src/services/system/auth-service/**` | HR, Identity, Notification, Permission, TenantOrg |
| Browser Activity | `src/common/src/contracts/browser_activity_service/browser_activity.proto` | `src/services/system/browser-activity-service/**` | none found statically |
| Collaboration | `src/common/src/contracts/collaboration_service/collaboration.proto` | `src/services/system/collaboration-service/**` | CRM, Identity, Permission |
| CRM | `src/common/src/contracts/crm_service/crm.proto` | `src/services/business/crm-service/**` | Party |
| Finance | `src/common/src/contracts/finance_service/finance.proto` | `src/services/business/finance-service/**` | none found statically |
| HR | `src/common/src/contracts/hr_service/hr.proto` | `src/services/system/hr-service/**` | Auth, Identity, Party, Permission, TenantOrg |
| Identity | `src/common/src/contracts/identity_service/identity_query.proto` | `src/services/system/identity-service/**` | HR, Party, TenantOrg |
| Item Master | `src/common/src/contracts/item_master_service/item_master.proto` | `src/services/system/item-master-service/**` | none found statically |
| MES | `src/common/src/contracts/mes_service/mes.proto` | `src/services/business/mes-service/**` | Item Master |
| Notification | `src/common/src/contracts/notification_service/notification.proto` | `src/services/system/notification-service/**` | none found statically |
| Party | `src/common/src/contracts/party_service/party.proto` | `src/services/system/party-service/**` | none found statically |
| Permission | `src/common/src/contracts/permission_service/*.proto` | `src/services/system/permission-service/**` | Identity |
| Procurement | `src/common/src/contracts/procurement_service/procurement.proto` | `src/services/business/procurement-service/**` | Item Master, SRM |
| Public Entry | `src/common/src/contracts/public_entry_service/public_entry.proto` | `src/services/system/public-entry-service/**` | HR, Identity, Permission, TenantOrg |
| Sales | `src/common/src/contracts/sales_service/sales.proto` | `src/services/business/sales-service/**` | none found statically |
| Site | `src/common/src/contracts/site_service/site.proto` | `src/services/system/site-service/**` | Asset after Site Media implementation |
| SRM | `src/common/src/contracts/srm_service/srm.proto` | `src/services/business/srm-service/**` | Item Master, Party |
| TenantOrg | `src/common/src/contracts/tenant_org_service/tenant_org.proto` | `src/services/system/tenant-org-service/**` | Auth, HR, Identity, Party, Permission |
| Terminal Device | `src/common/src/contracts/terminal_device_service/terminal_device.proto` | `src/services/system/terminal-device-service/**` | none found statically |
| WMS | `src/common/src/contracts/wms_service/wms.proto` | `src/services/business/wms-service/**` | Item Master, Procurement |

Each owner can modify only its service path, its owner proto/contract, its Permission Code definitions and focused tests. Gateway caller changes remain Gateway-owned; Common runtime changes remain TG-1-owned.

## 8. Mandatory Checklist For Every Service Slice

### A. Classification gate

- [ ] Enumerate every proto RPC, generated handler, Controller method and direct caller.
- [ ] Record exactly one enforcement declaration for each RPC in the owner service truth/contract: BUSINESS / SELF_SERVICE / INTERNAL, or one of the two named exact bootstrap policies when and only when the RPC is `ResolveWorkloadIssuance` or `IssueMachineWorkloadSourceCredential`.
- [ ] BUSINESS methods reference active BUSINESS Permission Code with correct `all / any`.
- [ ] SELF_SERVICE derives target from trusted principal and explicitly decides DELEGATED allowance.
- [ ] INTERNAL references active INTERNAL Code and an exact workload -> audience issuance policy.
- [ ] Rate limit, audit, idempotency, resource policy, device proof and domain rules remain in their proper layers.

### B. Caller preparation

- [ ] Update Gateway adapters, service adapters, workers and fixtures for the target audience.
- [ ] Preserve subject / tenant / delegation / request / trace attribution across legitimate multi-hop calls.
- [ ] Prove wrong audience and wrong workload `cnf` fail.
- [ ] Keep the target in LEGACY state if any caller lacks a trusted root context.

### C. Target server cutover

- [ ] Remove tenant/operator/scope/service identity fields from target request bodies where they are not legitimate business targets.
- [ ] Add explicit generated `metadata: Metadata` signatures.
- [ ] Install Common server runtime, mode scanner and immutable execution context.
- [ ] Replace legacy guards and Controller request-context parsing.
- [ ] Pass only verified identity facts into application use cases; domain does not receive JWT or gRPC metadata.
- [ ] Reject Token failure without fallback.

### D. Verification and cleanup

- [ ] Run the target package build and all target L1/L2/L3 tests available in its package scripts.
- [ ] Run caller package builds and focused adapter tests.
- [ ] Run target black-box positive, cross-tenant, wrong-audience, wrong-`cnf`, missing-Code and body-injection cases.
- [ ] Scan target proto, controllers, adapters and fixtures for legacy identity fields / headers / factories.
- [ ] Produce service handoff with cwd, branch, HEAD, dirty state, RPC count, caller count, test commands and results.
- [ ] Mark `LEGACY_REFERENCES_ZERO` only with fresh evidence.

The next target does not begin server cutover until the current target reaches `LEGACY_REFERENCES_ZERO`, except separately owned caller preparation that does not activate another server.

## 9. Asset And Site Priority Acceptance

Asset and Site retain the previously frozen exact behavior:

- Asset existing five RPCs and Site Media RPCs consume only trusted context.
- Site 59 Admin and seven Runtime RPCs are explicitly classified.
- Gateway Site Admin / Runtime / Avatar / Employee Photo callers use target Tokens.
- Site -> Asset exchanges `aud=asset-service` and exact `asset.internal.*` Codes.
- Site Runtime HMAC, nonce, method/path/body hash remains independently mandatory.
- Asset/Site body identity and fixture fallbacks reach zero before moving past the Site slice.
- Asset may reach `ALL_CALLERS_READY` without waiting for the pure MACHINE root implementation only if a fresh static caller/fixture inventory proves that every Asset caller is Gateway HUMAN/session or verified multi-hop and that no Cron/Robot/worker starts a root MACHINE call. Discovery of any pure MACHINE caller blocks Asset token-only cutover until that caller has the frozen source-credential path.

This priority does not exempt any later service.

## 10. Repository-wide Security Acceptance

Final acceptance must prove:

1. All 565 planned RPCs have exactly one enforcement declaration: BUSINESS / SELF_SERVICE / INTERNAL after context establishment, or one exact non-reusable bootstrap policy for `ResolveWorkloadIssuance` / `IssueMachineWorkloadSourceCredential`; missing, duplicate or widened bootstrap declarations fail architecture tests/startup.
2. All 21 services validate exact issuer, time, audience, `cnf`, tenant and required Permission Codes locally.
3. Normal RPC validation makes no Auth network call; only Token exchange/cache miss does.
4. No RPC trusts `x-internal-service-name`, shared signed operator payload or identity body duplicates.
5. SYSTEM is not a tenant wildcard; cross-tenant body injection fails.
6. SELF_SERVICE cannot target another principal; forbidden DELEGATED operations fail.
7. INTERNAL pure-machine calls work only for approved workload issuance policy.
8. Multi-hop calls change audience / `cnf` and preserve allowed attribution and trace continuity.
9. Cross-workload Token replay fails; repeated commands remain idempotent.
10. Site Runtime credential proof remains independent from internal Token validation.
11. External API Key never enters internal gRPC metadata. DG-3 is frozen; Gateway locally validates the five-minute external access token, and credential revocation immediately blocks new exchange.
12. Emergency revoke and DELEGATED/ActionGrant acceptance remain gated by DG-2/DG-4 rather than locally invented.
13. Every pure MACHINE root caller proves the dedicated Auth source credential, current SPIFFE/leaf binding, transport-derived unexpired leaf `notAfter` and Identity principal/binding/version path; caller-supplied lifetime, malformed/expired certificate evidence and wrong or stale binding fail before Permission/signing. A target with no such caller proves that absence through fresh static inventory rather than assuming readiness.
14. Full workspace generation, build and service test matrix pass at the exact candidate SHA.
15. Repository scans find zero legacy signer, guard, factory, header, trusted body identity and request-only client call.

## 11. Verification Commands

Foundation and global checks:

```bash
pnpm proto:regen
node scripts/architecture/trusted-grpc-signature-inventory.mjs
pnpm --filter @oes/common build
pnpm -r --if-present build
```

Final exact service build/test matrix:

```bash
for pkg in \
  asset-service auth-service browser-activity-service collaboration-service \
  crm-service finance-service hr-service identity-service item-master-service \
  mes-service notification-service party-service permission-service \
  procurement-service public-entry-service sales-service site-service \
  srm-service tenant-org-service terminal-device-service wms-service
do
  pnpm --filter "$pkg" run build
  pnpm --filter "$pkg" --if-present run test
  pnpm --filter "$pkg" --if-present run test:l1
  pnpm --filter "$pkg" --if-present run test:l2
  pnpm --filter "$pkg" --if-present run test:l3
done
pnpm --filter api-gateway run build
```

During one service slice, run the exact package commands for that registry row plus `api-gateway` and every direct caller identified by the inventory script. The loop above is repeated at final candidate acceptance and does not replace focused caller adapter tests.

Final black-box harness:

```bash
node scripts/local/trusted-grpc-repository-smoke.spec.mjs
node scripts/local/trusted-grpc-repository-smoke.mjs
```

## 12. Closure Conditions

The capability closes only when:

- TG-0 through TG-5 and TG-VERIFY outputs are integrated.
- DG-1 and DG-3 are frozen for their enabled capabilities; DG-2, DG-4 and DG-5 are either closed for enabled capabilities or the corresponding capability is demonstrably disabled; no local substitute exists.
- Every pure MACHINE root caller uses the frozen Auth source credential and Identity binding resolver; external API Key, legacy Identity API-key auth and hardcoded root mapping are absent from this path.
- All 21 service rows are `LEGACY_REFERENCES_ZERO`.
- All existing 51 Controller files plus the frozen new Auth MACHINE controller and all 565 planned RPCs are covered by the enforcement-declaration architecture test.
- The 19 request-only caller baseline reaches zero and the full generated caller inventory is explicit-metadata compliant.
- Every service-level handoff contains fresh build/test/security evidence.
- Full repository black-box acceptance passes at one candidate SHA.
- Common operator-context signer/codec/guard/factory exports and all references are deleted.
- Marketplace has no model, contract, permission, endpoint or backlog lane in this capability.

Implementation must not be dispatched from this design thread. Global Command assigns one service migration owner at a time, plus independent foundation/design owners, under the project’s branch/worktree and acceptance discipline.
