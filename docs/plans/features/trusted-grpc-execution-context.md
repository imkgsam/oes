# Trusted gRPC Execution Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Global Command must assign each lane before execution; this packet does not dispatch implementation.

**Goal:** Replace every repository gRPC request-body/operator-header trust path with mTLS workload identity, Auth / STS ExecutionToken, explicit RPC authorization mode and trusted multi-hop propagation.

**Architecture:** Common supplies one generated metadata signature and one client/server runtime. Migration proceeds target service by target service: prepare all callers, switch one target to Token-only enforcement, run service-level acceptance, delete that target’s legacy trust path, then continue. Only an irreducible strongly connected service group may share one server cutover; all 21 services and the current 560-RPC baseline plus five frozen MACHINE Auth RPCs, three frozen Item Master INTERNAL eligibility RPCs, two frozen SRM INTERNAL eligibility RPCs and one frozen Procurement INTERNAL eligibility RPC must reach zero legacy references before the capability closes.

**Tech Stack:** NestJS, gRPC, `ts-proto` / Buf, TypeScript, JWT / JWKS, Prisma, Jest, W3C Trace Context, deployment-managed mTLS.

---

```text
status: DESIGN_FROZEN_IMPLEMENTATION_NOT_DISPATCHED
freezeToken: FROZEN_TRUSTED_GRPC_METADATA
decisionAdr: docs/adr/0015-workload-identity-and-execution-token.md
architectureTruthSource: docs/architecture/14-grpc-metadata-and-service-trust-architecture.md
migrationClosure: 21 services / 51 existing controllers plus the frozen MACHINE Auth, Item Master INTERNAL, SRM INTERNAL and Procurement INTERNAL surfaces / 55 planned controllers / 571 planned RPCs / zero legacy trust references
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
- Current integrated baseline of 21 gRPC services, 51 Controller files and 560 proto RPCs, plus the frozen Auth MACHINE controller/five RPCs, Item Master INTERNAL controller/three RPCs, SRM INTERNAL controller/two RPCs and Procurement INTERNAL controller/one RPC defined by the owner contracts.
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

Overall execution status is `CRM_FROZEN_PENDING_FINAL_IMPLEMENTATION` at design base `5930f94f0576b70fc128625e7b2132165e2335cd`. All 21 target services now have frozen contracts; twenty have complete `A/T/L` evidence and CRM is the sole remaining implementation. Generated explicit metadata signatures prove only the shared call-signature foundation and remain insufficient without each target service's classified contract, prepared callers, Token-only server enforcement and legacy-path removal evidence.

The persistent execution owner is **OES Trusted gRPC Service Migration** (`019ff138-ed1c-7b82-8cd4-865bdb6529bd`). The prior delivery-mode owner `019ff07e-d441-7731-acdb-1a9d262661a9` and approval-stalled predecessor `019fe9f8-5a44-76e1-b5a4-110db9da6d59` are archived with their WIP histories preserved. The former A/C/GRPC lane is historical, migration-frozen evidence and is not the active controller for the remaining cutover.

`C/A/T/L` means `CONTRACT_CLASSIFIED` / `ALL_CALLERS_READY` / `TOKEN_ONLY_SERVER_CUTOVER` / `LEGACY_PATH_REMOVED`:

| Service | RPCs / controllers | C | A | T | L | Proven callers / ordering note |
| --- | ---: | :-: | :-: | :-: | :-: | --- |
| Asset | 5 / 1 | Y | Y | Y | Y | Gateway, Site Media; complete |
| Site | 66 / 2 | Y | Y | Y | Y | Gateway; complete |
| Browser Activity | 13 / 1 | Y | Y | Y | Y | Gateway; implemented and verified at `bf0723472ad0cb430dce99d4547671b216c81ba4` |
| Notification | 2 / 1 | Y | Y | Y | Y | Auth; implemented and verified at `cc253986a86c6b8a063984cbb1874cf00fd20a60` |
| Terminal Device | 17 / 1 | Y | Y | Y | Y | Gateway; implemented and verified at `4667305797a90fe8789067183b8f5ef732ee6f02` |
| Finance | 27 / 2 | Y | Y | Y | Y | Gateway; implemented and verified at `caa7a5c08c0d30792317b328b27a14ef625ef6cc` |
| Public Entry | 23 / 2 | Y | Y | Y | Y | Gateway; implemented and verified at `bda36bffbdc28132872d4bed967adb93c2a92b9e` |
| Sales | 27 / 4 | Y | Y | Y | Y | Gateway; implemented and verified in current main at `584be36794435f8c4688a09197e2f49ee9cf336a` |
| MES | 32 / 4 | Y | Y | Y | Y | Gateway; implemented and verified at `ec1ef2b19f66da2ef0287b887f7d2805534c6764` |
| Collaboration | 16 / 4 | Y | Y | Y | Y | Gateway; implemented and verified at `c8c8a810108ec19f35a527e25ace6cdead433e93` |
| CRM | 15 / 3 | Y | N | N | N | Gateway BUSINESS HUMAN; Collaboration INTERNAL HUMAN_OBO; final frozen slice in §9.16 |
| Procurement | 21+1 / 2+1 planned | Y | Y | Y | Y | Gateway; server implemented and verified at `62b954ea53de051be640ab5506c73cfc33d23259`; WMS INTERNAL caller active through WMS integration `108ca92602b729a9dd1271c88ccdef3f58efe800` |
| SRM | 13+2 / 2+1 planned | Y | Y | Y | Y | Gateway, Procurement; implemented and verified at `84402fc566fee82a5e73cf7a013e7b617e254578` |
| Item Master | 50+3 / 2+1 planned | Y | Y | Y | Y | Gateway, MES, WMS, Procurement, SRM; server accepted at `764f28fba059965a4272752beb6ff0c7acf25d64`; MES/SRM/Procurement/WMS exact HUMAN_OBO actor paths all active after `108ca92602b729a9dd1271c88ccdef3f58efe800` |
| WMS | 15 / 2 | Y | Y | Y | Y | Gateway; implemented and verified at `108ca92602b729a9dd1271c88ccdef3f58efe800` |
| HR | 15 / 2 | Y | Y | Y | Y | atomic foundation group implemented and verified at `09dcb1279d22fa809023a69f2d8cfff090e3826d` |
| Party | 6 / 2 | Y | Y | Y | Y | Gateway, CRM, SRM, HR, Identity, TenantOrg; implemented and verified at `f6caa3aa294b6fb6e7099393afbe0770ee90c09a` |
| TenantOrg | 20 / 2 | Y | Y | Y | Y | atomic foundation group implemented and verified at `09dcb1279d22fa809023a69f2d8cfff090e3826d` |
| Identity | 41 / 3 | Y | Y | Y | Y | atomic foundation group implemented and verified at `09dcb1279d22fa809023a69f2d8cfff090e3826d`; integrated machine surfaces preserved |
| Permission | 66 / 8 | Y | Y | Y | Y | atomic foundation group implemented and verified at `09dcb1279d22fa809023a69f2d8cfff090e3826d`; bootstrap surfaces preserved |
| Auth | 70+5 / 1+1 planned | Y | Y | Y | Y | atomic foundation group implemented and verified at `09dcb1279d22fa809023a69f2d8cfff090e3826d`; MACHINE/OBO foundation preserved |
| **Total / proven state** | **571 / 55 planned** | **21 Y / 0 N** | **20 Y / 1 N** | **20 Y / 1 N** | **20 Y / 1 N** | **all contracts frozen; 20 services complete; CRM implementation remains** |

The frozen order in §6 remains authoritative. Migration continues one target service at a time except for the sole proven Auth/Identity/Permission/HR/TenantOrg strongly connected group in §9.15: its code review and tests remain service-by-service under one writer, while all five Token-only boundaries activate in one candidate. No classified row advances A/T/L before accepted evidence.

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

Status: `IMPLEMENTED_VERIFIED`. Terminal Device trusted gRPC was accepted and integrated at `4667305797a90fe8789067183b8f5ef732ee6f02`, using 61 of the 84 leased paths with all final gates passing. The frozen design covers 17/17 methods as 13 BUSINESS HUMAN WEB and four exact Gateway SYSTEM MACHINE INTERNAL RPCs, all with `aud=urn:oes:service:terminal-device-service` and no DELEGATED mode. The complete method/Code mapping, target-status binding, device credential, field reservations and audit semantics are owned by [terminal-device-service.md](../../architecture/services/terminal-device-service.md) and its five black-box contracts.

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
    - pnpm --filter terminal-device-service exec jest --config jest.config.js --runInBand test/l1/enrollment-commands.spec.ts test/l1/device-governance-task4.spec.ts test/l1/module-and-in-memory-repositories.spec.ts test/l2/prisma-terminal-device.repositories.spec.ts test/l3/terminal-device-grpc-surface.spec.ts test/l3/terminal-device-trusted-grpc-security.spec.ts
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/services/system/terminal-device-service/src/application/services/terminal-device-credential-verifier.service.spec.ts
    - pnpm --filter terminal-device-service exec jest --config jest.config.js --runInBand test/l1/terminal-device-unavailable-event-publisher.spec.ts
```

Acceptance proves 17/17 exact declarations; 13 BUSINESS versus four INTERNAL with no SELF_SERVICE/DELEGATED; Admin HUMAN WEB and Gateway SYSTEM MACHINE cannot cross-call; target audience/workload/`cnf`/Code and status-to-Code binding fail closed; body tenant/operator/session/trace/server-time/sensitive flags have no authority; the five new Codes are exactly `terminal-device.update` plus the four Gateway INTERNAL Codes; enrollment/device credential hash/state/version, one-time return, 30-day maximum, seven-day rotation threshold, five-minute overlap, expiry/suspension/revocation/replay and no-log rules hold; credential-less or mismatched LOGIN/BOOTSTRAP/heartbeat/diagnostic requests fail; sensitive projection/history and mutation audit are enforced; the Redis unavailable path remains unchanged; and the implementation diff is a strict subset of these 84 paths.

Historical design-freeze evidence recorded Common root-config, Permission filter-config and Gateway filter Jest command success, independent Redis publisher 1/1, and a stale `terminal-device-grpc-surface.spec.ts` fixture/controller baseline of 4 pass / 10 fail. Final acceptance at `4667305797a90fe8789067183b8f5ef732ee6f02` closed that baseline gap and passed all final gates; the historical limitation never relaxed any 17-RPC acceptance assertion or authorized production-code fallback.

### 9.5 Finance 27-RPC frozen cutover lease

Status: `IMPLEMENTED_VERIFIED`. Finance trusted gRPC was accepted and integrated at `caa7a5c08c0d30792317b328b27a14ef625ef6cc`, using 20 of the 30 leased paths. Final acceptance proved 27/27 exact BUSINESS HUMAN WEB declarations, Token-only Finance server enforcement, removal of legacy body/ordinary-metadata authority, Gateway caller cutover, exact wire reservations and canonical Codes, shared fail-closed Finance DI through both controller-owning feature modules, and successful proto/inventory, Common/Gateway/Finance builds, focused tests, root gates and real `AppModule` compile. The 30-path manifest remains historical closed-lease evidence.

All 27 RPCs are `BUSINESS / HUMAN / WEB`, require `aud=urn:oes:service:finance-service`, exact mTLS/`cnf` binding and `all [exactCode]`, and reject MACHINE, DELEGATED, SELF_SERVICE and non-WEB sessions:

| RPC | Exact existing Code |
| --- | --- |
| `GetFinancialAccount` | `finance.financial_account.get_by_id` |
| `SearchFinancialAccounts` | `finance.financial_account.list` |
| `SearchAccountTransactions` | `finance.account_transaction.list` |
| `GetExchangeRate` | `finance.exchange_rate.get` |
| `CreateFinancialAccount` | `finance.financial_account.create` |
| `UpdateFinancialAccountBasics` | `finance.financial_account.update_basics` |
| `ImportAccountTransactions` | `finance.account_transaction.import` |
| `RecordAccountTransaction` | `finance.account_transaction.record` |
| `RegisterCustomerFinancialAccount` | `finance.customer_financial_account.register` |
| `SetExchangeRate` | `finance.exchange_rate.set` |
| `GetReceivableSchedule` | `finance.receivable_schedule.get_by_id` |
| `SearchReceivableSchedules` | `finance.receivable_schedule.list` |
| `GetFinanceReleaseSignal` | `finance.finance_release_signal.get` |
| `CreateReceivableScheduleFromSalesOrder` | `finance.receivable_schedule.create_from_sales_order` |
| `SetFinanceReleaseSignal` | `finance.finance_release_signal.set` |
| `GetPayableSchedule` | `finance.payable.read` |
| `SearchPayableSchedules` | `finance.payable.read` |
| `SearchPaymentRequests` | `finance.payable.read` |
| `SearchPaymentExecutions` | `finance.payable.read` |
| `SearchPaymentAllocations` | `finance.payment_allocation.list` |
| `CreatePayableScheduleFromPurchaseOrder` | `finance.payable.create_from_purchase_order` |
| `ApplyPayableScheduleAdjustmentFromPurchaseOrderChange` | `finance.payable.adjust_from_purchase_order_change` |
| `CreatePaymentRequest` | `finance.payment_request.create` |
| `DecidePaymentRequest` | `finance.payment_request.decide` |
| `ExecutePaymentRequest` | `finance.payment_execution.create` |
| `AllocatePaymentToPayable` | `finance.payment_allocation.create` |
| `AllocatePaymentToReceivable` | `finance.payment_allocation.allocate_to_receivable` |

The existing canonical catalog already owns every Code above, so no Permission writer path is leased. Proto removes/reserves the exact request authority fields frozen in [Finance contract](../../contracts/finance-service/README.md) §6.1: 96 tenant/operator/trace/audit fields, 11 request `org_id` fields and two caller-identity duplicates (`imported_by=9`, `set_by=9`). Six Finance-owned projection `tenant_id` fields remain unchanged. Tenant, org scope, operator, trace, request and audit identity are derived from trusted execution context; body, ordinary metadata and signed-operator fallback are forbidden.

The current 27 RPC business payloads, rules, errors, audit, idempotency, transactions and persistence remain unchanged. Existing RPCs do not gain a second INTERNAL mode. Sales/Procurement synchronous integration, order lifecycle events, new INTERNAL Codes/RPCs, event catalog, consumer, outbox and inbox are explicitly deferred to separate future design and implementation packets.

```yaml
financeTrustedGrpcImplementationLease:
  totalTrackedWriterPaths: 30
  stateCounts: { EXISTING: 25, NEW_TARGET: 5 }
  trackedWriterPaths:
    financeProtoContract:
      - { state: EXISTING, path: src/common/src/contracts/finance_service/finance.proto }
      - { state: NEW_TARGET, path: src/common/src/contracts/finance_service/finance.contract.spec.ts }

    gatewayFinanceHumanProducer:
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/index.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-finance-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-finance-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/finance-service/adapters/finance-grpc-context.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/finance-service/adapters/finance-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/finance-service/adapters/finance-management-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/finance-service/finance-service.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/finance-service/finance.service.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/finance-service/finance.service.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/finance-service/interface/http/controllers/finance.controller.spec.ts }

    financeTrustedRuntime:
      - { state: EXISTING, path: src/services/business/finance-service/src/main.ts }
      - { state: EXISTING, path: src/services/business/finance-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/business/finance-service/src/interfaces/grpc/finance-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/finance-service/src/interfaces/grpc/finance-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/finance-service/src/interfaces/grpc/finance-rpc-context.validator.ts }
      - { state: EXISTING, path: src/services/business/finance-service/src/modules/finance-management.module.ts }
      - { state: EXISTING, path: src/services/business/finance-service/src/modules/finance-query.module.ts }
      - { state: NEW_TARGET, path: src/services/business/finance-service/src/modules/finance-trusted-execution.module.ts }

    financeSecurityTests:
      - { state: EXISTING, path: src/services/business/finance-service/test/l3/finance-grpc-context.spec.ts }
      - { state: EXISTING, path: src/services/business/finance-service/test/l3/finance-cqrs-validation.spec.ts }
      - { state: EXISTING, path: src/services/business/finance-service/test/l3/finance-payables-cqrs-validation.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/finance-service/test/l3/finance-trusted-grpc-security.spec.ts }

  ignoredGeneratedOutputs:
    - path: src/common/src/generated/finance_service/finance.ts
      input: src/common/src/contracts/finance_service/finance.proto
      command: pnpm proto:regen

  protectedByDefault:
    - canonical Permission catalog/generator and generated Permission Code files
    - Sales, Procurement and every other service caller, contract, proto, runtime and cutover
    - Finance application/domain/persistence/schema/business-rule paths not listed above
    - event catalog, consumer, outbox, inbox, package, lock, deployment, AI and ActionGrant paths
    - Common trusted runtime and every unlisted Gateway or Finance path

  focusedAcceptanceCommands:
    - pnpm proto:lint
    - pnpm proto:regen
    - node scripts/architecture/trusted-grpc-signature-inventory.mjs
    - pnpm --filter @oes/common build
    - pnpm --filter api-gateway build
    - pnpm --filter finance-service build
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/common/src/contracts/finance_service/finance.contract.spec.ts
    - pnpm --filter api-gateway exec jest --runInBand --runTestsByPath src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts src/common/grpc/gateway-finance-grpc.client.spec.ts src/modules/finance-service/finance.service.spec.ts src/modules/finance-service/interface/http/controllers/finance.controller.spec.ts
    - pnpm --filter finance-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l3/finance-grpc-context.spec.ts test/l3/finance-cqrs-validation.spec.ts test/l3/finance-payables-cqrs-validation.spec.ts test/l3/finance-trusted-grpc-security.spec.ts
```

Acceptance proves 27/27 exact BUSINESS declarations and zero unclassified/duplicate methods; Gateway exchanges current HUMAN WEB source credential for the Finance audience and never places AT/ET in DTO/body/ordinary metadata; Finance rejects missing/wrong issuer, time, audience, `cnf`, tenant, principal type, terminal and Code before controller data; both controller-owning feature modules import the shared Finance trusted-execution module so the Guard/verifier/workload provider fail closed through Nest DI; all removed body authority and caller identity fields are reserved while the six service-owned tenant projections remain; all existing Finance behavior tests remain green; no direct non-Gateway or pure MACHINE caller appears in fresh inventory; and the implementation diff is a strict subset of these 30 paths.

### 9.6 Public Entry 23-RPC frozen cutover lease

Status: `IMPLEMENTED_VERIFIED`. Public Entry trusted gRPC was accepted and integrated at `bda36bffbdc28132872d4bed967adb93c2a92b9e`; the implementation preserved the exact 23-RPC contract and remains within the frozen 52-path lease. This slice adds no Public Entry business capability, Permission Code, database object, outbound-service cutover or anonymous no-Token gRPC mode.

The exact matrix is frozen in [Public Entry contracts](../../contracts/public-entry-service/README.md) §3: 19 admin RPCs are `BUSINESS / HUMAN / WEB`, `GetOwnBusinessCardPreview` is `SELF_SERVICE / HUMAN / WEB` with an empty Code set and `allowDelegated=false`, and `ResolvePublicRedirect`, `RenderPublicBusinessCard` and `GenerateBusinessCardVCard` are narrow `BUSINESS / SYSTEM MACHINE` calls from the exact Gateway workload. The public calls use only the existing read Codes (`public-entry.short-link.read` and `public-entry.business-card.read`) with `aud=urn:oes:service:public-entry-service`; SYSTEM is not a tenant wildcard and Public Entry derives tenant/resource facts from its own records. `ChangeShortLinkStatus` keeps its existing three-Code status binding and validates the target status before mutation. The 41 request authority fields and `OperatorContext` tombstone reservations in the contract are deleted from supported wire input; observation fields remain bounded telemetry payload. All legacy body, ordinary-metadata and signed-operator fallback is rejected. HR, Identity, Permission and TenantOrg outbound edges stay on their current contracts and migrate only with those target services.

The three anonymous HTTP routes have no HUMAN ET. Gateway reuses the existing MACHINE source-credential and mTLS channel, and the existing machine producer/provider gains a BUSINESS metadata-producing entry point for the two existing public read Codes; this is caller plumbing for the already frozen `BUSINESS` declaration, not a new authorization mode or credential profile. Admin and self-view HTTP fixtures use authenticated Gateway routes; public render, vCard and redirect fixtures use anonymous Gateway routes. The historical raw gRPC live-smoke script is converted to those HTTP paths, while controller/security tests retain direct internal assertions.

```yaml
publicEntryTrustedGrpcImplementationLease:
  totalTrackedWriterPaths: 52
  stateCounts: { EXISTING: 45, NEW_TARGET: 7 }
  trackedWriterPaths:
    publicEntryProtoContract:
      - { state: EXISTING, path: src/common/src/contracts/public_entry_service/public_entry.proto }
      - { state: NEW_TARGET, path: src/common/src/contracts/public_entry_service/public_entry.contract.spec.ts }

    gatewayPublicEntryHumanAndMachineProducer:
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-machine-trusted-grpc-execution-producer.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-machine-trusted-grpc-execution-producer.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-downstream-source.mapper.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/decorators/downstream-source.decorator.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/index.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.spec.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-public-entry-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-public-entry-grpc.client.spec.ts }

    gatewayPublicEntryAdaptersAndHttp:
      - { state: EXISTING, path: src/services/api-gateway/src/modules/public-entry-service/public-entry-service.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/public-entry-service/adapters/public-entry-short-link-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/public-entry-service/adapters/public-entry-business-card-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/public-entry-service/public-entry-short-link.service.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/public-entry-service/public-entry-short-link.service.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/public-entry-service/public-entry-business-card.service.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/public-entry-service/public-entry-business-card.service.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/public-entry-service/interface/http/controllers/public-entry-short-link.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/public-entry-service/interface/http/controllers/public-entry-short-link.controller.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/public-entry-service/interface/http/controllers/public-entry-business-card.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/public-entry-service/interface/http/controllers/public-entry-business-card.controller.spec.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/modules/public-entry-service/interface/http/controllers/public-entry.integration.spec.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/modules/public-entry-service/adapters/public-entry-dedicated-client.spec.ts }

    publicEntryTrustedRuntime:
      - { state: EXISTING, path: src/services/system/public-entry-service/src/main.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/src/modules/short-link/short-link.module.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/src/modules/business-card/business-card.module.ts }
      - { state: NEW_TARGET, path: src/services/system/public-entry-service/src/modules/public-entry-trusted-execution.module.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/src/interfaces/grpc/public-entry-short-link.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/src/interfaces/grpc/public-entry-business-card.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/src/application/services/short-link-application.service.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/src/application/services/public-redirect.service.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/src/application/services/business-card-application.service.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/src/application/ports/business-card.ports.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/src/infrastructure/adapters/permission-business-card-authorization.adapter.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/src/domain/types/short-link.types.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/src/domain/types/business-card.types.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/test/l1/business-card.module.spec.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/test/l1/business-card-permission.adapter.spec.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/test/l3/short-link.grpc.controller.spec.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/test/l3/business-card.grpc.controller.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/public-entry-service/test/l3/public-entry-trusted-grpc-security.spec.ts }

    publicEntrySecurityAndSmokeTests:
      - { state: EXISTING, path: src/services/system/public-entry-service/scripts/business-card-live-smoke.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/test/l1/business-card-live-smoke.spec.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/test/live/business-card-live-smoke.live.spec.ts }
      - { state: EXISTING, path: scripts/local/business-card-live-fixtures.mjs }
      - { state: EXISTING, path: scripts/local/business-card-live-fixtures.spec.mjs }

  ignoredGeneratedOutputs:
    - path: src/common/src/generated/public_entry_service/public_entry.ts
      input: src/common/src/contracts/public_entry_service/public_entry.proto
      command: pnpm proto:regen

  protectedByDefault:
    - canonical Permission catalog/generator and generated Permission Code files
    - Auth source profiles, STS issuance, ExecutionToken wire fields and all Common trusted runtime paths not listed above
    - HR, Identity, Permission and TenantOrg contracts, callers and runtime; their outbound cutovers remain separate service slices
    - Public Entry Prisma schema/migrations, repositories and business-rule/domain paths not listed above
    - package, lock, deployment, provider-secret, event-bus, AI and ActionGrant paths
    - every non-Public Entry Gateway adapter and every other service cutover

  focusedAcceptanceCommands:
    - pnpm proto:lint
    - pnpm proto:regen
    - node scripts/architecture/trusted-grpc-signature-inventory.mjs
    - pnpm --filter @oes/common build
    - pnpm --filter api-gateway build
    - pnpm --filter public-entry-service build
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/common/src/contracts/public_entry_service/public_entry.contract.spec.ts
    - pnpm --filter api-gateway exec jest --runInBand --runTestsByPath src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts src/common/grpc/gateway-machine-trusted-grpc-execution-producer.spec.ts src/common/grpc/gateway-public-entry-grpc.client.spec.ts src/modules/public-entry-service/public-entry-short-link.service.spec.ts src/modules/public-entry-service/public-entry-business-card.service.spec.ts src/modules/public-entry-service/interface/http/controllers/public-entry-short-link.controller.spec.ts src/modules/public-entry-service/interface/http/controllers/public-entry-business-card.controller.spec.ts src/modules/public-entry-service/interface/http/controllers/public-entry.integration.spec.ts
    - pnpm --filter public-entry-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l1/business-card.module.spec.ts test/l1/business-card-permission.adapter.spec.ts test/l3/short-link.grpc.controller.spec.ts test/l3/business-card.grpc.controller.spec.ts test/l3/public-entry-trusted-grpc-security.spec.ts test/l1/business-card-live-smoke.spec.ts
    - node --test scripts/local/business-card-live-fixtures.spec.mjs
```

