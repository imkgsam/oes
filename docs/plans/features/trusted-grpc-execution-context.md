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

### 3.1 Current-main global cutover status

Overall execution status is `GRPC_FOUNDATION_COMPLETE_GLOBAL_SERVICE_CUTOVER_PENDING` at current-main `6f259dc1cca555936ca8c2e358c05d6a21374e59`. The 54 generated files expose all 590 required explicit metadata signatures with zero missing signatures; this proves the shared call-signature foundation only. It does not prove that a target service has classified every contract, prepared every caller, enabled Token-only server enforcement or removed its legacy trust path.

The persistent execution owner is **OES Trusted gRPC Service Migration** (`019fe9f8-5a44-76e1-b5a4-110db9da6d59`). The former A/C/GRPC lane is historical, migration-frozen evidence and is not the active controller for the remaining cutover.

`C/A/T/L` means `CONTRACT_CLASSIFIED` / `ALL_CALLERS_READY` / `TOKEN_ONLY_SERVER_CUTOVER` / `LEGACY_PATH_REMOVED`:

| Service | RPCs / controllers | C | A | T | L | Proven callers / ordering note |
| --- | ---: | :-: | :-: | :-: | :-: | --- |
| Asset | 5 / 1 | Y | Y | Y | Y | Gateway, Site Media; complete |
| Site | 66 / 2 | Y | Y | Y | Y | Gateway; complete |
| Browser Activity | 13 / 1 | Y | Y | Y | Y | Gateway; implemented and verified at `bf0723472ad0cb430dce99d4547671b216c81ba4` |
| Notification | 2 / 1 | Y | Y | Y | Y | Auth; implemented and verified at `cc253986a86c6b8a063984cbb1874cf00fd20a60` |
| Terminal Device | 17 / 1 | N | N | N | N | Gateway; pending |
| Finance | 27 / 2 | N | N | N | N | Gateway; pending |
| Public Entry | 23 / 2 | N | N | N | N | Gateway; pending |
| Sales | 27 / 4 | N | N | N | N | Gateway; pending |
| MES | 32 / 4 | N | N | N | N | Gateway; pending |
| Collaboration | 16 / 4 | N | N | N | N | Gateway; second batch |
| CRM | 15 / 3 | N | N | N | N | Gateway, Collaboration; second batch |
| Procurement | 21 / 2 | N | N | N | N | Gateway, WMS; second batch |
| SRM | 13 / 2 | N | N | N | N | Gateway, Procurement; second batch |
| Item Master | 50 / 2 | N | N | N | N | Gateway, MES, WMS; high fan-in |
| WMS | 15 / 2 | N | N | N | N | Gateway; dependency-heavy |
| HR | 15 / 2 | N | N | N | N | Gateway, Auth, Identity; dependency-heavy |
| Party | 6 / 2 | N | N | N | N | Gateway, CRM, HR, TenantOrg; high fan-in |
| TenantOrg | 20 / 2 | N | N | N | N | Gateway, Auth, HR, Identity; high fan-in |
| Identity | 41 / 3 | N | N | N | N | Gateway, Auth, Permission, HR; foundation partial only |
| Permission | 66 / 8 | N | N | N | N | Gateway, Auth, HR, TenantOrg, WMS; bootstrap partial only |
| Auth | 70 / 1 | N | N | N | N | Gateway, HR, Site, TenantOrg; MACHINE foundation complete, full service pending |
| **Total / proven state** | **560 / 51** | **4 Y / 17 N** | **4 Y / 17 N** | **4 Y / 17 N** | **4 Y / 17 N** | **Asset, Site, Browser Activity and Notification complete; 17 services pending** |

The frozen order in §6 remains authoritative. Migration continues one target service at a time; completing the Auth, Identity, Permission, Gateway or Common foundation does not implicitly advance an unverified service row.

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
| TG-1 | Common platform / contract owner | `src/common/src/contracts/buf.gen.yaml`, `src/common/src/generated/**`, `src/common/src/authorization/trusted-execution/**`, `src/common/src/transport/grpc/**`, reviewed exports and focused tests; the Provider composition seam is restricted by the exact §5.3 lease | `addGrpcMetadata=true`, decorators, verifier, immutable context, provider, mode scanner, process-local cache and inventory script |
| TG-2 | Auth Service owner | `src/common/src/contracts/auth_service/execution_token.proto`, `src/services/system/auth-service/src/{application,domain,infrastructure,interfaces,modules}/**`, Auth Prisma and tests | STS exchange, signed single-audience Token, JWKS, cache-compatible TTL, audited issuance and dedicated MACHINE source-credential lifecycle/verifier; the MACHINE sub-slice may write only the exact §5.1 manifest; DG-1/DG-2 gate production completion |
| TG-3 | Identity + Auth credential migration owners | `src/common/src/contracts/identity_service/identity_query.proto`, Identity Machine Principal/binding paths, Auth credential paths, Identity/Auth `prisma/**` and focused tests | `IMPLEMENTED_VERIFIED`: Machine Principal, `MachineWorkloadBinding` and `ResolveMachinePrincipalForAuth` remain Identity-owned and were integrated by `024579598c1293807d3f1cd5e7003aefd8e8fa0a`; the §5.1 manifest remains historical ownership evidence; API Key remains a distinct Auth-owned profile; DG-3 gates external opening |
| TG-4 | Permission + Common Permission owners | `src/common/src/authorization/permission-codes/**`, `src/common/src/contracts/permission_service/permission_check.proto`, generated output, Permission source / Prisma / tests | Existing `PermissionCheckService` gains Auth-only `ResolveWorkloadIssuance` mTLS bootstrap decision and ExecutionToken-protected `ResolvePrincipalAuthorization`; exact INTERNAL Codes including `identity.internal.machine_principal.resolve`, all-or-nothing decisions, audit and catalog sync; the MACHINE sub-slice may write only the exact §5.1 manifest; DG-5 gates schema migration |
| TG-5 | API Gateway owner | Target-specific downstream adapters/tests plus the exact Gateway lifecycle paths frozen by §5.2; descriptive Gateway directory ranges do not grant this lifecycle slice additional writes | Per-request verified source-credential lifecycle, session/root execution construction and target-specific producer preparation for every migrated service |
| TG-VERIFY | Integration / Security owner | `scripts/local/trusted-grpc-*.mjs`, target-specific fixtures and deployment test configuration | Per-service acceptance evidence plus final repository-wide proof |

`src/common/src/generated/**` is changed only through `pnpm proto:regen`. Shared paths remain single-writer.

### 5.1 MACHINE root exact implementation lease

Status is `IMPLEMENTED_VERIFIED`: the HUMAN foundation `1ca24f417a2d06bce8be79d4c8ed67bc6c518a65` and MACHINE completion `024579598c1293807d3f1cd5e7003aefd8e8fa0a` were accepted and integrated. This manifest remains historical path-ownership evidence; exact proto field numbers, JWS profile, Prisma invariants, actors, error mapping and audit semantics remain frozen in the Auth/Identity MACHINE contracts named above. Runtime class names and algorithms remain implementation details. The original classification is preserved: `EXISTING` means the file existed at base `1ca24f417a2d06bce8be79d4c8ed67bc6c518a65`; `NEW_TARGET` identifies the exact file introduced by that implementation slice.

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

### 5.2 Gateway verified source credential exact implementation lease

