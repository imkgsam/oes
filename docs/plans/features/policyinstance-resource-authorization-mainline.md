# PolicyInstance Resource Authorization Mainline

> 服务设计唯一真相源：[permission-service.md](../../architecture/services/permission-service.md)。本文只记录 `PolicyInstance` 资源授权主线的冻结结论、迁移路径与首个前端可测试 slice，不重新定义 permission-service 长期 owner 边界。

## 1. Goal

将 OES resource authorization 从“legacy Policy AST + internal PolicyInstance prototype 并存”的状态，收敛为清晰主线：

```text
checkPermission
  -> PolicyTemplate / PolicyInstance
  -> ResourceAuthorizationService.checkResource / buildQueryScope
  -> business domain rule
```

## 2. Final Design

冻结结论：

- `Role` 管能力，不管个人化资源范围。
- `PolicyTemplate` 定义平台内置、代码版本化、可测试、可审计的判断模板。
- `PolicyInstance` 定义资源授权事实，是 resource grant / resource scope 的唯一长期承接模型。
- `ResourceAuthorizationService` 是资源授权 application facade。
- 旧 `Policy + conditionAstJson` 只保留为 legacy readonly governance 与 `CheckPermissionWithContext` 兼容载体。
- 新业务资源授权不得接入 `CheckPermissionWithContext`。
- 新业务资源授权不得通过旧 `conditionAstJson` 自由编辑表达。

## 3. Scope

本主线包含三段：

1. 冻结最终设计并更新稳定文档。
2. 迁移并清理历史遗留。
3. 实现第一个真正使用 `PolicyInstance` 的能力操作，并提供前端测试入口。

本主线不做：

- 让 permission-service 拥有业务资源主数据。
- 将业务生命周期、不变量或流程规则写成 policy。
- 在 Gateway、DTO、Prisma schema 或前端中编写核心授权规则。
- 在第一阶段开放自由 AST 或任意脚本规则。

## 4. Current State

已存在：

- Prisma `PolicyInstance` model。
- `PolicyTemplateInstanceRepository`。
- `PolicyTemplateInstanceAuthorizationService`。
- `ResourceAuthorizationService` internal facade。
- Internal runtime `ResourceAuthorizationService` gRPC contract for `CheckResource` and `BuildQueryScope`。
- Controlled `PolicyInstanceManagementService` gRPC contract for list / detail governance and first-stage create / enable-disable mutations。
- L1 / L2 tests covering evaluator and repository-backed resource authorization。
- tenant-web `策略治理` page for legacy `Policy + conditionAstJson` readonly governance。
- tenant-web `/admin/policy-instance-preview` preview page and Gateway preview endpoint。
- tenant-web `/admin/policy-instance-management` page for persisted `PolicyInstance` list / detail / create / enable-disable。
- navigation foundation registers `admin.policy-instance-management` and `admin.policy-instance-preview` for system-admin governance access。

未存在：

- `PolicyInstance` full update gRPC / Gateway contract。
- Business service rollout through `PolicyInstance`。

## 5. Migration Phases

### Phase 1: Design Freeze

Status: completed.

Deliverables:

- Update `docs/architecture/services/permission-service.md`.
- Update `docs/architecture/platforms/authorization-layering-and-resource-policy.md`.
- Add `docs/contracts/permission-service/resource-authorization.md`.
- Keep `PolicyInstance` as the only resource grant / resource scope fact model.
- Mark legacy `Policy + conditionAstJson` and `CheckPermissionWithContext` as no-new-callers for resource authorization.

Acceptance:

- Stable docs define old/new model boundaries without conflicting terminology.
- Docs state that no independent `ResourceGrant / ResourceScope` model will be introduced.
- Docs state that `PolicyInstance` does not own business resource master data.

Current truth sources:

- Service boundary: [permission-service.md](../../architecture/services/permission-service.md)
- Project authorization layering: [authorization-layering-and-resource-policy.md](../../architecture/platforms/authorization-layering-and-resource-policy.md)
- Resource authorization contract: [resource-authorization.md](../../contracts/permission-service/resource-authorization.md)

