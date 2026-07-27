# Trusted gRPC Execution Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Global Command must assign each lane before execution; this packet does not dispatch implementation.

**Goal:** Replace every repository gRPC request-body/operator-header trust path with mTLS workload identity, Auth / STS ExecutionToken, explicit RPC authorization mode and trusted multi-hop propagation.

**Architecture:** Common supplies one generated metadata signature and one client/server runtime. Migration proceeds target service by target service: prepare all callers, switch one target to Token-only enforcement, run service-level acceptance, delete that target’s legacy trust path, then continue. Only an irreducible strongly connected service group may share one server cutover; all 21 services and 560 RPCs must reach zero legacy references before the capability closes.

**Tech Stack:** NestJS, gRPC, `ts-proto` / Buf, TypeScript, JWT / JWKS, Prisma, Jest, W3C Trace Context, deployment-managed mTLS.

---

```text
status: DESIGN_FROZEN_IMPLEMENTATION_NOT_DISPATCHED
freezeToken: FROZEN_TRUSTED_GRPC_METADATA
decisionAdr: docs/adr/0015-workload-identity-and-execution-token.md
architectureTruthSource: docs/architecture/14-grpc-metadata-and-service-trust-architecture.md
migrationClosure: 21 services / 51 controllers / 560 RPCs / zero legacy trust references
resolvedDesignGates:
  - DG-1: docs/architecture/services/auth-service.md
  - DG-3: docs/architecture/collaborations/external-api-key-security.md
```

## 1. Frozen Scope

This capability now includes the complete current gRPC repository boundary:

- Common generated metadata signatures and trusted client/server runtime.
- Deployment workload identity and channel authentication.
- Auth / STS issuance, local validation support and process-local Token cache.
- Identity Machine Principal ownership and Permission principal authorization integration.
- API Gateway and every service-to-service caller.
- All 21 gRPC services, 51 Controller files and 560 proto RPCs.
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
| DG-3 | **FROZEN**: [External API Key Security Collaboration](../../architecture/collaborations/external-api-key-security.md) and its Auth/Gateway contracts define identifier/secret, HTTP exchange, verifier/pepper, rate protection, rotation, audit, leak response and Integration Machine boundary. | Credential implementation may start after Command dispatch; public external opening remains blocked by DG-2 credential-deny propagation. |
| DG-4 | DELEGATED execution and ActionGrant: delegation lifecycle, tool upper bound, step-up, one-time consumption and forbidden operations | AI delegation and RPCs requiring one-time high-risk authorization |
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
| TG-2 | Auth Service owner | `src/common/src/contracts/auth_service/execution_token.proto`, `src/services/system/auth-service/src/{application,domain,infrastructure,interfaces,modules}/**`, Auth Prisma and tests | STS exchange, signed single-audience Token, JWKS, cache-compatible TTL and audited issuance; DG-1/DG-2 gate production completion |
| TG-3 | Identity + Auth credential migration owners | `src/common/src/contracts/identity_service/identity_query.proto`, `src/services/system/identity-service/src/application/{commands,queries}/service-account/**`, `src/services/system/identity-service/src/domain/{entities,repositories}/api-key*`, `src/services/system/identity-service/src/infrastructure/**/*api-key*`, `src/services/system/identity-service/src/interfaces/grpc/identity-machine-auth.grpc.controller.ts`, Identity/Auth `prisma/**` and focused tests | Machine Principal remains Identity-owned; API Key credential moves to Auth; DG-3 gates external opening |
| TG-4 | Permission + Common Permission owners | `src/common/src/authorization/permission-codes/**`, `principal_authorization.proto`, Permission source / Prisma / tests | Common definitions, Principal authorization, INTERNAL issuance decision and catalog sync; DG-5 gates schema migration |
| TG-5 | API Gateway owner | `src/services/api-gateway/src/common/grpc/**`, tenant-aware permission guard, all target-specific downstream adapters and tests | Session/root execution construction and target-specific producer preparation for every migrated service |
| TG-VERIFY | Integration / Security owner | `scripts/local/trusted-grpc-*.mjs`, target-specific fixtures and deployment test configuration | Per-service acceptance evidence plus final repository-wide proof |

`src/common/src/generated/**` is changed only through `pnpm proto:regen`. Shared paths remain single-writer.

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
- [ ] Record exactly one mode for each RPC in the owner service truth/contract.
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

This priority does not exempt any later service.

## 10. Repository-wide Security Acceptance

Final acceptance must prove:

1. All 560 RPCs have exactly one authorization mode; missing or duplicate mode fails architecture tests/startup.
2. All 21 services validate exact issuer, time, audience, `cnf`, tenant and required Permission Codes locally.
3. Normal RPC validation makes no Auth network call; only Token exchange/cache miss does.
4. No RPC trusts `x-internal-service-name`, shared signed operator payload or identity body duplicates.
5. SYSTEM is not a tenant wildcard; cross-tenant body injection fails.
6. SELF_SERVICE cannot target another principal; forbidden DELEGATED operations fail.
7. INTERNAL pure-machine calls work only for approved workload issuance policy.
8. Multi-hop calls change audience / `cnf` and preserve allowed attribution and trace continuity.
9. Cross-workload Token replay fails; repeated commands remain idempotent.
10. Site Runtime credential proof remains independent from internal Token validation.
11. External API Key never enters internal gRPC metadata. DG-3 is frozen; public external opening remains blocked until DG-2 provides credential-deny propagation.
12. Emergency revoke and DELEGATED/ActionGrant acceptance remain gated by DG-2/DG-4 rather than locally invented.
13. Full workspace generation, build and service test matrix pass at the exact candidate SHA.
14. Repository scans find zero legacy signer, guard, factory, header, trusted body identity and request-only client call.

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
- All 21 service rows are `LEGACY_REFERENCES_ZERO`.
- All 51 Controller files and 560 RPCs are covered by the authorization-mode architecture test.
- The 19 request-only caller baseline reaches zero and the full generated caller inventory is explicit-metadata compliant.
- Every service-level handoff contains fresh build/test/security evidence.
- Full repository black-box acceptance passes at one candidate SHA.
- Common operator-context signer/codec/guard/factory exports and all references are deleted.
- Marketplace has no model, contract, permission, endpoint or backlog lane in this capability.

Implementation must not be dispatched from this design thread. Global Command assigns one service migration owner at a time, plus independent foundation/design owners, under the project’s branch/worktree and acceptance discipline.