Status is `IMPLEMENTED_VERIFIED`: the Gateway verified source-credential lifecycle was accepted and is present in current main through `a82e5ea69a7773d4e0e8f5a91dcdf7a599897c1d`. This historical lease covers only the Gateway request lifecycle frozen in [Gateway / BFF architecture](../../architecture/11-gateway-and-bff-architecture.md) §9.5; it does not grant Asset RPC changes, target-adapter migration, Common carrier changes, Auth/session semantics, external API-key changes, proto/schema/runtime outside Gateway, or any other Gateway path. The original classification is preserved: `EXISTING` means the file existed at base `024579598c1293807d3f1cd5e7003aefd8e8fa0a`; `NEW_TARGET` identifies the exact file introduced by that implementation slice.

```yaml
gatewayVerifiedSourceCredentialLifecycleLease:
  trackedWriterPaths:
    gatewayEntryAndComposition:
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/main.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/security/index.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/security/composition/gateway-source-credential.providers.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/security/composition/gateway-source-credential.providers.spec.ts }

    verifiedSessionAdmission:
      - { state: EXISTING, path: src/services/api-gateway/src/common/guards/gateway-session-auth.guard.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/guards/gateway-session-auth.guard.spec.ts }

    privateVaultAndScope:
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-verified-source-credential.vault.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-verified-source-credential.vault.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-verified-source-credential.boundary.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-verified-source-credential.boundary.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/index.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/interceptors/gateway-verified-source-credential-scope.interceptor.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/interceptors/gateway-verified-source-credential-scope.interceptor.spec.ts }

  protectedPaths:
    - src/common/src/authorization/trusted-execution/transport-private-source-credential.ts
    - src/services/api-gateway/src/common/external-api/**
    - src/services/api-gateway/src/modules/**
    - src/services/system/**
    - src/common/src/contracts/**
    - src/common/src/generated/**

  frozenLifecycle:
    owner: GatewayVerifiedSourceCredentialVault
    storage: request-keyed private WeakMap containing only credential kind plus Common opaque handle
    admission: only after the owning verifier succeeds; HUMAN_SESSION is admitted by GatewaySessionAuthGuard
    scopeOwner: GatewayVerifiedSourceCredentialScopeInterceptor registered explicitly in main.ts
    interceptorOrder: credential-scope, timeout, response-transform, controller-and-awaited-downstream
    subscriptionRule: next.handle actual subscription occurs inside the Common transport-private accessor scope
    cleanup: idempotent on later-guard rejection, complete, error, timeout, cancel, unsubscribe and disconnect
    isolation: one scope per protected external request; concurrent requests never share entries
    absentScope: public, invalid and sessionless routes create no credential scope
    credentialKinds: HUMAN_SESSION and EXTERNAL_API remain verifier-separated and non-interchangeable
    cacheRule: every ExecutionToken exchange or cache hit requires the current verified request scope

  focusedAcceptance:
    - no scope exists before successful owner verification or for public, invalid and sessionless routes
    - one verified request exposes its credential only during the actual nested awaited downstream subscription
    - concurrent requests cannot observe or consume each other's entry
    - complete, error, timeout, cancel, unsubscribe, disconnect and later-guard denial leave no reusable entry
    - raw bearer and opaque handle are absent from request.user, enumerable request state, DTO, TrustedExecutionContext, logs, errors, JSON and Node inspection
    - adapter/header/body injection cannot create authority and adapters do not reread HTTP Authorization
    - an ExecutionToken cache hit fails without the current verified request source credential
    - provider tests prove the fixed Guard order and explicit main.ts interceptor order; APP_INTERCEPTOR and request-scoped-provider registration are absent

  verificationCommands:
    build:
      - pnpm --filter api-gateway build
    focusedTests:
      - pnpm --filter api-gateway exec jest --runInBand --runTestsByPath src/common/guards/gateway-session-auth.guard.spec.ts src/common/grpc/gateway-verified-source-credential.vault.spec.ts src/common/grpc/gateway-verified-source-credential.boundary.spec.ts src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts src/common/interceptors/gateway-verified-source-credential-scope.interceptor.spec.ts src/security/composition/gateway-source-credential.providers.spec.ts src/security/composition/gateway-guard.providers.spec.ts
    ownership:
      - git diff --name-only <base>..<candidate>
      - git status --short
```

The lifecycle manifest is closed rather than advisory and contains exactly 15 tracked writer paths. Any additional tracked file, renamed `NEW_TARGET`, Common carrier change, target adapter write, external verifier write or alternate DI seam is a design-scope change and returns to Unified Design. Existing Common opaque-handle and AsyncLocal accessor behavior is consumed as frozen infrastructure rather than redefined here.

### 5.3 Common STS source-credential composition exact implementation lease

Status is `IMPLEMENTED_VERIFIED`: the Common private source-credential composition seam was accepted and is present in current main through `a82e5ea69a7773d4e0e8f5a91dcdf7a599897c1d`. This historical lease records the only Common change used by Gateway composition. `EXISTING` retains its original meaning at base `32607c7aa017df9539d2999f97f9b274dbd46a78`; no additional file, proto, schema, barrel export or carrier path was granted.

```yaml
commonStsSourceCredentialCompositionLease:
  trackedWriterPaths:
    provider:
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/trusted-grpc-metadata-provider.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/trusted-grpc-metadata-provider.spec.ts }

  protectedPaths:
    - src/common/src/transport/grpc/execution-token-exchange-source-credential.carrier.ts
    - src/common/src/transport/grpc/index.ts
    - src/common/src/authorization/index.ts
    - src/common/src/authorization/trusted-execution/index.ts
    - src/common/src/generated/**
    - src/common/src/contracts/**
    - src/services/api-gateway/src/**

  frozenSeam:
    publicOption: "TrustedGrpcMetadataProviderOptions accepts sourceCredentialAccessor: AsyncLocalTransportPrivateSourceCredentialAccessor"
    privateConstruction: TrustedGrpcMetadataProvider constructs its private ExecutionTokenExchangeSourceCredentialCarrier internally from that accessor
    sharedInstance: Gateway supplies the same accessor instance to its Vault/Interceptor boundary and TrustedGrpcMetadataProvider
    cacheGate: assertCurrent remains mandatory on both cache hit and exchange miss
    exchangeMetadata: createMetadata remains the only place that emits Auth STS authorization metadata, and only on exchange miss
    visibility: carrier stays non-exported from transport/grpc/index.ts and all other public barrels; no deep import
    semantics: carrier validation, metadata shape, mTLS transport and ExecutionToken claims remain unchanged

  focusedAcceptance:
    - Provider can be constructed with the public accessor option and no private carrier is imported by Gateway
    - Common public barrel does not export ExecutionTokenExchangeSourceCredentialCarrier
    - missing current source credential fails closed before both cache reuse and exchange
    - current source credential is used only for Auth STS exchange metadata and never enters target metadata, DTO or TrustedExecutionContext
    - exact target audience, canonical Permission Code set, cache key and certificate binding behavior remain unchanged

  verificationCommands:
    build:
      - pnpm --filter @oes/common build
    focusedTests:
      - pnpm exec jest --runInBand --runTestsByPath src/common/src/authorization/trusted-execution/trusted-grpc-metadata-provider.spec.ts
      - pnpm --filter api-gateway exec jest --runInBand --runTestsByPath src/security/composition/gateway-source-credential.providers.spec.ts
    ownership:
      - git diff --name-only <base>..<candidate>
      - git diff --check <base>..<candidate>
      - git status --short
```

This Common lease contains exactly two existing writer paths. A change to the carrier, transport barrel, public export surface, Gateway files, proto/schema/generated output or Token semantics is a design-scope change and returns to Unified Design.

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