Acceptance proves all 23 RPCs have exactly one declaration and no dual-mode method; the 19 HUMAN WEB, one SELF_SERVICE HUMAN WEB and three exact Gateway SYSTEM MACHINE calls reject wrong audience, `cnf`, principal, session terminal, Code, body authority and legacy metadata; the 41 field reservations and 12 canonical Codes remain unchanged; `GetOwnBusinessCardPreview` is bound to the verified subject; anonymous public lookups enforce owner-owned status/expiry/readiness/public-safe facts without a tenant wildcard; duplicate BusinessCard runtime Permission checks are retired after ET admission while local tenant/resource/domain/audit checks remain; all current Gateway/admin/self/public fixtures use the corresponding HTTP or trusted gRPC path; the raw unauthenticated live-gRPC caller is gone; outbound target-service contracts remain untouched; and the implementation diff is a strict subset of these 51 paths.

### 9.7 Sales 27-RPC frozen cutover lease

Status: `IMPLEMENTED_VERIFIED`. The Sales trusted-gRPC slice is present in current main at `584be36794435f8c4688a09197e2f49ee9cf336a`; the implementation and its focused security corrections preserve the exact 27-RPC contract and remain a strict subset of the frozen 42-path lease. This slice adds no Sales business capability, Permission Code, database object, cross-service RPC, event or outbound-service cutover.

All 27 RPCs are `BUSINESS / HUMAN / WEB`, require `aud=urn:oes:service:sales-service`, exact mTLS/`cnf` binding and `all [exactCode]`, and reject MACHINE, DELEGATED, SELF_SERVICE and non-WEB sessions:

| RPC | Exact existing Code |
| --- | --- |
| `GetQuote` | `sales.quote.get_by_id` |
| `SearchQuotes` | `sales.quote.list` |
| `GetQuoteVersion` | `sales.quote.get_by_id` |
| `ListQuoteVersions` | `sales.quote.get_by_id` |
| `GetSalesOrder` | `sales.order.get_by_id` |
| `SearchSalesOrders` | `sales.order.list` |
| `CreateQuote` | `sales.quote.create` |
| `UpdateQuoteDraft` | `sales.quote.update_draft` |
| `PublishQuote` | `sales.quote.publish` |
| `ConvertQuoteVersionToOrder` | `sales.quote.convert_to_order` |
| `SetOrderCommercialGate` | `sales.order.set_commercial_gate` |
| `SubmitFulfillmentHandoff` | `sales.order.submit_fulfillment_handoff` |
| `SearchPriceLists` | `sales.pricing.price_list.read` |
| `GetPriceList` | `sales.pricing.price_list.read` |
| `GetPriceListLines` | `sales.pricing.price_list.read` |
| `GetActiveCustomerPriceAgreement` | `sales.pricing.customer_agreement.read` |
| `GetCustomerPriceAgreement` | `sales.pricing.customer_agreement.read` |
| `ListCustomerPriceAgreementVersions` | `sales.pricing.customer_agreement.read` |
| `PreviewQuoteLinePricing` | `sales.pricing.preview_quote_line` |
| `CreatePriceList` | `sales.pricing.price_list.manage` |
| `UpdatePriceList` | `sales.pricing.price_list.manage` |
| `ReplacePriceListLines` | `sales.pricing.price_list.manage` |
| `ChangePriceListStatus` | `sales.pricing.price_list.manage` |
| `CreateCustomerPriceAgreement` | `sales.pricing.customer_agreement.manage` |
| `UpdateCustomerPriceAgreementDraft` | `sales.pricing.customer_agreement.manage` |
| `PublishCustomerPriceAgreementVersion` | `sales.pricing.customer_agreement.manage` |
| `CreateCustomerPriceAgreementFromSalesOrderLine` | `sales.pricing.customer_agreement.manage` |

The canonical catalog already owns all 15 Codes. Proto removes and reserves 95 request authority fields: `tenant_id=1`, `operator_context=2`, `trace_context=3` on all 27 requests and `audit_context=4` on all 14 management requests. The eight nested compatibility fields of `OperatorContext`, `TraceContext` and `AuditContext` are also tombstoned. The 14 optional business `reason` fields use the exact next field numbers frozen in [Sales contracts](../../contracts/sales-service/README.md) §5.3. Sales-owned response projections and every other business field remain unchanged. Gateway exchanges its current HUMAN WEB source credential for the Sales audience; no AT/ET appears in DTO/body/ordinary metadata, and Sales derives tenant/org/operator/request/trace/audit authority only from trusted context.

The historical `src/services/business/sales-service/scripts/sales-smoke.mjs` raw gRPC test caller is deleted together with its package command, rather than adapted into a MACHINE caller. Future automated Sales collaboration is recorded but not opened: verified needs such as a narrow Finance/MES fact read must return for a separately classified INTERNAL RPC design, while order/handoff fact propagation should return for an event contract design. Existing HUMAN methods never become dual-mode, and Sales→CRM/Party/Item/WMS/MES/Finance outbound and event paths remain protected in this slice.

```yaml
salesTrustedGrpcImplementationLease:
  totalTrackedWriterPaths: 42
  stateCounts: { EXISTING: 36, NEW_TARGET: 6 }
  trackedWriterPaths:
    salesProtoContract:
      - { state: EXISTING, path: src/common/src/contracts/sales_service/sales.proto }
      - { state: NEW_TARGET, path: src/common/src/contracts/sales_service/sales.contract.spec.ts }

    gatewaySalesHumanProducer:
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/index.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-sales-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-sales-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.spec.ts }

    gatewaySalesAdaptersAndHttp:
      - { state: EXISTING, path: src/services/api-gateway/src/modules/sales-service/sales-service.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/sales-service/adapters/sales-grpc-context.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/sales-service/adapters/sales-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/sales-service/adapters/sales-management-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/sales-service/adapters/pricing-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/sales-service/adapters/pricing-management-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/sales-service/sales.service.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/sales-service/sales.service.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/sales-service/interface/http/controllers/sales.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/sales-service/interface/http/controllers/sales.controller.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/sales-service/interface/http/dtos/sales.dto.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/modules/sales-service/adapters/sales-dedicated-client.spec.ts }

    salesTrustedRuntime:
      - { state: EXISTING, path: src/services/business/sales-service/src/main.ts }
      - { state: EXISTING, path: src/services/business/sales-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/business/sales-service/src/interfaces/grpc/sales-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/sales-service/src/interfaces/grpc/sales-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/sales-service/src/interfaces/grpc/pricing-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/sales-service/src/interfaces/grpc/pricing-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/sales-service/src/interfaces/grpc/sales-rpc-context.validator.ts }
      - { state: EXISTING, path: src/services/business/sales-service/src/modules/sales-query.module.ts }
      - { state: EXISTING, path: src/services/business/sales-service/src/modules/sales-management.module.ts }
      - { state: EXISTING, path: src/services/business/sales-service/src/modules/pricing-query.module.ts }
      - { state: EXISTING, path: src/services/business/sales-service/src/modules/pricing-management.module.ts }
      - { state: NEW_TARGET, path: src/services/business/sales-service/src/modules/sales-trusted-execution.module.ts }

    salesSecurityAndLegacyRemoval:
      - { state: EXISTING, path: src/services/business/sales-service/src/application/services/sales-audit.service.ts }
      - { state: EXISTING, path: src/services/business/sales-service/src/application/support/sales-assertions.ts }
      - { state: EXISTING, path: src/services/business/sales-service/package.json }
      - { state: EXISTING, path: src/services/business/sales-service/scripts/sales-smoke.mjs }
      - { state: EXISTING, path: src/services/business/sales-service/test/l3/sales-grpc-context.spec.ts }
      - { state: EXISTING, path: src/services/business/sales-service/test/l3/sales-pricing-grpc-surface.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/sales-service/test/l3/sales-trusted-grpc-security.spec.ts }

  ignoredGeneratedOutputs:
    - path: src/common/src/generated/sales_service/sales.ts
      input: src/common/src/contracts/sales_service/sales.proto
      command: pnpm proto:regen

  protectedByDefault:
    - canonical Permission catalog/generator and generated Permission Code files
    - Sales application/domain/persistence/schema/business-rule paths not listed above
    - CRM, Party, Item, WMS, MES, Finance and fulfillment contracts, callers, runtime and cutovers
    - event catalog, producer, consumer, outbox, inbox and every candidate INTERNAL RPC
    - Common trusted runtime paths not listed above, package/lock/deployment, AI and ActionGrant paths
    - every non-Sales Gateway adapter and every other service cutover

  focusedAcceptanceCommands:
    - pnpm proto:lint
    - pnpm proto:regen
    - node scripts/architecture/trusted-grpc-signature-inventory.mjs
    - pnpm --filter @oes/common build
    - pnpm --filter api-gateway build
    - pnpm --filter sales-service build
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/common/src/contracts/sales_service/sales.contract.spec.ts
    - pnpm --filter api-gateway exec jest --runInBand --runTestsByPath src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts src/common/grpc/gateway-sales-grpc.client.spec.ts src/modules/sales-service/adapters/sales-dedicated-client.spec.ts src/modules/sales-service/sales.service.spec.ts src/modules/sales-service/interface/http/controllers/sales.controller.spec.ts
    - pnpm --filter sales-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l3/sales-grpc-context.spec.ts test/l3/sales-pricing-grpc-surface.spec.ts test/l3/sales-trusted-grpc-security.spec.ts
```

Acceptance proves 27/27 exact BUSINESS declarations and zero unclassified or dual-mode methods; Gateway and Sales reject wrong issuer/time/audience/`cnf`/tenant/principal/terminal/Code before controller data; all 95 request authority fields and eight nested tombstone fields are removed/reserved while 14 bounded business reasons and Sales-owned projections remain; trusted audit identity/source cannot be overridden by reason; all four Gateway adapters resolve the dedicated Sales mTLS client and legacy body/ordinary-metadata/fallback context is absent; the raw smoke script and package command are absent; all 15 Codes remain canonical and unchanged; no pure MACHINE caller or current INTERNAL surface appears; outbound/event paths are untouched; and the implementation diff is a strict subset of these 42 paths.

### 9.8 MES 32-RPC frozen cutover lease

Status: `IMPLEMENTED_VERIFIED`. MES trusted gRPC was accepted and integrated at `ec1ef2b19f66da2ef0287b887f7d2805534c6764`, using 28 of the 39 frozen writer paths. Final acceptance proved 32/32 BUSINESS HUMAN WEB declarations, exact Code and tenant-scope enforcement, Token-only mTLS transport, removal of legacy body/ordinary-metadata authority and the raw smoke caller, and the focused proto, inventory, Common/Gateway/MES build and security gates. The repository L2 command remained environment-limited because `DATABASE_URL` was unavailable; this is preserved as a literal verification limitation and is not represented as an L2 pass. The implementation adds no MES business capability, Permission Code, database object, cross-service RPC, event, PDA/device mode or outbound-service cutover.

All 32 RPCs are `BUSINESS / HUMAN / WEB`, require `aud=urn:oes:service:mes-service`, exact mTLS/`cnf` binding and `all [exactCode]`, and reject MACHINE, DELEGATED, SELF_SERVICE and non-WEB sessions:

| RPC | Exact existing Code |
| --- | --- |
| `CreateProductionSpec` | `mes.production_spec.manage` |
| `UpdateProductionSpec` | `mes.production_spec.manage` |
| `ActivateProductionSpec` | `mes.production_spec.manage` |
| `RetireProductionSpec` | `mes.production_spec.manage` |
| `GetProductionSpec` | `mes.production_spec.read` |
| `ListProductionSpecs` | `mes.production_spec.read` |
| `ResolveProductionSpecsForMold` | `mes.production_spec.read` |
| `RegisterMoldDesign` | `mes.mold_design.manage` |
| `RegisterMasterMold` | `mes.production_mold.manage` |
| `RegisterProductionMold` | `mes.production_mold.manage` |
| `ConfirmProductionMoldArrival` | `mes.production_mold.manage` |
| `AcceptProductionMold` | `mes.production_mold.manage` |
| `MoveTooling` | `mes.tooling_installation.manage` |
| `InstallTooling` | `mes.tooling_installation.manage` |
| `UnmountTooling` | `mes.tooling_installation.manage` |
| `ConfirmInstalledMoldReady` | `mes.tooling_installation.manage` |
| `MarkInstalledMoldMaintenance` | `mes.tooling_installation.manage` |
| `RecordMoldUsage` | `mes.mold_usage.record` |
| `RecordMoldUsageBatch` | `mes.mold_usage.record` |
| `AdjustMoldLifeCounter` | `mes.mold_life.manage` |
| `MarkProductionMoldForScrap` | `mes.production_mold.manage` |
| `GetMoldDesign` | `mes.mold_design.read` |
| `ListMoldDesigns` | `mes.mold_design.read` |
| `GetMasterMold` | `mes.production_mold.read` |
| `ListMasterMolds` | `mes.production_mold.read` |
| `GetProductionMold` | `mes.production_mold.read` |
| `ListProductionMolds` | `mes.production_mold.read` |
| `ListProductionMoldsByDesign` | `mes.production_mold.read` |
| `GetToolingCurrentPlacement` | `mes.tooling_installation.read` |
| `GetMoldUsageHistory` | `mes.production_mold.read` |
| `ListCurrentMoldsByWorkCenter` | `mes.tooling_installation.read` |
| `ListMoldLifeCounters` | `mes.production_mold.read` |