### Phase 2: Legacy Governance and Contract Cleanup

Status: first-stage completed; physical cleanup deferred behind deletion gates.

Planned actions:

- Audit all code references to `CheckPermissionWithContext`.
- Audit all Gateway / tenant-web access to legacy policy management.
- Mark legacy policy mutation RPCs as deprecated / no-new-callers in proto and docs.
- Keep legacy policy readonly governance available during transition.
- Add tests preventing new frontend mutation paths for legacy `conditionAstJson`.

Completed:

- `CheckPermissionWithContext` is marked deprecated in proto.
- Legacy AST policy mutation RPCs are marked deprecated in proto.
- Legacy AST policy mutation controller methods are marked deprecated in source and point new resource authorization facts to `PolicyInstance`.
- Gateway policy governance controller remains readonly.
- Gateway no longer exposes a generic `deletePolicy` facade.
- Gateway policy governance controller has a source-level guard preventing legacy `Policy + conditionAstJson` HTTP mutation routes from returning.
- Gateway policy management adapter has a guard that only permits readonly methods plus the explicit `deleteLegacyPolicy` compatibility cleanup path.
- Account deletion cleanup uses an explicit `deleteLegacyPolicy` compatibility method while legacy account-scoped AST policies may still exist.
- tenant-web has a readonly guard test preventing legacy `Policy + conditionAstJson` governance from regaining frontend mutation paths.

Deferred deletion gates:

Physical deletion is intentionally deferred. The following artifacts must not be removed until caller evidence proves they are no longer needed:

- `Policy` table.
- `conditionAstJson` parser/evaluator.
- `CheckPermissionWithContext` RPC.
- `deleteLegacyPolicy` compatibility cleanup path used during account deletion.

Required proof before deletion:

- Static no-new-callers guard shows no non-test caller outside the compatibility whitelist.
- Runtime or integration audit shows no production-like traffic depends on `CheckPermissionWithContext`.
- Account deletion no longer needs `deleteLegacyPolicy`, or legacy account-scoped AST policies have been migrated.
- Historical policy governance page has either been archived or re-scoped to a read-only archive view.

### Phase 3: PolicyInstance Contract and Management Surface

Status: first-stage completed; full update / archive semantics deferred.

Planned actions:

- Freeze `PolicyInstance` management gRPC / Gateway contract.
- Add strict params schema validation against built-in template registry.
- Add readonly or mutation-controlled `PolicyInstance` management APIs.
- Add audit metadata for create / update / disable.
- Keep template logic platform-owned and non-editable.

Completed:

- First-stage params schema validation is enforced for preview candidates and repository save.
- Unknown params and malformed required params are rejected with `POLICY_TEMPLATE_PARAMS_INVALID`.
- Historical phase packets are marked `SUPERSEDED_BY_TRUTH_SOURCE` and point to stable service / contract truth sources instead of acting as second-source design documents.
- Internal runtime `ResourceAuthorizationService` gRPC exposes `CheckResource` and `BuildQueryScope` for service-to-service rollout.
- `PolicyInstanceManagementService` gRPC query methods expose list / detail governance for `PolicyInstance`.
- Gateway exposes readonly `GET /policy-instance` and `GET /policy-instance/:id` through the new `PolicyInstanceManagementService`.
- tenant-web exposes readonly `/admin/policy-instance-management` for persisted `PolicyInstance` list / detail.
- `PolicyInstanceManagementService` gRPC exposes `CreatePolicyInstance` and `SetPolicyInstanceEnabled`.
- Gateway exposes `POST /policy-instance` and `POST /policy-instance/:id/enabled`.
- tenant-web `/admin/policy-instance-management` exposes the first persisted operation entry:
  - create an account-level WMS warehouse-scope `PolicyInstance`
  - enable / disable persisted `PolicyInstance` rows
