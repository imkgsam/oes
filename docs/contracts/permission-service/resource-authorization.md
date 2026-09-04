# Permission Service Resource Authorization Contract

> 服务设计唯一真相源：[permission-service.md](../../architecture/services/permission-service.md)。本文只描述 `checkResource / buildQueryScope` 的黑盒调用语义、边界与当前开放状态，不重新定义 Permission、Role、PolicyTemplate、PolicyInstance 或业务资源 owner。

## 1. Purpose

This contract defines how service consumers should use `permission-service` resource authorization.

The long-term model is:

```text
checkPermission
  -> ResourceAuthorizationService.checkResource / buildQueryScope
  -> business domain rule
```

`PolicyInstance` is the resource authorization fact model. It replaces the need for a separate `ResourceGrant` or `ResourceScope` fact model.

## 2. Current Exposure Status

Current implementation status:

- Internal `ResourceAuthorizationService` application facade exists in `permission-service`.
- Internal `PolicyTemplateInstanceAuthorizationService` evaluator exists.
- Prisma-backed `PolicyInstance` storage exists.
- First-stage template params schema validation exists for preview and repository save paths.
- Unit and Integration tests cover `checkResource`, `buildQueryScope`, storage mapping, and repository-backed evaluation.

Current external status:

- Internal runtime gRPC `ResourceAuthorizationService` is exposed through
  [resource_authorization.proto](../../../src/common/src/contracts/permission_service/resource_authorization.proto).
- `ResourceAuthorizationService.CheckResource` delegates to the same application `checkResource` facade.
- `ResourceAuthorizationService.BuildQueryScope` delegates to the same application `buildQueryScope` facade.
- Preview-only `PolicyInstancePreviewService.EvaluatePolicyInstancePreview` gRPC exists for management verification.
- Preview-only Gateway HTTP endpoint `POST /policy-instance/evaluate-preview` exists.
- Preview-only tenant-web route `/admin/policy-instance-preview` exists.
- Controlled `PolicyInstanceManagementService` gRPC exists for list / detail / create / enable-disable.
- Gateway exposes controlled `PolicyInstance` management endpoints:
  - `GET /policy-instance`
  - `GET /policy-instance/:id`
  - `POST /policy-instance`
  - `POST /policy-instance/:id/enabled`
- tenant-web exposes `/admin/policy-instance-management` for persisted `PolicyInstance` list / detail / create / enable-disable.
- Full `PolicyInstance` update / delete / archive APIs are not exposed yet.
- Existing tenant-web `策略治理` page displays legacy `Policy + conditionAstJson` as readonly governance, not as the new resource authorization management surface.

Business services must consume the frozen `ResourceAuthorizationService` gRPC contract for runtime resource authorization and must not invent their own wire contract for `PolicyInstance`.
The runtime contract is internal service-to-service only; external clients still enter through API Gateway / BFF.

## 3. checkResource

`checkResource` is used for one concrete resource.

Typical scenarios:

- detail query
- update
- delete
- approve
- confirm
- adjust
- status change

Request shape:

```text
CheckResourceRequest:
  subject:
    accountId
    tenantId
    roleIds[]
    roleCodes?
    orgIds?
    visibleOrgIds?
  permissionCode
  resource:
    tenantId
    resourceType
    resourceId?
    ownerAccountId?
    responsibleBuyerAccountId?
    managerAccountId?
    orgId?
    categoryId?
    customerId?
    supplierId?
    factoryId?
    plantId?
    workshopId?
    workCenterId?
    warehouseId?
    storageLocationId?
    attributes?
  environment?
```

Result shape:

```text
CheckResourceResult:
  allowed
  reasonCode?
  matchedPolicyIds[]
  deniedPolicyIds[]
  trace?
```

Stable rules:

- Caller must already have passed `checkPermission` or an equivalent coarse capability gate.
- Caller must provide minimal resource facts.
- `permission-service` must not query business databases to load resource facts.
- Any matched `DENY` denies the request.
- Business domain rules still run in the owning business service after resource authorization.

## 4. buildQueryScope

`buildQueryScope` is used before list, search, selector, dashboard, report, and export queries.

Request shape:

```text
BuildQueryScopeRequest:
  subject:
    accountId
    tenantId
    roleIds[]
    roleCodes?
    orgIds?
    visibleOrgIds?
  permissionCode
  resourceType
  environment?
```