The canonical catalog already owns all ten Codes. `ListMoldLifeCounters` is corrected to `mes.production_mold.read`; `mes.mold_life.manage` remains exclusive to `AdjustMoldLifeCounter`, and master-mold methods reuse the production-mold Code family. Proto deletes and reserves 148 request fields: `tenant_id=1`, `org_id=2`, `operator_context=3` and `trace_context=4` on all 32 requests, `audit_context=5` on all 18 management requests, plus `RecordMoldUsageRequest.capture_source=18` and `RecordMoldUsageBatchRequest.capture_source=11`. The eight nested compatibility fields of `OperatorContext`, `TraceContext` and `AuditContext` are also tombstoned. Existing `command_id=6`, `MoveToolingRequest.movement_reason=11` and `MarkInstalledMoldMaintenanceRequest.reason=9` remain business payload; the other 16 management reasons use the exact next field numbers and bounded rules frozen in [MES contracts](../../contracts/mes-service/README.md#wire-compatibility-and-business-reason). MES derives capture source from verified `session_terminal`; this slice accepts only WEB.

The live raw-gRPC `mes-smoke.mjs` and package `smoke` command are deleted rather than reclassified as MACHINE. `mes-smoke-lib.mjs` and `mes-smoke.spec.mjs` remain isolated business/idempotency/outbox tests. Future live smoke must enter Gateway HTTP with a test HUMAN session. Future HUMAN PDA, device/worker automation, Planning/WMS/Quality/Site integration and event surfaces require separate packets; existing methods never gain a second execution mode. MES→Item Master outbound behavior, its adapter, every other outbound/event path, schema and business state machine remain protected.

```yaml
mesTrustedGrpcImplementationLease:
  totalTrackedWriterPaths: 39
  stateCounts: { EXISTING: 33, NEW_TARGET: 6 }
  trackedWriterPaths:
    mesProtoContract:
      - { state: EXISTING, path: src/common/src/contracts/mes_service/mes.proto }
      - { state: NEW_TARGET, path: src/common/src/contracts/mes_service/mes.contract.spec.ts }

    gatewayMesHumanProducer:
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/index.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-mes-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-mes-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.spec.ts }

    gatewayMesAdaptersAndHttp:
      - { state: EXISTING, path: src/services/api-gateway/src/modules/mes-service/mes-service.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/mes-service/adapters/mes-grpc-context.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/mes-service/adapters/mes-management-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/mes-service/adapters/mes-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/mes-service/mes.service.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/mes-service/mes.service.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/mes-service/interface/http/controllers/mes.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/mes-service/interface/http/controllers/mes.controller.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/mes-service/interface/http/dtos/mes.dto.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/mes-service/interface/http/dtos/mes.dto.spec.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/modules/mes-service/adapters/mes-dedicated-client.spec.ts }

    mesTrustedRuntime:
      - { state: EXISTING, path: src/services/business/mes-service/src/main.ts }
      - { state: EXISTING, path: src/services/business/mes-service/src/interfaces/grpc/production-spec-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/mes-service/src/interfaces/grpc/production-spec-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/mes-service/src/interfaces/grpc/mes-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/mes-service/src/interfaces/grpc/mes-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/mes-service/src/interfaces/grpc/mes-rpc-context.validator.ts }
      - { state: EXISTING, path: src/services/business/mes-service/src/modules/mes-management.module.ts }
      - { state: EXISTING, path: src/services/business/mes-service/src/modules/mes-query.module.ts }
      - { state: NEW_TARGET, path: src/services/business/mes-service/src/modules/mes-trusted-execution.module.ts }

    mesSecurityAndLegacySmoke:
      - { state: EXISTING, path: src/services/business/mes-service/package.json }
      - { state: EXISTING, path: src/services/business/mes-service/scripts/mes-smoke.mjs }
      - { state: EXISTING, path: src/services/business/mes-service/scripts/mes-smoke-lib.mjs }
      - { state: EXISTING, path: src/services/business/mes-service/scripts/mes-smoke.spec.mjs }
      - { state: EXISTING, path: src/services/business/mes-service/test/l3/mes-grpc-context.spec.ts }
      - { state: EXISTING, path: src/services/business/mes-service/test/l3/mes-grpc-surface.spec.ts }
      - { state: EXISTING, path: src/services/business/mes-service/test/l3/production-spec-grpc-surface.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/mes-service/test/l3/mes-trusted-grpc-security.spec.ts }

  ignoredGeneratedOutputs:
    - path: src/common/src/generated/mes_service/mes.ts
      input: src/common/src/contracts/mes_service/mes.proto
      command: pnpm proto:regen

  protectedByDefault:
    - canonical Permission catalog/generator and generated Permission Code files
    - MES application/domain/persistence/schema/business-rule paths not listed above
    - MES outbound Item Master adapter/caller semantics and Item Master contracts/runtime/cutover
    - Planning, WMS, Quality, Site, PDA/device automation and every candidate INTERNAL RPC
    - event catalog, producer, consumer, outbox and inbox semantics
    - Common trusted runtime paths not listed above, package/lock/deployment, AI and ActionGrant paths
    - every non-MES Gateway adapter and every other service cutover

  focusedAcceptanceCommands:
    - pnpm proto:lint
    - pnpm proto:regen
    - node scripts/architecture/trusted-grpc-signature-inventory.mjs
    - pnpm --filter @oes/common build
    - pnpm --filter api-gateway build
    - pnpm --filter mes-service build
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/common/src/contracts/mes_service/mes.contract.spec.ts
    - pnpm --filter api-gateway exec jest --runInBand --runTestsByPath src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts src/common/grpc/gateway-mes-grpc.client.spec.ts src/modules/mes-service/adapters/mes-dedicated-client.spec.ts src/modules/mes-service/mes.service.spec.ts src/modules/mes-service/interface/http/controllers/mes.controller.spec.ts src/modules/mes-service/interface/http/dtos/mes.dto.spec.ts
    - pnpm --filter mes-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l3/mes-grpc-context.spec.ts test/l3/mes-grpc-surface.spec.ts test/l3/production-spec-grpc-surface.spec.ts test/l3/mes-trusted-grpc-security.spec.ts
    - node --test src/services/business/mes-service/scripts/mes-smoke.spec.mjs
```

Acceptance proves 32/32 exact BUSINESS declarations and zero unclassified or dual-mode methods; Gateway and MES reject wrong issuer/time/audience/`cnf`/tenant/principal/terminal/Code before controller data; all 148 request fields and eight nested tombstone fields are removed/reserved while 16 new and two existing bounded business reasons remain; trusted audit identity/source and capture source cannot be overridden; both Gateway adapters resolve the dedicated MES mTLS client and legacy body/ordinary-metadata/fallback context is absent; the raw smoke script and package command are absent while isolated business tests remain; all ten Codes remain canonical and unchanged; no pure MACHINE caller, PDA declaration or current INTERNAL surface appears; MES outbound/event paths and business state machines are untouched; and the implementation diff is a strict subset of these 39 paths.

### 9.9 Collaboration Task + Annotation 16-RPC frozen cutover lease

Status: `IMPLEMENTED_VERIFIED`. Collaboration trusted gRPC was accepted and integrated at `c8c8a810108ec19f35a527e25ace6cdead433e93`; all 16 RPCs, Gateway caller cutover, Token-only enforcement and legacy-path removal satisfy the frozen 54-path packet. The slice adds no Task, Annotation, AI, ActionGrant, event or object capability. The business API remains unified: `CreateTask` admits self todo and assigned task through one RPC; `DeleteAnnotation` admits author deletion and governance deletion through one RPC. The base `collaboration.task.create` Code is checked at trusted admission; `collaboration.task.assign` is checked by Collaboration only when the verified assignee differs from the verified operator. `collaboration.annotation.manage` is checked by Collaboration only when the verified operator is not the Annotation author.

All 16 RPCs use `aud=urn:oes:service:collaboration-service`, certificate-bound `HUMAN` ExecutionToken and `session_terminal=WEB`; all reject MACHINE, DELEGATED, wrong audience/`cnf`/terminal/issuer and body authority. Query RPCs use the empty SELF_SERVICE Code set only where the operation is participant/author-bound; BUSINESS RPCs use the exact existing or newly frozen Code below. Resource, author, creator and assignee facts remain service-owned business targets and are never authority sources.

| RPC | Mode | Code / condition |
| --- | --- | --- |
| `CreateTask` | BUSINESS | `all [collaboration.task.create]`; service checks `collaboration.task.assign` only for another assignee |
| `UpdateTask` | SELF_SERVICE | empty Code; creator rule |
| `StartTask` | SELF_SERVICE | empty Code; assignee rule |
| `CompleteTask` | SELF_SERVICE | empty Code; creator/assignee rule |
| `CancelTask` | SELF_SERVICE | empty Code; creator rule |
| `ReopenTask` | SELF_SERVICE | empty Code; existing creator/assignee state rules |
| `ArchiveTask` | SELF_SERVICE | empty Code; creator rule |
| `UnarchiveTask` | SELF_SERVICE | empty Code; creator rule |
| `ListTasks` | SELF_SERVICE | empty Code; participant query scope |
| `GetTask` | SELF_SERVICE | empty Code; creator/assignee visibility |
| `CreateAnnotation` | BUSINESS | `all [collaboration.annotation.create]` plus CRM object read/capability check |
| `UpdateAnnotation` | SELF_SERVICE | empty Code; author rule |
| `DeleteAnnotation` | SELF_SERVICE | empty Code at admission; service checks author, otherwise `collaboration.annotation.manage` |
| `SetAnnotationPinned` | BUSINESS | `all [collaboration.annotation.manage]` |
| `ListAnnotationsForObject` | SELF_SERVICE | empty Code plus CRM object read check |
| `GetAnnotation` | SELF_SERVICE | empty Code plus author/private and CRM object read check |

Every request removes and reserves `tenant_id=1`, `operator_context=2`, `trace_context=3`; command requests additionally remove and reserve `audit_context=4`. The nested `OperatorContext` fields 1..4, `TraceContext` fields 1..2 and `AuditContext` fields 1..3 are compatibility tombstones. All remaining title, task target, notes, reasons, objectRef, visibility and query fields retain business meaning and existing numbers.

The old direct insecure Annotation gRPC smoke path is not a production caller and must be removed from live acceptance; Gateway HTTP smoke remains the only live entry. Collaboration outbound calls to CRM, Identity and Permission, the Gateway Identity display-name client, Task events/outbox, Notification consumer, Prisma/schema and all ActionGrant/AI paths remain protected.

```yaml
collaborationTrustedGrpcImplementationLease:
  totalTrackedWriterPaths: 54
  stateCounts: { EXISTING: 48, NEW_TARGET: 6 }
  trackedWriterPaths:
    commonProtoPermissionCode:
      - { state: EXISTING, path: src/common/src/contracts/collaboration_service/collaboration.proto }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/collaboration/task.permission-codes.ts }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/collaboration/annotation.permission-codes.ts }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/collaboration/index.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/permission-catalog.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/generate-common-permission-codes.ts }
      - { state: NEW_TARGET, path: src/common/src/contracts/collaboration_service/collaboration.contract.spec.ts }

    gatewayCollaborationHumanProducer:
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/index.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-collaboration-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-collaboration-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.ts }

    gatewayCollaborationAdaptersAndBff:
      - { state: EXISTING, path: src/services/api-gateway/src/modules/collaboration-service/collaboration-service.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/collaboration-service/adapters/task-command-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/collaboration-service/adapters/task-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/collaboration-service/adapters/annotation-command-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/collaboration-service/adapters/annotation-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/collaboration-service/application/task-bff.service.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/collaboration-service/application/task-bff.service.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/collaboration-service/application/annotation-bff.service.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/collaboration-service/application/annotation-bff.service.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/collaboration-service/interface/http/controllers/task.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/collaboration-service/interface/http/controllers/task.controller.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/collaboration-service/interface/http/controllers/annotation.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/collaboration-service/interface/http/dtos/task.dto.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/collaboration-service/interface/http/dtos/annotation.dto.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/modules/collaboration-service/adapters/collaboration-dedicated-client.spec.ts }

    collaborationTrustedRuntime:
      - { state: EXISTING, path: src/services/system/collaboration-service/src/main.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/interfaces/grpc/task-command.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/interfaces/grpc/task-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/interfaces/grpc/task-grpc.mapping.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/interfaces/grpc/task-grpc.presenter.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/interfaces/grpc/annotation-command.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/interfaces/grpc/annotation-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/interfaces/grpc/annotation-grpc.mapping.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/interfaces/grpc/annotation-grpc.presenter.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/modules/collaboration-task.module.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/modules/collaboration-annotation.module.ts }
      - { state: NEW_TARGET, path: src/services/system/collaboration-service/src/modules/collaboration-trusted-execution.module.ts }

    collaborationSecurityAndSmoke:
      - { state: EXISTING, path: src/services/system/collaboration-service/package.json }
      - { state: EXISTING, path: src/services/system/collaboration-service/test/l3/task-command.grpc.controller.spec.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/test/l3/task-query.grpc.controller.spec.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/test/l3/annotation-command.grpc.controller.spec.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/test/l3/annotation-query.grpc.controller.spec.ts }
      - { state: EXISTING, path: scripts/local/collaboration-task-p1-smoke.mjs }
      - { state: EXISTING, path: scripts/local/collaboration-task-p1-smoke-lib.mjs }
      - { state: EXISTING, path: scripts/local/collaboration-task-p1-smoke.spec.mjs }
      - { state: EXISTING, path: scripts/local/collaboration-annotation-p1-smoke.mjs }
      - { state: EXISTING, path: scripts/local/collaboration-annotation-p1-smoke-lib.mjs }
      - { state: NEW_TARGET, path: src/services/system/collaboration-service/test/l3/collaboration-trusted-grpc-security.spec.ts }

  ignoredGeneratedOutputs:
    - path: src/common/src/generated/collaboration_service/collaboration.ts
      input: src/common/src/contracts/collaboration_service/collaboration.proto
      command: pnpm proto:regen

  protectedByDefault:
    - Collaboration application/domain/repository/Prisma/schema/outbox/event paths not listed above
    - outbound CRM object reference, Identity account reference and Permission access-summary adapters and contracts
    - Gateway Identity generic client used for participant display labels
    - Notification Collaboration Task consumer and all event consumers
    - Task Assistant, ActionGrant, AI Platform, DELEGATED and every future MACHINE caller
    - package/lock/deployment, tenant-web internals and every other service cutover

  focusedAcceptanceCommands:
    - pnpm proto:lint
    - pnpm proto:regen
    - node scripts/architecture/trusted-grpc-signature-inventory.mjs
    - pnpm --filter @oes/common build
    - pnpm --filter api-gateway build
    - pnpm --filter collaboration-service build
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/common/src/contracts/collaboration_service/collaboration.contract.spec.ts
    - pnpm --filter api-gateway exec jest --runInBand --runTestsByPath src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts src/common/grpc/gateway-collaboration-grpc.client.spec.ts src/modules/collaboration-service/adapters/collaboration-dedicated-client.spec.ts src/modules/collaboration-service/application/task-bff.service.spec.ts src/modules/collaboration-service/application/annotation-bff.service.spec.ts src/modules/collaboration-service/interface/http/controllers/task.controller.spec.ts
    - pnpm --filter collaboration-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l3/task-command.grpc.controller.spec.ts test/l3/task-query.grpc.controller.spec.ts test/l3/annotation-command.grpc.controller.spec.ts test/l3/annotation-query.grpc.controller.spec.ts test/l3/collaboration-trusted-grpc-security.spec.ts
    - node --test scripts/local/collaboration-task-p1-smoke.spec.mjs
```

Acceptance proves exactly 16 declared RPCs, one mode per RPC, one base Task create Code, service-layer conditional assign/manage checks, 100% body authority tombstones, claims-derived tenant/operator/trace/audit, no MACHINE/DELEGATED/ActionGrant admission, dedicated Gateway mTLS client wiring, raw insecure Annotation smoke removed from live acceptance, and untouched Collaboration outbound/event/schema/AI boundaries. Implementation must be a strict subset of this 54-path lease.

### 9.10 Party TenantParty 6-RPC frozen cutover lease

Status: `IMPLEMENTED_VERIFIED`. Party trusted gRPC was accepted and integrated at `f6caa3aa294b6fb6e7099393afbe0770ee90c09a`; all six RPCs, Gateway and five non-Gateway caller compositions, Token-only enforcement and legacy-path removal satisfy the frozen 92-path packet. This slice adds no TenantParty capability, merge/unmerge flow, schema, event, outbound collaboration or cross-tenant identity behavior. All six methods are `INTERNAL / SYSTEM MACHINE`, use `aud=urn:oes:service:party-service`, exact workload allowlists and certificate-bound ET. Gateway first performs any HUMAN HTTP authorization, then calls Party with Gateway's SYSTEM MACHINE ET.

The caller work is frozen in two phases. Phase 1 prepares the five existing non-Gateway callers (CRM, SRM, HR, Identity and TenantOrg) with their own dedicated Party client, module DI, Common trusted-provider/exchange composition and fail-closed tests. Each service owns its own Party STS client, source-credential provider and Party producer, following the accepted Notification Auth MACHINE and Site→Asset multi-hop compositions; Common only reuses the existing `TrustedGrpcMetadataProvider`, certificate-bound ET cache, mTLS workload identity and private source-credential carrier. Missing source credential or missing target-audience ET is an immediate failure; no caller may synthesize authority or retain the legacy Party metadata/body fallback. Auth STS contract, Party proto/RPC, Permission Codes and Party business capabilities remain unchanged. Phase 2 is the later integration gate: after the Auth/Identity/Permission MACHINE foundation is available in the deployment, each workload receives its registered Machine Principal/SPIFFE binding, obtains an Auth-owned source credential, exchanges it for the Party-audience ET and proves certificate-bound mTLS in end-to-end tests. No other RPC in these five services is migrated and no Party or cross-service business capability is added.

| RPC | Mode | Code | Current workload allowlist |
| --- | --- | --- | --- |
| `RegisterTenantParty` | INTERNAL | `party.internal.register_tenant_party` | Identity, HR, TenantOrg, CRM |
| `DeactivateTenantParty` | INTERNAL | `party.internal.deactivate_tenant_party` | TenantOrg |
| `GetTenantPartyById` | INTERNAL | `party.internal.get_tenant_party_by_id` | Gateway, HR, TenantOrg, CRM, SRM |
| `ResolveTenantPartyByIdentifier` | INTERNAL | `party.internal.resolve_tenant_party_by_identifier` | none currently; future exact workload only |
| `ResolveTenantPartyForConsumer` | INTERNAL | `party.internal.resolve_tenant_party_for_consumer` | CRM |
| `SearchTenantPartyCandidates` | INTERNAL | `party.internal.search_tenant_party_candidates` | none currently; future exact workload only |

Party rejects HUMAN, DELEGATED, tenant MACHINE, unknown workload, wrong issuer/audience/`cnf`, missing or mismatched Code and all legacy body/metadata authority. Every request removes and reserves `tenant_id=1`; tenant scope is derived from verified ET. Response `TenantPartySummary.tenant_id` remains a business projection. Identifier/profile matching, registration idempotency, deactivation and all existing Party-owned persistence semantics remain unchanged.

```yaml
partyTrustedGrpcImplementationLease:
  totalTrackedWriterPaths: 92
  stateCounts: { EXISTING: 44, NEW_TARGET: 48 }
  trackedWriterPaths:
    commonProtoPermissionCode:
      - { state: EXISTING, path: src/common/src/contracts/party_service/party.proto }
      - { state: NEW_TARGET, path: src/common/src/authorization/permission-codes/party/index.ts }
      - { state: NEW_TARGET, path: src/common/src/authorization/permission-codes/party/internal.permission-codes.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/permission-catalog.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/generate-common-permission-codes.ts }
    partyTrustedRuntime:
      - { state: EXISTING, path: src/services/system/party-service/src/main.ts }
      - { state: EXISTING, path: src/services/system/party-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/system/party-service/src/interfaces/grpc/party-registration.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/party-service/src/interfaces/grpc/party-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/party-service/src/modules/party-registration/party-registration.module.ts }
      - { state: EXISTING, path: src/services/system/party-service/src/modules/party-query/party-query.module.ts }
      - { state: NEW_TARGET, path: src/services/system/party-service/src/modules/party-trusted-execution.module.ts }
    partyCallersAndAdapters:
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.ts }
      - { state: EXISTING, path: src/services/business/crm-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/system/identity-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/system/tenant-org-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/auth-bff.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/hr-service/hr-service.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/tenant-org-service/tenant-org-service.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/party-service/party-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/hr-service/adapters/party-tenant-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/tenant-org-service/adapters/party-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/system/hr-service/src/infrastructure/adapters/party-registration-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/system/identity-service/src/infrastructure/adaptors/party-registration.grpc.adaptor.ts }
      - { state: EXISTING, path: src/services/system/tenant-org-service/src/infrastructure/adapters/party-registration.grpc.adapter.ts }
      - { state: EXISTING, path: src/services/system/tenant-org-service/src/infrastructure/adapters/party-query.grpc.adapter.ts }
      - { state: EXISTING, path: src/services/business/crm-service/src/infrastructure/adapters/party-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/infrastructure/adapters/party-query-grpc.adapter.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/modules/party-service/adapters/party-dedicated-client.spec.ts }
    partySecurityTests:
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/public-barrels.spec.mjs }
      - { state: EXISTING, path: src/services/system/party-service/test/l3/party-registration.grpc.controller.spec.ts }
      - { state: EXISTING, path: src/services/system/party-service/test/l3/party-query.grpc.controller.spec.ts }
      - { state: EXISTING, path: src/services/system/party-service/test/l1/party-registration.service.spec.ts }
      - { state: EXISTING, path: src/services/system/party-service/test/l1/party-query.service.spec.ts }
      - { state: EXISTING, path: src/services/system/party-service/scripts/party-smoke.spec.mjs }
      - { state: NEW_TARGET, path: src/services/system/party-service/test/l3/party-trusted-grpc-security.spec.ts }
      - { state: EXISTING, path: src/services/system/party-service/package.json }
      - { state: EXISTING, path: src/services/system/party-service/jest.config.js }
    partyCallerCompositionExpansion:
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/index.ts }
      - { state: NEW_TARGET, path: src/common/src/authorization/trusted-execution/internal-trusted-grpc-caller.ts }
      - { state: NEW_TARGET, path: src/common/src/authorization/trusted-execution/internal-trusted-grpc-caller.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/crm-service/src/modules/crm-trusted-execution.module.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/modules/srm-trusted-execution.module.ts }
      - { state: NEW_TARGET, path: src/services/system/hr-service/src/modules/hr-trusted-execution.module.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/modules/identity-trusted-execution.module.ts }
      - { state: NEW_TARGET, path: src/services/system/tenant-org-service/src/modules/tenant-org-trusted-execution.module.ts }
      - { state: NEW_TARGET, path: src/services/business/crm-service/src/infrastructure/adapters/party-trusted-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/infrastructure/adapters/party-trusted-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/system/hr-service/src/infrastructure/adapters/party-trusted-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/infrastructure/adaptors/party-trusted-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/system/tenant-org-service/src/infrastructure/adapters/party-trusted-grpc.client.ts }
      - { state: EXISTING, path: src/services/business/crm-service/src/modules/crm-infrastructure.module.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/modules/srm-infrastructure.module.ts }
      - { state: EXISTING, path: src/services/system/hr-service/src/infrastructure/modules/hr-reference.module.ts }
      - { state: EXISTING, path: src/services/system/identity-service/src/modules/identity-management/identity-management.module.ts }
      - { state: EXISTING, path: src/services/system/tenant-org-service/src/modules/tenant-org-management/tenant-org-management.module.ts }
      - { state: EXISTING, path: src/services/business/crm-service/test/l1/party-query-grpc.adapter.spec.ts }
      - { state: EXISTING, path: src/services/system/hr-service/test/l1/hr-grpc-config.spec.ts }
      - { state: EXISTING, path: src/services/system/tenant-org-service/test/l1/app-module-grpc-config.spec.ts }
      - { state: EXISTING, path: src/services/system/tenant-org-service/test/l1/party-registration.grpc.adapter.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/crm-service/test/l1/party-trusted-grpc.client.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/test/l1/party-trusted-grpc.client.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/hr-service/test/l1/party-trusted-grpc.client.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/test/l1/party-trusted-grpc.client.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/tenant-org-service/test/l1/party-trusted-grpc.client.spec.ts }
    partyMachineFoundationPreparation:
      - { state: NEW_TARGET, path: src/services/business/crm-service/src/infrastructure/adapters/crm-party-machine-source-credential.client.ts }
      - { state: NEW_TARGET, path: src/services/business/crm-service/src/infrastructure/adapters/crm-party-machine-source-credential.provider.ts }
      - { state: NEW_TARGET, path: src/services/business/crm-service/src/infrastructure/adapters/crm-party-execution-token-exchange.client.ts }
      - { state: NEW_TARGET, path: src/services/business/crm-service/src/infrastructure/adapters/crm-party-trusted-grpc-execution.producer.ts }
      - { state: NEW_TARGET, path: src/services/business/crm-service/src/infrastructure/adapters/crm-party-trusted-grpc-execution.producer.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/infrastructure/adapters/srm-party-machine-source-credential.client.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/infrastructure/adapters/srm-party-machine-source-credential.provider.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/infrastructure/adapters/srm-party-execution-token-exchange.client.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/infrastructure/adapters/srm-party-trusted-grpc-execution.producer.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/infrastructure/adapters/srm-party-trusted-grpc-execution.producer.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/hr-service/src/infrastructure/adapters/hr-party-machine-source-credential.client.ts }
      - { state: NEW_TARGET, path: src/services/system/hr-service/src/infrastructure/adapters/hr-party-machine-source-credential.provider.ts }
      - { state: NEW_TARGET, path: src/services/system/hr-service/src/infrastructure/adapters/hr-party-execution-token-exchange.client.ts }
      - { state: NEW_TARGET, path: src/services/system/hr-service/src/infrastructure/adapters/hr-party-trusted-grpc-execution.producer.ts }
      - { state: NEW_TARGET, path: src/services/system/hr-service/src/infrastructure/adapters/hr-party-trusted-grpc-execution.producer.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/infrastructure/adaptors/identity-party-machine-source-credential.client.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/infrastructure/adaptors/identity-party-machine-source-credential.provider.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/infrastructure/adaptors/identity-party-execution-token-exchange.client.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/infrastructure/adaptors/identity-party-trusted-grpc-execution.producer.ts }
      - { state: NEW_TARGET, path: src/services/system/identity-service/src/infrastructure/adaptors/identity-party-trusted-grpc-execution.producer.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/tenant-org-service/src/infrastructure/adapters/tenant-org-party-machine-source-credential.client.ts }
      - { state: NEW_TARGET, path: src/services/system/tenant-org-service/src/infrastructure/adapters/tenant-org-party-machine-source-credential.provider.ts }
      - { state: NEW_TARGET, path: src/services/system/tenant-org-service/src/infrastructure/adapters/tenant-org-party-execution-token-exchange.client.ts }
      - { state: NEW_TARGET, path: src/services/system/tenant-org-service/src/infrastructure/adapters/tenant-org-party-trusted-grpc-execution.producer.ts }
      - { state: NEW_TARGET, path: src/services/system/tenant-org-service/src/infrastructure/adapters/tenant-org-party-trusted-grpc-execution.producer.spec.ts }
    gatewayPartyDedicatedProductionClient:
      - { state: NEW_TARGET, path: src/services/api-gateway/src/modules/party-service/adapters/party-dedicated-client.ts }
```

The ignored generated Party client remains verification output from `src/common/src/contracts/party_service/party.proto`. Acceptance proves 6/6 declarations, exact Code/workload/audience enforcement, tenant body tombstone, no HUMAN/DELEGATED admission, all Gateway and non-Gateway Party callers on dedicated Party-audience ET clients, module DI composition, and unchanged Party persistence/business boundaries. It also proves each five-service provider/exchange composition fails closed without a real source credential or ET and that no legacy Party metadata fallback remains; each service owns its own STS client, source provider and producer while Common/Auth STS/Party contracts remain unchanged. The accepted implementation is a strict subset of this 92-path lease and does not start any caller service's own full trusted-gRPC cutover.

### 9.11 Item Master 50+3-RPC frozen cutover lease

Status: `IMPLEMENTED_VERIFIED`. The accepted Item Master server implementation at `764f28fba059965a4272752beb6ff0c7acf25d64` migrated the existing 50 Item Master RPCs, added only the three frozen INTERNAL eligibility queries, and activated the Gateway and MES paths. Subsequent accepted SRM and Procurement migrations activated their exact actor paths; final WMS integration at `108ca92602b729a9dd1271c88ccdef3f58efe800` activated `ResolveStockableItem` and closed the fourth exact HUMAN_OBO actor path. This history adds no Item capability, lifecycle, persistence, event, Gateway route or caller-service business RPC. Existing `GetItem` remains HUMAN-only and never admits MACHINE authority.

All existing 50 RPCs are `BUSINESS / HUMAN / WEB`, require `aud=urn:oes:service:item-master-service`, exact mTLS/`cnf` binding and the exact existing Code below, and reject MACHINE, DELEGATED, SELF_SERVICE, non-WEB sessions and legacy body/ordinary-metadata authority:

| Exact Code | Existing RPCs |
| --- | --- |
| `item_master.item_model.get_by_id` | `GetItemModel` |
| `item_master.item_model.list` | `BatchGetItemModels`, `SearchItemModels` |
| `item_master.attribute.list` | `ListAttributeDefinitions`, `ListAttributeOptions`, `GetItemModelAttributeRules` |
| `item_master.item.get_by_id` | `GetItem`, `ResolveItemVariant` |
| `item_master.item.list` | `BatchGetItems`, `SearchItems` |
| `item_master.item_category.list` | `ListItemCategories` |
| `item_master.packaging.list` | `ListPackagingMethods`, `GetPackagingSpec`, `SearchPackagingSpecs` |
| `item_master.bom.list` | `GetBom`, `SearchBoms`, `GetBomByOutputItem` |
| `item_master.supplier_item_mapping.list_by_item` | `ListSupplierItemMappingsByItem`, `ResolveSupplierItemMapping` |
| `item_master.item_model.create` | `CreateItemModel` |
| `item_master.item_model.manage` | `UpdateItemModelBasics`, `SetItemModelCapabilities`, `ChangeItemModelStatus` |
| `item_master.item.set_primary_category` | `SetItemModelPrimaryCategory` |
| `item_master.attribute.create` | `CreateAttributeDefinition`, `CreateAttributeOption` |
| `item_master.attribute.manage` | `UpdateAttributeDefinition`, `UpdateAttributeOption`, `SetItemModelAttributeRules` |
| `item_master.item.create` | `CreateItem` |
| `item_master.item.update_basics` | `UpdateItemBasics` |
| `item_master.item.set_capabilities` | `SetItemCapabilities` |
| `item_master.item.update_status` | `ChangeItemStatus` |
| `item_master.item_category.create` | `CreateItemCategory` |
| `item_master.item_category.update_basics` | `UpdateItemCategoryBasics`, `MoveItemCategory` |
| `item_master.item_category.update_status` | `ChangeItemCategoryStatus` |
| `item_master.item_category.delete` | `DeleteItemCategory` |
| `item_master.packaging.create` | `CreatePackagingMethod`, `CreatePackagingSpec` |
| `item_master.packaging.manage` | `UpdatePackagingMethod`, `ChangePackagingMethodStatus`, `DeletePackagingMethod`, `UpdatePackagingSpec`, `ChangePackagingSpecStatus` |
| `item_master.bom.create` | `CreateBom` |
| `item_master.bom.manage` | `UpdateBomBasics`, `ReplaceBomLines`, `ChangeBomStatus` |
| `item_master.supplier_item_mapping.upsert` | `UpsertSupplierItemMapping` |

The new service `ItemMasterInternalQueryService` contains exactly three `INTERNAL` methods whose only frozen execution shape is `HUMAN subject + exact SYSTEM MACHINE actor`. They use the same Item Master audience and certificate binding, reject direct HUMAN without the actor, pure MACHINE root, DELEGATED, TENANT MACHINE, unknown workloads and wildcard issuance, and derive the exact tenant from the verified HUMAN subject rather than request data:

| RPC | Exact new INTERNAL Code | Exact workload allowlist | Item Master-owned rule |
| --- | --- | --- | --- |
| `ResolveManufacturableItem` | `item_master.internal.manufacturable_item.resolve` | `mes-service` | `active + manufacturable` |
| `ResolveStockableItem` | `item_master.internal.stockable_item.resolve` | `wms-service` | `active + stockable` |
| `ResolvePurchasableItem` | `item_master.internal.purchasable_item.resolve` | `procurement-service`, `srm-service` | `active + purchasable` |

Each INTERNAL request contains only `item_id=1`; a successful response exposes only `item_id`, `item_code`, `item_name` and `active`. `NOT_FOUND` means no Item; `FAILED_PRECONDITION` means inactive or missing the exact capability. No generic caller-selected capability parameter exists. Every caller owns its Item Master dedicated client, Auth STS/OBO composition and Item Master audience producer, reusing the target-neutral Common `InternalTrustedGrpcCaller`; it never imports another service's producer or reuses Gateway/Party identity.

Each Item Master producer passes one immutable Common caller profile with `executionSource=HUMAN_OBO`, `targetAudience=urn:oes:service:item-master-service` and exact stable error literals `ITEM_MASTER_CALLER_EXECUTION_CONTEXT_REQUIRED`, `ITEM_MASTER_CALLER_FOUNDATION_UNAVAILABLE` and `ITEM_MASTER_CALLER_SOURCE_CREDENTIAL_INVALID`. Common maps missing HUMAN OBO context, unavailable workload/transport foundation and invalid subject credential/STS/audience/Code/certificate binding into those three categories without exposing underlying credentials. Profile values are DI-owned startup constants, never request input. The existing Party three-argument caller form remains a compatibility overload fixed to `executionSource=MACHINE_ROOT`, the exact Party audience and `PARTY_CALLER_*` errors. Common tests must prove Party behavior is byte-stable, Item Master rejects MACHINE root, and neither strategy infers or falls back to the other.

The three INTERNAL methods use exactly one execution shape: original `HUMAN` subject plus an exact direct `SYSTEM MACHINE` actor from the MES/WMS/Procurement/SRM allowlist. Common places the already verified current-service-audience inbound ET into a private, non-serializable request scope and submits that one subject credential through `authorization` to STS. Auth re-verifies the subject Token and current exchanger mTLS/SPIFFE/leaf, then selects actor facts only from the matching deployment-owned workload policy `humanObo` block: exact `selfAudience`, actor Machine Principal id, binding stable ref/version and allowed OBO target audiences. The existing Identity resolver must confirm those exact active SYSTEM owner facts before Permission's actor-workload -> Item Master audience -> INTERNAL Code decision. Permission neither receives nor authorizes subject tenant authority.

The Auth registry retains existing `spiffeId` and `audiences` semantics and adds one optional `humanObo` block. SPIFFE and OBO self-audience entries are unique; target audiences are canonical, non-empty, unique and a subset of the existing audience list; actor refs are non-empty and binding version is a canonical positive decimal. Duplicate/ambiguous/stale/malformed configuration fails startup. Missing policy, wrong self/target audience, stale/mismatched Identity response, non-SYSTEM or tenant-bearing actor, Identity outage, and caller/body/metadata actor injection fail before Permission or signing. No new Identity RPC, Permission field or caller actor input is introduced.

The target Item Master ET preserves subject `sub`, `principal_type=HUMAN`, `tenant_id`, applicable org/session and security version. Its `act` identifies the current SYSTEM MACHINE actor; `client_id`/`cnf` bind the next-hop workload and leaf; `exp <= subject exp`; and Auth durably records subject `jti` -> target `jti` plus actor attribution before returning. Request/body/local metadata tenant never enters this composition. Missing, malformed, expired or wrong-audience subject Token; cross-tenant input; actor spoofing; wrong workload/certificate; direct HUMAN without the required actor; MACHINE root; denied Permission; audit failure; target expiry beyond subject expiry; invalid/unbounded `act` chain; and body injection all fail closed. A background job without a HUMAN subject Token remains deferred and cannot use this path.

Common extends only its current-hop private credential scope, existing single-bearer carrier and cache: the bearer stays outside DTO, `TrustedExecutionContext`, target metadata and logs; OBO cache entries bind an irreversible subject reference plus actor/target/Code/leaf tuple and require the same request-scoped handle even on cache hit. A deeper hop uses the Token addressed to the current service and never retains the original Gateway Token. `TrustedInternalCallSourceProvider` remains target-neutral, `TrustedPartySourceProvider` remains a compatibility alias, and the three Item Master error literals stay package-owned and pairwise distinct. The four source-local caller producer specs must be included by each package's official `jest.config.js` and executed by the literal package command; a green command that omits those specs is a failure. The Item Master security gate must compose real inbound verifier/scope -> Identity actor resolution -> Auth subject verifier -> Permission workload decision -> STS signer -> Item Master verifier/guard, rather than a mock STS shortcut.

The 50 existing request messages delete and reserve exactly `tenant_id=1` and `"tenant_id"`. No current request contains other operator/trace/audit authority fields. Tenant, org, principal, operator, trace, audit and source workload come only from verified ET and transport context. Response tenant projections remain Item Master-owned business data where already defined. Legacy `ItemMasterRpcContextGuard`, signed operator/internal-service metadata, `x-trace-id`/`x-request-id` authority and body tenant fallback are migration targets and are absent after cutover.

Production caller manifest is exact: Gateway is the sole allowed production caller class for the 50 HUMAN methods and retains the current 46 BFF routes; methods without a current route gain none in this slice. MES calls only `ResolveManufacturableItem`; WMS calls only `ResolveStockableItem`; Procurement and SRM call only `ResolvePurchasableItem`. The direct management bootstrap smoke and shared fixture are deleted or moved behind a Gateway HTTP HUMAN test flow; the WMS local query stub remains an isolated fixture and is never registered as a workload. No other worker, Cron, Robot, AI or ActionGrant caller is admitted.

Implementation progress preserved the frozen order: canonical proto/Code and Common/Auth OBO foundation, Gateway dedicated HUMAN client, Item Master server/runtime and MES actor path were accepted at `764f28fba059965a4272752beb6ff0c7acf25d64`; SRM and Procurement later activated their exact Item Master actor paths through their own trusted inbound migrations; WMS integration at `108ca92602b729a9dd1271c88ccdef3f58efe800` established the same verified HUMAN request scope, removed its legacy fallback and passed the end-to-end composition gate. MES, SRM, Procurement and WMS actor paths are all active, so Item Master is `IMPLEMENTED_VERIFIED` with C/A/T/L complete. Outbound services other than these exact Item Master calls, schemas, events/outbox and business rules remain protected. AI/ActionGrant, DELEGATED runtime and background-without-user tenant authority remain deferred.

The frozen Auth root Jest literal must resolve the same `@oes/common/*` aliases as the workspace build. Root `tsconfig.json` therefore retains its existing solution `files` / `references` and adds exactly these runner-compatibility fields:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": { "isolatedModules": true }
}
```

This tracked change exists only so the literal root Jest/TypeScript runner inherits the canonical path mapping while transpiling isolated test modules. It does not change any package production compiler configuration, generated contract, runtime code, deployment configuration or OBO security semantics.

```yaml
itemMasterTrustedGrpcImplementationLease:
  totalTrackedWriterPaths: 133
  stateCounts: { EXISTING: 99, NEW_TARGET: 34 }
  trackedWriterPaths:
    commonProtoPermissionCode:
      - { state: EXISTING, path: src/common/src/contracts/item_master_service/item_master.proto }
      - { state: NEW_TARGET, path: src/common/src/contracts/item_master_service/item_master.contract.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/item-master/index.ts }
      - { state: NEW_TARGET, path: src/common/src/authorization/permission-codes/item-master/internal.permission-codes.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/permission-catalog.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/generate-common-permission-codes.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/sync-permission-codes.ts }
      - { state: EXISTING, path: src/services/system/permission-service/test/l1/common-permission-code-generator.spec.ts }
    gatewayHumanProducer:
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/index.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-item-master-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-item-master-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/item-master-service/item-master-service.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/item-master-service/adapters/item-master-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/item-master-service/adapters/item-master-management-grpc.adapter.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/modules/item-master-service/adapters/item-master-dedicated-client.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/item-master-service/item-management.service.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/item-master-service/item-management.service.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/item-master-service/interface/http/controllers/item-management.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/item-master-service/interface/http/controllers/item-management.controller.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/item-master-service/interface/http/dtos/item-management.dto.ts }
    itemMasterTrustedRuntime:
      - { state: EXISTING, path: src/services/system/item-master-service/src/main.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/src/application/item-master-v2.service.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/src/application/services/item-master-audit.service.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/src/common/errors/item-master.errors.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/src/common/constants/tokens.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/src/interfaces/grpc/item-master-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/src/interfaces/grpc/item-master-management.grpc.controller.ts }
      - { state: NEW_TARGET, path: src/services/system/item-master-service/src/interfaces/grpc/item-master-internal-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/src/interfaces/grpc/item-master-rpc-context.guard.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/src/modules/item-master-query/item-master-query.module.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/src/modules/item-master-management/item-master-management.module.ts }
      - { state: NEW_TARGET, path: src/services/system/item-master-service/src/modules/item-master-trusted-execution.module.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/test/l1/item-master-v2.service.spec.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/test/l2/item-master-contract-v2-smoke.spec.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/test/l3/item-master-grpc-metadata-guard.integration.spec.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/test/l3/item-master-v2-grpc.controller.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/item-master-service/test/l3/item-master-trusted-grpc-security.spec.ts }
    internalMachineCallers:
      - { state: EXISTING, path: src/services/business/mes-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/business/mes-service/src/modules/mes-infrastructure.module.ts }
      - { state: EXISTING, path: src/services/business/mes-service/src/infrastructure/adapters/item-master-manufacturable-query.grpc.adapter.ts }
      - { state: NEW_TARGET, path: src/services/business/mes-service/src/infrastructure/adapters/item-master-trusted-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/business/mes-service/src/infrastructure/adapters/mes-item-master-execution-token-exchange.client.ts }
      - { state: NEW_TARGET, path: src/services/business/mes-service/src/infrastructure/adapters/mes-item-master-trusted-grpc-execution.producer.ts }
      - { state: NEW_TARGET, path: src/services/business/mes-service/src/infrastructure/adapters/mes-item-master-trusted-grpc-execution.producer.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/mes-service/test/l1/item-master-trusted-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/modules/wms-infrastructure.module.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/infrastructure/adapters/item-master-stockable-query.grpc.adapter.ts }
      - { state: NEW_TARGET, path: src/services/business/wms-service/src/infrastructure/adapters/item-master-trusted-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/business/wms-service/src/infrastructure/adapters/wms-item-master-execution-token-exchange.client.ts }
      - { state: NEW_TARGET, path: src/services/business/wms-service/src/infrastructure/adapters/wms-item-master-trusted-grpc-execution.producer.ts }
      - { state: NEW_TARGET, path: src/services/business/wms-service/src/infrastructure/adapters/wms-item-master-trusted-grpc-execution.producer.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/wms-service/test/l1/item-master-trusted-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/modules/procurement-infrastructure.module.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/infrastructure/adapters/item-master-query.grpc.adapter.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/src/infrastructure/adapters/item-master-trusted-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/src/infrastructure/adapters/procurement-item-master-execution-token-exchange.client.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/src/infrastructure/adapters/procurement-item-master-trusted-grpc-execution.producer.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/src/infrastructure/adapters/procurement-item-master-trusted-grpc-execution.producer.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/test/l1/item-master-trusted-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/modules/srm-infrastructure.module.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/infrastructure/adapters/item-master-query-grpc.adapter.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/infrastructure/adapters/item-master-trusted-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/infrastructure/adapters/srm-item-master-execution-token-exchange.client.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/infrastructure/adapters/srm-item-master-trusted-grpc-execution.producer.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/infrastructure/adapters/srm-item-master-trusted-grpc-execution.producer.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/test/l1/item-master-trusted-grpc.client.spec.ts }
    smokeAndSecurityEvidence:
      - { state: EXISTING, path: scripts/local/item-master-smoke-fixture.mjs }
      - { state: EXISTING, path: src/services/business/procurement-service/scripts/procurement-smoke.mjs }
      - { state: EXISTING, path: src/services/business/srm-service/scripts/srm-smoke.mjs }
      - { state: EXISTING, path: src/services/business/wms-service/scripts/wms-smoke.mjs }
    commonInternalCallerParameterization:
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/internal-trusted-grpc-caller.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/internal-trusted-grpc-caller.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/index.ts }
    humanOboComposition:
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/trusted-execution-context.ts }
      - { state: NEW_TARGET, path: src/common/src/authorization/trusted-execution/trusted-execution-context.spec.ts }
      - { state: NEW_TARGET, path: src/common/src/authorization/trusted-execution/inbound-execution-token-credential.scope.ts }
      - { state: NEW_TARGET, path: src/common/src/authorization/trusted-execution/inbound-execution-token-credential.scope.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/execution-token-verifier.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/execution-token-verifier.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/declarations/index.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/declarations.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/guards/trusted-execution.guard.ts }
      - { state: EXISTING, path: src/common/src/authorization/guards/trusted-execution.guard.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/interceptors/grpc-request-context.interceptor.ts }
      - { state: EXISTING, path: src/common/src/authorization/interceptors/grpc-request-context.interceptor.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/authorization.module.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/transport-private-source-credential.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/transport-private-source-credential.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/trusted-grpc-metadata-provider.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/trusted-grpc-metadata-provider.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/certificate-bound-execution-token-cache.ts }
      - { state: EXISTING, path: src/common/src/transport/grpc/execution-token-exchange-source-credential.carrier.ts }
      - { state: EXISTING, path: src/common/src/transport/grpc/execution-token-exchange-source-credential.carrier.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/ports/execution-token-exchange-context.port.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/execution-token-exchange.service.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/services/execution-token-exchange.service.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/domain/services/execution-token-registry.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/domain/services/execution-token-registry.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/ports/identity-service.port.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/adaptors/identity-service.adaptor.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/adaptors/identity-service.adaptor.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/execution-token-signer/execution-token-context-bootstrap.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/execution-token-signer/execution-token-context-bootstrap.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/execution-token-signer/verified-execution-token-context.provider.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/execution-token-signer/verified-execution-token-context.provider.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/execution-token-signer/execution-token-subject-credential.verifier.ts }
      - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/execution-token-signer/execution-token-subject-credential.verifier.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/modules/token/execution-token.module.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/modules/token/execution-token.module.spec.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/application/events/auth-audit.event.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/domain/repositories/auth-audit.repository.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.auth-audit.repository.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.auth-audit.repository.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-verified-source-credential.boundary.spec.ts }
      - { state: EXISTING, path: src/services/business/mes-service/src/interfaces/grpc/production-spec-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/mes-service/src/modules/mes-trusted-execution.module.ts }
      - { state: EXISTING, path: src/services/business/mes-service/test/l3/mes-grpc-context.spec.ts }
      - { state: EXISTING, path: src/services/business/mes-service/test/l3/mes-trusted-grpc-security.spec.ts }
      - { state: EXISTING, path: src/services/business/mes-service/jest.config.js }
      - { state: EXISTING, path: src/services/business/wms-service/jest.config.js }
      - { state: EXISTING, path: src/services/business/procurement-service/jest.config.js }
      - { state: EXISTING, path: src/services/business/srm-service/jest.config.js }
    rootLiteralRunnerCompatibility:
      - { state: EXISTING, path: tsconfig.json }
  ignoredGeneratedOutputs:
    - path: src/common/src/generated/item_master_service/item_master.ts
      input: src/common/src/contracts/item_master_service/item_master.proto
      command: pnpm proto:regen
  protectedByDefault:
    - Item Master domain/persistence/schema/business rules and every path not listed above
    - MES/WMS/Procurement/SRM inbound trusted-gRPC cutovers, other outbound dependencies and business RPCs
    - event catalog, producer, consumer, outbox, inbox, package/lock/deployment and database migrations
    - Common/Auth/Identity/Permission pure-MACHINE foundation and Party/Gateway production behavior except the exact listed OBO foundation and compatibility evidence paths
    - AI, ActionGrant, DELEGATED and every speculative caller or capability
  focusedAcceptanceCommands:
    - pnpm proto:lint
    - pnpm proto:regen
    - node scripts/architecture/trusted-grpc-signature-inventory.mjs
    - pnpm --filter @oes/common build
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/common/src/authorization/trusted-execution/internal-trusted-grpc-caller.spec.ts src/common/src/authorization/trusted-execution/trusted-execution-context.spec.ts src/common/src/authorization/trusted-execution/inbound-execution-token-credential.scope.spec.ts src/common/src/authorization/trusted-execution/execution-token-verifier.spec.ts src/common/src/authorization/trusted-execution/declarations.spec.ts src/common/src/authorization/guards/trusted-execution.guard.spec.ts src/common/src/authorization/interceptors/grpc-request-context.interceptor.spec.ts src/common/src/authorization/trusted-execution/transport-private-source-credential.spec.ts src/common/src/authorization/trusted-execution/trusted-grpc-metadata-provider.spec.ts src/common/src/transport/grpc/execution-token-exchange-source-credential.carrier.spec.ts
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/services/system/auth-service/src/application/services/execution-token-exchange.service.spec.ts src/services/system/auth-service/src/domain/services/execution-token-registry.spec.ts src/services/system/auth-service/src/infrastructure/adaptors/identity-service.adaptor.spec.ts src/services/system/auth-service/src/infrastructure/execution-token-signer/execution-token-context-bootstrap.spec.ts src/services/system/auth-service/src/infrastructure/execution-token-signer/verified-execution-token-context.provider.spec.ts src/services/system/auth-service/src/infrastructure/execution-token-signer/execution-token-subject-credential.verifier.spec.ts src/services/system/auth-service/src/modules/token/execution-token.module.spec.ts src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.auth-audit.repository.spec.ts
    - pnpm --filter permission-service run permission-codes:generate-common
    - pnpm --filter api-gateway build
    - pnpm --filter item-master-service build
    - pnpm --filter mes-service build
    - pnpm --filter wms-service build
    - pnpm --filter procurement-service build
    - pnpm --filter srm-service build
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/common/src/contracts/item_master_service/item_master.contract.spec.ts
    - pnpm --filter api-gateway exec jest --runInBand --runTestsByPath src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts src/common/grpc/gateway-item-master-grpc.client.spec.ts src/modules/item-master-service/adapters/item-master-dedicated-client.spec.ts src/modules/item-master-service/item-management.service.spec.ts src/modules/item-master-service/interface/http/controllers/item-management.controller.spec.ts
    - pnpm --filter item-master-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l1/item-master-v2.service.spec.ts test/l2/item-master-contract-v2-smoke.spec.ts test/l3/item-master-grpc-metadata-guard.integration.spec.ts test/l3/item-master-v2-grpc.controller.spec.ts test/l3/item-master-trusted-grpc-security.spec.ts
    - pnpm --filter mes-service exec jest --config jest.config.js --runInBand --runTestsByPath src/infrastructure/adapters/mes-item-master-trusted-grpc-execution.producer.spec.ts test/l1/item-master-trusted-grpc.client.spec.ts test/l3/mes-grpc-context.spec.ts test/l3/mes-trusted-grpc-security.spec.ts
    - pnpm --filter wms-service exec jest --config jest.config.js --runInBand --runTestsByPath src/infrastructure/adapters/wms-item-master-trusted-grpc-execution.producer.spec.ts test/l1/item-master-trusted-grpc.client.spec.ts
    - pnpm --filter procurement-service exec jest --config jest.config.js --runInBand --runTestsByPath src/infrastructure/adapters/procurement-item-master-trusted-grpc-execution.producer.spec.ts test/l1/item-master-trusted-grpc.client.spec.ts
    - pnpm --filter srm-service exec jest --config jest.config.js --runInBand --runTestsByPath src/infrastructure/adapters/srm-item-master-trusted-grpc-execution.producer.spec.ts test/l1/item-master-trusted-grpc.client.spec.ts
