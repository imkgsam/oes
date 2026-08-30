# Public Business Card Owner-Fact Resolution

```text
status: STABLE
implementation: DESIGN_FROZEN_PENDING_IMPLEMENTATION
entry: EXISTING_DELIVERY_DESIGN_GAP
publicOwner: public-entry-service
factOwners: hr-service, identity-service, tenant-org-service
```

## 1. Purpose

本文冻结匿名 Public Business Card 在 request time 读取 HR、Identity 与 TenantOrg owner facts 的跨服务协同。它只定义 owner-fact acquisition、SYSTEM MACHINE admission、tenant target selector、public-safe projection、失败映射与最小 provisioning；各服务职责和黑盒字段分别以对应 service truth 与 contract 为准。

## 2. Decision

Phase 1 使用 **request-time API composition**：

```text
anonymous browser
  -> Gateway
  -> Public Entry
       -> HR public-card employee projection
       -> Identity public-card identity/contact projection
       -> TenantOrg public-card organization projection
       -> request-private aggregate
  -> one PublicBusinessCardView
```

HR、Identity 与 TenantOrg 继续拥有各自业务真相。Public Entry 只拥有 BusinessCard 配置、公开状态、readiness、展示规则与最终 public view；它不直接读取其他服务数据库，不持久化 owner projection 快照，也不把 request-time aggregate 变成第二份主数据。浏览器只调用 Public Entry，不直接编排内部 owner services。

缓存、owner-event invalidation 或可重建 materialized public-safe read model 是基于真实流量、延迟和可用性证据的后续优化，不属于 Phase 1。任何后续物化都必须保持衍生、可重建、可撤回且不取代 owner truth。

## 3. Exact Owner Resolvers

三个 additive RPC 均为 target-owned `INTERNAL` method，只允许 exact registered `public-entry-service` SYSTEM MACHINE workload、目标 audience、current certificate `cnf` 与一个 literal Code：

| Owner | RPC | Audience | INTERNAL Code |
| --- | --- | --- | --- |
| HR | `ResolvePublicBusinessCardEmployee` | `urn:oes:service:hr-service` | `hr.internal.public_business_card_employee.resolve` |
| Identity | `ResolvePublicBusinessCardIdentity` | `urn:oes:service:identity-service` | `identity.internal.public_business_card_identity.resolve` |
| TenantOrg | `ResolvePublicBusinessCardOrganization` | `urn:oes:service:tenant-org-service` | `tenant_org.internal.public_business_card_organization.resolve` |

现有 `hr.employee.get_by_id`、`identity.account.list`、`identity.account.self.read`、`tenant_org.tenant.get_by_id` 与 `tenant_org.org_unit.list_tree` 保持 `BUSINESS`，不得授予 Public Entry SYSTEM principal，也不得作为这条匿名链路的 fallback。

当前实现状态是 `DESIGN_FROZEN_PENDING_IMPLEMENTATION`：上述 RPC、Code、policy、declaration 与 caller cutover 必须由同一 delivery atomic candidate 实现；设计合并本身不代表 runtime 已具备该能力，也不允许用临时 BUSINESS grant 解除当前阻塞。

## 4. Execution And Tenant Target Admission

1. 匿名访问者没有 HUMAN Token。Gateway 使用既有 exact SYSTEM MACHINE contract 调用 Public Entry 的公开 RPC。
2. Public Entry 先按 `business_card_id` 或 service-owned ShortLink target 读取自己的 BusinessCard，取得 exact `tenant_id` 与 `employee_id`；Contact Action refs 也只来自该卡配置。
3. Public Entry 以固定 tenantless SYSTEM MACHINE direct root 分别申请三个 target-audience ExecutionToken。每个 Token 只携带该 target 的一个 INTERNAL Code，省略 `tenant_id`，不伪造 HUMAN、TENANT 或 terminal。
4. Permission 通过现有 `ResolveWorkloadIssuance` 判定 exact Public Entry workload SPIFFE -> target audience -> INTERNAL Code。三个 Code 均为 `WORKLOAD_POLICY`-only、SYSTEM、non-external，不读取或创建 `PrincipalRoleBinding`、tenant role 或 BUSINESS grant。
5. target method declaration 独立校验 principal/binding、workload、audience、`cnf` 与 Code。Request `tenant_id` 只是 dedicated SYSTEM tenant-target resolver 的 owner lookup selector；它不建立 execution tenant、operator authority 或 tenant wildcard。
6. 每个 owner 必须从自身 store 复核 selector 与 resource owner 关系。Public Entry 的比较不替代 target owner 检查；任一 request/body/header 也不能覆盖 verified execution context。

固定 Public Entry principal 或 binding inactive、workload/audience/Code/`cnf` mismatch、selector malformed、owner relation mismatch、policy/config 缺失或依赖失败全部 fail closed。

## 5. Request-Time Composition

Public Entry 对每次 readiness/render/vCard operation 建立一个 request-private aggregate，不跨 request 持久化：

1. 读取 service-owned BusinessCard 与公开入口状态。
2. 以 card-derived `tenant_id + employee_id` 并行请求 HR employee projection 与 Identity identity/contact projection。
3. HR 返回当前 active employment 的 optional `org_unit_id` 后，Public Entry 请求 TenantOrg organization projection；没有 org reference 时该 selector 可省略。
4. Public Entry 按既有 visibility/contact/vCard 规则组合 owner projections。单次 operation 对同一 owner projection 至多读取一次，readiness 与 render 复用同一 request-private结果，避免前后两次 owner read 漂移。