### 9.1 SITE Recovery Exact Implementation Lease

Status: `IMPLEMENTED_VERIFIED`. The Site 59+7 trusted-gRPC slice and directly required Site Media collaboration were accepted and integrated by `547a0c5d55f9a955543779ec584a16e9b05cf453`. The 122-path manifest remains historical closed-lease evidence: 58 paths were `EXISTING` at the implementation base and 64 were exact `NEW_TARGET` paths; paths outside that manifest were protected by default.

```yaml
siteRecoveryExactLease:
  sharedContractAndPermission:
    - { state: EXISTING, path: src/common/src/events/index.ts }
    - { state: EXISTING, path: src/common/src/contracts/site_service/site.proto }
    - { state: NEW_TARGET, path: src/common/src/contracts/asset_service/site_media.proto }
    - { state: NEW_TARGET, path: src/common/src/contracts/asset_service/site_media.contract.spec.ts }
    - { state: EXISTING, path: src/common/src/contracts/asset_service/index.ts }
    - { state: NEW_TARGET, path: src/common/src/contracts/asset_service/events.ts }
    - { state: NEW_TARGET, path: src/common/src/contracts/asset_service/events.spec.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/scripts/permission-catalog.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/scripts/generate-common-permission-codes.ts }
    - { state: EXISTING, path: src/services/system/permission-service/test/l1/common-permission-code-generator.spec.ts }
    - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-foundation.seed.spec.ts }
    - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-service-seed.spec.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/asset/index.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/asset/internal.permission-codes.ts }
    - { state: NEW_TARGET, path: src/common/src/authorization/permission-codes/asset/site-media.permission-codes.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/site-management/index.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/site-management/management.permission-codes.ts }
    - { state: NEW_TARGET, path: src/common/src/authorization/permission-codes/site-management/internal.permission-codes.ts }
  gatewaySiteCallersAndMachineRoot:
    - { state: EXISTING, path: src/services/api-gateway/src/app.module.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/common/guards/gateway-session-auth.guard.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.ts }
    - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-asset-grpc.client.ts }
    - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-auth-machine-workload-source-credential.client.ts }
    - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-auth-machine-workload-source-credential.client.spec.ts }
    - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-machine-workload-source-credential.provider.ts }
    - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-machine-workload-source-credential.provider.spec.ts }
    - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-machine-trusted-grpc-execution-producer.ts }
    - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-machine-trusted-grpc-execution-producer.spec.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/site-management-bff/infrastructure/downstream/site-admin-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/site-management-bff/infrastructure/downstream/site-admin-grpc.adapter.spec.ts }
    - { state: NEW_TARGET, path: src/services/api-gateway/src/modules/site-management-bff/infrastructure/downstream/site-admin-grpc.media.spec.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/site-management-bff/site-management.service.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/site-management-bff/site-management.service.spec.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/site-management-bff/interface/http/controllers/site-management.controller.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/site-management-bff/interface/http/controllers/site-management.controller.spec.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/site-management-bff/interface/http/controllers/site-management.integration.spec.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/site-runtime-bff/infrastructure/downstream/site-runtime-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/site-runtime-bff/infrastructure/downstream/site-runtime-grpc.adapter.spec.ts }
  siteTrustedCutoverAndEventConsumer:
    - { state: EXISTING, path: src/services/system/site-service/src/main.ts }
    - { state: EXISTING, path: src/services/system/site-service/src/app.module.ts }
    - { state: EXISTING, path: src/services/system/site-service/src/modules/site-service.module.ts }
    - { state: EXISTING, path: src/services/system/site-service/src/interfaces/grpc/site-admin.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/site-service/src/interfaces/grpc/site-runtime.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/site-service/src/application/services/site-admin-application.service.ts }
    - { state: EXISTING, path: src/services/system/site-service/src/application/audit/site-audit-envelope.ts }
    - { state: EXISTING, path: src/services/system/site-service/prisma/schema.prisma }
    - { state: NEW_TARGET, path: src/services/system/site-service/prisma/migrations/202608090001_asset_site_media_availability_inbox/migration.sql }
    - { state: NEW_TARGET, path: src/services/system/site-service/prisma/migrations/202608090001_asset_site_media_dlq/migration.sql }
    - { state: NEW_TARGET, path: src/services/system/site-service/src/application/ports/asset-site-media.port.ts }
    - { state: NEW_TARGET, path: src/services/system/site-service/src/infrastructure/prisma/prisma.module.ts }
    - { state: NEW_TARGET, path: src/services/system/site-service/src/application/ports/asset-site-media-inbox.port.ts }
    - { state: NEW_TARGET, path: src/services/system/site-service/src/application/events/asset-site-media-availability.handler.ts }
    - { state: NEW_TARGET, path: src/services/system/site-service/src/infrastructure/events/asset-site-media-availability.consumer.ts }
    - { state: NEW_TARGET, path: src/services/system/site-service/src/infrastructure/events/asset-site-media-availability.worker.ts }
    - { state: NEW_TARGET, path: src/services/system/site-service/src/infrastructure/repositories/prisma-asset-site-media-inbox.repository.ts }
    - { state: NEW_TARGET, path: src/services/system/site-service/src/infrastructure/grpc/site-auth-execution-token-exchange.client.ts }
    - { state: NEW_TARGET, path: src/services/system/site-service/src/infrastructure/grpc/site-trusted-asset.grpc.adapter.ts }
    - { state: NEW_TARGET, path: src/services/system/site-service/src/modules/asset-site-media-events.module.ts }
  siteExistingTests:
    - { state: EXISTING, path: src/services/system/site-service/test/l1/site-admin-ownership.spec.ts }
    - { state: EXISTING, path: src/services/system/site-service/test/l1/site-application-services.spec.ts }
    - { state: EXISTING, path: src/services/system/site-service/test/l1/site-content-descendant-ownership.spec.ts }
    - { state: EXISTING, path: src/services/system/site-service/test/l1/site-credential-sync-ownership.spec.ts }
    - { state: EXISTING, path: src/services/system/site-service/test/l1/site-domain-foundation.spec.ts }
    - { state: EXISTING, path: src/services/system/site-service/test/l1/site-preview-ownership.spec.ts }
    - { state: EXISTING, path: src/services/system/site-service/test/l1/site-publication-sync.spec.ts }
    - { state: EXISTING, path: src/services/system/site-service/test/l1/site-service-module.spec.ts }
    - { state: EXISTING, path: src/services/system/site-service/test/l2/prisma-site-content-descendant-ownership.spec.ts }
    - { state: EXISTING, path: src/services/system/site-service/test/l2/prisma-site-credential-sync-ownership.spec.ts }
    - { state: EXISTING, path: src/services/system/site-service/test/l2/prisma-site-slug-ledger.spec.ts }
    - { state: EXISTING, path: src/services/system/site-service/test/l2/prisma-site-sync-concurrency.spec.ts }
    - { state: EXISTING, path: src/services/system/site-service/test/l2/site-page-governance.repositories.spec.ts }
    - { state: EXISTING, path: src/services/system/site-service/test/l2/site-service-application-closed-loop.spec.ts }
    - { state: EXISTING, path: src/services/system/site-service/test/l3/site-grpc.controllers.spec.ts }
    - { state: EXISTING, path: src/services/system/site-service/test/l3/site-grpc-uint64-transport.spec.ts }
  siteNewTests:
    - { state: NEW_TARGET, path: src/services/system/site-service/test/l1/asset-site-media-availability.handler.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/site-service/test/l1/asset-site-media-availability.consumer.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/site-service/test/l1/asset-site-media-availability.worker.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/site-service/test/l2/asset-site-media-inbox.persistence.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/site-service/test/l3/site-trusted-grpc-security.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/site-service/test/l3/site-trusted-asset.grpc.adapter.spec.ts }
  assetSiteMediaR2PurgeAndOutbox:
    - { state: EXISTING, path: src/services/system/asset-service/package.json }
    - { state: EXISTING, path: src/services/system/asset-service/prisma/schema.prisma }
    - { state: NEW_TARGET, path: src/services/system/asset-service/prisma/migrations/202608090001_site_media_foundation/migration.sql }
    - { state: NEW_TARGET, path: src/services/system/asset-service/prisma/migrations/202608090003_site_media_purge_lease/migration.sql }
    - { state: NEW_TARGET, path: src/services/system/asset-service/prisma/migrations/202608090002_site_media_asset_identity/migration.sql }
    - { state: EXISTING, path: src/services/system/asset-service/src/main.ts }
    - { state: EXISTING, path: src/services/system/asset-service/src/app.module.ts }
    - { state: EXISTING, path: src/services/system/asset-service/src/domain/entities/asset.entity.ts }
    - { state: EXISTING, path: src/services/system/asset-service/src/common/constants/symbols/port.symbols.ts }
    - { state: EXISTING, path: src/services/system/asset-service/src/common/constants/symbols/repo.symbols.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/domain/entities/site-media-delivery-binding.entity.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/domain/entities/site-media-lifecycle-operation.entity.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/domain/repositories/site-media.repository.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/domain/ports/site-media-storage.port.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/domain/ports/asset-delivery-purge.port.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/application/services/site-media-application.service.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/interfaces/grpc/site-media.grpc.controller.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/modules/site-media/site-media.module.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/infrastructure/adaptors/storage/s3-compatible-site-media-storage.adaptor.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/infrastructure/adaptors/storage/cloudflare-r2-site-media-storage.adaptor.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/infrastructure/adaptors/delivery/cloudflare-site-media-delivery-purge.adaptor.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/infrastructure/repositories/prisma/prisma.site-media.repository.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/infrastructure/events/prisma-asset-site-media-outbox.store.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/infrastructure/events/nats-asset-site-media-event.publisher.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/infrastructure/events/asset-site-media-outbox.relay.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/infrastructure/events/asset-site-media-outbox.worker.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/src/infrastructure/workers/site-media-lifecycle-operation.worker.ts }
  assetNewTests:
    - { state: NEW_TARGET, path: src/services/system/asset-service/test/l1/site-media-grpc.controller.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/test/l1/site-media-application.service.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/test/l1/s3-compatible-site-media-storage.adaptor.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/test/l1/cloudflare-r2-site-media-storage.adaptor.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/test/l1/cloudflare-site-media-delivery-purge.adaptor.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/test/l1/asset-site-media-outbox-relay.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/test/l1/asset-site-media-outbox-worker.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/test/l1/site-media-lifecycle-operation.worker.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/test/l1/site-media-module.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/test/l2/prisma-site-media.repository.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/test/l2/site-media-database-constraints.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/asset-service/test/l3/site-media-grpc-security.spec.ts }
  ignoredGeneratedOutputs:
    generatorInput:
      - src/common/src/contracts/site_service/site.proto
      - src/common/src/contracts/asset_service/site_media.proto
    ignoredOutputs:
      - src/common/src/generated/site_service/site.ts
      - src/common/src/generated/asset_service/site_media.ts
      - src/common/src/generated/asset_service/index.ts
    generationCommand: pnpm proto:regen
    verificationCommand: pnpm --filter @oes/common build
  protectedBoundaries:
    - Auth and Identity MACHINE credential implementation
    - existing Asset five-RPC wire and runtime semantics
    - Common trusted carrier/runtime outside its already integrated public seams
    - external API-key and DELEGATED/AI/ActionGrant runtime
    - Site Inspiration Item/Category/Hotspot and Runtime local store/Storefront
    - Product Master-Site Product, BYOC, multi-CDN, DNS automation and video transcoding
```