Result shape:

```text
BuildQueryScopeResult:
  allowed
  scope?: QueryScopeExpression
  reasonCode?
  matchedPolicyIds[]
  deniedPolicyIds[]
  trace?
```

`QueryScopeExpression` shape:

```text
QueryScopeExpression:
  and?: QueryScopeExpression[]
  or?: QueryScopeExpression[]
  field?: string
  op?: EQ | IN | INTERSECTS
  value?: string | string[]
```

Stable rules:

- `buildQueryScope` returns authorization scope, not business data.
- No raw SQL, JavaScript expression, or service-specific internal type may be returned.
- Repository / query adapter maps the expression to Prisma, SQL, or a read-model query.
- If a policy cannot be compiled to a safe query scope, the service must fail closed.
- List/search/page/export flows must not use per-row `checkResource` as the primary authorization strategy.

## 5. PolicyInstance Semantics

Runtime collects all enabled `PolicyInstance` rows matching:

```text
tenantId
permissionCode
resourceType or global resourceType
subjectSelector:
  TENANT_WIDE
  ROLE matching subject.roleIds
  ACCOUNT matching subject.accountId
```

Combination rules:

- `DENY` has priority over `ALLOW`.
- Same layer and same field `ALLOW` values are unioned.
- Different layers and same field `ALLOW` values are intersected.
- Different fields are combined with `AND`.
- Missing field policy in one layer does not narrow that field.
- No enabled matching instance means RBAC allow remains allowed.
- Matching instances with no effective `ALLOW` mean default deny.

## 6. Business Service Responsibilities

Business services own:

- Resource master data.
- Resource lifecycle and business state.
- Resource facts extraction.
- Mapping `QueryScopeExpression` to repository queries.
- Domain rules and invariants.

Examples:

- CRM owns customer facts such as `ownerAccountId`.
- SRM owns supplier facts such as `responsibleBuyerAccountId`.
- Procurement / item-master own category and item facts.
- WMS owns warehouse and storage location facts.
- MES owns factory, site, workshop, and work center facts.

`permission-service` owns only authorization configuration and authorization decision semantics.

## 7. Legacy Boundary

Legacy `Policy + conditionAstJson` and `CheckPermissionWithContext` are not part of this resource authorization contract.

Stable rules:

- New business integrations must not use `CheckPermissionWithContext`.
- New resource range configuration must not use legacy `conditionAstJson`.
- `PolicyInstance.params` must be validated against built-in template schemas before preview or persistence.
- Legacy policy governance may remain readonly while migration is in progress.
- Legacy `CheckPermissionWithContext` and legacy Policy AST mutation RPCs are disabled by default in `permission-service`; explicit recovery flags are required before historical compatibility calls can execute.
- Legacy mutation RPCs must be treated as no-new-callers until a cleanup feature removes them after user confirmation.

## 8. First Product Slice Status

The first frontend-testable slices are:

```text
PolicyInstance Evaluate Preview
PolicyInstance persisted WMS warehouse-scope management
```

Implemented preview behavior:

- Admin can submit a preview-only account-level `PolicyInstance` candidate.
- A test action invokes `buildQueryScope` or `checkResource` through a controlled backend path.
- The frontend displays the resulting decision or `QueryScopeExpression`.
- The preview path proves a real UI path uses `PolicyInstance`, not legacy `Policy + conditionAstJson`.

Implemented persisted management behavior:

- Admin can list and inspect persisted template-based `PolicyInstance` rows.
- Admin can create the first account-level WMS warehouse-scope `PolicyInstance` sample:
  - `permissionCode = wms.inventory.view`
  - `resourceType = inventory`
  - `templateCode = resource-field-in-set`
  - `params.field = warehouseId`
  - `params.allowedValues = [...]`
- Admin can enable or disable one persisted `PolicyInstance`.
- The management path persists `PolicyInstance` facts and does not write legacy `Policy + conditionAstJson`.

This product slice proves the management path and authorization evaluator path, but it does not mean WMS / MES / CRM / SRM / Procurement have completed runtime rollout. Business services still need to consume `ResourceAuthorizationService.CheckResource / BuildQueryScope` and map `QueryScopeExpression` inside their own repositories.