Required facts：

- HR 确认 employee 与当前 employment 均 active；
- Identity 确认同 tenant 的 enabled account/binding，并返回 nonblank public display name；
- TenantOrg 确认 tenant active，并返回 nonblank company display name。

Optional facts：position/title、没有引用时的 department、official photo、website 与每个 contact action。Optional fact 缺失只省略对应字段或 action；已提供的 employee/account/org selector 出现 tenant mismatch、inactive owner fact 或 malformed owner relation 仍是 required-integrity failure，不降级为跨 tenant/旧值 fallback。

Identity 的 public-card resolver 对每个 Contact Action ref 独立返回 renderable/public-safe projection。单个 target missing、inactive 或 type mismatch 只隐藏该 action；Identity resolver 整体 trust/dependency failure 因 display name 也不可用而使 required aggregate unavailable。

## 6. Public Failure Mapping

Public Entry 可以在 owner-local diagnostics/audit 中记录安全 reason category 与 trace，但匿名响应保持现有 shape 与状态语义：

- required owner fact、trust 或 dependency failure -> generic `PUBLIC_CARD_UNAVAILABLE` / resolver `UNAVAILABLE`；
- card missing 或 service-owned tenant mismatch -> existing `PUBLIC_CARD_NOT_FOUND` / resolver `NOT_FOUND`；
- optional contact/website unavailable -> omit field/action；
- available aggregate -> existing `PublicBusinessCardView` / resolver `REDIRECT`。

匿名响应不得暴露 employee/account/tenant/org 是否存在、具体 lifecycle、Permission reason、owner service 名称、internal id、stack 或 retry detail。

## 7. Provisioning And Readiness

Deploy/runtime readiness 必须在公开流量前幂等核对：

1. Identity-owned versioned inventory 中存在一个 active `SYSTEM / INTERNAL_SERVICE` Public Entry Machine Principal 与 exact workload SPIFFE binding；重复同 manifest 是 no-op，missing/duplicate/mismatch 阻止 readiness。
2. Permission catalog 中存在三个 exact INTERNAL Codes，且只允许 `WORKLOAD_POLICY`；存在 exact Public Entry workload -> three target audiences -> corresponding Code policies。缺少、重复、错误 kind/assignability 或 wildcard policy 阻止 readiness。
3. 三个 target method declarations、server/client registration 与 Public Entry target profiles 完整且唯一；不存在 BUSINESS fallback。
4. deployment smoke 对三个 resolver 执行 wrong workload/audience/Code/`cnf` 与 selector-owner mismatch 负向检查，并确认日志、审计与 response 不含 source credential/Token plaintext。

Acceptance fixture 是 owner-owned、最小且确定性的组合，不通过 broad grant 补齐：

- TenantOrg：一个 active tenant/company 与一个归属该 tenant 的 active org unit；
- HR：一个归属该 tenant 的 active employee 与唯一 current active employment；
- Identity：一个同 tenant enabled account（含 nonblank display name）、active employee binding 与 optional active public-safe Contact Asset；
- Public Entry：一个同 tenant active BusinessCard、ShortLink、template 与 refs；
- Permission/Identity deployment facts：上述 fixed principal/binding、三个 Codes 与 exact workload policies。

Positive fixture 必须产生 existing available public view。Wrong-tenant employee/account/org、inactive tenant、offboarded employee、disabled account、wrong workload/audience/Code/`cnf` 必须 fail closed 并保持 generic public unavailable；optional contact/website 缺失仍可 available，只省略 action。

## 8. Protected Scope

- Gateway -> Public Entry 的 23-RPC admission、现有 public Codes 与匿名入口不变。
- `PublicBusinessCardView`、resolver result、public unavailable/not-found、vCard 与 VisitEvent mapping 不变。
- 不新增 tenant claim、`scope_level` wire claim、tenant wildcard、HUMAN role inheritance 或 Public Entry tenant bot。
- 不共享数据库，不复制 HR/Identity/TenantOrg truth，不新增 owner write path。
- 不放宽现有 BUSINESS methods/Codes，不建立 fallback、dual-read 或 compatibility grant。

## 9. Migration And Verification

迁移是 additive target contracts + atomic caller cutover：

1. 先增加 Proto messages/RPCs、三个 INTERNAL Codes、workload policies、target declarations、server implementations 与 deterministic owner fixtures。
2. 再把 Public Entry outbound adapters 切换到三个 dedicated resolver，并删除匿名/readiness 链路中的五个 BUSINESS Code 请求。
3. 同一 candidate 内通过 static/focused unit、target component、Proto contract/integration、Public Entry available/unavailable journey 与 task-owned full local runtime acceptance；禁止混合 replica 依赖 BUSINESS fallback。

验证至少覆盖：exact method inventory；Proto lint/gen/breaking；workload issuance positive/negative；tenant selector/resource owner checks；required/optional truth table；single-owner-read request scope；generic public error；fixture idempotency；rollback 到 migration 前 caller/runtime。已有 BUSINESS methods 对既有 HUMAN/HUMAN_OBO consumers 保持兼容。

## 10. Related Truth

- [Trusted gRPC and execution context](../platforms/grpc-metadata-and-service-trust.md)
- [Public Entry service](../services/public-entry-service.md)
- [HR service](../services/hr-service.md)
- [Identity service](../services/identity-service.md)
- [TenantOrg service](../services/tenant-org-service.md)
- [Permission service](../services/permission-service.md)
- [BusinessCard public render contract](../../contracts/public-entry-service/business-card-public-render.md)
