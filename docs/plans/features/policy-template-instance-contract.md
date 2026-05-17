# Policy Template / Instance Contract

> 服务设计唯一真相源：[permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。模型冻结依据为 [policy-template-instance-model.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/policy-template-instance-model.md)。本文只记录第一条实现主线的 contract / application pattern / evaluation shape，不重新定义 permission-service 长期 owner 边界。

## 1. 目标

- 将已冻结的 `Policy Template / Policy Instance` 模型推进为可实现的最小 contract。
- 补齐当前 policy “底层 AST 能力存在，但业务资源授权不可用”的关键缺口。
- 定义第一阶段 template registry、policy instance、subject selector、resource facts、decision result、query scope result 的稳定形状。
- 为后续 storage、管理 UI、CRM/SRM rollout、Procurement category scope、MES/WMS site scope 提供实现基线。

## 2. 不做什么

- 不实现代码。
- 不修改 proto / gRPC / HTTP contract。
- 不开放 policy AST 自由编辑。
- 不开放通用 rule builder。
- 不实现 tenant-web 管理页面。
- 不实现 policy instance storage。
- 不实现 CRM/SRM/Procurement/MES/WMS 业务 rollout。
- 不改变 `CheckPermission` 粗粒度 RBAC 语义。
- 不改变 hard boundary、domain rule 或业务主数据 owner 边界。

## 3. 上游依赖

- architecture:
  - [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
- services:
  - [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- model:
  - [policy-template-instance-model.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/policy-template-instance-model.md)
- related plans:
  - [policy-governance-readonly.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/policy-governance-readonly.md)
  - [unified-permission-decorator.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/unified-permission-decorator.md)

## 4. 当前结论

- 当前 policy 不应被视为业务资源授权已可用。
- 当前已有 policy AST、policy engine 与 readonly governance，但缺少 template / instance contract、resource facts contract、`checkResource` contract 与 `buildQueryScope` contract。
- 第一条实现主线应先冻结 contract shape，而不是直接进入 UI 或业务 rollout。
- 第一阶段产品心智是“账号数据范围配置”，底层实现是受限 `Policy Template / Policy Instance`。

## 5. Contract 范围

本 feature packet 冻结以下 contract 形状：

- `PolicyTemplateDefinition`
- `PolicyInstance`
- `SubjectSelector`
- `AuthorizationSubjectFacts`
- `ResourceFacts`
- `EnvironmentFacts`
- `CheckResourceRequest / Result`
- `BuildQueryScopeRequest / Result`
- `QueryScopeExpression`
- `PolicyDecisionTrace`

本文只冻结逻辑 shape；字段名进入 proto / DTO 前仍需由实现线程根据现有代码风格做最小映射。

## 6. PolicyTemplateDefinition

第一阶段 template 由平台内置 registry 提供，不从数据库自由创建。

建议 shape：

```text
PolicyTemplateDefinition:
  code: string
  category: RESOURCE | QUERY_SCOPE | SECURITY
  effectSupport: ALLOW_ONLY | DENY_ONLY | ALLOW_AND_DENY
  supportedSubjectSelectors: ACCOUNT | ROLE | TENANT_WIDE
  resourceFieldParamsSchema?
  environmentParamsSchema?
  queryScopeCapable: boolean
  checkResourceCapable: boolean
  description
  version
```

稳定规则：

- template code 由平台维护，不能由租户管理员创建。
- template 必须声明是否支持 `buildQueryScope`。
- template 必须声明是否支持 `checkResource`。
- template 只允许访问白名单 resource facts / environment facts。
- 第一阶段不允许 template 执行任意脚本或任意 AST。

## 7. 第一阶段 Template Registry

第一阶段建议 registry 只包含以下 template：

- `resource-field-in-set`
  - resource field 属于 params.allowedValues。
  - 支持 `checkResource` 与 `buildQueryScope`。
- `resource-field-equals`
  - resource field 等于 params.value。
  - 支持 `checkResource` 与 `buildQueryScope`。
- `resource-field-matches-subject-field`
  - resource field 等于 subject field。
  - 支持 `checkResource` 与 `buildQueryScope`。
- `own-resource`
  - resource owner account 等于 subject account。
  - 支持 `checkResource` 与 `buildQueryScope`。
- `org-scope`
  - resource org 落在 subject visible org scope 内。
  - 第一阶段可先作为试点 template，不作为首批强依赖。
- `working-hours`
  - environment time 落在 params windows 内。
  - 支持 `checkResource`，不支持通用 `buildQueryScope`。
- `ip-allowlist`
  - environment client IP 落在 params cidrs 内。
  - 支持 `checkResource`，不支持通用 `buildQueryScope`。

暂不进入 registry：

- 自由 AST。
- 任意 JavaScript / expression script。
- 业务域专用 template 大量铺开。
- 外部风险引擎 template。

## 8. PolicyInstance

建议 shape：

```text
PolicyInstance:
  id: string
  tenantId: string
  subjectSelector: SubjectSelector
  permissionCode: string
  resourceType?: string
  templateCode: string
  effect: ALLOW | DENY
  params: object
  enabled: boolean
  priority: number
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
```

稳定规则：

- `permissionCode` 必须引用已存在 Permission。
- `templateCode` 必须引用内置 template registry。
- `resourceType` 为空时仅适用于 security policy 或非资源型能力。
- instance 保存授权配置与业务资源引用，不保存业务资源真相。
- tenant isolation 不由 instance 表达。
- `TENANT_WIDE` 表示租户内全员策略，不表示 tenant isolation。

## 9. SubjectSelector

建议 shape：

```text
SubjectSelector:
  type: ACCOUNT | ROLE | TENANT_WIDE
  accountId?: string
  roleId?: string
```

约束：

- `ACCOUNT` 必须有 `accountId`。
- `ROLE` 必须有 `roleId`。
- `TENANT_WIDE` 不携带 accountId 或 roleId。
- `ORG` 不进入第一阶段 subject selector。

## 10. AuthorizationSubjectFacts

运行时 subject facts 由调用方 operator context、permission-service access summary 与必要的组织事实组合得出。

建议 shape：

```text
AuthorizationSubjectFacts:
  accountId: string
  tenantId: string
  roleIds: string[]
  roleCodes?: string[]
  orgIds?: string[]
  visibleOrgIds?: string[]
```

稳定规则：

- subject facts 不应携带完整业务主数据。
- `roleIds` 用于匹配 `ROLE` subject selector。
- `visibleOrgIds` 可用于 `org-scope`，但第一阶段不强制所有服务支持。

## 11. ResourceFacts

业务服务负责提供 resource facts。

建议最小 shape：

```text
ResourceFacts:
  tenantId: string
  resourceType: string
  resourceId?: string
  ownerAccountId?: string
  responsibleBuyerAccountId?: string
  managerAccountId?: string
  orgId?: string
  categoryId?: string
  customerId?: string
  supplierId?: string
  factoryId?: string
  plantId?: string
  workshopId?: string
  productionLineId?: string
  warehouseId?: string
  storageLocationId?: string
  attributes?: object
```

稳定规则：

- resource facts 只提供授权判断所需最小事实。
- category、customer、supplier、factory、warehouse 等主数据真相仍归业务服务。
- `attributes` 只能作为受限扩展字段，不能成为任意深层对象访问入口。
- 业务服务不能把业务状态合法性伪装成 policy facts 后交给 permission-service 决定。

## 12. EnvironmentFacts

建议 shape：

```text
EnvironmentFacts:
  clientIp?: string
  requestTime?: string
  timezone?: string
  terminal?: string
```

稳定规则：

- environment facts 用于 security policy。
- password failure、account lockout、session validity 不进入 permission-service policy。
- 高动态外部风险评分暂不进入第一阶段。

## 13. CheckResource Contract

`checkResource` 用于 detail / update / delete / approve / confirm / adjust / status change 等场景。

建议 request shape：

```text
CheckResourceRequest:
  subject: AuthorizationSubjectFacts
  permissionCode: string
  resource: ResourceFacts
  environment?: EnvironmentFacts
```

建议 result shape：

```text
CheckResourceResult:
  allowed: boolean
  reasonCode?: string
  matchedPolicyIds?: string[]
  deniedPolicyIds?: string[]
  trace?: PolicyDecisionTrace
```

稳定规则：

- 调用前必须已通过 `checkPermission` 或等价粗粒度能力入口。
- 调用方业务服务必须先加载最小 resource facts。
- permission-service 不反查业务数据库。
- 任意适用 `DENY` 命中即拒绝。
- 业务 domain rule 仍在业务服务内执行。

## 14. BuildQueryScope Contract

`buildQueryScope` 用于 list / selector / search / page / dashboard / report 等查询场景。

建议 request shape：

```text
BuildQueryScopeRequest:
  subject: AuthorizationSubjectFacts
  permissionCode: string
  resourceType: string
  environment?: EnvironmentFacts
```

建议 result shape：

```text
BuildQueryScopeResult:
  allowed: boolean
  scope?: QueryScopeExpression
  reasonCode?: string
  matchedPolicyIds?: string[]
  deniedPolicyIds?: string[]
  trace?: PolicyDecisionTrace
```

稳定规则：

- `buildQueryScope` 返回授权范围表达式，不返回业务数据。
- repository / query adapter 负责把 scope 转成 Prisma / SQL / read model 查询条件。
- 不支持 query scope 的 security policy 只能作为请求级前置检查，不参与 where 条件生成。
- 如果存在适用 policy 但无法生成安全 query scope，应 fail closed。

## 15. QueryScopeExpression

第一阶段只支持可安全下推的结构化表达式。

建议 shape：

```text
QueryScopeExpression:
  and?: QueryScopeExpression[]
  or?: QueryScopeExpression[]
  field?: string
  op?: EQ | IN | INTERSECTS
  value?: string | string[]
```

稳定规则：

- 不支持任意 raw SQL。
- 不支持任意 JS expression。
- 不支持业务服务未知字段。
- 字段必须来自 resource facts 白名单或业务服务显式映射表。
- 同 layer 同 field 的多个 allow 可合并为 `IN`。
- 不同 layer 同 field 取交集。
- 不同 field 组合为 `AND`。

## 16. PolicyDecisionTrace

建议 shape：

```text
PolicyDecisionTrace:
  evaluatedPolicyIds: string[]
  matchedAllowPolicyIds: string[]
  matchedDenyPolicyIds: string[]
  skippedPolicyIds?: string[]
  reasonCode: string
```

稳定规则：

- trace 用于审计、debug 与后续 explain。
- 第一阶段 trace 可先返回最小字段。
- trace 不应泄露敏感业务数据。

## 17. 组合规则

冻结规则：

- hard boundary 先于 policy。
- `checkPermission` 先于 `checkResource / buildQueryScope`。
- `DENY` 优先于 `ALLOW`。
- 任意适用 `DENY` 命中即拒绝。
- 同一 layer、同一 field 的多个 `ALLOW` 取并集。
- 不同 layer、同一 field 的 `ALLOW` 取交集。
- 不同 field 的 `ALLOW` 取 `AND`。
- 某个 layer 未配置某 field 的 `ALLOW` 时，该 layer 不参与该 field 收窄。
- 无启用 policy 时，RBAC 通过即可允许。
- 有启用 policy 且进入 policy 评估时，未命中允许规则默认拒绝。

## 18. 第一阶段业务映射

第一阶段 contract 必须能支持：

- CRM 客户负责人可见性
  - resource fact: `ownerAccountId`
  - template: `own-resource` 或 `resource-field-matches-subject-field`
- SRM 供应商负责人可见性
  - resource fact: `responsibleBuyerAccountId`
  - template: `resource-field-matches-subject-field`
- Procurement 采购 category 范围
  - resource fact: `categoryId`
  - template: `resource-field-in-set`
- MES / WMS 工厂、仓库、车间、库位范围
  - resource facts: `factoryId / plantId / workshopId / warehouseId / storageLocationId`
  - template: `resource-field-in-set`

## 19. 后续执行顺序

本 feature packet 完成后，建议按以下顺序开实现线程：

1. `policy-template-instance-contract`
   - 本文。
   - 冻结并实现 common / permission-service 内部 contract shape。
2. `policy-template-instance-storage`
   - template registry、instance persistence、seed、审计。
3. `resource-authorization-contract`
   - `checkResource / buildQueryScope` gRPC 或 application service 入口。
4. `account-data-scope-management`
   - 第一阶段产品能力。
   - 不暴露 template / AST。
5. `crm-srm-resource-visibility-rollout`
   - 首批业务接入。
6. `procurement-category-scope-rollout`
   - 采购 category 范围。
7. `mes-wms-site-scope-rollout`
   - 工厂 / 仓库 / 车间 / 库位范围。

## 20. 验收标准

- 已冻结 template registry 最小集合。
- 已冻结 policy instance shape。
- 已冻结 subject selector shape。
- 已冻结 subject / resource / environment facts shape。
- 已冻结 `checkResource` request / result shape。
- 已冻结 `buildQueryScope` request / result shape。
- 已冻结 query scope expression 限制。
- 已冻结组合规则。
- 已明确第一阶段不做 AST、rule builder、UI、storage 或业务 rollout。

## 21. 备注

- 本文是实现前的 contract feature packet，不是最终 proto 文档。
- 具体 proto / DTO 命名可以在实现线程中按现有代码风格微调，但不得改变本文冻结的语义。
- 当前 policy 从“readonly governance + AST 存储”走向“业务资源授权可用”的第一步，是先补齐本文 contract，而不是直接做业务服务适配。