Implementation dependency order is: shared proto/Permission registration; Gateway and Site trusted cutover preparation; Asset Site Media persistence/provider/runtime; Asset outbox and Site inbox; then cross-service acceptance. No server may enter token-only mode while a direct caller still uses legacy metadata or body identity.

Focused generation, build and test commands:

```bash
pnpm --filter permission-service permission-codes:generate-common
pnpm proto:regen
pnpm proto:lint
pnpm --filter asset-service prisma:generate
pnpm --filter site-service prisma:generate

pnpm --filter @oes/common build
pnpm --filter permission-service build
pnpm --filter api-gateway build
pnpm --filter asset-service build
pnpm --filter site-service build

pnpm exec jest --runInBand --runTestsByPath \
  src/common/src/contracts/asset_service/site_media.contract.spec.ts \
  src/common/src/contracts/asset_service/events.spec.ts

pnpm --filter permission-service exec jest --config jest.config.js --runInBand \
  test/l1/common-permission-code-generator.spec.ts \
  test/l1/permission-foundation.seed.spec.ts \
  test/l1/permission-service-seed.spec.ts

pnpm --filter api-gateway exec jest --runInBand --runTestsByPath \
  src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts \
  src/common/grpc/gateway-auth-machine-workload-source-credential.client.spec.ts \
  src/common/grpc/gateway-machine-workload-source-credential.provider.spec.ts \
  src/common/grpc/gateway-machine-trusted-grpc-execution-producer.spec.ts \
  src/modules/site-management-bff/infrastructure/downstream/site-admin-grpc.adapter.spec.ts \
  src/modules/site-runtime-bff/infrastructure/downstream/site-runtime-grpc.adapter.spec.ts

pnpm --filter asset-service test
pnpm --filter site-service test:l1
pnpm --filter site-service test:l2
pnpm --filter site-service test:l3
node scripts/architecture/trusted-grpc-signature-inventory.mjs
```

Acceptance additionally proves: 59/59 Admin, 7/7 Runtime and 11/11 Site Media RPCs each have exactly one declaration; all 13 new Code values come only from the canonical catalog/generator; Admin body identity and legacy Gateway metadata references are zero; `SignedSiteContext` remains intact; wrong audience/`cnf`, missing Code and body injection fail closed; the public Site Media event does not use process-local `EventEmitter`; and the tracked diff is a strict subset of this lease.

### 9.2 Browser Activity 13-RPC frozen cutover lease

Status: `IMPLEMENTED_VERIFIED`. Browser Activity was accepted and integrated at `bf0723472ad0cb430dce99d4547671b216c81ba4`: the cumulative implementation used 39 of the 47 leased paths (`1773` insertions / `707` deletions), preserved the exact 13-RPC matrix and all 46 field reservations, rejected MACHINE, DELEGATED and missing/wrong `session_terminal`, and passed proto/inventory, four package builds, focused tests and root gates. The accepted evidence preserves the baseline date-window and L2 environment limitations; it does not treat either limitation as a Browser cutover regression or as proof for any remaining service.

The audience is exactly `urn:oes:service:browser-activity-service`. The nine management/query RPCs are BUSINESS, `HUMAN`, `session_terminal=WEB`; the four extension RPCs are SELF_SERVICE with empty Code set, `HUMAN`, `session_terminal=BROWSER_EXTENSION`. All 13 reject MACHINE and DELEGATED. Auth derives `session_terminal` from the same active session truth as `session_id`; Common carries it in the signed Token, trusted context, declaration enforcement and cache key. This authentication fact does not change Principal Authorization, Permission Code ownership or the three authorization modes.

