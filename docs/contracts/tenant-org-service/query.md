# tenant-org-service Query API

> 服务设计唯一真相源：[tenant-org-service.md](../../architecture/services/tenant-org-service.md)。本文只描述黑盒 query contract，不重新定义 `Tenant / OrgUnit / org tree` 的长期职责或 owner 边界。
> 查询入口涉及的 PermissionGuard、permission code 或授权判定语义，以 [permission-service.md](../../architecture/services/permission-service.md) 与项目级授权架构为准。

## 1. 模块职责

`TenantOrgQueryService` 负责提供只读 tenant / org 查询能力，不修改状态。

适用场景：

- 按 `tenantId` 查询 tenant 摘要
- 查询租户组织树
- 按 `orgUnitId` 查询组织节点摘要
- 校验业务对象中的 org 引用是否合法
- 查询组织节点的祖先 / 子孙范围

调用约束：

- 接口类型：内部服务接口
- 服务：`TenantOrgQueryService`
- 调用方：内部服务
- 租户目录、组织树、组织节点详情与层级遍历等人类可见查询接口：要求 internal service、authenticated operator 与 `PermissionGuard`
- `GetTenantById` 与组织引用校验类接口：要求 internal service；不重新定义业务使用权，调用方仍需遵循自身服务权限与协同 contract

## 2. Tenant 查询

### `GetTenantById`

- 作用：按 `tenantId` 查询 tenant 最小摘要
- 权限语义：内部 tenant lifecycle / reference 查询能力，不单独声明人类可见查询权限；若由 BFF 暴露给用户，必须在 gateway / BFF 层执行 `tenant_org.tenant.get_by_id`
- 请求关键字段：
  - `tenant_id`
- 响应关键字段：
  - `tenant.id`
  - `tenant.code`
  - `tenant.name`
  - `tenant.status`
  - `tenant.root_org_id`
- 返回空语义：
  - 未匹配时返回空响应对象
- 认证准入语义：
  - `auth-service` 是该接口的正式消费者之一，用于判断 `TENANT` scope account/session 是否允许建立或继续使用
  - `auth-service` 如何消费 tenant lifecycle 结果，以 [auth-service.md](../../architecture/services/auth-service.md) 为准
  - `tenant.status = ACTIVE` 是认证与会话准入的唯一允许状态
  - `SUSPENDED` 与 `ARCHIVED` 都必须被认证链路拒绝
  - `identity-service` 本地 account 或历史 tenant 字段不得替代该状态真相

### `ListTenants`

- 作用：按条件列出租户目录
- 权限码：`tenant_org.tenant.list`
- 请求关键字段：
  - optional `keyword`
  - optional `status`
  - optional `page`
  - optional `page_size`
- 响应关键字段：
  - `tenants[]`
  - `total`

## 3. 组织结构查询

### `GetOrgTreeByTenantId`

- 作用：查询某个 tenant 的组织树
- 权限码：`tenant_org.org_unit.list_tree`
- 请求关键字段：
  - `tenant_id`
- 响应关键字段：
  - `roots[]`
  - `OrgNode.children[]`
- 关键语义：
  - 第一版返回稳定树结构，不表达人员归属

### `GetOrgUnitById`

- 作用：按 `orgUnitId` 查询组织节点摘要
- 权限码：`tenant_org.org_unit.get_by_id`
- 请求关键字段：
  - `tenant_id`
  - `org_unit_id`
- 响应关键字段：
  - `org_unit.id`
  - `org_unit.tenant_id`
  - `org_unit.parent_org_id`
  - `org_unit.name`
  - `org_unit.type`
  - `org_unit.status`
  - `org_unit.path`
  - `org_unit.depth`
  - optional `org_unit.organization_tenant_party_id`
- `organization_tenant_party_id` 语义：
  - 表示该节点当前正式持有的 `ORGANIZATION` TenantParty 引用
  - 该字段为空不代表数据异常；当前基础语义仍是 optional association
  - 当前只有 `ROOT` 与 `BRANCH` 节点允许返回非空值

### `ListAncestorOrgUnits`

- 作用：列出组织节点的祖先链
- 权限码：`tenant_org.org_unit.list_tree`
- 请求关键字段：
  - `tenant_id`
  - `org_unit_id`
- 响应关键字段：
  - `ancestors[]`

### `ListDescendantOrgUnits`

- 作用：列出组织节点的子孙节点
- 权限码：`tenant_org.org_unit.list_tree`
- 请求关键字段：
  - `tenant_id`
  - `org_unit_id`
  - optional `max_depth`
- 响应关键字段：
  - `descendants[]`

## 4. 组织引用查询

### `ValidateOrgReference`