```

Acceptance proves 53/53 unique declarations and zero dual-mode methods; exact Code/actor-workload/audience/tenant/terminal/`cnf` enforcement; 50/50 `tenant_id=1` reservations; claims-derived context; three minimum eligibility projections; Gateway and four dedicated caller clients; explicit `MACHINE_ROOT | HUMAN_OBO` caller strategy with no inference/fallback; single-credential HUMAN OBO with exact SYSTEM MACHINE actor; unique deployment registry self-audience/actor binding/version/OBO target policy and every startup/runtime fail-closed case; subject self-audience/expiry/signature, actor/workload/certificate and target expiry enforcement; subject `jti` -> target `jti` durable audit; real inbound verifier/scope -> Identity actor resolution -> Auth subject verifier -> Permission workload decision -> signer -> Item Master composition; four producer specs discovered and executed by official package Jest configs; the frozen root Auth Jest literal resolves Common aliases through the exact runner-only root tsconfig fields; Gateway compatibility and unchanged pure MACHINE roots; Common target-profile parameterization with exact Item Master errors and byte-stable Party compatibility; no legacy generic Item Master registration, metadata or body fallback; no raw smoke workload; unchanged business rules/schema/events; exact 133-path scope; and successful proto, generation, build, focused test, UTF-8, link, YAML and diff gates.

### 9.12 SRM 13+2-RPC frozen cutover lease

Status: `IMPLEMENTED_VERIFIED` at `84402fc566fee82a5e73cf7a013e7b617e254578`. This slice migrated the 13 existing SRM RPCs and added only two narrow Procurement eligibility projections already required by the Procurement service truth. It added no Supplier, offering, pricing, qualification, persistence, event, Gateway route or Procurement business capability.

All 13 existing methods are `BUSINESS / HUMAN / WEB`, require `aud=urn:oes:service:srm-service`, exact mTLS/`cnf` binding and the exact existing Code below, and reject MACHINE, DELEGATED, SELF_SERVICE, non-WEB sessions and legacy body/ordinary-metadata authority:

| RPC | Exact Code |
| --- | --- |
| `GetSupplier` | `srm.supplier_profile.get_by_id` |
| `SearchSuppliers` | `srm.supplier_profile.list` |
| `ListSupplierContacts` | `srm.supplier_profile.get_by_id` |
| `ListSupplierAddresses` | `srm.supplier_profile.get_by_id` |
| `ListSupplierOfferingsBySupplier` | `srm.supplier_offering.list_by_supplier` |
| `ListSupplierOfferingsByItem` | `srm.supplier_offering.list_by_item` |
| `CreateSupplierProfile` | `srm.supplier_profile.create` |
| `UpdateSupplierProfileBasics` | `srm.supplier_profile.update_basics` |
| `BindSupplierToTenantParty` | `srm.supplier_profile.bind_tenant_party` |
| `UpsertSupplierContact` | `srm.supplier_contact.upsert` |
| `UpsertSupplierAddress` | `srm.supplier_address.upsert` |
| `UpsertSupplierOffering` | `srm.supplier_offering.upsert` |
| `ChangeSupplierStatus` | `srm.supplier_profile.change_status` |

Gateway is the sole production caller class for these methods. The existing 11 HTTP routes remain; no new route is added. The supplier-detail aggregate invokes `GetSupplier`, contacts, addresses and offerings, so its edge declaration requires both `srm.supplier_profile.get_by_id` and `srm.supplier_offering.list_by_supplier`. Gateway derives the SRM ET from the authenticated HUMAN session and uses one dedicated SRM mTLS client. Generic `SERVICE_NAMES.SRM` registration, `GrpcMetadataPropagationFactory`, body contexts and request/trace fallback literals are migration targets and absent after cutover.

The new `SrmInternalQueryService` contains exactly two `INTERNAL / HUMAN_OBO` methods. Both preserve the verified HUMAN subject and exact tenant, require `act` to identify the direct `procurement-service` SYSTEM MACHINE workload, use the SRM audience and exact certificate binding, and reject direct HUMAN without actor, pure MACHINE root, DELEGATED, TENANT MACHINE, unknown workload and wildcard issuance:

| RPC | Exact new INTERNAL Code | Exact actor workload | SRM-owned rule |
| --- | --- | --- | --- |
| `ResolveActiveSupplier` | `srm.internal.supplier_profile.resolve_active` | `procurement-service` | SupplierProfile exists and is `ACTIVE` |
| `ResolveActiveSupplierOffering` | `srm.internal.supplier_offering.resolve_active` | `procurement-service` | exact `supplier_id + item_id` offering exists and is `ACTIVE` under an active SupplierProfile |

`ResolveActiveSupplierRequest` contains only `supplier_id=1`; its response contains `supplier_id=1`, `display_name=2`, `status=3`. `ResolveActiveSupplierOfferingRequest` contains only `supplier_id=1`, `item_id=2`; its response contains `supplier_offering_id=1`, `supplier_id=2`, `item_id=3`, `status=4`. `NOT_FOUND` means the requested owner object does not exist; `FAILED_PRECONDITION` means it exists but is not active. Neither method returns a directory page, price, MOQ, lead time, terms or caller-selected rule.

The 13 existing requests delete and reserve 46 authority fields in 13 groups: every request reserves `tenant_id=1`, `operator_context=2` and `trace_context=3`; the seven management requests additionally reserve `audit_context=4`. The unused `OperatorContext`, `TraceContext` and `AuditContext` messages are removed. Existing business fields and response field numbers remain byte-stable; `SupplierProfile.tenant_id=3` remains an SRM-owned projection. Tenant, org, subject, operator, trace, audit and source workload come only from verified ET/transport context.

SRM inbound trusted admission establishes the private current-hop HUMAN proof required by the already prepared SRM→Item Master caller. `UpsertSupplierOffering` then calls only Item Master `ResolvePurchasableItem` with `HUMAN_OBO`; its manual fake `GrpcRequestContextStore` bridge and body tenant authority are removed. SRM→Party remains the already accepted pure `MACHINE_ROOT` composition, with no identity, error or fallback change. Management mutation and success audit envelope remain in one Prisma transaction; audit failure rolls back the mutation. Current uniqueness, upsert convergence, retry, schema, event/outbox and business state rules remain unchanged.

Procurement's former reuse of `GetSupplier` and `ListSupplierOfferingsBySupplier` through generic transport and legacy body/metadata authority was retired in favor of a Procurement-owned dedicated SRM client, target-neutral Common `InternalTrustedGrpcCaller` with `executionSource=HUMAN_OBO`, and the two exact INTERNAL methods. The accepted SRM slice prepared that producer/client and proved fail-closed behavior; the accepted Procurement integration at `62b954ea53de051be640ab5506c73cfc33d23259` established the verified HUMAN current-hop private scope and activated the exact Procurement→SRM path. SRM server semantics remain unchanged, with no legacy fallback or background-without-user path.

The live raw `srm-smoke.mjs` entry and package `smoke` command are deleted rather than reclassified as MACHINE. `srm-smoke-lib.mjs` and `srm-smoke.spec.mjs` remain isolated business/audit tests after authority payload removal; future live smoke enters Gateway HTTP with a test HUMAN session. Procurement raw smoke evidence must not establish SRM authority and is adjusted only as needed to remove direct legacy SRM invocation. No worker, Cron, Robot, AI or ActionGrant caller is admitted.

The literal Permission Jest gate explicitly selects the package's canonical `jest.config.js` only to disambiguate the test runner; this changes no production compiler or runtime contract.

```yaml
srmTrustedGrpcImplementationLease:
  totalTrackedWriterPaths: 83
  stateCounts: { EXISTING: 67, NEW_TARGET: 16 }
  trackedWriterPaths:
    srmProtoAndPermissionContract:
      - { state: EXISTING, path: src/common/src/contracts/srm_service/srm.proto }
      - { state: NEW_TARGET, path: src/common/src/contracts/srm_service/srm.contract.spec.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/permission-catalog.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/sync-permission-codes.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/generate-common-permission-codes.ts }
      - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-foundation.seed.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/srm/index.ts }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/srm/management.permission-codes.ts }
      - { state: NEW_TARGET, path: src/common/src/authorization/permission-codes/srm/internal.permission-codes.ts }

    gatewaySrmHumanProducer:
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/index.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-srm-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-srm-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.spec.ts }

    gatewaySrmAdaptersAndHttp:
      - { state: EXISTING, path: src/services/api-gateway/src/modules/srm-service/srm-service.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/srm-service/adapters/srm-grpc-context.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/srm-service/adapters/supplier-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/srm-service/adapters/supplier-management-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/srm-service/supplier-management.service.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/srm-service/supplier-management.service.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/srm-service/interface/http/controllers/supplier-management.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/srm-service/interface/http/controllers/supplier-management.controller.spec.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/modules/srm-service/adapters/srm-dedicated-client.spec.ts }

    srmTrustedInboundRuntime:
      - { state: EXISTING, path: src/services/business/srm-service/src/main.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/modules/srm-query.module.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/modules/srm-management.module.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/modules/srm-infrastructure.module.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/modules/srm-trusted-execution.module.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/interfaces/grpc/supplier-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/interfaces/grpc/supplier-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/interfaces/grpc/supplier-rpc-context.validator.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/interfaces/grpc/supplier-grpc.presenter.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/application/services/srm-audit.service.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/common/errors/srm.errors.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/interfaces/grpc/srm-internal-query.grpc.controller.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/application/queries/resolve-active-supplier.query.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/application/queries/resolve-active-supplier.handler.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/application/queries/resolve-active-supplier-offering.query.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/src/application/queries/resolve-active-supplier-offering.handler.ts }

    srmSecurityAuditAndLegacySmoke:
      - { state: EXISTING, path: src/services/business/srm-service/test/l1/srm-service.behavior.spec.ts }
      - { state: EXISTING, path: src/services/business/srm-service/test/l3/srm-grpc-context.spec.ts }
      - { state: EXISTING, path: src/services/business/srm-service/test/l3/srm-grpc-surface.spec.ts }
      - { state: EXISTING, path: src/services/business/srm-service/test/l3/srm-app-module.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/srm-service/test/l3/srm-trusted-grpc-security.spec.ts }
      - { state: EXISTING, path: src/services/business/srm-service/jest.config.js }
      - { state: EXISTING, path: src/services/business/srm-service/package.json }
      - { state: EXISTING, path: src/services/business/srm-service/scripts/srm-smoke.mjs }
      - { state: EXISTING, path: src/services/business/srm-service/scripts/srm-smoke-lib.mjs }
      - { state: EXISTING, path: src/services/business/srm-service/scripts/srm-smoke.spec.mjs }

    srmItemMasterHumanOboActivation:
      - { state: EXISTING, path: src/services/business/srm-service/src/infrastructure/adapters/item-master-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/infrastructure/adapters/item-master-trusted-grpc.client.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/infrastructure/adapters/srm-item-master-execution-token-exchange.client.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/infrastructure/adapters/srm-item-master-trusted-grpc-execution.producer.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/infrastructure/adapters/srm-item-master-trusted-grpc-execution.producer.spec.ts }
      - { state: EXISTING, path: src/services/business/srm-service/test/l1/item-master-trusted-grpc.client.spec.ts }

    srmPartyMachineRegression:
      - { state: EXISTING, path: src/services/business/srm-service/src/infrastructure/adapters/party-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/infrastructure/adapters/party-trusted-grpc.client.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/infrastructure/adapters/srm-party-trusted-grpc-execution.producer.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/infrastructure/adapters/srm-party-trusted-grpc-execution.producer.spec.ts }
      - { state: EXISTING, path: src/services/business/srm-service/test/l1/party-trusted-grpc.client.spec.ts }

    procurementSrmHumanOboPreparation:
      - { state: EXISTING, path: src/services/business/procurement-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/modules/procurement-infrastructure.module.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/jest.config.js }
      - { state: EXISTING, path: src/services/business/procurement-service/src/application/ports/supplier-reference-lookup.port.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/infrastructure/adapters/supplier-query.grpc.adapter.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/test/l3/supplier-query.grpc.adapter.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/src/infrastructure/adapters/srm-internal-trusted-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/src/infrastructure/adapters/procurement-srm-execution-token-exchange.client.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/src/infrastructure/adapters/procurement-srm-trusted-grpc-execution.producer.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/src/infrastructure/adapters/procurement-srm-trusted-grpc-execution.producer.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/test/l1/srm-trusted-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/package.json }
      - { state: EXISTING, path: src/services/business/procurement-service/scripts/procurement-smoke.mjs }
      - { state: EXISTING, path: src/services/business/procurement-service/scripts/procurement-smoke-lib.mjs }
      - { state: EXISTING, path: src/services/business/procurement-service/scripts/procurement-smoke.spec.mjs }

    stableDocConsistency:
      - { state: EXISTING, path: docs/architecture/collaborations/item-master-sales-mes-wms-srm.md }
      - { state: EXISTING, path: docs/architecture/services/index.md }
      - { state: EXISTING, path: docs/plans/designs/srm-service-design.md }

  ignoredGeneratedOutputs:
    - path: src/common/src/generated/srm_service/srm.ts
      input: src/common/src/contracts/srm_service/srm.proto
      command: pnpm proto:regen

  protectedByDefault:
    - SRM application/domain/repository/Prisma/schema/business rules not listed above
    - Procurement inbound trusted-gRPC cutover, business RPCs, handlers, schema and runtime activation before its own packet
    - SRM Party MACHINE_ROOT identity/contract and Party service runtime
    - Item Master contract/runtime and every outbound service other than the exact SRM activation above
    - Common/Auth/Identity/Permission OBO foundation except the exact SRM Codes and generated Code outputs listed above
    - event catalog, producer, consumer, outbox, inbox, package lock and deployment configuration
    - AI, ActionGrant, DELEGATED, background-without-user and every speculative caller or capability

  focusedAcceptanceCommands:
    - pnpm proto:lint
    - pnpm proto:regen
    - node scripts/architecture/trusted-grpc-signature-inventory.mjs
    - pnpm --filter permission-service run permission-codes:generate-common
    - pnpm --filter @oes/common build
    - pnpm --filter api-gateway build
    - pnpm --filter srm-service build
    - pnpm --filter procurement-service build
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/common/src/contracts/srm_service/srm.contract.spec.ts
    - pnpm --filter permission-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l1/permission-foundation.seed.spec.ts
    - pnpm --filter api-gateway exec jest --runInBand --runTestsByPath src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts src/common/grpc/gateway-srm-grpc.client.spec.ts src/modules/srm-service/adapters/srm-dedicated-client.spec.ts src/modules/srm-service/supplier-management.service.spec.ts src/modules/srm-service/interface/http/controllers/supplier-management.controller.spec.ts
    - pnpm --filter srm-service exec jest --config jest.config.js --runInBand --runTestsByPath src/infrastructure/adapters/srm-item-master-trusted-grpc-execution.producer.spec.ts src/infrastructure/adapters/srm-party-trusted-grpc-execution.producer.spec.ts test/l1/item-master-trusted-grpc.client.spec.ts test/l1/party-trusted-grpc.client.spec.ts test/l1/srm-service.behavior.spec.ts test/l3/srm-grpc-context.spec.ts test/l3/srm-grpc-surface.spec.ts test/l3/srm-app-module.spec.ts test/l3/srm-trusted-grpc-security.spec.ts
    - pnpm --filter procurement-service exec jest --config jest.config.js --runInBand --runTestsByPath src/infrastructure/adapters/procurement-srm-trusted-grpc-execution.producer.spec.ts test/l1/srm-trusted-grpc.client.spec.ts test/l3/supplier-query.grpc.adapter.spec.ts
    - node --test src/services/business/srm-service/scripts/srm-smoke.spec.mjs src/services/business/procurement-service/scripts/procurement-smoke.spec.mjs