| RPC | Mode | Exact Code |
| --- | --- | --- |
| `GetPolicy` | BUSINESS | `browser_activity.policy.read` |
| `UpdatePolicy` | BUSINESS | `browser_activity.policy.manage` |
| `GetEmployeeAuditGrants` | BUSINESS | `browser_activity.overview.read` |
| `UpdateEmployeeAuditGrant` | BUSINESS | `browser_activity.policy.manage` |
| `GetOverview` | BUSINESS | `browser_activity.overview.read` |
| `GetEmployeeTimeline` | BUSINESS | `browser_activity.employee_detail.read` |
| `GetDomainAggregation` | BUSINESS | `browser_activity.url_detail.read` |
| `SearchUrls` | BUSINESS | `browser_activity.url_detail.read` |
| `GetOnlinePresence` | BUSINESS | `browser_activity.overview.read` |
| `GetAuditControl` | SELF_SERVICE | empty set |
| `AppendVisitSessions` | SELF_SERVICE | empty set |
| `Heartbeat` | SELF_SERVICE | empty set |
| `Disconnect` | SELF_SERVICE | empty set |

The five Browser Activity Codes already exist in the canonical Permission catalog and generated Common output; this slice adds no Code and grants no Permission writer path. Proto removes and reserves the exact body authority fields/numbers frozen in [Browser Activity P1 Contract](../../contracts/browser-activity-service/browser-activity-p1.md) §2.2. `extension_session_id` on ingest/heartbeat/disconnect is derived from verified `session_id`; target account/query fields remain tenant-scoped business targets. Update Policy/Grant management audit and Timeline/Domain/URL sensitive-read audit are method-owned, append-only and fail closed. Token/body/header/signed-operator fallback is forbidden.

```yaml
browserActivityTrustedGrpcImplementationLease:
  totalTrackedWriterPaths: 47
  stateCounts: { EXISTING: 41, NEW_TARGET: 6 }
  trackedWriterPaths:
    authCommonSessionTerminal:
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/declarations/index.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/declarations.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/trusted-execution-context.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/certificate-bound-execution-token-cache.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/execution-token-verifier.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/execution-token-verifier.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/trusted-grpc-metadata-provider.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/trusted-grpc-metadata-provider.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/guards/trusted-execution.guard.ts }
      - { state: EXISTING, path: src/common/src/authorization/guards/trusted-execution.guard.spec.ts }

      - { state: EXISTING, path: src/services/system/auth-service/src/modules/token/execution-token.module.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/modules/token/execution-token.module.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/execution-token-exchange.service.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/execution-token-exchange.service.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/execution-token-signer/verified-execution-token-context.provider.spec.ts }

    browserActivityProtoContract:
      - { state: EXISTING, path: src/common/src/contracts/browser_activity_service/browser_activity.proto }
      - { state: NEW_TARGET, path: src/common/src/contracts/browser_activity_service/browser_activity.contract.spec.ts }

    gatewayBrowserActivity:
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/index.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-browser-activity-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-browser-activity-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.spec.ts }

      - { state: EXISTING, path: src/services/api-gateway/src/modules/browser-activity-bff/adapters/browser-activity-grpc.adapter.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/modules/browser-activity-bff/adapters/browser-activity-grpc.adapter.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/browser-activity-bff/browser-activity-bff.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/browser-activity-bff/browser-activity-bff.service.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/browser-activity-bff/browser-activity-bff.service.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/browser-activity-bff/interfaces/http/dtos/browser-activity.dto.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/browser-activity-bff/interfaces/http/controllers/browser-activity.controller.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/browser-activity-bff/interfaces/http/controllers/extension-browser-activity.controller.spec.ts }

    browserActivityService:
      - { state: EXISTING, path: src/services/system/browser-activity-service/src/main.ts }
      - { state: EXISTING, path: src/services/system/browser-activity-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/system/browser-activity-service/src/interfaces/grpc/browser-activity.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/browser-activity-service/src/application/browser-activity-application.ts }
      - { state: EXISTING, path: src/services/system/browser-activity-service/src/infrastructure/prisma/prisma-browser-activity-application.ts }
      - { state: EXISTING, path: src/services/system/browser-activity-service/prisma/schema.prisma }
      - { state: NEW_TARGET, path: src/services/system/browser-activity-service/prisma/migrations/202608100001_browser_activity_trusted_audit/migration.sql }
      - { state: EXISTING, path: src/services/system/browser-activity-service/test/helpers/integration-db.ts }
      - { state: EXISTING, path: src/services/system/browser-activity-service/test/l1/browser-activity-application.spec.ts }
      - { state: EXISTING, path: src/services/system/browser-activity-service/test/l2/prisma-browser-activity-application.spec.ts }
      - { state: EXISTING, path: src/services/system/browser-activity-service/test/l3/browser-activity.grpc.controller.spec.ts }
      - { state: EXISTING, path: src/services/system/browser-activity-service/test/l3/browser-activity.module-di.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/browser-activity-service/test/l3/browser-activity.trusted-grpc.spec.ts }

  ignoredGeneratedOutputs:
    - path: src/common/src/generated/browser_activity_service/browser_activity.ts
      input: src/common/src/contracts/browser_activity_service/browser_activity.proto
      command: pnpm proto:regen

  protectedByDefault:
    - canonical Permission catalog/generator and generated Permission Code files
    - other Auth claims, source profiles, Permission decisions and ExecutionToken wire RPC fields
    - AI, ActionGrant, DELEGATED and MACHINE runtime
    - every non-Browser Gateway adapter and every other service cutover

  focusedAcceptanceCommands:
    - pnpm proto:lint
    - pnpm proto:regen
    - node scripts/architecture/trusted-grpc-signature-inventory.mjs
    - pnpm --filter @oes/common build
    - pnpm --filter auth-service build
    - pnpm --filter api-gateway build
    - pnpm --filter browser-activity-service build
    - pnpm --filter browser-activity-service test
    - pnpm exec jest --runInBand --runTestsByPath src/common/src/contracts/browser_activity_service/browser_activity.contract.spec.ts src/common/src/authorization/trusted-execution/declarations.spec.ts src/common/src/authorization/trusted-execution/execution-token-verifier.spec.ts src/common/src/authorization/trusted-execution/trusted-grpc-metadata-provider.spec.ts src/common/src/authorization/guards/trusted-execution.guard.spec.ts
    - pnpm --filter auth-service exec jest --runInBand --runTestsByPath src/application/services/execution-token-exchange.service.spec.ts src/modules/token/execution-token.module.spec.ts src/infrastructure/execution-token-signer/verified-execution-token-context.provider.spec.ts
    - pnpm --filter api-gateway exec jest --runInBand --runTestsByPath src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts src/common/grpc/gateway-browser-activity-grpc.client.spec.ts src/modules/browser-activity-bff/adapters/browser-activity-grpc.adapter.spec.ts src/modules/browser-activity-bff/browser-activity-bff.service.spec.ts src/modules/browser-activity-bff/interfaces/http/controllers/browser-activity.controller.spec.ts src/modules/browser-activity-bff/interfaces/http/controllers/extension-browser-activity.controller.spec.ts
```

