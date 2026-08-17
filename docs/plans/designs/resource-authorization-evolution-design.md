# Resource Authorization Evolution Design Workspace

## Objective

核验现有 Permission 候选场景是否已经被当前冻结设计完整支持，并只保留仍有真实缺口或明确设计张力的部分，继续形成可冻结的授权演进方案。

本文不另建并行权限框架，也不把已经冻结的结论重新标记为开放设计。

## Scope

本 Workspace 关注：

- 查询类操作中的环境策略；
- 资源类型化授权事实契约；
- owner、team、临时协作等跨字段查询范围；
- 策略模板的可配置边界；
- explain、impact preview、版本、发布与回滚；
- Supplier / Contact 场景对授权能力的验证。

不在本文重新讨论：

- 是否采用 RBAC 作为功能权限基线；
- Permission Service 是否读取业务数据库；
- 是否为当前阶段引入完整 ReBAC；
- 已冻结的 ACCOUNT / ROLE / TENANT_WIDE、DENY 优先与 fail-closed 语义。

## Current truth baseline

规范真相：

- [Permission Service](../../architecture/services/permission-service.md)
- [Authorization Layering and Resource Policy](../../architecture/platforms/authorization-layering-and-resource-policy.md)
- [Resource Authorization Contract](../../contracts/permission-service/resource-authorization.md)
- [Policy Instance Management Contract](../../contracts/permission-service/policy-instance-management.md)

当前已经冻结并覆盖的能力：

1. checkPermission 处理功能级 RBAC。
2. checkResource 处理单资源授权。
3. buildQueryScope 为列表、搜索和导出生成范围表达式。
4. 业务服务拥有资源事实与关系，Permission Service 不直接读取业务数据库。
5. PolicyTemplate 是平台内建、随代码版本演进的模板。
6. PolicyInstance 是 tenant 内持久化的策略配置。
7. 不另建 ResourceGrant / ResourceScope 作为并行授权真相。
8. ACCOUNT、ROLE 与 TENANT_WIDE assignment 已冻结。
9. DENY 优先、层内合并、层间收敛与 fail-closed 已冻结。
10. 当前阶段不引入通用 ReBAC。

因此，现有基础架构以当前稳定设计为准；下面尚未被完整支持的场景继续作为当前设计输入。

## Coverage assessment

| 候选主题 | 当前覆盖 | 处理 |
| --- | --- | --- |
| 功能权限与资源权限分层 | 已冻结 | 不重复保留 |
| 单资源 authorize 语义 | checkResource 已覆盖 | 使用当前命名 |
| 查询 authorizeQuery 语义 | buildQueryScope 基本覆盖 | 保留环境与复杂范围缺口 |
| 资源事实由业务服务提供 | 已冻结 | 不重开 |
| Permission 不查询业务数据库 | 已冻结 | 不重开 |
| ACCOUNT / ROLE / tenant assignment | 已冻结 | 不重开 |
| DENY 优先与 fail-closed | 已冻结 | 不重开 |
| owner / org / visibleOrg 范围 | 基础能力已覆盖 | 验证类型与组合 |
| team / temporary collaboration | 未完整覆盖 | 保留 |
| 工作时间与 IP 对列表查询生效 | 未端到端覆盖 | 保留为确认缺口 |
| 资源类型 FactSchema | 未冻结 | 保留 |
| 租户可创建任意策略代码 | 当前明确不支持 | 只保留受控配置边界的取舍 |
| explain / impact preview | 部分覆盖 | 保留演进缺口 |
| 完整 ReBAC | 当前明确延后 | 不作为当前方案 |

## Confirmed gaps

### 1. 查询流中的环境策略没有端到端闭合

契约的 BuildQueryScopeRequest 可以携带 environment，但当前模板注册信息将 working-hours 和 ip-allowlist 标记为 queryScopeCapable=false。

当这些策略适用于查询操作时，buildQueryScope 会返回 POLICY_QUERY_SCOPE_UNSUPPORTED，而不是同时返回：