```

Acceptance proves 15/15 unique declarations and zero dual-mode methods; exact 13 BUSINESS plus two Procurement HUMAN_OBO INTERNAL Code/audience/terminal/actor/tenant/`cnf` rules; 46/46 authority reservations in 13 groups; claims-derived business and audit context; Gateway dedicated SRM client and dual-Code supplier-detail aggregation; SRM→Item Master HUMAN_OBO activation with no fake local context; byte-stable SRM→Party MACHINE_ROOT behavior; Procurement dedicated caller preparation that remains inactive until verified Procurement ingress; no raw smoke authority, generic SRM registration, legacy body/metadata or fallback; stable SRM documents contain no conflicting future/optional offering guidance and the historical workspace is superseded; unchanged schema/events/business rules; exact 83-path scope; and successful proto, Code generation, build, focused test, UTF-8, link, YAML and diff gates.

### 9.13 Procurement 21+1-RPC frozen cutover lease

Status: `IMPLEMENTED_VERIFIED` at `62b954ea53de051be640ab5506c73cfc33d23259`. The accepted implementation used 50 of the final 93 leased paths, passed the exact L2 audit transaction closure with 2/2 tests, migrated all 21 existing Procurement RPCs and activated the exact Procurement→Item Master/SRM HUMAN_OBO paths. WMS integration at `108ca92602b729a9dd1271c88ccdef3f58efe800` subsequently activated the frozen WMS→Procurement caller without changing Procurement server semantics. The slice added exactly one narrow WMS receipt-reference eligibility projection and no PR/PO/receiving business state, persistence, event, idempotency key, retry policy, Gateway route or WMS capability.

All 21 existing methods remain `BUSINESS / HUMAN / WEB`, require `aud=urn:oes:service:procurement-service`, exact mTLS/`cnf` binding and the exact existing Code below, and reject MACHINE, DELEGATED, SELF_SERVICE, non-WEB sessions and legacy body/ordinary-metadata authority:

| RPC | Exact Code |
| --- | --- |
| `GetPurchaseRequest` | `procurement.purchase_request.get_by_id` |
| `SearchPurchaseRequests` | `procurement.purchase_request.list` |
| `CreatePurchaseRequest` | `procurement.purchase_request.create` |
| `UpdatePurchaseRequestDraft` | `procurement.purchase_request.update_draft` |
| `SubmitPurchaseRequest` | `procurement.purchase_request.submit` |
| `DecidePurchaseRequest` | `procurement.purchase_request.decide` |
| `CancelPurchaseRequest` | `procurement.purchase_request.cancel` |
| `ConvertPurchaseRequestToPurchaseOrder` | `procurement.purchase_request.convert_to_order` |
| `GetPurchaseOrder` | `procurement.purchase_order.get_by_id` |
| `SearchPurchaseOrders` | `procurement.purchase_order.list` |
| `ListPurchaseOrderChanges` | `procurement.purchase_order_change.list` |
| `CreatePurchaseOrderDraft` | `procurement.purchase_order.create_draft` |
| `UpdatePurchaseOrderDraft` | `procurement.purchase_order.update_draft` |
| `IssuePurchaseOrder` | `procurement.purchase_order.issue` |
| `ConfirmSupplierAcknowledgement` | `procurement.purchase_order.confirm_acknowledgement` |
| `ApplyPurchaseOrderChange` | `procurement.purchase_order.apply_change` |
| `CancelPurchaseOrder` | `procurement.purchase_order.cancel` |
| `GetReceivingExpectation` | `procurement.receiving_expectation.get_by_id` |
| `SearchReceivingExpectations` | `procurement.receiving_expectation.list` |
| `CreateReceivingExpectation` | `procurement.receiving_expectation.create` |
| `RecordReceivingDiscrepancyResolution` | `procurement.receiving_discrepancy.record_resolution` |

Gateway is the sole production caller class for these methods. The existing 21 HTTP routes remain and no new route is added. Gateway derives claims from the authenticated HUMAN session, exchanges for a Procurement-audience ET and uses one dedicated Procurement mTLS client. Generic `SERVICE_NAMES.PROCUREMENT` registration, `GrpcMetadataPropagationFactory`, request body context, `requestId/traceId` fallback and ordinary metadata authority are migration targets and are absent after activation.

The new `ProcurementInternalQueryService` contains exactly one `INTERNAL / HUMAN_OBO` method:

| RPC | Exact new INTERNAL Code | Exact actor workload | Procurement-owned rule |
| --- | --- | --- | --- |
| `ResolveReceivingExpectationForReceipt` | `procurement.internal.receiving_expectation.resolve_for_receipt` | `wms-service` | ReceivingExpectation exists in the verified tenant |

The request contains only `receiving_expectation_id=1`. The response contains only `receiving_expectation_id=1`, `purchase_order_id=2`, `purchase_order_line_id=3`, `target_warehouse_id=4`, `open_quantity=5` and `status=6`. `NOT_FOUND` means no tenant-visible expectation. The method does not add an active/open precondition, close an expectation, resolve a discrepancy or change WMS receipt/inventory truth. It preserves the verified HUMAN subject and tenant, requires `act` to identify exact direct `wms-service` SYSTEM MACHINE workload, uses the Procurement audience/certificate binding, and rejects direct HUMAN without actor, pure MACHINE root, DELEGATED, TENANT MACHINE, unknown workload and wildcard issuance.

The 21 existing request messages delete and reserve exactly 82 authority fields: 21 `tenant_id`, 21 `operator_context`, 21 `trace_context`, 14 `audit_context` and five request `org_id` fields. The legacy `OperatorContext`, `TraceContext` and `AuditContext` messages reserve their eight nested field numbers/names, yielding 90 tombstones total. Existing business request numbers and response tenant/org projections remain byte-stable. Tenant, applicable org, subject/operator, trace and audit come only from verified ET/transport context.

Procurement trusted inbound establishes the private current-hop HUMAN proof and activates the already prepared Procurement→Item Master `ResolvePurchasableItem` and Procurement→SRM `ResolveActiveSupplier`/`ResolveActiveSupplierOffering` callers as `HUMAN_OBO`. Each uses its target audience, exact Procurement SYSTEM MACHINE actor and existing target INTERNAL Code. Missing proof/credential/ET, wrong audience/workload/certificate/tenant or denied Permission fail closed. No generic transport or legacy body/metadata fallback remains.

WMS no longer reuses Gateway-only `GetReceivingExpectation`. Its dedicated Procurement client, exchange client, producer and tests were prepared in the Procurement slice and activated at WMS integration `108ca92602b729a9dd1271c88ccdef3f58efe800` after WMS trusted inbound established verified HUMAN proof. The active path remains fail closed and retains no second legacy authority path. WMS receipt, inventory, schema and business behavior otherwise remain protected.

The raw direct `procurement-smoke.mjs` gRPC authority is retired with its package entry rather than reclassified as MACHINE. The smoke library/spec may remain isolated business/transaction evidence after authority payload removal; future live coverage enters Gateway HTTP with a test HUMAN session. Existing mutations and their successful audit envelope remain in one Prisma transaction so audit failure rolls back the mutation. The leased L2 fixture `test/l2/procurement-audit-transaction.spec.ts` must establish a verified HUMAN request context before exercising both existing success and rollback paths; it must not restore body/input authority fallback. Existing idempotency, retry, PR/PO/expectation state, schema, outbox/event and cross-domain ownership remain unchanged. No worker, Cron, Robot, AI or ActionGrant caller is admitted.

The audit proposal of `92 = 74 EXISTING + 18 NEW_TARGET` had the correct path total but misclassified the new Procurement internal contract document. Base `13dd6aa09f633d76c6c7eddd54decbaca2a79b25` proves the amended closed lease is `93 = 74 EXISTING + 19 NEW_TARGET`:

```yaml
procurementTrustedGrpcImplementationLease:
  totalTrackedWriterPaths: 93
  stateCounts: { EXISTING: 74, NEW_TARGET: 19 }
  trackedWriterPaths:
    procurementProtoAndPermissionContract:
      - { state: EXISTING, path: src/common/src/contracts/procurement_service/procurement.proto }
      - { state: NEW_TARGET, path: src/common/src/contracts/procurement_service/procurement.contract.spec.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/permission-catalog.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/sync-permission-codes.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/generate-common-permission-codes.ts }
      - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-foundation.seed.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/procurement/index.ts }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/procurement/management.permission-codes.ts }
      - { state: NEW_TARGET, path: src/common/src/authorization/permission-codes/procurement/internal.permission-codes.ts }

    gatewayProcurementHumanProducer:
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/index.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-procurement-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-procurement-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/procurement-service/procurement-service.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/procurement-service/adapters/procurement-grpc-context.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/procurement-service/adapters/procurement-management-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/procurement-service/adapters/procurement-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/procurement-service/procurement.service.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/procurement-service/procurement.service.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/procurement-service/interface/http/controllers/procurement.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/procurement-service/interface/http/controllers/procurement.controller.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/procurement-service/interface/http/dtos/procurement.dto.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/modules/procurement-service/adapters/procurement-dedicated-client.spec.ts }

    procurementTrustedInboundRuntime:
      - { state: EXISTING, path: src/services/business/procurement-service/src/main.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/modules/procurement-infrastructure.module.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/modules/procurement-management.module.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/modules/procurement-query.module.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/src/modules/procurement-trusted-execution.module.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/interfaces/grpc/procurement-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/interfaces/grpc/procurement-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/interfaces/grpc/procurement-rpc-context.validator.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/interfaces/grpc/procurement-grpc.presenter.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/src/interfaces/grpc/procurement-internal-query.grpc.controller.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/src/application/queries/resolve-receiving-expectation-for-receipt.query.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/src/application/queries/resolve-receiving-expectation-for-receipt.handler.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/application/services/procurement-audit.service.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/common/errors/procurement.errors.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/test/l1/procurement-service.behavior.spec.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/test/l3/procurement-grpc-context.spec.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/test/l3/procurement-grpc-surface.spec.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/test/l2/procurement-audit-transaction.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/test/l3/procurement-app-module.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/procurement-service/test/l3/procurement-trusted-grpc-security.spec.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/jest.config.js }
      - { state: EXISTING, path: src/services/business/procurement-service/package.json }
      - { state: EXISTING, path: src/services/business/procurement-service/scripts/procurement-smoke.mjs }
      - { state: EXISTING, path: src/services/business/procurement-service/scripts/procurement-smoke-lib.mjs }
      - { state: EXISTING, path: src/services/business/procurement-service/scripts/procurement-smoke.spec.mjs }

    procurementItemMasterHumanOboActivation:
      - { state: EXISTING, path: src/services/business/procurement-service/src/infrastructure/adapters/item-master-query.grpc.adapter.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/infrastructure/adapters/item-master-trusted-grpc.client.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/infrastructure/adapters/procurement-item-master-execution-token-exchange.client.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/infrastructure/adapters/procurement-item-master-trusted-grpc-execution.producer.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/infrastructure/adapters/procurement-item-master-trusted-grpc-execution.producer.spec.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/test/l1/item-master-trusted-grpc.client.spec.ts }

    procurementSrmHumanOboActivation:
      - { state: EXISTING, path: src/services/business/procurement-service/src/infrastructure/adapters/supplier-query.grpc.adapter.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/infrastructure/adapters/srm-internal-trusted-grpc.client.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/infrastructure/adapters/procurement-srm-execution-token-exchange.client.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/infrastructure/adapters/procurement-srm-trusted-grpc-execution.producer.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/infrastructure/adapters/procurement-srm-trusted-grpc-execution.producer.spec.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/test/l1/srm-trusted-grpc.client.spec.ts }

    wmsProcurementHumanOboPreparation:
      - { state: EXISTING, path: src/services/business/wms-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/modules/wms-infrastructure.module.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/application/ports/receiving-expectation-lookup.port.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/application/commands/post-receipt.handler.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/infrastructure/adapters/procurement-receiving-expectation.grpc.adapter.ts }
      - { state: NEW_TARGET, path: src/services/business/wms-service/src/infrastructure/adapters/procurement-internal-trusted-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/business/wms-service/src/infrastructure/adapters/wms-procurement-execution-token-exchange.client.ts }
      - { state: NEW_TARGET, path: src/services/business/wms-service/src/infrastructure/adapters/wms-procurement-trusted-grpc-execution.producer.ts }
      - { state: NEW_TARGET, path: src/services/business/wms-service/src/infrastructure/adapters/wms-procurement-trusted-grpc-execution.producer.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/wms-service/test/l1/procurement-trusted-grpc.client.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/wms-service/test/l3/procurement-receiving-expectation.grpc.adapter.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/wms-service/test/l3/wms-app-module.spec.ts }
      - { state: EXISTING, path: src/services/business/wms-service/test/l1/wms-service.behavior.spec.ts }
      - { state: EXISTING, path: src/services/business/wms-service/jest.config.js }

    stableTruthAndContractConsistency:
      - { state: EXISTING, path: docs/architecture/services/procurement-service.md }
      - { state: EXISTING, path: docs/architecture/services/wms-service.md }
      - { state: EXISTING, path: docs/architecture/collaborations/procurement-srm-item-wms-finance.md }
      - { state: EXISTING, path: docs/architecture/services/index.md }
      - { state: EXISTING, path: docs/contracts/procurement-service/README.md }
      - { state: NEW_TARGET, path: docs/contracts/procurement-service/internal-query.md }
      - { state: EXISTING, path: docs/contracts/procurement-service/purchase-request-query.md }
      - { state: EXISTING, path: docs/contracts/procurement-service/purchase-request-management.md }
      - { state: EXISTING, path: docs/contracts/procurement-service/purchase-order-query.md }
      - { state: EXISTING, path: docs/contracts/procurement-service/purchase-order-management.md }
      - { state: EXISTING, path: docs/contracts/procurement-service/receiving-expectation.md }
      - { state: EXISTING, path: docs/contracts/wms-service/receipt-management.md }
      - { state: EXISTING, path: docs/plans/features/trusted-grpc-execution-context.md }

  ignoredGeneratedOutputs:
    - path: src/common/src/generated/procurement_service/procurement.ts
      input: src/common/src/contracts/procurement_service/procurement.proto
      command: pnpm proto:regen

  protectedByDefault:
    - Procurement application/domain/repository/Prisma/schema/business rules not listed above
    - WMS trusted inbound cutover, all other WMS callers/RPCs and activation before its own packet
    - Item Master and SRM target contracts/runtime beyond the exact prepared caller activation above
    - Common/Auth/Identity/Permission OBO foundation except the exact Procurement Code/generated output paths listed above
    - event catalog, producer, consumer, outbox, inbox, package lock and deployment configuration
    - AI, ActionGrant, DELEGATED, background-without-user and every speculative caller or capability

  focusedAcceptanceCommands:
    - pnpm proto:lint
    - pnpm proto:regen
    - node scripts/architecture/trusted-grpc-signature-inventory.mjs
    - pnpm --filter permission-service run permission-codes:generate-common
    - pnpm --filter @oes/common build
    - pnpm --filter api-gateway build
    - pnpm --filter procurement-service build
    - pnpm --filter wms-service build
    - pnpm --filter procurement-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l2/procurement-audit-transaction.spec.ts
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/common/src/contracts/procurement_service/procurement.contract.spec.ts
    - pnpm --filter permission-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l1/permission-foundation.seed.spec.ts
    - pnpm --filter api-gateway exec jest --runInBand --runTestsByPath src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts src/common/grpc/gateway-procurement-grpc.client.spec.ts src/modules/procurement-service/adapters/procurement-dedicated-client.spec.ts src/modules/procurement-service/procurement.service.spec.ts src/modules/procurement-service/interface/http/controllers/procurement.controller.spec.ts
    - pnpm --filter procurement-service exec jest --config jest.config.js --runInBand --runTestsByPath src/infrastructure/adapters/procurement-item-master-trusted-grpc-execution.producer.spec.ts src/infrastructure/adapters/procurement-srm-trusted-grpc-execution.producer.spec.ts test/l1/item-master-trusted-grpc.client.spec.ts test/l1/srm-trusted-grpc.client.spec.ts test/l1/procurement-service.behavior.spec.ts test/l3/procurement-grpc-context.spec.ts test/l3/procurement-grpc-surface.spec.ts test/l3/procurement-app-module.spec.ts test/l3/procurement-trusted-grpc-security.spec.ts
    - pnpm --filter wms-service exec jest --config jest.config.js --runInBand --runTestsByPath src/infrastructure/adapters/wms-procurement-trusted-grpc-execution.producer.spec.ts test/l1/procurement-trusted-grpc.client.spec.ts test/l1/wms-service.behavior.spec.ts test/l3/procurement-receiving-expectation.grpc.adapter.spec.ts test/l3/wms-app-module.spec.ts
    - node --test src/services/business/procurement-service/scripts/procurement-smoke.spec.mjs