Acceptance proves 13/13 methods have one exact declaration; WEB and BROWSER_EXTENSION Tokens cannot cross-call; wrong principal type/audience/`cnf`/Code/terminal fails before controller data; SELF_SERVICE derives tenant/account/session only from verified claims; all 46 active legacy input authority fields are removed/reserved while response session facts remain service-derived; Gateway no longer registers or uses the legacy Browser client/metadata factory; management and three sensitive reads persist the required audit; cache entries include `session_terminal`; no pure MACHINE caller appears; generated output is regenerated from the leased proto; and the candidate diff is a strict subset of these 47 paths.

### 9.3 Notification Auth dispatch 2-RPC frozen cutover lease

Status: `IMPLEMENTED_VERIFIED`. Notification Auth dispatch was accepted and integrated at `cc253986a86c6b8a063984cbb1874cf00fd20a60`; the implementation used 55 of the 68 leased paths. Final acceptance proved 2/2 trusted RPC declarations, exact Auth SYSTEM MACHINE workload/audience/Code enforcement and rejection of HUMAN, DELEGATED, TENANT MACHINE and wrong trust; preserved the wire reservations and all four template profiles; verified the canonical Code, atomic dispatch/audit/outbox, idempotency, protected TTL payload and redaction; removed the Auth local fallback and `effectiveCode`; kept the Collaboration Task consumer unchanged; and passed proto/generation, build, focused and root gates. The 68-path manifest remains historical closed-lease evidence.

`NotificationService.SendEmail` and `SendSms` are both Auth-only INTERNAL RPCs requiring the environment-registered exact Auth SPIFFE workload, `aud=urn:oes:service:notification-service`, a dedicated SYSTEM Machine Principal and Code `notification.internal.auth.dispatch`. HUMAN, DELEGATED, TENANT MACHINE and other workloads are rejected. The existing MACHINE source credential, Identity binding, `ResolveWorkloadIssuance`, Common trusted metadata provider and five-minute process-local ET cache are reused without a new credential profile or bootstrap exception.

Both requests delete and reserve `source=1`; the unused `SourceContext` becomes a tombstone reserving `source_service=1`, `tenant_id=2`, `org_id=3`, `trace_id=4`, `request_id=5`. Category/template/recipient/variables/idempotency/priority and Email subject override retain their current field numbers and are constrained by the [Notification Auth dispatch contract](../../contracts/notification-service/auth-dispatch.md). SYSTEM dispatch has no tenant/org and never writes a fake `system` tenant. Durable acceptance atomically persists dispatch, safe audit and protected provider outbox; provider delivery occurs after commit. Auth runtime/local development has no local dispatch fallback and Notification never returns or changes Auth-owned OTP.

```yaml
notificationAuthDispatchTrustedGrpcImplementationLease:
  totalTrackedWriterPaths: 68
  stateCounts: { EXISTING: 48, NEW_TARGET: 20 }
  trackedWriterPaths:
    commonProtoPermissionCode:
      - { state: EXISTING, path: src/common/src/contracts/notification_service/notification.proto }
      - { state: NEW_TARGET, path: src/common/src/contracts/notification_service/notification.contract.spec.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/permission-catalog.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/generate-common-permission-codes.ts }
      - { state: EXISTING, path: src/services/system/permission-service/test/l1/common-permission-code-generator.spec.ts }
      - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-foundation.seed.spec.ts }
      - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-service-seed.spec.ts }
      - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-service-seed-validate.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/index.ts }
      - { state: NEW_TARGET, path: src/common/src/authorization/permission-codes/notification/index.ts }
      - { state: NEW_TARGET, path: src/common/src/authorization/permission-codes/notification/internal.permission-codes.ts }

    authTrustedNotificationProducer:
      - { state: EXISTING, path: src/services/system/auth-service/src/domain/services/notification-dispatch.port.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/adaptors/notification-service.grpc.adaptor.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/adaptors/notification-service.grpc.adaptor.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/adaptors/local-notification-dispatch.adaptor.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/services/email.service.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/services/sms.service.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/modules/auth/auth.module.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/modules/auth/auth.module.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/modules/external-services.module.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/adaptors/auth-notification-execution-token-exchange.client.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/adaptors/auth-notification-execution-token-exchange.client.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/adaptors/auth-notification-machine-source-credential.client.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/adaptors/auth-notification-machine-source-credential.client.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/adaptors/auth-notification-machine-source-credential.provider.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/adaptors/auth-notification-machine-source-credential.provider.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/adaptors/auth-notification-trusted-grpc-execution.producer.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/adaptors/auth-notification-trusted-grpc-execution.producer.spec.ts }

      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/email-otp-login.service.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/email-otp-login.service.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/phone-otp-login.service.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/phone-otp-login.service.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/password-recovery.service.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/password-recovery.service.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/contact-binding-verification.service.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/contact-binding-verification.service.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/mfa/email-otp-mfa-challenge.service.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/mfa/email-otp-mfa-challenge.service.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/mfa/phone-otp-mfa-challenge.service.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/mfa/phone-otp-mfa-challenge.service.spec.ts }

    notificationTrustedDispatch:
      - { state: EXISTING, path: src/services/system/notification-service/src/main.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/modules/notification/notification.module.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/interfaces/grpc/notification.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/application/commands/index.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/application/commands/send-email.command.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/application/commands/send-email.handler.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/application/commands/send-sms.command.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/application/commands/send-sms.handler.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/domain/aggregates/notification-dispatch.aggregate.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/domain/repositories/notification-dispatch.repository.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/domain/services/email-provider.port.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/domain/services/sms-provider.port.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/common/constants/injection-tokens.ts }
      - { state: EXISTING, path: src/services/system/notification-service/prisma/schema.prisma }
      - { state: EXISTING, path: src/services/system/notification-service/src/infrastructure/mappers/notification-dispatch.mapper.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/infrastructure/repositories/prisma/prisma.notification-dispatch.repository.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/infrastructure/providers/local-email-provider.adaptor.ts }
      - { state: EXISTING, path: src/services/system/notification-service/src/infrastructure/providers/local-sms-provider.adaptor.ts }
      - { state: NEW_TARGET, path: src/services/system/notification-service/prisma/migrations/202608110001_notification_auth_dispatch_trust/migration.sql }
      - { state: NEW_TARGET, path: src/services/system/notification-service/src/domain/services/notification-delivery-payload-protection.port.ts }
      - { state: NEW_TARGET, path: src/services/system/notification-service/src/infrastructure/outbox/notification-provider-outbox.worker.ts }
      - { state: NEW_TARGET, path: src/services/system/notification-service/src/infrastructure/security/deployment-notification-delivery-payload-protector.ts }

    notificationSecurityTests:
      - { state: NEW_TARGET, path: src/services/system/notification-service/test/l1/notification-auth-dispatch.handlers.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/notification-service/test/l1/notification-provider-outbox.worker.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/notification-service/test/l2/notification-auth-dispatch.persistence.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/notification-service/test/l3/notification-auth-dispatch.trusted-grpc.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/notification-service/test/l3/notification-auth-dispatch.module-di.spec.ts }

  ignoredGeneratedOutputs:
    - path: src/common/src/generated/notification_service/notification.ts
      input: src/common/src/contracts/notification_service/notification.proto
      command: pnpm proto:regen

  protectedByDefault:
    - Collaboration Task event contract, NATS consumer, Inbox, DLQ, replay and operations paths
    - Auth login/MFA/password/invitation semantics outside removal of effectiveCode consumption
    - existing MACHINE credential, Identity binding, Permission resolver and ExecutionToken wire semantics
    - every non-Notification service cutover, external API-key, DELEGATED, AI and ActionGrant runtime
    - deployment/package/lock paths not listed above

  focusedAcceptanceCommands:
    - pnpm proto:lint
    - pnpm proto:regen
    - node scripts/architecture/trusted-grpc-signature-inventory.mjs
    - pnpm --filter permission-service permission-codes:generate-common
    - pnpm --filter @oes/common build
    - pnpm --filter permission-service build
    - pnpm --filter auth-service build
    - pnpm --filter notification-service build
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/common/src/contracts/notification_service/notification.contract.spec.ts
    - pnpm --filter permission-service exec jest --config jest.config.js --runInBand test/l1/common-permission-code-generator.spec.ts test/l1/permission-foundation.seed.spec.ts test/l1/permission-service-seed.spec.ts test/l1/permission-service-seed-validate.spec.ts
    - pnpm --filter auth-service exec jest --runInBand --runTestsByPath src/infrastructure/adaptors/auth-notification-execution-token-exchange.client.spec.ts src/infrastructure/adaptors/auth-notification-machine-source-credential.client.spec.ts src/infrastructure/adaptors/auth-notification-machine-source-credential.provider.spec.ts src/infrastructure/adaptors/auth-notification-trusted-grpc-execution.producer.spec.ts
    - pnpm --filter auth-service exec jest --runInBand --runTestsByPath src/infrastructure/adaptors/notification-service.grpc.adaptor.spec.ts src/application/services/email-otp-login.service.spec.ts src/application/services/phone-otp-login.service.spec.ts src/application/services/password-recovery.service.spec.ts src/application/services/contact-binding-verification.service.spec.ts src/application/services/mfa/email-otp-mfa-challenge.service.spec.ts src/application/services/mfa/phone-otp-mfa-challenge.service.spec.ts src/modules/auth/auth.module.spec.ts
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/services/system/notification-service/test/l1/notification-auth-dispatch.handlers.spec.ts src/services/system/notification-service/test/l1/notification-provider-outbox.worker.spec.ts src/services/system/notification-service/test/l2/notification-auth-dispatch.persistence.spec.ts src/services/system/notification-service/test/l3/notification-auth-dispatch.trusted-grpc.spec.ts src/services/system/notification-service/test/l3/notification-auth-dispatch.module-di.spec.ts
```