- 环境门禁判断；以及
- 可下推到业务查询的资源范围。

因此，“会计人员仅在工作日、办公时间、公司 IP 内查看其授权账务列表”的旧场景目前不能按预期运行。单资源检查可评价环境条件，不代表列表、搜索和导出已经获得同等支持。

相关实现位置：

- src/services/system/permission-service/src/application/authorization/resource-policy/template-registry.ts
- src/services/system/permission-service/src/application/authorization/resource-policy/policy-template-instance-authorization.service.ts

需要设计并冻结：

- buildQueryScope 是先做 environment gate，再生成 data scope；
- 或新增明确的 query authorization envelope；
- 环境条件失败、缺失与不支持时的错误语义；
- 列表、导出、批处理和分页是否统一；
- 业务服务如何避免绕过环境门禁直接使用旧 scope。

### 2. 缺少资源类型化 FactSchema 契约

当前 wire contract 有固定字段与 attributes，PolicyTemplate 参数也有 schema，但尚未看到每种 resourceType 对授权事实的规范定义，例如：

- 允许哪些字段；
- 字段类型与可空性；
- 字段由哪个业务服务拥有；
- 事实来源与可信边界；
- 新鲜度与版本；
- 缺失字段是 deny、not-applicable 还是 contract error；
- 哪些字段可用于 query scope 编译。

这会导致策略模板可能引用一个业务服务未稳定提供、含义不一致或不可查询的 attribute。

需要决定：

- 建立中心 Resource FactSchema；
- 或由资源 owner 定义类型化 authorization facts contract，Permission 只注册和校验；
- 以及两者如何避免 Permission 成为业务模型拥有者。

### 3. 跨字段 OR 与关系型查询范围仍不完整

QueryScopeExpression 类型层面支持 and、or 与 INTERSECTS，但当前已实现的模板/编译路径主要形成字段 IN 条件的 AND 组合。

Supplier 场景需要类似：

- currentAccountId = ownerId；
- OR currentAccountId intersects managerIds；
- OR currentTeamId intersects assignedTeamIds；
- OR 存在有效的 temporary collaborator relationship。

这里不仅是表达式语法问题，还包括：

- team 与临时关系事实从哪里来；
- 单资源 checkResource 与 buildQueryScope 如何保持等价；
- 业务服务能否把表达式安全地编译成其 ORM 查询；
- 无法下推的关系条件如何处理；
- 多个策略产生 OR/AND 混合时的确定性语义。

### 4. Team 事实尚未形成稳定 wire contract

现有主体上下文主要覆盖 account、role、org 与 visibleOrg。旧 Supplier 场景需要 owner、manager、team 和临时协作者。

需要决定：

- team 是否复用 ROLE；
- team 是否属于 ORG 层级；
- 是否新增类型化 team facts；
- 或由业务服务预计算 capability / relation facts。

在该点冻结前，不应假设 team-based supplier visibility 已经得到完整支持。

### 5. 动态模板边界与当前冻结设计存在张力

一种候选方向是“可配置但不允许任意表达式，由系统管理员控制”。当前稳定设计更严格：

- PolicyTemplate 由平台内建并随代码版本发布；
- tenant 管理员不能创建或编辑模板；
- tenant 只管理 PolicyInstance 和 assignment。

这不是实现遗漏，而是明确的治理选择。后续只有在真实场景证明内建模板无法覆盖、且新增模板发布成本不可接受时，才应重开边界。

若重开，应优先讨论受控的模板组合、参数化或认证扩展机制，而不是直接允许租户提交任意策略代码。

### 6. Explain、impact preview 与生命周期仍是部分能力

当前已有 preview、策略/assignment 标识与 trace 基础，但完整治理能力还包括：

- 人可读 explain；
- 发布前影响范围；
- 哪些用户或资源将新增/失去访问；
- PolicyInstance version；
- draft / publish / supersede；
- 回滚；
- 与审计记录的稳定关联。