- 作用：校验业务对象中某个 org 引用是否合法
- 权限语义：内部引用校验能力，不单独声明人类可见查询权限；调用方业务动作必须在自身服务完成授权
- 请求关键字段：
  - `tenant_id`
  - `org_unit_id`
  - optional `expected_org_type`
- 响应关键字段：
  - `valid`
  - optional `rejection_reason`
  - optional `org_unit_summary`

### `GetOrgReferenceSummary`

- 作用：返回组织引用可消费的轻量摘要
- 权限语义：内部引用摘要能力，不单独声明人类可见查询权限；调用方业务动作必须在自身服务完成授权
- 请求关键字段：
  - `tenant_id`
  - `org_unit_id`
- 响应关键字段：
  - `org_unit.id`
  - `org_unit.name`
  - `org_unit.type`
  - `org_unit.path`
  - `org_unit.status`
- 当前第一阶段 `GetOrgReferenceSummary` 不承诺补水 TenantParty 摘要；调用方如需要主体详情，应再通过受控链路查询 `party-service`

## 5. `ResolveAuthSessionTenantLifecycle`

该 additive RPC 是 Auth-only 登录/session safety resolver：

- admission：exact registered `auth-service` workload、`aud=urn:oes:service:tenant-org-service`、SYSTEM MACHINE principal、current certificate `cnf`、INTERNAL Code `tenant_org.internal.auth_session_tenant_lifecycle.resolve`；Code 只可分配给 `WORKLOAD_POLICY`。
- request：`tenant_id`，来自 Identity account owner fact 或已验证 terminal/device boundary，仅作为 TenantOrg owner lookup selector。
- response：仅 `tenant_id`, `status`；不返回 tenant profile、org tree、onboarding、party、role 或 grant。
- use：登录 candidate 筛选、account selection、MFA completion、session refresh/validation 的 lifecycle 复核。
- failure：not found、status 非 `ACTIVE`、selector/owner mismatch、trust/policy/dependency failure均使 Auth 拒绝对应 TENANT session 的建立或续期。

Generic `GetTenantById` remains a BUSINESS projection for its existing HUMAN/HUMAN_OBO and other declared consumers. The fixed Auth Machine Principal receives no `tenant_org.tenant.get_by_id` grant for login/session safety.

## 6. `ResolvePublicBusinessCardOrganization`

该 additive RPC 只服务 Public Entry 的公开名片 request-time composition：

- admission：exact registered `public-entry-service` workload、`aud=urn:oes:service:tenant-org-service`、tenantless SYSTEM MACHINE principal、current certificate `cnf` 与 INTERNAL Code `tenant_org.internal.public_business_card_organization.resolve`；Code 只可分配给 `WORKLOAD_POLICY`。
- request：`tenant_id=1`, optional `org_unit_id=2`。Tenant 来自 Public Entry service-owned BusinessCard record；org reference 只来自 HR public-card employee projection。两者都是 owner lookup selector。
- owner decision：selected tenant 必须存在且 `ACTIVE`；当 `org_unit_id` 非空时，该 org 必须存在、active 且属于 selected tenant。空 org selector 表示名片没有 department projection，不是错误。
- response：`available=1`, `tenant_id=2`, `company_display_name=3`, optional `website_url=4`, optional `org_unit_id=5`, optional `org_unit_display_name=6`, safe `reason_code=7`。它不返回 tenant code、root org、org tree/path/ancestors/descendants、party、onboarding、role 或 grant。
- failure：tenant missing/inactive、supplied org missing/inactive/cross-tenant、trust/policy/dependency failure 返回 `available=false` 与 safe reason，不泄露其他 tenant/org fact。

Public Entry 使用本 resolver 取代 public-card 链路中的 `GetTenantById` 与 `GetOrgReferenceSummary`。Existing BUSINESS methods 保持既有 consumers，不成为 fallback；固定 Public Entry principal 不获得 `tenant_org.tenant.get_by_id` 或 `tenant_org.org_unit.list_tree` grant。

## 7. 主要错误与返回约束

- 输入参数非法时：
  - 返回统一 validation failure
- 查询对象不存在时：
  - 查询接口优先返回空响应对象，而不是抛业务异常
- 调用方不应依赖内部异常结构推断 tenant 或 org 语义
- query 侧暴露 `organization_tenant_party_id` 不代表调用方获得了对该 party 的业务使用权；是否继续消费该主体，仍由各自业务 contract 与授权链路决定

## 8. 第一阶段明确不做

- 不提供 account-org membership 查询
- 不提供 employee / employment 查询；HR 查询语义以 [hr-service.md](../../architecture/services/hr-service.md) 为准
- 不提供基于正式人员归属的 org scope 结果