Acceptance proves both methods have one INTERNAL declaration; only exact Auth SYSTEM MACHINE execution succeeds; body/legacy source authority is absent; the four template profiles and all payload constraints fail closed; idempotency conflict and concurrency do not duplicate dispatch; dispatch/audit/outbox commit atomically; protected payload expires and never enters logs/audit/ordinary dispatch JSON; Auth runtime has no local fallback/effective-code override; the Collaboration Task NATS consumer paths and tests are unchanged; and the implementation diff is a strict subset of these 68 paths.

### 9.4 Terminal Device 17-RPC frozen cutover lease

Status: `FROZEN_PENDING_IMPLEMENTATION`. Terminal Device freezes 17/17 methods as 13 BUSINESS HUMAN WEB and four exact Gateway SYSTEM MACHINE INTERNAL RPCs, all with `aud=urn:oes:service:terminal-device-service` and no DELEGATED mode. The complete method/Code mapping, target-status binding, device credential, field reservations and audit semantics are owned by [terminal-device-service.md](../../architecture/services/terminal-device-service.md) and its five black-box contracts.

The public/sessionless PDA routes are pure MACHINE roots at the internal hop: Gateway reuses its accepted Machine workload source credential and process-local certificate-bound ET producer. This proves the direct Gateway workload only. Terminal Device separately verifies its own random device credential, issued once during enrollment activation, default-valid for 30 days, rotated by heartbeat with seven days remaining and at most five minutes old/new overlap, Keystore-encrypted on PDA and stored only as a server-side hash/state/version. It is not an Auth source credential, Machine Principal, Permission grant or business authorization. Admin calls continue from the request-private verified HUMAN source credential and never reuse the Gateway MACHINE root.

Proto compatibility removes/reserves request tenant/operator/trace/session/server-time/sensitive-projection authority while retaining business targets and diagnostic facts at their current field numbers. Activation adds `device_credential=8`, `device_credential_expires_at=9`, `device_credential_version=10`; Resolve adds `device_credential=9`; Heartbeat adds `device_credential=11` and response rotation fields `5..7`; diagnostic write adds `device_credential=4`. Generated outputs are regenerated from the leased proto and are not hand-edited.

The stable repository consistency contract is owned by [terminal-device-service.md](../../architecture/services/terminal-device-service.md) §8.3: credential rotation CAS and lifecycle/credential/audit atomic commit are declared on `TerminalDeviceRepository`, Prisma and in-memory adapters implement the same semantics, and application-local casts or test-only repository capabilities are prohibited.