完整 explain / impact preview 已在 backlog 中有后续项，但版本、发布与回滚语义仍需统一设计，避免各管理接口自行发明状态。

## Current proposed design

以下仅是讨论起点，不是冻结结论：

1. 把一次 query authorization 的结果建模为两部分：
   - environment decision；
   - data scope expression。
2. 只有 environment 通过且 data scope 可编译时，业务服务才能执行查询。
3. 每个 resourceType 必须声明可供授权使用的 typed facts 与 queryable facts。
4. Resource owner 仍拥有事实定义；Permission 只校验、求值和编译，不拥有业务关系。
5. owner/team/temporary relation 先用 Supplier / Contact 实际场景验证，避免提前构造通用 ReBAC。
6. 单资源策略与查询范围必须有可验证的语义等价性。
7. 模板继续默认 platform-built-in；只有具体需求证据足够时再讨论受控扩展。
8. explain、impact、version、publish 和 rollback 应形成一个一致的策略治理生命周期。

## Human-confirmed items pending UD review

- Permission 候选场景必须逐点与稳定设计核验。
- 已被稳定设计完整覆盖的基础结论不在新 Workspace 重复设计。
- 工作时间/IP 对查询流、类型化 FactSchema、team/temporary relation 与复杂 scope 是真实未闭合点。
- Supplier / Contact 编辑与可见性场景应作为授权演进的首个业务验证用例。
- 这些场景尚未获得完整实现支持，继续作为设计验证输入。

## Open questions

1. buildQueryScope 应返回单一 scope，还是 environment decision + scope envelope？
2. 环境条件缺失、失败和模板不支持分别返回什么稳定错误？
3. Resource FactSchema 是中心注册表还是 owner-owned contract？
4. attributes 如何进行类型校验、版本兼容和查询能力声明？
5. owner OR team OR temporary relation 如何同时支持 checkResource 与 buildQueryScope？
6. team 应建模为 role、org、独立主体事实还是预计算关系？
7. temporary access 的业务真相由 SRM、Procurement 还是独立协作对象拥有？
8. ORM adapter 对 OR、INTERSECTS 和关系子查询支持到什么边界？
9. 什么证据足以重开 platform-built-in template 的边界？
10. explain 与 impact preview 的最小 P1 语义是什么？
11. PolicyInstance 是否需要显式版本、发布和回滚状态机？
12. Supplier 与 Contact 的字段级敏感性是否属于当前资源授权层，还是后续字段授权能力？

## Known conflicts

- BuildQueryScopeRequest 接收 environment，但环境类模板当前不可生成 query scope。
- QueryScopeExpression 的类型表达力高于当前模板与编译器的实际覆盖范围。
- 允许一定程度动态定义模板的候选方向，与当前平台内建模板的冻结边界存在张力。
- Supplier / Contact 场景需要 team 与临时关系，而当前稳定主体事实并未完整表达。
- 把任意 attributes 当作事实会削弱契约；把全部业务 schema 集中到 Permission 又会破坏业务 ownership。

## Intended truth-source changes

冻结后预计分别更新：

- [Authorization Layering and Resource Policy](../../architecture/platforms/authorization-layering-and-resource-policy.md)；
- [Permission Service](../../architecture/services/permission-service.md)；
- [Resource Authorization Contract](../../contracts/permission-service/resource-authorization.md)；
- [Policy Instance Management Contract](../../contracts/permission-service/policy-instance-management.md)；
- Supplier / Contact 资源 owner 的服务规范与必要 collaboration；
- 对应 Proto、adapter contract 和验收测试；
- 如仍有长期解释价值，再新增或更新 ADR。

## Next discussion point

先用“账务列表只能在工作日、办公时间和公司 IP 内访问”的查询场景，冻结 environment gate 与 data scope 的组合契约。

随后用 Supplier 场景验证：

owner OR manager OR assigned team OR valid temporary collaborator。

只有这两个场景在 checkResource 与 buildQueryScope 上都能得到一致结果，才能认为相关授权能力完成设计闭合。
