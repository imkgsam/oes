# Policy Template / Instance Model

> Status: SUPERSEDED_BY_TRUTH_SOURCE. Do not use this file as the stable design source or an implementation target.

> Historical phase packet. The stable service boundary is now [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md), the stable resource authorization contract is [resource-authorization.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/resource-authorization.md), the stable management contract is [policy-instance-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/policy-instance-management.md), and the active PolicyInstance resource authorization mainline is [policyinstance-resource-authorization-mainline.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/policyinstance-resource-authorization-mainline.md). Use this file only as background for earlier design rationale.

> 服务设计唯一真相源：[permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。本文只记录 policy template / instance 模型的历史阶段讨论；`Permission`、`Role`、`AccountRole`、`Policy`、`PolicyInstance` 的长期 owner 边界、资源授权组合规则与当前 contract 均以上述真相源为准。

## 1. 目标

- 将当前 readonly policy governance 推进到可落地的 policy template / instance 模型设计。
- 明确哪些授权需求适合进入 policy，哪些必须留在 hard boundary、application hard rule 或 domain rule。
- 支持账号级资源范围控制，避免为了采购 category、销售区域、客户/供应商可见范围不断拆分角色。
- 为 CRM/SRM 客户/供应商可见性、Sales/Procurement selector、后续 MES/WMS 多工厂多仓库范围控制提供统一接入模式。
- 第一阶段采用内置 template + 参数化 instance，不开放自由 AST 编辑。

## 2. 不做什么

- 不开放 policy AST 自由编辑。
- 不开放通用 rule builder。
- 不改变 tenant isolation、authentication、session、token、operator context 等平台硬边界。
- 不把业务聚合生命周期、不变量、业务状态合法性塞进 policy。
- 不让 permission-service 拥有 category、region、customer、supplier、factory、warehouse、workshop、storage location 等业务主数据真相。
- 不改变 `checkPermission` 的粗粒度 RBAC 职责。
- 不把 resource facts 或 query scope 条件放进 interface decorator。
- 不在本文实现代码或修改 gRPC / HTTP contract。

## 3. 上游依赖

- architecture:
  - [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
- services:
  - [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- collaborations:
  - [authorization-decision-flow.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authorization-decision-flow.md)
- related plans:
  - [policy-governance-readonly.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/policy-governance-readonly.md)
  - [unified-permission-decorator.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/unified-permission-decorator.md)

## 4. 当前结论

- `Role` 主要控制“是否拥有某类能力”。
- `Policy Instance` 主要控制“在该能力下可访问或可操作的资源范围 / 安全环境”。
- 不应为了资源范围差异拆出大量角色，例如 `raw-material-buyer`、`packaging-buyer`、`domestic-sales`、`export-sales`。
- 采购 category、客户/供应商可见范围、多仓库/多工厂范围，优先通过 `ACCOUNT` 级 policy instance 表达。
- `TENANT_WIDE` 不是 tenant isolation；tenant isolation 是平台硬边界。
- `TENANT_WIDE` 表示“本租户内全员适用的默认收窄策略或安全策略”。
- 同时命中的 `TENANT_WIDE`、`ROLE`、`ACCOUNT` policy instance 都应参与最终决策，默认叠加收窄，不互相覆盖。
- 第一阶段 policy template 必须是平台内置、受限、可解释、可审计的模板。
- 租户管理员不能修改 template 逻辑，只能在授权范围内配置、启用或停用允许其管理的 instance。

## 5. Frozen Decisions

### 5.1 长期稳定模型

OES 授权长期采用分层模型：

```text
RBAC + Policy-based Resource Authorization + Query Scope + Domain Rule + Hard Boundary
```

冻结规则：

- `checkPermission` 负责粗粒度接口 / 能力入口授权。
- `buildQueryScope` 负责列表、selector、search、报表等查询范围。
- `checkResource` 负责 detail、update、delete、approve、confirm、adjust、status change 等单资源或具体资源操作。
- `Role` 管能力，不管个人化数据范围。
- `Policy Instance` 管资源范围、安全环境和查询边界。
- `policy` 不表达业务聚合生命周期、不变量或业务状态合法性。
- tenant isolation、authentication、session、token、operator context、service-to-service trust、password failure、account lockout、审计与 AI 写入边界均是 hard boundary，不依赖 permission policy。
- permission-service 不拥有业务主数据真相。
- 业务服务负责提供 resource facts，并在 application / domain 中执行业务正确性规则。

### 5.2 第一阶段落地规则

第一阶段产品能力按“账号数据范围配置”理解，底层使用受限 `Policy Template / Policy Instance`。

冻结规则：

- 第一阶段不开放自由 AST。
- 第一阶段不开放通用 rule builder。
- 第一阶段不引入 access profile。
- 第一阶段不让管理员直接理解或编辑底层 template 逻辑。
- 第一阶段使用 `ACCOUNT / ROLE / TENANT_WIDE` 三类 subject selector。
- 第一阶段 `ACCOUNT policy instance` 是个人化数据范围配置主模型。
- 同一个 account 可拥有多个 instance，同一 layer 同一 field 取并集。
- `TENANT_WIDE / ROLE / ACCOUNT` 是叠加收窄关系，不是覆盖关系。
- `DENY` 永远优先。

### 5.3 已确认业务场景边界

- SRM 供应商负责人：
  - 是 SRM 业务事实，不是 permission-service policy instance。
  - policy 可以消费 `responsibleBuyerAccountId` resource fact。
  - 供应商负责人不能跳过其他 policy rule。
- CRM 客户负责人：
  - 是 CRM 业务事实，不是 permission-service policy instance。
  - policy 可以消费 `ownerAccountId` resource fact。
  - 客户负责人不能跳过其他 policy rule。
- Procurement 采购 category 范围：
  - 是账号数据范围，进入 `ACCOUNT policy instance`。
  - category / item 真相归 item-master / procurement。
- MES / WMS 多工厂、多仓库、多车间、多库位范围：
  - 是账号数据范围，进入 `ACCOUNT policy instance`。
  - factory / plant / warehouse / workshop / storage location 真相归 MES / WMS / tenant-org / asset 等对应服务。
- Sales 国内 / 国外示例：
  - 当前不作为本阶段冻结示例，后续如需推进应先梳理 Sales 业务设定。

## 6. 核心概念

### 6.1 Policy Template

`Policy Template` 是平台内置的策略逻辑模板。

稳定规则：

- template 定义“如何判断”。
- template 由平台维护，不由租户管理员编辑。
- template 应代码版本化、可测试、可审计。
- template 不拥有业务主数据真相。
- template 不应直接编码某个业务域的主数据语义，例如不应写死 `procurement-category-policy`、`sales-domestic-order-policy`。

示例：

```text
resource-field-in-set
resource-field-equals
resource-field-matches-subject-field
own-resource
org-scope
working-hours
ip-allowlist
```

### 6.2 Policy Instance

`Policy Instance` 是基于 template 创建的具体策略配置。

稳定规则：

- instance 定义“对谁、对哪个 permission、对哪类 resource、使用哪些参数、是否启用”。
- instance 可以由系统管理员或被授权的租户管理员治理。
- instance 可以是 `ALLOW` 或 `DENY`。
- instance 不改变 template 的执行逻辑。
- instance 只保存授权配置或业务资源引用，不保存业务资源真相。

第一阶段建议字段：

```text
id
tenantId
subjectSelector
permissionCode
resourceType?
templateCode
effect: ALLOW | DENY
params
enabled
priority
createdBy
updatedBy
createdAt
updatedAt
```

### 6.3 Subject Selector

第一阶段支持三类 subject selector：

```text
TENANT_WIDE
ROLE
ACCOUNT
```

语义：

- `TENANT_WIDE`
  - 作用于当前租户内所有主体。
  - 用于租户级默认收窄策略或安全策略。
  - 不用于表达 tenant isolation。
- `ROLE`
  - 作用于拥有某个 role 的账号。
  - 用于一类岗位或职责的共同访问范围。
- `ACCOUNT`
  - 作用于具体账号。
  - 用于个人差异化资源范围。

第一阶段后置：

- `ORG`
  - 因为组织架构语义可能涉及直属组织、下级组织、矩阵组织、岗位组织等复杂模型。
  - 组织范围先通过 `org-scope` template 的 params / resource facts 试点，不先冻结为 subject selector。

## 7. Template 启用与 Instance 管理

租户管理员不应“启用 template 本身”，而应管理某个 template 生成的 instance。

推荐将 template 分为三类：

- `platform_required`
  - 平台强制策略模板或强制 instance 来源。
  - 租户不能关闭其强制性。
- `tenant_configurable`
  - 租户可创建、启用、停用、调整参数的 instance。
  - 例如 working-hours、IP allowlist、部分资源范围策略。
- `platform_only`
  - 只有系统管理员可配置。
  - 用于高风险或跨租户治理策略。

示例：

```text
template: working-hours
template kind: tenant_configurable

instance:
  tenantId: T1
  subjectSelector: TENANT_WIDE
  permissionCode: finance.report.export
  templateCode: working-hours
  params:
    timezone: Asia/Shanghai
    windows:
      - days: [1, 2, 3, 4, 5]
        start: "09:00"
        end: "18:00"
  enabled: true
```

## 8. 多 Instance 组合规则

第一阶段采用多 instance 模型。

同一个 `tenantId + permissionCode + resourceType` 下可以存在多个启用中的 policy instance。运行时必须收集所有对当前 operator 适用的 instance：

- 当前租户的 `TENANT_WIDE` instance
- 当前账号拥有角色命中的 `ROLE` instance
- 当前账号命中的 `ACCOUNT` instance

稳定规则：

- 平台硬边界先执行，policy 不能放宽硬边界。
- domain rule 最终仍必须执行，policy 不能允许违反领域不变量的状态变更。
- `DENY` 优先于 `ALLOW`。
- 任意适用的 `DENY` 命中，最终拒绝。
- 多个同一 layer、同一 field 的 `ALLOW` 可以取并集。
- 不同 layer、同一 field 的 `ALLOW` 取交集。
- 不同 field 的 `ALLOW` 取 `AND`。
- 某个 layer 未配置某 field 的 `ALLOW` 时，该 layer 不参与该 field 收窄。
- `TENANT_WIDE / ROLE / ACCOUNT` 是叠加收窄关系，不是覆盖关系。
- 无启用 policy 时，`checkPermission` / RBAC 通过即可允许。
- 有启用 policy 且进入 policy 评估时，未命中允许规则默认拒绝。

示例：

```text
ACCOUNT instance A:
  account_001 allowed category [A, B]

ACCOUNT instance B:
  account_001 allowed category [C]

结果:
  category IN [A, B, C]
```

示例：

```text
TENANT_WIDE:
  category [A, B, C]

ROLE:
  no category policy

ACCOUNT:
  category [B, C, D]

结果:
  category IN [B, C]
```

说明：

- `ROLE` 未配置 category policy，因此不参与 category 收窄。
- `TENANT_WIDE` 与 `ACCOUNT` 都配置了 category，因此同 field 跨 layer 取交集。

示例：

```text
TENANT_WIDE:
  marketType [domestic, international]

ROLE:
  marketType [domestic]

ACCOUNT:
  no marketType policy

结果:
  marketType IN [domestic]
```

示例：

```text
TENANT_WIDE:
  finance.report.export requires ip-allowlist

ACCOUNT:
  account_001 can export report type [AR, AP]

结果:
  client_ip IN allowedCidrs
  AND reportType IN [AR, AP]
```

## 9. 适合进入 Policy 的规则

适合进入 policy 的规则通常回答：

- 当前账号、角色或租户安全策略下，能访问哪些资源范围
- 当前环境下，是否允许执行某类高风险动作

典型场景：

- 采购员只能采购指定 category。
- account A 只能查看自己负责的客户。
- account B 只能查看指定供应商分组。
- 某账号只能查看 `W1 / W2` 仓库库存。
- 某账号只能操作 `P1` 工厂工单。
- 工厂 A 厂长只能查看本工厂生产数据。
- 仓库 A 主管只能查看仓库 A 库存并执行仓库 A 操作。
- 成型主管只能查看其管理范围内的工人或车间数据。
- 财务导出必须来自 IP 白名单。
- 高风险审批只能在工作时间执行。

## 10. 不应进入 Policy 的规则

### 10.1 平台硬边界

以下不依赖 permission policy：

- tenant isolation
- authentication / session / token validity
- operator context validity
- service-to-service trust / metadata
- self-service target binding
- password failure count / account lockout
- 跨服务数据库边界
- 审计与 trace context 传播
- AI 写入边界

### 10.2 业务正确性与业务状态规则

以下应由 application hard rule 或 domain rule 负责：

- 停用物料不能采购。
- 不可采购物料不能进入采购流程。
- 已关闭仓库不能入库。
- 冻结库位不能出库。
- 已完工工单不能修改。
- 库存不足不能出库。
- 关闭订单不能修改。
- 已完成出库的单据不能重新确认。

判断原则：

```text
如果换一个操作者，这条规则仍然必须成立，它通常不是 permission policy。
```

## 11. 场景示例

### 11.1 采购员按账号限定 category

角色只控制能力：

```text
role: buyer
permissionCode: procurement.purchase.create
```

账号级 instance 控制范围：

```text
subjectSelector:
  type: ACCOUNT
  accountId: account_001
permissionCode: procurement.purchase.create
resourceType: item
templateCode: resource-field-in-set
effect: ALLOW
params:
  field: categoryId
  allowedValues: [raw-material, packaging]
enabled: true
```

使用方式：

- 商品 selector / 可采购商品列表：`buildQueryScope` 生成 `categoryId IN [...]`。
- 创建采购单 / 修改采购行：application 层加载 item facts 后执行 `checkResource`。

### 11.2 多仓库 / 多工厂范围

```text
subjectSelector:
  type: ACCOUNT
  accountId: account_003
permissionCode: wms.inventory.view
resourceType: inventory
templateCode: resource-field-in-set
effect: ALLOW
params:
  field: warehouseId
  allowedValues: [W1, W2]
enabled: true
```

使用方式：

- 库存列表：`buildQueryScope` 生成 `warehouseId IN [W1, W2]`。
- 库存详情 / 调整：`checkResource` 校验 inventory facts。

### 11.3 工厂生产数据范围

```text
subjectSelector:
  type: ACCOUNT
  accountId: factory_a_manager
permissionCode: mes.production.view
resourceType: production-data
templateCode: resource-field-in-set
effect: ALLOW
params:
  field: factoryId
  allowedValues: [factory_A]
enabled: true
```

使用方式：

- 生产看板 / 工单列表 / 报表：`buildQueryScope` 生成 `factoryId IN [factory_A]`。
- 工单详情 / 更新 / 状态变更：`checkResource` 校验 work order facts。

### 11.4 主管查看管理范围内工人

如果管理关系是 HR 业务事实：

```text
employee.managerAccountId = currentAccountId
```

则 policy 消费该 resource fact：

```text
templateCode: resource-field-matches-subject-field
params:
  resourceField: managerAccountId
  subjectField: accountId
```

如果管理关系来自车间 / 班组范围：

```text
subjectSelector:
  type: ACCOUNT
  accountId: molding_manager
permissionCode: hr.employee.list
resourceType: employee
templateCode: resource-field-in-set
effect: ALLOW
params:
  field: workshopId
  allowedValues: [molding_workshop]
enabled: true
```

稳定规则：

- 员工所属组织、车间、班组或 manager 关系归 HR / tenant-org / MES 等对应服务。
- permission-service 只消费 facts，不拥有人员管理关系真相。

### 11.5 租户内全员安全策略

```text
subjectSelector:
  type: TENANT_WIDE
permissionCode: finance.report.export
templateCode: ip-allowlist
effect: ALLOW
params:
  cidrs: ["203.0.113.10/32"]
enabled: true
```

语义：

- 该策略作用于当前租户内所有主体。
- 它不是 tenant isolation。
- 它只是在本租户内对财务导出进一步收窄安全环境。

## 12. Resource Facts 与业务真相边界

permission-service 可以拥有授权配置与 policy instance，但不拥有业务资源主数据真相。

业务服务必须提供 resource facts：

```text
tenantId
resourceType
resourceId
ownerAccountId?
orgId?
categoryId?
marketType?
customerId?
supplierId?
factoryId?
plantId?
warehouseId?
workshopId?
storageLocationId?
```

稳定规则：

- category 是否存在、是否启用、层级含义，归 item-master / procurement 等对应服务。
- customer / supplier 真相归 CRM / SRM / party 等对应服务。
- factory / plant / warehouse / workshop / storage location 真相归 MES / WMS / tenant-org / asset 等对应服务。
- permission-service 不直接查询其他服务数据库。
- policy instance 中保存的是授权引用或参数，不是业务主数据真相。

## 13. 第一阶段内置 Template 候选

第一阶段建议只冻结少量高频通用模板：

- `resource-field-in-set`
  - 判断 `resource.<field>` 是否属于 instance params 的 allowedValues。
- `resource-field-equals`
  - 判断 `resource.<field>` 是否等于指定值。
- `resource-field-matches-subject-field`
  - 判断资源字段是否匹配 subject facts 中的字段。
- `own-resource`
  - 判断资源 owner 是否为当前 account。
- `org-scope`
  - 判断资源 org 是否落在当前可见组织范围内。
- `working-hours`
  - 判断当前时间是否落在配置窗口内。
- `ip-allowlist`
  - 判断请求来源 IP 是否落在配置 CIDR 内。

暂不冻结：

- 自由 AST 编辑。
- 业务域专用 template 大量铺开。
- 外部风险引擎复杂策略。

## 14. Rollout 顺序

### 14.1 第一批

- CRM 客户可见性
- SRM 供应商可见性
- Procurement selector / search

原因：

- 场景轻，容易验证 `buildQueryScope + checkResource + ACCOUNT instance` 模式。
- 能直接解决客户/供应商/商品选择器的数据可见性问题。

### 14.2 第二批

- MES 多工厂 / 多车间范围
- WMS 多仓库 / 多库位范围

原因：

- 层级更复杂，适合在第一批模式稳定后推进。
- 需要更清晰的 resource facts 与 query scope adapter。

## 15. 后续执行包

本文冻结模型后，后续至少需要拆成独立执行包：

- `policy-template-instance-contract`
  - 冻结 gRPC / application contract、DTO、错误码、审计字段。
- `policy-template-instance-storage`
  - 设计 template registry 与 instance 持久化模型。
- `resource-authorization-contract`
  - 冻结 `checkResource` 与 `buildQueryScope` 的标准调用模式。
- `crm-srm-resource-visibility-rollout`
  - 首批业务 rollout。
- `security-policy-template-rollout`
  - working-hours / IP allowlist 等 security policy rollout。

## 16. 验收标准

- 已明确 template 与 instance 的职责边界。
- 已明确租户管理员管理的是 instance，不是 template 逻辑。
- 已明确 `TENANT_WIDE` 不是 tenant isolation。
- 已明确 `ACCOUNT / ROLE / TENANT_WIDE` 都可以参与最终决策。
- 已明确多 instance 组合规则。
- 已明确哪些规则适合 policy，哪些留在 hard boundary / domain。
- 已明确 permission-service 不拥有业务主数据真相。
- 已明确第一批与第二批 rollout 顺序。

## 17. 备注

- 本设计的核心是避免角色爆炸：role 管能力，policy instance 管范围。
- 第一阶段宁可 template 少而稳，也不要开放不可治理的自由 AST。
- 复杂业务规则应先留在业务服务 application / domain 或专用 authorization adapter，等稳定且跨域复用后再考虑沉淀为平台 template。