```yaml
terminalDeviceTrustedGrpcImplementationLease:
  totalTrackedWriterPaths: 84
  stateCounts: { EXISTING: 75, NEW_TARGET: 9 }
  trackedWriterPaths:
    commonProtoPermissionCode:
      - { state: EXISTING, path: src/common/src/contracts/terminal_device_service/terminal_device.proto }
      - { state: NEW_TARGET, path: src/common/src/contracts/terminal_device_service/terminal_device.contract.spec.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/permission-catalog.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/generate-common-permission-codes.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/sync-permission-codes.ts }
      - { state: EXISTING, path: src/services/system/permission-service/test/l1/common-permission-code-generator.spec.ts }
      - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-foundation.seed.spec.ts }
      - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-service-seed.spec.ts }
      - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-service-seed-validate.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/terminal-device/index.ts }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/terminal-device/management.permission-codes.ts }
      - { state: NEW_TARGET, path: src/common/src/authorization/permission-codes/terminal-device/internal.permission-codes.ts }

    gatewayAdminHumanProducer:
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-terminal-device-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-terminal-device-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/terminal-device-admin-bff/infrastructure/downstream/terminal-device-admin.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/terminal-device-admin-bff/infrastructure/downstream/terminal-device-admin.adapter.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/terminal-device-admin-bff/application/use-cases/terminal-device-admin.use-case.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/terminal-device-admin-bff/application/use-cases/terminal-device-admin.use-case.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/terminal-device-admin-bff/terminal-device-admin-bff.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/terminal-device-admin-bff/interfaces/http/controllers/terminal-device-admin.controller.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/modules/terminal-device-admin-bff/terminal-device-admin.trusted-grpc.spec.ts }

    gatewayPdaMachineProducer:
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-machine-trusted-grpc-execution-producer.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-machine-trusted-grpc-execution-producer.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/pda-bff/infrastructure/downstream/terminal-device-service/pda-terminal-device.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/pda-bff/infrastructure/downstream/terminal-device-service/pda-terminal-device.adapter.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/pda-bff/pda-bff.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/pda-bff/interfaces/http/controllers/pda-device.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/pda-bff/interfaces/http/controllers/pda-session.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-device-enrollment.use-case.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-device-enrollment.use-case.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-device-heartbeat.use-case.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-device-heartbeat.use-case.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-device-logs.use-case.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-device-logs.use-case.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-session-bootstrap.use-case.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-session-bootstrap.use-case.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-managed-device-flow.use-case.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/pda-bff/interfaces/http/view-models/pda-device.view-model.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/terminal-device-service/terminal-device-access.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/terminal-device-service/terminal-device-access.adapter.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/terminal-auth.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/terminal-auth.controller.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/application/use-cases/login.use-case.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/application/use-cases/login.use-case.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/auth-bff.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/auth-bff.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/middleware/request-logger.middleware.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/middleware/request-logger.middleware.spec.ts }

    terminalTrustedRuntime:
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/main.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/modules/terminal-device/terminal-device.module.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/interfaces/grpc/terminal-device.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/interfaces/grpc/terminal-device-grpc.presenter.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/prisma/schema.prisma }
      - { state: NEW_TARGET, path: src/services/system/terminal-device-service/prisma/migrations/202608110001_terminal_device_credential/migration.sql }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/domain/entities/terminal-device.entity.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/domain/repositories/terminal-device.repository.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/domain/repositories/terminal-device-activation.repository.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/application/commands/enrollment/activate-enrollment.command.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/application/commands/device/change-terminal-device-status.command.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/application/services/device-access-decision.service.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/application/commands/runtime/record-heartbeat.command.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/application/commands/runtime/record-diagnostic-logs.command.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/application/services/index.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/common/constants/symbols/repo.symbols.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/domain/errors/terminal-device.error.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/infrastructure/repositories/prisma/prisma-terminal-device.mapper.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/infrastructure/repositories/prisma/prisma-terminal-device-activation.repository.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/infrastructure/repositories/prisma/prisma-terminal-device.repository.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/infrastructure/repositories/in-memory/in-memory-terminal-device-activation.repository.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/infrastructure/repositories/in-memory/in-memory-terminal-device.repository.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/infrastructure/repositories/in-memory/in-memory-terminal-device-store.ts }
      - { state: NEW_TARGET, path: src/services/system/terminal-device-service/src/application/services/terminal-device-credential-verifier.service.ts }
      - { state: NEW_TARGET, path: src/services/system/terminal-device-service/src/application/services/terminal-device-credential-verifier.service.spec.ts }

    terminalSecurityTests:
      - { state: EXISTING, path: src/services/system/terminal-device-service/test/l1/enrollment-commands.spec.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/test/l1/device-governance-task4.spec.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/test/l1/module-and-in-memory-repositories.spec.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/test/l2/prisma-terminal-device.repositories.spec.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/test/l3/terminal-device-grpc-surface.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/terminal-device-service/test/l3/terminal-device-trusted-grpc-security.spec.ts }

  ignoredGeneratedOutputs:
    - { path: src/common/src/generated/terminal_device_service/terminal_device.ts, input: src/common/src/contracts/terminal_device_service/terminal_device.proto, command: "pnpm proto:regen" }
    - { path: src/services/system/terminal-device-service/prisma/generated/prisma/**, input: src/services/system/terminal-device-service/prisma/schema.prisma, command: "pnpm --filter terminal-device-service prisma:generate" }

  protectedByDefault:
    - Redis terminal-device.unavailable publisher/subscriber/event contract and session-cleanup semantics
    - Auth login/session/Terminal Access Policy semantics beyond forwarding the exact device credential to the owner decision
    - WMS, MES, other service cutovers, external API-key, DELEGATED, AI and ActionGrant runtime
    - Common trusted carrier/runtime, deployment, package and lock paths not listed above
    - every unlisted Gateway and Terminal Device path

  focusedAcceptanceCommands:
    - pnpm proto:lint
    - pnpm proto:regen
    - node scripts/architecture/trusted-grpc-signature-inventory.mjs
    - pnpm --filter permission-service permission-codes:generate-common
    - pnpm --filter terminal-device-service prisma:generate
    - pnpm --filter @oes/common build
    - pnpm --filter permission-service build
    - pnpm --filter api-gateway build
    - pnpm --filter terminal-device-service build
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/common/src/contracts/terminal_device_service/terminal_device.contract.spec.ts
    - pnpm --filter permission-service exec jest --config jest.config.js --runInBand test/l1/common-permission-code-generator.spec.ts test/l1/permission-foundation.seed.spec.ts test/l1/permission-service-seed.spec.ts test/l1/permission-service-seed-validate.spec.ts
    - pnpm --filter api-gateway exec jest --runInBand --runTestsByPath src/common/grpc/gateway-terminal-device-grpc.client.spec.ts src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts src/common/grpc/gateway-machine-trusted-grpc-execution-producer.spec.ts src/modules/terminal-device-admin-bff/infrastructure/downstream/terminal-device-admin.adapter.spec.ts src/modules/terminal-device-admin-bff/application/use-cases/terminal-device-admin.use-case.spec.ts src/modules/terminal-device-admin-bff/terminal-device-admin.trusted-grpc.spec.ts
    - pnpm --filter api-gateway exec jest --runInBand --runTestsByPath src/modules/pda-bff/infrastructure/downstream/terminal-device-service/pda-terminal-device.adapter.spec.ts src/modules/pda-bff/application/use-cases/pda-device-enrollment.use-case.spec.ts src/modules/pda-bff/application/use-cases/pda-device-heartbeat.use-case.spec.ts src/modules/pda-bff/application/use-cases/pda-device-logs.use-case.spec.ts src/modules/pda-bff/application/use-cases/pda-session-bootstrap.use-case.spec.ts src/modules/auth-bff/infrastructure/downstream/terminal-device-service/terminal-device-access.adapter.spec.ts src/modules/auth-bff/interfaces/http/controllers/terminal-auth.controller.spec.ts src/modules/auth-bff/application/use-cases/login.use-case.spec.ts src/common/middleware/request-logger.middleware.spec.ts
    - pnpm --filter terminal-device-service exec jest --config jest.config.js --runInBand test/l1/enrollment-commands.spec.ts test/l1/device-governance-task4.spec.ts test/l1/module-and-in-memory-repositories.spec.ts src/application/services/terminal-device-credential-verifier.service.spec.ts test/l2/prisma-terminal-device.repositories.spec.ts test/l3/terminal-device-grpc-surface.spec.ts test/l3/terminal-device-trusted-grpc-security.spec.ts
    - pnpm --filter terminal-device-service exec jest --config jest.config.js --runInBand test/l1/terminal-device-unavailable-event-publisher.spec.ts
```

Acceptance proves 17/17 exact declarations; 13 BUSINESS versus four INTERNAL with no SELF_SERVICE/DELEGATED; Admin HUMAN WEB and Gateway SYSTEM MACHINE cannot cross-call; target audience/workload/`cnf`/Code and status-to-Code binding fail closed; body tenant/operator/session/trace/server-time/sensitive flags have no authority; the five new Codes are exactly `terminal-device.update` plus the four Gateway INTERNAL Codes; enrollment/device credential hash/state/version, one-time return, 30-day maximum, seven-day rotation threshold, five-minute overlap, expiry/suspension/revocation/replay and no-log rules hold; credential-less or mismatched LOGIN/BOOTSTRAP/heartbeat/diagnostic requests fail; sensitive projection/history and mutation audit are enforced; the Redis unavailable path remains unchanged; and the implementation diff is a strict subset of these 84 paths.

Read-only baseline evidence at design freeze: Common root-config, Permission filter-config and Gateway filter Jest command shapes execute successfully. Terminal Device's filter-config entry also executes, and the independent Redis publisher spec passes 1/1; the existing `terminal-device-grpc-surface.spec.ts` baseline currently reports 4 pass / 10 fail because its fixture/controller constructor alignment is stale. That exact existing spec is leased and must be made green by the implementation candidate; the baseline failure does not relax any 17-RPC acceptance assertion or authorize production-code fallback.

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