```

Acceptance proves 22/22 unique declarations and zero dual-mode methods; exact 21 BUSINESS plus one WMS HUMAN_OBO INTERNAL Code/audience/terminal/actor/tenant/`cnf` rule; 82 request authority fields plus eight nested legacy-context fields reserved as 90/90 tombstones; unchanged business field numbers and 21 Gateway routes; claims-derived business/audit context; Gateway dedicated Procurement client; Procurement→Item Master and Procurement→SRM HUMAN_OBO activation; WMS dedicated caller activation through accepted WMS trusted ingress at `108ca92602b729a9dd1271c88ccdef3f58efe800`; verified-HUMAN L2 success/rollback evidence with no input fallback; no raw smoke authority, generic Procurement registration, legacy body/metadata or fallback; unchanged transaction/audit/idempotency/schema/events/business rules; exact 93-path scope; and successful proto, Code generation, build, focused test, UTF-8, link, YAML and diff gates.

### 9.14 WMS 15-RPC frozen cutover lease

Status: `IMPLEMENTED_VERIFIED` at `108ca92602b729a9dd1271c88ccdef3f58efe800` (parent `8982cb02f86c1261ad32825ef766129258db6202`). The accepted implementation used 38 of the frozen 70 paths with zero paths outside the lease, migrated all 15 BUSINESS HUMAN WEB RPCs and 15 Gateway routes with the exact five Codes and 63/63 tombstones, enabled Token-only WMS ingress and the dedicated Gateway WMS client, and activated WMS→Item Master `ResolveStockableItem` plus WMS→Procurement `ResolveReceivingExpectationForReceipt` as HUMAN_OBO. Proto/inventory finished at `54/596/0`; Common, Gateway, WMS, Item Master and Procurement builds passed; Common 3, Gateway 15, WMS 57, WMS L2 2 and smoke 1 tests passed; the root final matrix passed before one ff-only main integration and one main push. This packet adds no WMS RPC, Permission Code, Gateway route, owner object, business rule, schema, event/outbox, idempotency key or retry behavior.

All 15 existing methods are `BUSINESS / HUMAN / WEB`, require `aud=urn:oes:service:wms-service`, exact mTLS/`cnf` binding, WEB terminal and the exact existing Code below, and reject MACHINE, DELEGATED, SELF_SERVICE, non-WEB sessions, non-Gateway direct workloads and legacy body/ordinary-metadata authority:

| RPC | Exact existing Code |
| --- | --- |
| `GetWarehouse` | `wms.warehouse.read` |
| `ListWarehouses` | `wms.warehouse.read` |
| `GetLocation` | `wms.location.read` |
| `ListLocations` | `wms.location.read` |
| `GetReceipt` | `wms.receipt.read` |
| `SearchReceipts` | `wms.receipt.read` |
| `GetReceiptLine` | `wms.receipt.read` |
| `SearchReceiptLines` | `wms.receipt.read` |
| `CreateReceiptDraft` | `wms.receipt.manage` |
| `AddOrReplaceReceiptLines` | `wms.receipt.manage` |
| `PostReceipt` | `wms.receipt.manage` |
| `CancelReceiptDraft` | `wms.receipt.manage` |
| `SearchStockLedgerEntries` | `wms.inventory.read` |
| `GetInventoryBalance` | `wms.inventory.read` |
| `SearchInventoryBalances` | `wms.inventory.read` |

Gateway remains the only production caller and preserves exactly the following 15 authenticated HTTP routes. The `:tenantId` route selection is checked against the authenticated session/Permission decision at Gateway; it is not forwarded as gRPC body authority:

| HTTP route below `/wms/tenants/:tenantId` | RPC |
| --- | --- |
| `GET /warehouses` | `ListWarehouses` |
| `GET /warehouses/:warehouseId` | `GetWarehouse` |
| `GET /locations` | `ListLocations` |
| `GET /locations/:locationId` | `GetLocation` |
| `GET /receipts` | `SearchReceipts` |
| `GET /receipts/:receiptId` | `GetReceipt` |
| `GET /receipt-lines` | `SearchReceiptLines` |
| `GET /receipt-lines/:receiptLineId` | `GetReceiptLine` |
| `POST /receipts` | `CreateReceiptDraft` |
| `PUT /receipts/:receiptId/lines` | `AddOrReplaceReceiptLines` |
| `POST /receipts/:receiptId/post` | `PostReceipt` |
| `POST /receipts/:receiptId/cancel` | `CancelReceiptDraft` |
| `GET /stock-ledger-entries` | `SearchStockLedgerEntries` |
| `GET /inventory-balance` | `GetInventoryBalance` |
| `GET /inventory-balances` | `SearchInventoryBalances` |

Gateway derives tenant/org/subject/session/trace/audit from the authenticated HUMAN session and Permission decision, exchanges for a WMS-audience ET, and uses one dedicated WMS mTLS client. Generic `SERVICE_NAMES.WMS` registration, `GrpcMetadataPropagationFactory`, `toOperatorScopedMetadataInput`, `wms-grpc-context.ts`, request body context and requestId/traceId fallback are migration targets and are absent after cutover. WMS normal admission verifies Token/mTLS locally and makes no synchronous Auth call.

The 15 request messages delete and reserve exactly 55 authority fields: 15 `tenant_id`, 15 `operator_context`, 15 `trace_context`, four management `audit_context` and six request `org_id` fields. The six request `org_id` fields are `ListWarehouses.org_id=4`, `SearchReceipts.org_id=4`, `SearchReceiptLines.org_id=4`, `CreateReceiptDraft.org_id=2`, `SearchStockLedgerEntries.org_id=4` and `SearchInventoryBalances.org_id=4`. The legacy `OperatorContext`, `TraceContext` and `AuditContext` messages reserve their eight nested field numbers/names, yielding 63/63 tombstones. Existing business request numbers and response/WMS-owned record tenant/org projections remain unchanged. Tenant, applicable org, subject/operator, trace and audit come only from verified ET/transport context.

WMS trusted ingress establishes the private current-hop HUMAN proof and activates both existing prepared outbound paths in this order:

1. Token-only WMS guard/interceptor/context and Gateway dedicated WMS client are proven first.
2. WMS→Item Master activates only `ResolveStockableItem` with Code `item_master.internal.stockable_item.resolve`, Item Master audience and exact `wms-service` SYSTEM MACHINE actor.
3. WMS→Procurement activates only `ResolveReceivingExpectationForReceipt` with Code `procurement.internal.receiving_expectation.resolve_for_receipt`, Procurement audience and the same exact actor.
4. The real composition gate proves Gateway HUMAN session → WMS ET → verified WMS request scope → Auth OBO exchange → target ET → Item Master/Procurement guard, including `sub`, tenant, `act`, audience, expiry, Permission, trace and `cnf` continuity.

Each next-hop ET preserves the verified HUMAN subject/tenant and records exact `wms-service` SYSTEM MACHINE actor attribution; callers never submit actor or tenant authority. Missing proof/credential/ET, wrong subject/tenant/audience/workload/certificate/Code, expired Token, direct HUMAN without actor, MACHINE root, DELEGATED, TENANT MACHINE, body injection and Permission denial all fail closed. No background-without-user path is opened.

The raw `wms-smoke.mjs` direct gRPC authority and package `smoke` command are retired rather than reclassified as MACHINE. `wms-smoke-lib.mjs` and `wms-smoke.spec.mjs` may remain isolated business/transaction evidence only after authority payload removal; future live coverage enters Gateway HTTP with a test HUMAN session. Existing receipt mutation, successful audit envelope and rollback semantics remain unchanged; the dedicated L2 fixture must establish a real verified HUMAN request context and prove both success and rollback without restoring input/body authority. Receipt, inventory, Prisma schema, repositories, transaction boundaries, projections, events/outbox and all business invariants remain protected.

| Verification slice | Required proof |
| --- | --- |
| 15 BUSINESS RPCs | exact Code, WMS audience, WEB HUMAN, direct Gateway workload and certificate binding pass; wrong Code/audience/terminal/workload/certificate and every MACHINE/DELEGATED/SELF_SERVICE shape fail |
| wire/context | 55 request plus eight nested tombstones, unchanged business field numbers, claims-derived tenant/org/operator/trace/audit and body/metadata injection rejection |
| Gateway | all 15 HTTP routes use the dedicated WMS client and ET producer; both root and feature generic WMS registrations plus legacy context factory are absent |
| WMS→Item Master | exact `ResolveStockableItem` HUMAN_OBO success plus missing proof, actor/workload, tenant, audience, expiry, Permission and `cnf` negatives |
| WMS→Procurement | exact `ResolveReceivingExpectationForReceipt` HUMAN_OBO success with the same negative matrix and no `GetReceivingExpectation` reuse |
| persistence/audit | verified-HUMAN L2 success and rollback paths preserve the existing transaction boundary; no authority fallback enters fixtures |
| legacy/closure | raw live smoke authority and package command absent, isolated smoke evidence clean, lease exact, build/proto/inventory/link/YAML/UTF-8/diff gates pass |

The closed implementation writer lease is `70 = 63 EXISTING + 7 NEW_TARGET`:

```yaml
wmsTrustedGrpcImplementationLease:
  totalTrackedWriterPaths: 70
  stateCounts: { EXISTING: 63, NEW_TARGET: 7 }
  trackedWriterPaths:
    wmsProtoContract:
      - { state: EXISTING, path: src/common/src/contracts/wms_service/wms.proto }
      - { state: NEW_TARGET, path: src/common/src/contracts/wms_service/wms.contract.spec.ts }

    gatewayWmsHumanProducer:
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/index.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-wms-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-wms-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/wms-service/wms-service.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/wms-service/adapters/wms-grpc-context.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/wms-service/adapters/wms-management-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/wms-service/adapters/wms-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/wms-service/wms.service.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/wms-service/wms.service.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/wms-service/interface/http/controllers/wms.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/wms-service/interface/http/controllers/wms.controller.spec.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/modules/wms-service/adapters/wms-dedicated-client.spec.ts }

    wmsTrustedInboundRuntime:
      - { state: EXISTING, path: src/services/business/wms-service/src/main.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/modules/wms-infrastructure.module.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/modules/wms-management.module.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/modules/wms-query.module.ts }
      - { state: NEW_TARGET, path: src/services/business/wms-service/src/modules/wms-trusted-execution.module.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/interfaces/grpc/wms-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/interfaces/grpc/wms-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/interfaces/grpc/wms-rpc-context.validator.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/application/services/wms-audit.service.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/common/errors/wms.errors.ts }
      - { state: EXISTING, path: src/services/business/wms-service/test/l1/wms-service.behavior.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/wms-service/test/l2/wms-audit-transaction.spec.ts }
      - { state: EXISTING, path: src/services/business/wms-service/test/l3/wms-grpc-context.spec.ts }
      - { state: EXISTING, path: src/services/business/wms-service/test/l3/wms-grpc-surface.spec.ts }
      - { state: EXISTING, path: src/services/business/wms-service/test/l3/wms-app-module.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/wms-service/test/l3/wms-trusted-grpc-security.spec.ts }
      - { state: EXISTING, path: src/services/business/wms-service/jest.config.js }
      - { state: EXISTING, path: src/services/business/wms-service/package.json }
      - { state: EXISTING, path: src/services/business/wms-service/scripts/wms-smoke.mjs }
      - { state: EXISTING, path: src/services/business/wms-service/scripts/wms-smoke-lib.mjs }
      - { state: EXISTING, path: src/services/business/wms-service/scripts/wms-smoke.spec.mjs }

    wmsItemMasterHumanOboActivation:
      - { state: EXISTING, path: src/services/business/wms-service/src/application/ports/stockable-item-lookup.port.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/application/commands/post-receipt.handler.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/infrastructure/adapters/item-master-stockable-query.grpc.adapter.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/infrastructure/adapters/item-master-trusted-grpc.client.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/infrastructure/adapters/wms-item-master-execution-token-exchange.client.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/infrastructure/adapters/wms-item-master-trusted-grpc-execution.producer.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/infrastructure/adapters/wms-item-master-trusted-grpc-execution.producer.spec.ts }
      - { state: EXISTING, path: src/services/business/wms-service/test/l1/item-master-trusted-grpc.client.spec.ts }

    wmsProcurementHumanOboActivation:
      - { state: EXISTING, path: src/services/business/wms-service/src/application/ports/receiving-expectation-lookup.port.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/infrastructure/adapters/procurement-receiving-expectation.grpc.adapter.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/infrastructure/adapters/procurement-internal-trusted-grpc.client.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/infrastructure/adapters/wms-procurement-execution-token-exchange.client.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/infrastructure/adapters/wms-procurement-trusted-grpc-execution.producer.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/infrastructure/adapters/wms-procurement-trusted-grpc-execution.producer.spec.ts }
      - { state: EXISTING, path: src/services/business/wms-service/test/l1/procurement-trusted-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/business/wms-service/test/l3/procurement-receiving-expectation.grpc.adapter.spec.ts }

    stableTruthAndContractConsistency:
      - { state: EXISTING, path: docs/architecture/services/wms-service.md }
      - { state: EXISTING, path: docs/architecture/services/procurement-service.md }
      - { state: EXISTING, path: docs/architecture/services/index.md }
      - { state: EXISTING, path: docs/architecture/collaborations/item-master-sales-mes-wms-srm.md }
      - { state: EXISTING, path: docs/architecture/collaborations/procurement-srm-item-wms-finance.md }
      - { state: EXISTING, path: docs/contracts/wms-service/README.md }
      - { state: EXISTING, path: docs/contracts/wms-service/warehouse-query.md }
      - { state: EXISTING, path: docs/contracts/wms-service/receipt-query.md }
      - { state: EXISTING, path: docs/contracts/wms-service/receipt-management.md }
      - { state: EXISTING, path: docs/contracts/wms-service/inventory-query.md }
      - { state: EXISTING, path: docs/contracts/procurement-service/README.md }
      - { state: EXISTING, path: docs/contracts/procurement-service/internal-query.md }
      - { state: EXISTING, path: docs/plans/designs/wms-service-design.md }
      - { state: EXISTING, path: docs/plans/features/trusted-grpc-execution-context.md }

  ignoredGeneratedOutputs:
    - path: src/common/src/generated/wms_service/wms.ts
      input: src/common/src/contracts/wms_service/wms.proto
      command: pnpm proto:regen

  protectedByDefault:
    - WMS application/domain/repository/Prisma/schema/business rules not listed above
    - Item Master and Procurement contracts/runtime beyond activating the exact existing callers above
    - Common/Auth/Identity/Permission OBO foundation and all existing WMS Permission Codes
    - MES, Sales, fulfillment, shipping, transfer, cycle-count, package-unit and every other WMS collaboration/RPC
    - event catalog, producer, consumer, outbox, inbox, package lock and deployment configuration
    - AI, ActionGrant, DELEGATED, background-without-user and every speculative caller or capability

  focusedAcceptanceCommands:
    - pnpm proto:lint
    - pnpm proto:regen
    - node scripts/architecture/trusted-grpc-signature-inventory.mjs
    - pnpm --filter @oes/common build
    - pnpm --filter api-gateway build
    - pnpm --filter wms-service build
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/common/src/contracts/wms_service/wms.contract.spec.ts
    - pnpm --filter api-gateway exec jest --runInBand --runTestsByPath src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts src/common/grpc/gateway-wms-grpc.client.spec.ts src/modules/wms-service/adapters/wms-dedicated-client.spec.ts src/modules/wms-service/wms.service.spec.ts src/modules/wms-service/interface/http/controllers/wms.controller.spec.ts
    - pnpm --filter wms-service exec jest --config jest.config.js --runInBand --runTestsByPath src/infrastructure/adapters/wms-item-master-trusted-grpc-execution.producer.spec.ts src/infrastructure/adapters/wms-procurement-trusted-grpc-execution.producer.spec.ts test/l1/item-master-trusted-grpc.client.spec.ts test/l1/procurement-trusted-grpc.client.spec.ts test/l1/wms-service.behavior.spec.ts test/l3/procurement-receiving-expectation.grpc.adapter.spec.ts test/l3/wms-grpc-context.spec.ts test/l3/wms-grpc-surface.spec.ts test/l3/wms-app-module.spec.ts test/l3/wms-trusted-grpc-security.spec.ts
    - pnpm --filter wms-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l2/wms-audit-transaction.spec.ts
    - node --test src/services/business/wms-service/scripts/wms-smoke.spec.mjs