- Create / enable-disable persist `createdBy / updatedBy / createdAt / updatedAt` metadata through permission-service.

Deferred:

- Full `PolicyInstance` update contract for controlled metadata changes.
- Delete / archive semantics, if needed later.
- Business-service rollout through `ResourceAuthorizationService`.

Current API surface:

```text
GET /policy-instance
GET /policy-instance/:id
POST /policy-instance
POST /policy-instance/:id/enabled
POST /policy-instance/evaluate-preview
```

Future API candidates:

```text
PATCH /policy-instance/:id
POST /policy-instance/:id/archive
```

The API names may change during contract implementation, but the semantic surface must remain bounded to template-based `PolicyInstance`.

### Phase 4: First Frontend-Testable Slice

Status: completed for the first persisted PolicyInstance operation slice.

Recommended first slice:

```text
PolicyInstance persisted WMS warehouse-scope management
```

Why this slice:

- It matches the core purpose of `PolicyInstance`.
- It can be tested without waiting for WMS / MES full rollout.
- It gives tenant-web a concrete page to create/view/enable/disable account-level resource ranges.
- It persists real `PolicyInstance` facts instead of legacy `Policy + conditionAstJson`.

Implemented minimum behavior:

- tenant-web exposes `/admin/policy-instance-preview`.
- Gateway exposes `POST /policy-instance/evaluate-preview`.
- permission-service exposes preview-only `PolicyInstancePreviewService.EvaluatePolicyInstancePreview`.
- Preview invokes `ResourceAuthorizationService.checkResource` or `buildQueryScope` through `PolicyInstancePreviewService`.
- UI displays the resulting decision or `QueryScopeExpression`.
- The preview uses `PolicyInstance`, not legacy `Policy + conditionAstJson`.
- tenant-web exposes `/admin/policy-instance-management`.
- Gateway exposes `POST /policy-instance` and `POST /policy-instance/:id/enabled`.
- permission-service persists `PolicyInstance` via `PolicyInstanceManagementService.CreatePolicyInstance`.
- permission-service toggles state via `PolicyInstanceManagementService.SetPolicyInstanceEnabled`.
- permission-service navigation foundation exposes the management and preview pages as governed admin entries:
  - `admin.policy-instance-management`
  - `admin.policy-instance-preview`

Deferred for full account data scope management:

- Account / role selector integration.
- Controlled full-update contract.
- Business-service query-scope rollout.

Current thread completion boundary:

- The three requested deliverables for this thread are completed:
  - final design is frozen in the stable permission-service architecture and contract documents;
  - legacy `Policy + conditionAstJson + CheckPermissionWithContext` is downgraded to deprecated / readonly / compatibility with no-new-callers guards;
  - the first persisted PolicyInstance operation is available through tenant-web at `/admin/policy-instance-management`, with preview available at `/admin/policy-instance-preview`.
- The remaining items below are follow-up rollout tracks, not blockers for this thread's first PolicyInstance management slice.

Candidate preview scenarios:

- Procurement category scope:
  - `permissionCode = procurement.purchase_request.create`
  - `resourceType = item`
  - `templateCode = resource-field-in-set`
  - `params.field = categoryId`
  - `params.allowedValues = [raw-material, packaging]`
- WMS warehouse scope:
  - `permissionCode = wms.inventory.view`
  - `resourceType = inventory`
  - `templateCode = resource-field-in-set`
  - `params.field = warehouseId`
  - `params.allowedValues = [W1, W2]`

### Phase 5: Business Rollout

Status: follow-up pending; outside this thread's first PolicyInstance management slice.

Recommended rollout order:

1. Procurement selector / item category scope.
2. CRM customer owner visibility.
3. SRM supplier responsible buyer visibility.
4. WMS warehouse / location range.
5. MES factory / workshop / work center range.

WMS / MES hierarchy rules:

- Resource hierarchy truth remains in WMS / MES.
- First phase can use explicit IDs in `allowedValues`.
- `includeDescendants` requires a later controlled template or service-side query adapter design.

## 6. Risks

- Leaving legacy mutation RPCs undocumented may keep old AST policy alive as an accidental product surface.
- Adding separate `ResourceGrant` would create two resource authorization fact models.
- Exposing `PolicyInstance.params` without schema validation would recreate the old free-form AST problem in another shape.
- Building frontend pages before contract freeze may force UI concepts into service boundaries.
- Letting permission-service expand WMS / MES hierarchy would violate business resource ownership.

## 7. Verification Plan

Design freeze verification:

```text
rg -n "ResourceGrant|ResourceScope|CheckPermissionWithContext|conditionAstJson|PolicyInstance" docs/architecture docs/contracts docs/plans/features
```

Backend baseline verification:

```text
pnpm --filter permission-service exec jest --config jest.config.js --runInBand \
  test/l1/policy-template-instance-authorization.spec.ts \
  test/l1/resource-authorization.service.spec.ts \
  test/l1/policy-template-instance-storage.spec.ts \
  test/l2/prisma.policy-template-instance.repository.spec.ts \
  test/l2/resource-authorization.service.integration.spec.ts
```

First frontend slice verification:

```text
pnpm --filter permission-service exec jest --config jest.config.js --runInBand \
  test/l1/legacy-authorization-no-new-callers.spec.ts \
  test/l1/legacy-policy-contract-deprecation.spec.ts \
  test/l1/policy-instance-management.service.spec.ts \
  test/l1/policy-instance-management.grpc.controller.spec.ts \
  test/l1/policy-instance-preview.service.spec.ts \
  test/l1/policy-instance-preview.grpc.controller.spec.ts \
  test/l1/policy-template-params.validator.spec.ts \
  test/l1/resource-authorization.grpc.controller.spec.ts \
  test/l1/policy-template-instance-storage.spec.ts

pnpm --dir src/services/api-gateway exec jest --runInBand \
  src/modules/permission-service/interface/http/controllers/policy.controller.spec.ts \
  src/modules/permission-service/interface/http/controllers/policy-instance.controller.spec.ts \
  src/modules/permission-service/interface/http/controllers/policy-instance-preview.controller.spec.ts \
  src/modules/permission-service/adapters/policy-instance-management-grpc.adapter.spec.ts

pnpm --dir app/web exec vitest run \
  apps/tenant-web/src/api/bff/policy-governance/legacy-readonly-guard.spec.ts \
  apps/tenant-web/src/api/bff/policy-instance-management/index.spec.ts \
  apps/tenant-web/src/views/admin/policy-instance-management.spec.ts \
  apps/tenant-web/src/api/bff/policy-instance-preview/index.spec.ts \
  apps/tenant-web/src/views/admin/policy-instance-preview.spec.ts --dom

pnpm --filter api-gateway build
pnpm --dir app/web --filter @oes/tenant-web typecheck
```

Broader service test suites remain useful before merge, but the focused commands above are the minimum evidence for this mainline's design freeze, legacy guard, resource authorization gRPC, Gateway, and tenant-web slices.

## 8. Resolved and Remaining Decisions

Resolved:

- The first UI slice is not preview-only. It includes preview plus persisted WMS warehouse-scope `PolicyInstance` creation and enable / disable.
- `PolicyInstance` management is exposed through the existing Gateway permission-service module as a separate `policy-instance-management` HTTP group, backed by the dedicated permission-service `PolicyInstanceManagementService`.
- First-stage WMS / MES range expression starts with explicit ID lists through `resource-field-in-set`.

Remaining:

- Controlled full update / archive semantics for persisted `PolicyInstance`.
- Business service runtime rollout through `ResourceAuthorizationService.CheckResource / BuildQueryScope`.
- WMS / MES hierarchy expansion such as `includeDescendants`; this requires a later controlled template or business-service query adapter design because hierarchy truth stays in WMS / MES.