```

Acceptance proves 15/15 unique BUSINESS declarations and zero dual-mode methods; exact five existing Code mappings, WMS audience, WEB terminal and direct Gateway workload; unchanged 15 Gateway routes; 55 request authority fields plus eight nested legacy-context fields reserved as 63/63 tombstones; unchanged business field numbers and response projections; token-only WMS ingress and claims-derived business/audit context; Gateway dedicated WMS client; WMS→Item Master and WMS→Procurement HUMAN_OBO activation with real subject/actor/audience/Permission/expiry/trace/`cnf` composition; verified-HUMAN L2 success/rollback evidence without input fallback; no raw smoke authority, generic WMS registration, legacy body/metadata or fallback; unchanged schema/events/business rules; exact 70-path scope; and successful proto, build, focused test, UTF-8, link, YAML and diff gates.


### 9.15 Auth / Identity / Permission / HR / TenantOrg atomic foundation group

Status: `IMPLEMENTED_VERIFIED` at `09dcb1279d22fa809023a69f2d8cfff090e3826d`. The five target services were implemented as the frozen irreducible caller cycle in one atomic candidate, with service-by-service review/build/focused tests and one simultaneous Token-only activation, cross-foundation caller activation and legacy deletion. Final evidence passed nine builds; 53 suites / 240 tests; Permission DI 3/3; Common mTLS/ET/certificate 34/34; Auth ET/OBO/MACHINE 63/63; Party 22/22; five Party caller compositions 27/27; proto/generation and inventory `54/596/0`; canonical formatting on 152 cumulative paths; atomic gate 6/6; and the exact 217-declaration counts `70/18/24/15/20`. CRM remains the sole remaining service and is unchanged by this packet.

#### 9.15.1 exact membership and declaration totals

The stable per-method tables are owned only by the five service truth sources and are incorporated here by reference to avoid a second service truth:

| Target | Frozen membership | Declaration result | Audience | Canonical Code inventory | Request tombstones |
| --- | ---: | --- | --- | ---: | ---: |
| Auth | 70 existing + five already integrated foundation RPCs | 12 `PUBLIC_CREDENTIAL`; 5 `PUBLIC_CONTINUATION`; 1 `PUBLIC_SESSION_SOURCE_VALIDATION`; 29 `SELF_SERVICE`; 23 `BUSINESS`; five preserved foundation admissions | `urn:oes:service:auth-service` | 12 existing Auth Codes | 15 |
| Identity | 41 baseline RPCs | 2 `SELF_SERVICE`; 1 preserved external-credential foundation admission; 38 `BUSINESS` | `urn:oes:service:identity-service` | 27 existing Identity Codes | 4 |
| Permission | 66 baseline RPCs | 7 `INTERNAL`; 59 `BUSINESS`; five later integrated RPCs protected outside the 66 | `urn:oes:service:permission-service` | 38 existing unique Permission Code literals (40 generated entries) + 6 exact INTERNAL transport Codes | 3 |
| HR | 15 RPCs | 15 `BUSINESS` | `urn:oes:service:hr-service` | 6 existing HR Codes | 10 |
| TenantOrg | 20 RPCs | 20 `BUSINESS` | `urn:oes:service:tenant-org-service` | 10 existing TenantOrg Codes | 0 |
| **Atomic group** | **217 declarations including the exact five foundation members** | **one declaration/admission per RPC; no dual mode** | **five exact target audiences** | **93 existing unique Code literals (95 generated entries) + 6 new internal transport Codes** | **32 direct request fields** |

The five additional foundation members are exactly Auth `ExchangeExecutionToken`, `GetExecutionTokenJwks`, `IssueMachineWorkloadSourceCredential`, `RevokeMachineWorkloadSourceCredential` plus Identity `ResolveMachinePrincipalForAuth`. Identity's other later machine/external methods and Permission's five later integrated methods remain protected by their accepted contracts and are not silently counted or redesigned. External API-key feature expansion, AI Platform, ActionGrant, DELEGATED runtime and background-without-user execution remain deferred.

The exact 32 tombstones and the 57 retained target/decision selectors are listed in the five service truth sources. Retained `tenant_id` / `org_id` values identify an owner resource, policy target or authorization-decision subject; they never establish caller identity or execution scope. Every response projection and business field number remains unchanged. There are zero nested request-context proto tombstones in these five current baseline protos; legacy operator/trace/audit context exists in ordinary metadata/runtime helpers and is removed by the leased adapter/controller changes.

#### 9.15.2 admission and caller graph

Auth's anonymous login/recovery/bootstrap and opaque continuation methods accept only exact Gateway mTLS plus the existing Auth-owned credential/challenge/grant/session proof. They do not require or manufacture a HUMAN/MACHINE ExecutionToken. They preserve current anti-enumeration, challenge expiry/attempts, rate limits, credential secrecy and safe audit. Auth normal protected RPCs validate ET locally; only STS exchange/cache miss contacts Auth/Permission.

| Target | direct HUMAN | HUMAN_OBO callers | exact SYSTEM MACHINE callers |
| --- | --- | --- | --- |
| Auth | Gateway authenticated BFF | HR, TenantOrg | only already integrated foundation workloads; public methods use exact Gateway mTLS admission, not fake ET |
| Identity | Gateway | Auth after session, Permission, HR, TenantOrg, Collaboration | Auth pre-auth lookup and Public Entry anonymous rendering, exact methods only |
| Permission | Gateway management | Auth/HR/TenantOrg/Collaboration where upstream HUMAN exists | Auth pre-auth/session construction and Public Entry anonymous resource checks, exact internal methods only |
| HR | Gateway | Identity, TenantOrg | Auth employee-code pre-auth and Public Entry anonymous card projection, exact read methods only |
| TenantOrg | Gateway | Auth/Identity/HR after session | Auth pre-session lifecycle and Public Entry anonymous projection, exact read methods only |

All HUMAN_OBO hops carry the verified HUMAN subject, tenant/session/terminal/trace and exact current service SYSTEM actor in `act`; each hop exchanges for the next target audience and certificate binding. SYSTEM MACHINE is admitted only by exact SPIFFE/principal/binding/workload/target/Code allowlist; SYSTEM is not a tenant wildcard. Public Entry and Collaboration reuse their already verified inbound proof shapes. No direct Cron/worker MACHINE root exists for the five baseline business surfaces. Generic `GrpcMetadataPropagationFactory`, operator-scoped metadata, body/local tenant authority, request-id/trace-id fallback and target registration are migration objects, never fallback.

#### 9.15.3 staged single-writer implementation

1. Update the leased protos/reservations, six Permission INTERNAL Codes, generated outputs and 217-declaration architecture evidence without changing business schemas/events.
2. Prepare every Gateway and cross-foundation target-specific client/profile/provider while legacy targets remain active; preparation may attach ET but cannot synthesize fallback authority.
3. Complete Auth public-admission composition and all five local verifier/guard/context/module compositions.
4. Run service-by-service controller/module/security tests for Auth, Identity, Permission, HR and TenantOrg; keep all five production activations disabled.
5. In one candidate, activate the 15 cross-foundation edges, Gateway five-target clients and Public Entry/Collaboration edges, then enable all five Token-only, mandatory-mTLS server boundaries; startup fails closed when server credentials are unavailable, with no optional or insecure production mode.
6. Delete generic target registrations, signed/operator metadata factories, body authority consumption and all legacy fallbacks; every cross-foundation production target uses its dedicated `createGrpcClientCredentials()`-backed channel, while unrelated Party and already integrated foundation compositions remain intact.
7. Run the group composition/E2E, 217-declaration, Code, audience/actor/terminal, tombstone, legacy-zero, exact-scope and repository gates at one SHA.

No database schema, migration, event/outbox, role model, tenant model, business rule, package lock, CRM runtime or unrelated RPC is leased.

#### 9.15.4 closed implementation writer lease

The lease is exact: `201 = 172 EXISTING + 29 NEW_TARGET`. Each source package owns its package-local target profiles/clients; Common remains target-neutral infrastructure. One production file may register several target-specific immutable profiles, but each target has a distinct audience/client token and no package imports another package's producer. The original six appended existing paths are the minimum enforcement owners for mandatory server mTLS and removal of the remaining HR onboarding and Permission role generic target registrations. The next two appended Permission module paths close production Nest DI ownership: every controller-owning module that uses `PermissionFoundationTrustedExecutionGuard` imports `PermissionTrustedExecutionModule` so `ExecutionTokenVerifier` resolves in the owning module context. The next four appended test paths align stale assertions with `AuthorizeBusinessRpc`/ET declaration metadata, trusted-module DI, dedicated mTLS clients and absence of the removed local Permission resolver or generic target registration. The Auth module test path replaces its stale generic Permission client-token assertion with the already frozen dedicated `AuthPermissionTrustedGrpcClient` DI truth. The final three Identity test paths replace removed `RequirePermissions`/`RequireAuthenticatedOperator` metadata assertions with the frozen `AuthorizeBusinessRpc`/`AuthorizeInternalCall` ET declaration and trusted-guard facts. These paths do not change public admission, RPC, Code, wire, guard, production or business semantics.

```yaml
foundationIdentityAuthzAtomicGroupImplementationLease:
  base: ad131ac7e06fa01d21493b05502bd1a567318c68
  totalTrackedWriterPaths: 201
  stateCounts: { EXISTING: 172, NEW_TARGET: 29 }
  trackedWriterPaths:
    - { state: EXISTING, path: src/common/src/contracts/auth_service/auth.proto }
    - { state: EXISTING, path: src/common/src/contracts/auth_service/execution_token.proto }
    - { state: EXISTING, path: src/common/src/contracts/auth_service/machine_workload_source_credential.proto }
    - { state: EXISTING, path: src/common/src/contracts/identity_service/identity_query.proto }
    - { state: EXISTING, path: src/common/src/contracts/permission_service/permission_check.proto }
    - { state: EXISTING, path: src/common/src/contracts/permission_service/permission_management.proto }
    - { state: EXISTING, path: src/common/src/contracts/hr_service/hr.proto }
    - { state: EXISTING, path: src/common/src/contracts/tenant_org_service/tenant_org.proto }
    - { state: EXISTING, path: src/common/src/authorization/guards/trusted-execution.guard.ts }
    - { state: EXISTING, path: src/common/src/authorization/guards/trusted-execution.guard.spec.ts }
    - { state: EXISTING, path: src/common/src/authorization/guards/trusted-internal-execution.guard.ts }
    - { state: EXISTING, path: src/common/src/authorization/guards/trusted-internal-execution.guard.spec.ts }
    - { state: EXISTING, path: src/common/src/authorization/trusted-execution/declarations.spec.ts }
    - { state: EXISTING, path: src/common/src/authorization/trusted-execution/trusted-execution-registry.ts }
    - { state: EXISTING, path: src/common/src/authorization/trusted-execution/internal-trusted-grpc-caller.ts }
    - { state: EXISTING, path: src/common/src/authorization/trusted-execution/internal-trusted-grpc-caller.spec.ts }
    - { state: EXISTING, path: src/common/src/authorization/trusted-execution/inbound-execution-token-credential.scope.ts }
    - { state: EXISTING, path: src/common/src/authorization/trusted-execution/inbound-execution-token-credential.scope.spec.ts }
    - { state: EXISTING, path: src/common/src/authorization/trusted-execution/index.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/auth/auth-management.permission-codes.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/auth/self.permission-codes.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/auth/session.permission-codes.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/identity/account.permission-codes.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/identity/account-self.permission-codes.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/identity/machine.permission-codes.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/identity/internal.permission-codes.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/permission/management.permission-codes.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/permission/account-self.permission-codes.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/permission/internal.permission-codes.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/permission/role-instance.permission-codes.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/permission/role-template.permission-codes.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/hr/management.permission-codes.ts }
    - { state: EXISTING, path: src/common/src/authorization/permission-codes/tenant-org/management.permission-codes.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/scripts/permission-catalog.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/scripts/generate-common-permission-codes.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/scripts/sync-permission-codes.ts }
    - { state: EXISTING, path: src/services/system/permission-service/test/l1/common-permission-code-generator.spec.ts }
    - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-foundation.seed.spec.ts }
    - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-service-seed.spec.ts }
    - { state: EXISTING, path: scripts/architecture/trusted-grpc-signature-inventory.mjs }
    - { state: EXISTING, path: src/services/system/auth-service/src/app.module.ts }
    - { state: EXISTING, path: src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts }
    - { state: EXISTING, path: src/services/system/auth-service/src/interfaces/grpc/grpc-request-context.ts }
    - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/modules/external-services.module.ts }
    - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/adaptors/hr-service.adaptor.ts }
    - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/adaptors/identity-service.adaptor.ts }
    - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/adaptors/identity-service.adaptor.spec.ts }
    - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/adaptors/permission-service.adaptor.ts }
    - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/adaptors/permission-service.adaptor.spec.ts }
    - { state: EXISTING, path: src/services/system/auth-service/src/infrastructure/adaptors/tenant-org-lifecycle.grpc.adaptor.ts }
    - { state: EXISTING, path: src/services/system/auth-service/src/modules/auth/auth.module.ts }
    - { state: EXISTING, path: src/services/system/auth-service/src/modules/token/execution-token.module.ts }
    - { state: EXISTING, path: src/services/system/identity-service/src/app.module.ts }
    - { state: EXISTING, path: src/services/system/identity-service/src/interfaces/grpc/identity-query.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/identity-service/src/interfaces/grpc/identity-management.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/identity-service/src/interfaces/grpc/identity-machine-auth.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/identity-service/src/interfaces/grpc/grpc-request-context.ts }
    - { state: EXISTING, path: src/services/system/identity-service/src/modules/identity-query/identity-query.module.ts }
    - { state: EXISTING, path: src/services/system/identity-service/src/modules/identity-management/identity-management.module.ts }
    - { state: EXISTING, path: src/services/system/identity-service/src/modules/identity-machine-auth/identity-machine-auth.module.ts }
    - { state: EXISTING, path: src/services/system/identity-service/src/modules/identity-trusted-execution.module.ts }
    - { state: EXISTING, path: src/services/system/identity-service/src/infrastructure/adaptors/hr-employee-reference.grpc.adaptor.ts }
    - { state: EXISTING, path: src/services/system/identity-service/src/infrastructure/adaptors/tenant-reference.grpc.adaptor.ts }
    - { state: EXISTING, path: src/services/system/identity-service/test/l1/grpc-controller-input-validation.spec.ts }
    - { state: EXISTING, path: src/services/system/identity-service/test/l1/identity-management.module.spec.ts }
    - { state: EXISTING, path: src/services/system/identity-service/test/l1/hr-employee-reference.grpc.adaptor.spec.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/app.module.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/interfaces/grpc/permission-access-summary.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/interfaces/grpc/permission-check.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/interfaces/grpc/permission-management.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/interfaces/grpc/permission-terminal-access.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/interfaces/grpc/policy-instance-management.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/interfaces/grpc/policy-instance-preview.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/interfaces/grpc/policy-management.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/interfaces/grpc/resource-authorization.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/interfaces/guards/management-authorization.guard.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/interfaces/guards/permission-decision-transport.guard.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/interfaces/guards/permission-trusted-internal-execution.guard.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/infrastructure/adaptors/identity-account-reference.grpc.adaptor.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/modules/authorization/authorization.module.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/modules/management-authorization/management-authorization.module.ts }
    - { state: EXISTING, path: src/services/system/permission-service/test/l1/identity-account-reference.grpc.adaptor.spec.ts }
    - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-decision.module-wiring.spec.ts }
    - { state: EXISTING, path: src/services/system/permission-service/test/l3/permission-check.grpc.controller.spec.ts }
    - { state: EXISTING, path: src/services/system/permission-service/test/l3/permission-management.grpc.controller.spec.ts }
    - { state: EXISTING, path: src/services/system/permission-service/test/l3/permission-terminal-access.grpc.controller.spec.ts }
    - { state: EXISTING, path: src/services/system/permission-service/test/l1/resource-authorization.grpc.controller.spec.ts }
    - { state: EXISTING, path: src/services/system/hr-service/src/app.module.ts }
    - { state: EXISTING, path: src/services/system/hr-service/src/interfaces/grpc/hr-management.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/hr-service/src/interfaces/grpc/hr-query.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/hr-service/src/modules/hr-trusted-execution.module.ts }
    - { state: EXISTING, path: src/services/system/hr-service/src/infrastructure/modules/hr-reference.module.ts }
    - { state: EXISTING, path: src/services/system/hr-service/src/infrastructure/adapters/auth-login-bootstrap-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/system/hr-service/src/infrastructure/adapters/identity-account-provisioning-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/system/hr-service/src/infrastructure/adapters/identity-employee-binding-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/system/hr-service/src/infrastructure/adapters/permission-onboarding-grant-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/system/hr-service/src/infrastructure/adapters/tenant-org-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/system/hr-service/test/l1/grpc-onboarding-adapters.spec.ts }
    - { state: EXISTING, path: src/services/system/hr-service/test/l1/tenant-org-grpc.adapter.spec.ts }
    - { state: EXISTING, path: src/services/system/hr-service/test/l3/hr-management.grpc.controller.spec.ts }
    - { state: EXISTING, path: src/services/system/hr-service/test/l3/hr-query.grpc.controller.spec.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/src/app.module.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/src/interfaces/grpc/tenant-org-management.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/src/interfaces/grpc/tenant-org-query.grpc.controller.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/src/modules/tenant-org-trusted-execution.module.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/src/modules/tenant-org-management/tenant-org-management.module.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/src/modules/tenant-org-query/tenant-org-query.module.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/src/infrastructure/adapters/auth-login-onboarding.grpc.adapter.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/src/infrastructure/adapters/auth-session-revocation.grpc.adapter.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/src/infrastructure/adapters/hr-employee-onboarding.grpc.adapter.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/src/infrastructure/adapters/identity-account-onboarding.grpc.adapter.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/src/infrastructure/adapters/permission-tenant-onboarding.grpc.adapter.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/src/infrastructure/adapters/tenant-onboarding-metadata.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/test/l1/app-module-grpc-config.spec.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/test/l1/permission-tenant-onboarding.grpc.adapter.spec.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/test/l3/tenant-org-management.grpc.controller.spec.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/test/l3/tenant-org-query.grpc.controller.spec.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/app.module.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/config/gateway.config.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/auth-bff.module.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/auth-bff.module.spec.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.spec.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/permission-service/permission-access-summary-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/permission-service/permission-terminal-access-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/tenant-org-service/tenant-org-query-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/hr-service/adapters/hr-management-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/hr-service/adapters/hr-query-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/hr-service/hr-service.module.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/permission-service/adapters/permission-management-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/permission-service/adapters/policy-instance-management-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/permission-service/adapters/policy-instance-preview-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/permission-service/adapters/policy-management-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/permission-service/permission-service.module.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/permission-service/tenant-org-query-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/tenant-org-service/adapters/identity-tenant-account-stats-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/tenant-org-service/adapters/identity-user-lookup-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/tenant-org-service/adapters/tenant-org-management-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/tenant-org-service/adapters/tenant-org-management-grpc.adapter.spec.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/tenant-org-service/adapters/tenant-org-query-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/tenant-org-service/tenant-org-service.module.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/public-entry-service/adapters/identity-contact-asset-grpc.adapter.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/public-entry-service/public-entry-service.module.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/collaboration-service/collaboration-service.module.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/crm-service.module.ts }
    - { state: EXISTING, path: src/services/api-gateway/src/modules/terminal-device-admin-bff/terminal-device-admin-bff.module.ts }
    - { state: EXISTING, path: src/services/system/public-entry-service/src/infrastructure/adapters/business-card-upstream.grpc.adapters.ts }
    - { state: EXISTING, path: src/services/system/public-entry-service/src/infrastructure/adapters/permission-business-card-authorization.adapter.ts }
    - { state: EXISTING, path: src/services/system/public-entry-service/src/modules/business-card/business-card.module.ts }
    - { state: EXISTING, path: src/services/system/collaboration-service/src/infrastructure/adapters/annotation-permission.grpc.adapter.ts }
    - { state: EXISTING, path: src/services/system/collaboration-service/src/infrastructure/adapters/identity-account-reference.grpc.adapter.ts }
    - { state: EXISTING, path: src/services/system/collaboration-service/src/infrastructure/adapters/task-permission.grpc.adapter.ts }
    - { state: EXISTING, path: src/services/system/collaboration-service/src/modules/collaboration-annotation.module.ts }
    - { state: EXISTING, path: src/services/system/collaboration-service/src/modules/collaboration-task.module.ts }
    - { state: NEW_TARGET, path: src/services/system/auth-service/src/modules/auth/auth-trusted-execution.module.ts }
    - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/adaptors/foundation-trusted-grpc.clients.ts }
    - { state: NEW_TARGET, path: src/services/system/auth-service/src/infrastructure/adaptors/foundation-trusted-grpc.clients.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/auth-service/src/interfaces/grpc/auth-trusted-grpc-security.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/identity-service/src/infrastructure/adaptors/foundation-trusted-grpc.clients.ts }
    - { state: NEW_TARGET, path: src/services/system/identity-service/src/infrastructure/adaptors/foundation-trusted-grpc.clients.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/identity-service/test/l1/identity-trusted-grpc-security.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/permission-service/src/modules/authorization/permission-trusted-execution.module.ts }
    - { state: NEW_TARGET, path: src/services/system/permission-service/src/infrastructure/adaptors/foundation-trusted-grpc.clients.ts }
    - { state: NEW_TARGET, path: src/services/system/permission-service/src/infrastructure/adaptors/foundation-trusted-grpc.clients.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/permission-service/test/l1/permission-trusted-grpc-security.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/hr-service/src/infrastructure/adapters/foundation-trusted-grpc.clients.ts }
    - { state: NEW_TARGET, path: src/services/system/hr-service/src/infrastructure/adapters/foundation-trusted-grpc.clients.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/hr-service/test/l1/hr-trusted-grpc-security.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/tenant-org-service/src/infrastructure/adapters/foundation-trusted-grpc.clients.ts }
    - { state: NEW_TARGET, path: src/services/system/tenant-org-service/src/infrastructure/adapters/foundation-trusted-grpc.clients.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/tenant-org-service/test/l1/tenant-org-trusted-grpc-security.spec.ts }
    - { state: NEW_TARGET, path: src/services/api-gateway/src/infrastructure/grpc/trusted-auth.grpc.client.ts }
    - { state: NEW_TARGET, path: src/services/api-gateway/src/infrastructure/grpc/trusted-identity.grpc.client.ts }
    - { state: NEW_TARGET, path: src/services/api-gateway/src/infrastructure/grpc/trusted-permission.grpc.client.ts }
    - { state: NEW_TARGET, path: src/services/api-gateway/src/infrastructure/grpc/trusted-hr.grpc.client.ts }
    - { state: NEW_TARGET, path: src/services/api-gateway/src/infrastructure/grpc/trusted-tenant-org.grpc.client.ts }
    - { state: NEW_TARGET, path: src/services/api-gateway/src/infrastructure/grpc/foundation-trusted-grpc.clients.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/public-entry-service/src/infrastructure/adapters/foundation-trusted-grpc.clients.ts }
    - { state: NEW_TARGET, path: src/services/system/public-entry-service/src/infrastructure/adapters/foundation-trusted-grpc.clients.spec.ts }
    - { state: NEW_TARGET, path: src/services/system/collaboration-service/src/infrastructure/adapters/foundation-trusted-grpc.clients.ts }
    - { state: NEW_TARGET, path: src/services/system/collaboration-service/src/infrastructure/adapters/foundation-trusted-grpc.clients.spec.ts }
    - { state: NEW_TARGET, path: src/common/src/authorization/trusted-execution/foundation-atomic-group.declarations.spec.ts }
    - { state: NEW_TARGET, path: scripts/local/foundation-trusted-grpc-atomic-group.spec.mjs }
    - { state: EXISTING, path: src/services/system/identity-service/src/main.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/main.ts }
    - { state: EXISTING, path: src/services/system/hr-service/src/main.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/src/main.ts }
    - { state: EXISTING, path: src/services/system/hr-service/src/modules/hr-onboarding/hr-onboarding.module.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/modules/role/role.module.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/modules/permission/permission.module.ts }
    - { state: EXISTING, path: src/services/system/permission-service/src/modules/policy/policy.module.ts }
    - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-management.authorization.spec.ts }
    - { state: EXISTING, path: src/services/system/permission-service/test/l1/policy-instance-management.grpc.controller.spec.ts }
    - { state: EXISTING, path: src/services/system/hr-service/test/l1/hr-query.module.spec.ts }
    - { state: EXISTING, path: src/services/system/tenant-org-service/test/l1/tenant-org-authorization.module.spec.ts }
    - { state: EXISTING, path: src/services/system/auth-service/src/modules/token/execution-token.module.spec.ts }
    - { state: EXISTING, path: src/services/system/identity-service/test/l1/identity-audit-controller.spec.ts }
    - { state: EXISTING, path: src/services/system/identity-service/test/l1/list-accounts.handler.spec.ts }
    - { state: EXISTING, path: src/services/system/identity-service/test/l1/machine-workload-binding-management.grpc-controller.spec.ts }
  protected:
    - every tracked path not listed above
    - all prisma/schema/migration, event/outbox and business-domain state-machine paths
    - CRM service/runtime and all non-foundation target RPCs
    - package manifests and lockfiles
    - external API-key expansion, AI Platform, ActionGrant and DELEGATED/background runtime
```

#### 9.15.5 focused and final verification

```bash
pnpm proto:lint
pnpm proto:regen
node scripts/architecture/trusted-grpc-signature-inventory.mjs
pnpm --filter permission-service permission-codes:generate-common
pnpm --filter permission-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l1/common-permission-code-generator.spec.ts test/l1/permission-foundation.seed.spec.ts test/l1/permission-service-seed.spec.ts
pnpm --filter permission-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l1/resource-authorization-bootstrap.spec.ts
pnpm --filter permission-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l1/permission-management.authorization.spec.ts test/l1/policy-instance-management.grpc.controller.spec.ts
pnpm --filter hr-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l1/hr-query.module.spec.ts
pnpm --filter tenant-org-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l1/tenant-org-authorization.module.spec.ts
pnpm --filter auth-service exec jest --runInBand --runTestsByPath src/modules/token/execution-token.module.spec.ts
pnpm --filter identity-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l1/identity-audit-controller.spec.ts test/l1/list-accounts.handler.spec.ts test/l1/machine-workload-binding-management.grpc-controller.spec.ts
pnpm --filter @oes/common build
pnpm --filter auth-service build
pnpm --filter identity-service build
pnpm --filter permission-service build
pnpm --filter hr-service build
pnpm --filter tenant-org-service build
pnpm --filter public-entry-service build
pnpm --filter collaboration-service build
pnpm --filter api-gateway build
pnpm --filter auth-service exec jest --runInBand
pnpm --filter identity-service exec jest --config jest.config.js --runInBand
pnpm --filter permission-service exec jest --config jest.config.js --runInBand
pnpm --filter hr-service exec jest --config jest.config.js --runInBand
pnpm --filter tenant-org-service exec jest --config jest.config.js --runInBand
node --test scripts/local/foundation-trusted-grpc-atomic-group.spec.mjs
git diff --check
```

Acceptance proves: exact `70+5/41/66/15/20` membership and 217 declarations; exact five audiences, method Codes, terminals and workload/actor allowlists; all anonymous/public negatives and anti-enumeration/rate/audit invariants; all HUMAN/HUMAN_OBO/SYSTEM MACHINE success/negative cases; OBO subject/actor/tenant/session/trace/expiry/Permission/`cnf` continuity; exact 32 wire reservations and unchanged resource/response fields; Gateway/public/cross-foundation target clients; mandatory mTLS startup for all five servers with no optional/insecure production mode; exact `createGrpcClientCredentials()` use for every cross-foundation target and zero generic target registrations; executable Nest `TestingModule` closure for every Permission controller-owning module using `PermissionFoundationTrustedExecutionGuard`; aligned Permission/HR/TenantOrg suites assert ET declarations, trusted DI, dedicated clients and legacy resolver/registration absence rather than the removed local authority path; the Auth token module suite resolves the dedicated `AuthPermissionTrustedGrpcClient` rather than a generic Permission client token; aligned Identity suites assert `AuthorizeBusinessRpc`/`AuthorizeInternalCall` ET declarations and trusted guards rather than removed legacy authorization metadata; atomic activation with no intermediate mixed trust; zero legacy metadata/body/fallback references; all existing foundation/Party behavior unchanged; exact 201-path scope; UTF-8/link/YAML/fence/diff cleanliness.

### 9.16 CRM 15-RPC final frozen cutover lease

Status: `FROZEN_PENDING_IMPLEMENTATION` at design base `5930f94f0576b70fc128625e7b2132165e2335cd`. CRM is the final remaining target service. This packet classifies the existing 15 RPCs, prepares the only two production caller classes, freezes Token-only server admission and legacy removal, and adds no CRM capability, RPC, route, schema, event/outbox, business state, idempotency key or automatic retry.

The declaration contract is simultaneously normalized repository-wide: method authorization metadata exposes only `sessionTerminals: readonly TrustedSessionTerminal[]`. The array must be non-empty, duplicate-free, normalized and immutable. The former declaration field `sessionTerminal` is removed in the same candidate from Common, all existing controller declarations and exact declaration assertions; there is no dual-field compatibility period or fallback. An ExecutionToken still carries exactly one Auth-signed `session_terminal` fact, and the target guard authorizes only when that single fact belongs to the declared array. Runtime execution-context properties that represent the current Token's single terminal remain singular and are not a second declaration API.

All 15 RPCs require `aud=urn:oes:service:crm-service`, mTLS, leaf certificate-bound `cnf`, accurate Code, terminal and direct workload. Fourteen Gateway methods are BUSINESS/HUMAN; the existing Collaboration object-reference method is INTERNAL/HUMAN_OBO:

| RPC | Mode / principal | Exact Code | `sessionTerminals` / caller |
| --- | --- | --- | --- |
| `ListCrmAccounts` | BUSINESS / HUMAN | `crm.account.read` | `['WEB']` / Gateway |
| `GetCrmAccount` | BUSINESS / HUMAN | `crm.account.read` | `['WEB', 'BROWSER_EXTENSION']` / Gateway |
| `ListSourceRecords` | BUSINESS / HUMAN | `crm.account.read` | `['WEB']` / Gateway |
| `CheckLeadDuplicate` | BUSINESS / HUMAN | `crm.account.read` | `['WEB', 'BROWSER_EXTENSION']` / Gateway |
| `CreateDraftLead` | BUSINESS / HUMAN | `crm.account.create` | `['WEB', 'BROWSER_EXTENSION']` / Gateway |
| `UpdateDraftLead` | BUSINESS / HUMAN | `crm.account.update` | `['WEB']` / Gateway |
| `SubmitDraftLead` | BUSINESS / HUMAN | `crm.account.update` | `['WEB']` / Gateway |
| `DeleteDraftLead` | BUSINESS / HUMAN | `crm.account.update` | `['WEB']` / Gateway |
| `CreateLead` | BUSINESS / HUMAN | `crm.account.create` | `['WEB', 'BROWSER_EXTENSION']` / Gateway |
| `ClaimCrmAccount` | BUSINESS / HUMAN | `crm.account.claim` | `['WEB', 'BROWSER_EXTENSION']` / Gateway |
| `ReleaseCrmAccount` | BUSINESS / HUMAN | `crm.account.release` | `['WEB']` / Gateway |
| `ArchiveCrmAccount` | BUSINESS / HUMAN | `crm.account.manage` | `['WEB']` / Gateway |
| `UpdateCrmAccountIdentifiers` | BUSINESS / HUMAN | `crm.account.update` | `['WEB']` / Gateway |
| `ConvertLeadToProspectCustomer` | BUSINESS / HUMAN | `crm.account.convert`; ownerless override also requires `crm.account.manage` | `['WEB']` / Gateway |
| `ValidateCrmObjectReference` | INTERNAL / HUMAN_OBO | `crm.internal.object_reference.validate` | preserved `['WEB']` subject / Collaboration actor only |

The 12 existing CRM Codes remain unchanged; this packet adds exactly one INTERNAL transport Code, `crm.internal.object_reference.validate`, so the canonical CRM catalog contains 13 Codes. It is issued only for the exact `collaboration-service` workload→CRM audience decision and never enters a HUMAN role.

The five dual-terminal RPCs are one unchanged business capability used by both normal Web and Browser Extension sessions. They are not split by caller, do not accept PDA or future terminals, and remain independently Code/resource checked. The nine remaining Gateway RPCs are WEB-only. MACHINE root, TENANT MACHINE, DELEGATED, SELF_SERVICE, wrong workload, wrong terminal and direct external gRPC all fail closed.

Gateway remains the only production caller of the 14 customer RPCs and preserves exactly 22 authenticated HTTP routes:

| HTTP route | Downstream use |
| --- | --- |
| `GET /customer-management/tenants/:tenantId/crm-accounts` | `ListCrmAccounts` |
| `GET /customer-management/tenants/:tenantId/crm-accounts/:crmAccountId` | `GetCrmAccount` |
| `GET /customer-management/tenants/:tenantId/crm-accounts/:crmAccountId/source-records` | `ListSourceRecords` |
| `POST /customer-management/tenants/:tenantId/leads` | `CreateLead` |
| `POST /customer-management/tenants/:tenantId/draft-leads` | `CreateDraftLead` |
| `PATCH /customer-management/tenants/:tenantId/draft-leads/:crmAccountId` | `UpdateDraftLead` |
| `POST /customer-management/tenants/:tenantId/draft-leads/:crmAccountId/submit` | `SubmitDraftLead` |
| `DELETE /customer-management/tenants/:tenantId/draft-leads/:crmAccountId` | `DeleteDraftLead` |
| `POST /customer-management/tenants/:tenantId/crm-accounts/:crmAccountId/claim` | `ClaimCrmAccount` |
| `POST /customer-management/tenants/:tenantId/crm-accounts/:crmAccountId/release` | `ReleaseCrmAccount` |
| `POST /customer-management/tenants/:tenantId/crm-accounts/:crmAccountId/archive` | `ArchiveCrmAccount` |
| `PATCH /customer-management/tenants/:tenantId/crm-accounts/:crmAccountId/identifiers` | `UpdateCrmAccountIdentifiers` |
| `POST /customer-management/tenants/:tenantId/leads/check-duplicate` | `CheckLeadDuplicate` |
| `POST /customer-management/tenants/:tenantId/leads/:crmAccountId/convert-to-prospect-customer` | `ConvertLeadToProspectCustomer` |
| `GET /admin/crm/performance/overview` | existing CRM query composition only |
| `POST /extension/crm/page-context/resolve` | `CheckLeadDuplicate` / `GetCrmAccount` composition |
| `POST /extension/crm/search-results/resolve` | `CheckLeadDuplicate` / `GetCrmAccount` composition |
| `POST /extension/crm/leads/check-duplicate` | `CheckLeadDuplicate` |
| `POST /extension/crm/draft-leads` | `CreateDraftLead` |
| `POST /extension/crm/leads` | `CreateLead` |
| `POST /extension/crm/accounts/:crmAccountId/claim` | `ClaimCrmAccount` |
| `GET /extension/crm/accounts/:crmAccountId` | `GetCrmAccount` |

The `:tenantId` HTTP selector is checked against the authenticated session at Gateway and is not forwarded as gRPC authority. Gateway derives tenant/org/subject/session/trace/audit from the verified source credential and Permission decision, exchanges for a CRM-audience ET, and uses one dedicated CRM mTLS client. Root/feature generic CRM registrations, `InjectGrpcClient(SERVICE_NAMES.CRM)`, `GrpcMetadataPropagationFactory`, `crm-grpc-context.ts`, legacy body contexts and requestId/traceId authority fallback are migration targets and are absent after cutover.

Collaboration is the only production caller of `ValidateCrmObjectReference`. Its existing trusted inbound guard retains the request-private HUMAN proof; its package-owned CRM target profile exchanges that proof through Auth STS, preserves HUMAN subject/tenant/org/session/WEB terminal, records exact `collaboration-service` SYSTEM MACHINE actor in `act`, and calls the dedicated CRM client with `crm.internal.object_reference.validate`. The former generic CRM registration is removed without changing Collaboration's Identity/Permission clients, Annotation author/visibility rules or audit. CRM owns object existence/readability/lifecycle/requested-capability facts; Collaboration owns Annotation behavior.

CRM→Party remains the already integrated pure MACHINE_ROOT path. The inbound CRM trusted module must compose with, not replace or impersonate, the package-owned Party source credential/STS/producer/dedicated client. No HUMAN OBO subject is reused as Party MACHINE authority, and no Party RPC or Code changes.

Wire migration reserves 67 fields. The 15 requests reserve `tenant_id=1`, `operator_context=2`, `trace_context=3`; the ten management requests also reserve `audit_context=4`, yielding 55 standard request fields. Legacy `OperatorContext` fields 1..3, `TraceContext` fields 1..2 and `AuditContext` fields 1..3 yield eight nested reservations. Four additional authority/decision inputs are reserved: `CreateLead.owner_account_id=15`, `CreateLead.claim_for_current_user=26`, `SubmitDraftLead.claim_for_current_user=7` and `ConvertLeadToProspectCustomer.allow_ownerless_conversion=6`. `assignment_intent`, duplicate acknowledgment, archive reason, source evidence including `source_captured_by_account_id`, query filters and all other business fields keep their numbers. Response tenant/owner/created-by projections remain CRM-owned facts.

`OWNED_BY_OPERATOR` derives owner from the verified HUMAN subject and `POOL` keeps owner empty. Ownerless conversion derives its extra override only from verified ET Code `crm.account.manage`. Body/local metadata cannot establish either decision. Existing mutation/audit/transaction/rollback, duplicate, claim/release, conversion, Party resolution, Prisma/schema, repository, event/outbox and response semantics remain unchanged.

The raw `crm-smoke.mjs` direct insecure gRPC authority and package `smoke` command are retired rather than reclassified as MACHINE. `crm-smoke-lib.mjs` and `crm-smoke.spec.mjs` may remain isolated business evidence only after authority payload removal. Future live coverage enters an authenticated Gateway HTTP route. No fixture can restore request/body authority.

| Verification slice | Required proof |
| --- | --- |
| Common declaration API | only `sessionTerminals` exists; arrays are non-empty, unique, immutable; all existing declarations/tests migrated; old declaration field absent |
| 15 CRM RPCs | exact 14 BUSINESS plus one INTERNAL declaration, Codes, CRM audience, terminal sets, direct workloads and no dual-mode method |
| wire/context | 59 request plus eight nested reservations, unchanged business numbers/projections, claims-derived tenant/org/operator/trace/audit/owner/override and injection rejection |
| Gateway | exact 22 routes, dedicated CRM client and ET producer; generic CRM registration and legacy context/metadata absent |
| Collaboration→CRM | real HUMAN_OBO subject/actor/audience/Permission/expiry/trace/`cnf` success and missing/wrong proof negatives |
| CRM→Party | existing MACHINE_ROOT client/composition regression remains green and authority classes do not mix |
| persistence/business | existing mutation/audit/transaction/rollback and CRM business suites remain green; no schema/event/business expansion |
| legacy/closure | raw smoke authority removed, lease exact, proto/generation/inventory/build/link/YAML/UTF-8/diff gates pass |

The closed implementation writer lease is `114 = 105 EXISTING + 9 NEW_TARGET`:

```yaml
crmTrustedGrpcImplementationLease:
  totalTrackedWriterPaths: 114
  stateCounts: { EXISTING: 105, NEW_TARGET: 9 }
  trackedWriterPaths:
    commonSessionTerminalDeclarationMigration:
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/declarations/index.ts }
      - { state: EXISTING, path: src/common/src/authorization/trusted-execution/declarations.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/guards/trusted-execution.guard.ts }
      - { state: EXISTING, path: src/common/src/authorization/guards/trusted-execution.guard.spec.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/src/interfaces/grpc/public-entry-business-card.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/src/interfaces/grpc/public-entry-short-link.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/terminal-device-service/src/interfaces/grpc/terminal-device.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/identity-service/src/interfaces/grpc/identity-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/interfaces/grpc/task-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/interfaces/grpc/task-command.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/interfaces/grpc/annotation-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/interfaces/grpc/annotation-command.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/src/interfaces/grpc/item-master-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/src/interfaces/grpc/item-master-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/browser-activity-service/src/interfaces/grpc/browser-activity.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/interfaces/grpc/wms-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/wms-service/src/interfaces/grpc/wms-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/interfaces/grpc/procurement-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/src/interfaces/grpc/procurement-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/mes-service/src/interfaces/grpc/mes-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/mes-service/src/interfaces/grpc/mes-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/mes-service/src/interfaces/grpc/production-spec-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/mes-service/src/interfaces/grpc/production-spec-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/finance-service/src/interfaces/grpc/finance-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/finance-service/src/interfaces/grpc/finance-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/sales-service/src/interfaces/grpc/pricing-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/sales-service/src/interfaces/grpc/pricing-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/sales-service/src/interfaces/grpc/sales-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/sales-service/src/interfaces/grpc/sales-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/interfaces/grpc/supplier-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/srm-service/src/interfaces/grpc/supplier-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/system/public-entry-service/test/l3/public-entry-trusted-grpc-security.spec.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/test/l3/collaboration-trusted-grpc-security.spec.ts }
      - { state: EXISTING, path: src/services/system/item-master-service/test/l3/item-master-trusted-grpc-security.spec.ts }
      - { state: EXISTING, path: src/services/system/browser-activity-service/test/l3/browser-activity.trusted-grpc.spec.ts }
      - { state: EXISTING, path: src/services/business/wms-service/test/l3/wms-trusted-grpc-security.spec.ts }
      - { state: EXISTING, path: src/services/business/procurement-service/test/l3/procurement-trusted-grpc-security.spec.ts }
      - { state: EXISTING, path: src/services/business/finance-service/test/l3/finance-trusted-grpc-security.spec.ts }
      - { state: EXISTING, path: src/services/business/srm-service/test/l3/srm-trusted-grpc-security.spec.ts }

    crmProtoAndPermissionContract:
      - { state: EXISTING, path: src/common/src/contracts/crm_service/crm.proto }
      - { state: NEW_TARGET, path: src/common/src/contracts/crm_service/crm.contract.spec.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/permission-catalog.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/sync-permission-codes.ts }
      - { state: EXISTING, path: src/services/system/permission-service/src/scripts/generate-common-permission-codes.ts }
      - { state: EXISTING, path: src/services/system/permission-service/test/l1/permission-foundation.seed.spec.ts }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/crm/index.ts }
      - { state: EXISTING, path: src/common/src/authorization/permission-codes/crm/management.permission-codes.ts }
      - { state: NEW_TARGET, path: src/common/src/authorization/permission-codes/crm/internal.permission-codes.ts }

    gatewayCrmHumanProducerAndRoutes:
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/common/grpc/index.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-crm-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/common/grpc/gateway-crm-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/app.module.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/crm-service.module.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/adapters/crm-grpc-context.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/adapters/customer-management-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/adapters/customer-query-grpc.adapter.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/customer-management.service.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/customer-management.service.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/extension-crm-workspace.service.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/extension-crm-workspace.service.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/admin-crm-performance.service.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/admin-crm-performance.service.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/interface/http/controllers/customer-management.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/interface/http/controllers/customer-management.controller.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/interface/http/controllers/extension-crm-workspace.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/interface/http/controllers/extension-crm-workspace.controller.spec.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/interface/http/controllers/admin-crm-performance.controller.ts }
      - { state: EXISTING, path: src/services/api-gateway/src/modules/crm-service/interface/http/controllers/admin-crm-performance.controller.spec.ts }
      - { state: NEW_TARGET, path: src/services/api-gateway/src/modules/crm-service/adapters/crm-dedicated-client.spec.ts }

    crmTrustedInboundAndPartyPreservation:
      - { state: EXISTING, path: src/services/business/crm-service/src/main.ts }
      - { state: EXISTING, path: src/services/business/crm-service/src/app.module.ts }
      - { state: EXISTING, path: src/services/business/crm-service/src/modules/crm-infrastructure.module.ts }
      - { state: EXISTING, path: src/services/business/crm-service/src/modules/crm-management.module.ts }
      - { state: EXISTING, path: src/services/business/crm-service/src/modules/crm-query.module.ts }
      - { state: EXISTING, path: src/services/business/crm-service/src/modules/crm-trusted-execution.module.ts }
      - { state: EXISTING, path: src/services/business/crm-service/src/interfaces/grpc/customer-management.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/crm-service/src/interfaces/grpc/customer-query.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/crm-service/src/interfaces/grpc/crm-object-reference.grpc.controller.ts }
      - { state: EXISTING, path: src/services/business/crm-service/src/interfaces/grpc/customer-rpc-context.validator.ts }
      - { state: EXISTING, path: src/services/business/crm-service/src/application/services/crm-audit.service.ts }
      - { state: EXISTING, path: src/services/business/crm-service/src/common/errors/crm.errors.ts }
      - { state: EXISTING, path: src/services/business/crm-service/test/l1/crm-p1-contract-cleanup.spec.ts }
      - { state: EXISTING, path: src/services/business/crm-service/test/l3/crm-app-module.spec.ts }
      - { state: EXISTING, path: src/services/business/crm-service/test/l3/crm-grpc-context.spec.ts }
      - { state: EXISTING, path: src/services/business/crm-service/test/l3/crm-object-reference.grpc.controller.spec.ts }
      - { state: EXISTING, path: src/services/business/crm-service/test/l3/crm-p1-management.grpc.controller.spec.ts }
      - { state: EXISTING, path: src/services/business/crm-service/test/l3/crm-p1-query.grpc.controller.spec.ts }
      - { state: NEW_TARGET, path: src/services/business/crm-service/test/l3/crm-trusted-grpc-security.spec.ts }
      - { state: EXISTING, path: src/services/business/crm-service/jest.config.js }
      - { state: EXISTING, path: src/services/business/crm-service/package.json }
      - { state: EXISTING, path: src/services/business/crm-service/scripts/crm-smoke.mjs }
      - { state: EXISTING, path: src/services/business/crm-service/scripts/crm-smoke-lib.mjs }
      - { state: EXISTING, path: src/services/business/crm-service/scripts/crm-smoke.spec.mjs }

    collaborationCrmHumanOboActivation:
      - { state: EXISTING, path: src/services/system/collaboration-service/src/infrastructure/adapters/foundation-trusted-grpc.clients.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/infrastructure/adapters/foundation-trusted-grpc.clients.spec.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/infrastructure/adapters/crm-object-reference.grpc.adapter.ts }
      - { state: NEW_TARGET, path: src/services/system/collaboration-service/src/infrastructure/adapters/crm-object-reference.grpc.adapter.spec.ts }
      - { state: NEW_TARGET, path: src/services/system/collaboration-service/src/infrastructure/adapters/collaboration-crm-trusted-grpc.client.ts }
      - { state: NEW_TARGET, path: src/services/system/collaboration-service/src/infrastructure/adapters/collaboration-crm-trusted-grpc.client.spec.ts }
      - { state: EXISTING, path: src/services/system/collaboration-service/src/modules/collaboration-annotation.module.ts }

    stableTruthAndContractConsistency:
      - { state: EXISTING, path: docs/adr/0015-workload-identity-and-execution-token.md }
      - { state: EXISTING, path: docs/architecture/services/crm-service.md }
      - { state: EXISTING, path: docs/architecture/services/collaboration-service.md }
      - { state: EXISTING, path: docs/contracts/crm-service/README.md }
      - { state: EXISTING, path: docs/contracts/crm-service/customer-query.md }
      - { state: EXISTING, path: docs/contracts/crm-service/customer-management.md }
      - { state: EXISTING, path: docs/contracts/crm-service/object-reference.md }
      - { state: EXISTING, path: docs/plans/features/trusted-grpc-execution-context.md }

  ignoredGeneratedOutputs:
    - path: src/common/src/generated/crm_service/crm.ts
      input: src/common/src/contracts/crm_service/crm.proto
      command: pnpm proto:regen

  protectedByDefault:
    - CRM domain/repository/Prisma/schema/business rules not listed above
    - Party contracts/runtime and CRM→Party MACHINE_ROOT semantics
    - Collaboration Task/Annotation business rules, Identity/Permission callers, schema/events/outbox
    - every other service RPC/business capability and deployment/package lock
    - AI, ActionGrant, DELEGATED, background-without-user and external direct gRPC

  focusedAcceptanceCommands:
    - pnpm proto:lint
    - pnpm proto:regen
    - node scripts/architecture/trusted-grpc-signature-inventory.mjs
    - pnpm --filter @oes/common build
    - pnpm --filter api-gateway build
    - pnpm --filter crm-service build
    - pnpm --filter collaboration-service build
    - pnpm --filter public-entry-service build
    - pnpm --filter terminal-device-service build
    - pnpm --filter auth-service build
    - pnpm --filter identity-service build
    - pnpm --filter browser-activity-service build
    - pnpm --filter item-master-service build
    - pnpm --filter wms-service build
    - pnpm --filter procurement-service build
    - pnpm --filter mes-service build
    - pnpm --filter finance-service build
    - pnpm --filter sales-service build
    - pnpm --filter srm-service build
    - pnpm exec jest --config package.json --runInBand --runTestsByPath src/common/src/authorization/trusted-execution/declarations.spec.ts src/common/src/authorization/guards/trusted-execution.guard.spec.ts src/common/src/contracts/crm_service/crm.contract.spec.ts
    - pnpm --filter permission-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l1/permission-foundation.seed.spec.ts test/l1/common-permission-code-generator.spec.ts
    - pnpm --filter api-gateway exec jest --config jest.config.js --runInBand --runTestsByPath src/common/grpc/gateway-trusted-grpc-execution-producer.spec.ts src/common/grpc/gateway-trusted-grpc-execution.module.spec.ts src/common/grpc/gateway-crm-grpc.client.spec.ts src/modules/crm-service/adapters/crm-dedicated-client.spec.ts src/modules/crm-service/customer-management.service.spec.ts src/modules/crm-service/extension-crm-workspace.service.spec.ts src/modules/crm-service/admin-crm-performance.service.spec.ts src/modules/crm-service/interface/http/controllers/customer-management.controller.spec.ts src/modules/crm-service/interface/http/controllers/extension-crm-workspace.controller.spec.ts src/modules/crm-service/interface/http/controllers/admin-crm-performance.controller.spec.ts
    - pnpm --filter crm-service exec jest --config jest.config.js --runInBand --runTestsByPath src/infrastructure/adapters/crm-party-trusted-grpc-execution.producer.spec.ts test/l1/party-query-grpc.adapter.spec.ts test/l1/party-trusted-grpc.client.spec.ts test/l1/crm-p1-contract-cleanup.spec.ts test/l3/crm-app-module.spec.ts test/l3/crm-grpc-context.spec.ts test/l3/crm-object-reference.grpc.controller.spec.ts test/l3/crm-p1-management.grpc.controller.spec.ts test/l3/crm-p1-query.grpc.controller.spec.ts test/l3/crm-trusted-grpc-security.spec.ts
    - pnpm --filter collaboration-service exec jest --config jest.config.js --runInBand --runTestsByPath src/infrastructure/adapters/foundation-trusted-grpc.clients.spec.ts src/infrastructure/adapters/crm-object-reference.grpc.adapter.spec.ts src/infrastructure/adapters/collaboration-crm-trusted-grpc.client.spec.ts test/l3/collaboration-trusted-grpc-security.spec.ts
    - pnpm --filter public-entry-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l3/public-entry-trusted-grpc-security.spec.ts
    - pnpm --filter browser-activity-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l3/browser-activity.trusted-grpc.spec.ts
    - pnpm --filter item-master-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l3/item-master-trusted-grpc-security.spec.ts
    - pnpm --filter finance-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l3/finance-trusted-grpc-security.spec.ts
    - pnpm --filter procurement-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l3/procurement-trusted-grpc-security.spec.ts
    - pnpm --filter srm-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l3/srm-trusted-grpc-security.spec.ts
    - pnpm --filter wms-service exec jest --config jest.config.js --runInBand --runTestsByPath test/l3/wms-trusted-grpc-security.spec.ts
    - node --test src/services/business/crm-service/scripts/crm-smoke.spec.mjs
```

Acceptance proves the repository has one declaration field (`sessionTerminals`) and no compatibility alias; the Token retains one signed `session_terminal`; all 15 CRM methods and 22 Gateway routes have the exact matrix above; five methods accept exactly WEB plus BROWSER_EXTENSION while nine Gateway methods and the Collaboration subject accept WEB only; exact CRM audience, Codes, workload/actor and `cnf`; 59 request plus eight nested reservations; claims-derived authority and owner/override decisions; dedicated Gateway and Collaboration clients; Collaboration HUMAN_OBO activation; preserved CRM→Party MACHINE_ROOT; no raw smoke/generic CRM/legacy body or metadata authority; unchanged schema/events/business behavior; exact 114-path lease; and successful proto, generation, inventory, build, focused test, UTF-8, link, YAML and diff gates.

## 10. Repository-wide Security Acceptance

Final acceptance must prove:

1. All 571 planned RPCs have exactly one enforcement declaration: BUSINESS / SELF_SERVICE / INTERNAL after context establishment, or one exact non-reusable bootstrap policy for `ResolveWorkloadIssuance` / `IssueMachineWorkloadSourceCredential`; missing, duplicate or widened bootstrap declarations fail architecture tests/startup.
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
- All existing 51 Controller files plus the frozen new Auth MACHINE, Item Master INTERNAL, SRM INTERNAL and Procurement INTERNAL controllers and all 571 planned RPCs are covered by the enforcement-declaration architecture test.
- The 19 request-only caller baseline reaches zero and the full generated caller inventory is explicit-metadata compliant.
- Every service-level handoff contains fresh build/test/security evidence.
- Full repository black-box acceptance passes at one candidate SHA.
- Common operator-context signer/codec/guard/factory exports and all references are deleted.
- Marketplace has no model, contract, permission, endpoint or backlog lane in this capability.

Implementation must not be dispatched from this design thread. Global Command assigns one service migration owner at a time, plus independent foundation/design owners, under the project’s branch/worktree and acceptance discipline.
