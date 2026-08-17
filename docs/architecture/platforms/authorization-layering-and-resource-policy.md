# OES 授权分层与资源策略架构

> `permission-service` 的服务设计唯一真相源为 [permission-service.md](../services/permission-service.md)。本文只定义项目级授权分层、资源授权、查询范围与 policy 分类规则，不重新定义 permission-service 的核心对象或长期 owner 边界。

## 1. 文档目的

本文档用于冻结 OES 在“粗粒度接口权限、细粒度资源权限、查询范围约束、环境安全策略、跨服务派生协作授权”上的统一分层模型，作为后续 Gateway、`permission-service` 与各业务子服务改造的项目级依据。

本文档重点回答：

- 粗粒度 `RBAC` 与细粒度资源授权如何分层
- 为什么细粒度控制不能统一建模为前置 `guard`
- `checkPermission`、`checkResource`、`buildQueryScope` 各自的职责是什么
- `policy` 与业务规则的边界是什么
- 跨服务派生协作时，哪些授权检查需要做，哪些不应重复做

## 2. 核心结论

OES 的目标状态不是“所有权限控制都通过 guard 完成”，而是采用分层授权模型：

- 自助能力控制：
  - `self-service capability`
  - 基于 authenticated operator、self-bound target、字段白名单与安全策略
  - 用于“当前主体管理自己”，默认不依赖管理员 `RBAC` 权限码
- 接口前置粗粒度控制：
  - `checkPermission`
  - 基于 `RBAC`
  - 通过 `decorator + guard` 在 Gateway 与子服务接口前置执行
- 单资源细粒度控制：
  - `checkResource`
  - 在 application 层基于已加载的 resource facts 执行
- 列表 / 搜索 / 分页类查询控制：
  - `buildQueryScope`
  - 将权限边界反映为查询条件，而不是逐条布尔鉴权
- 业务正确性控制：
  - 由 domain rule 负责
  - 不通过 policy 替代聚合生命周期、不变量与流程约束
- 平台硬边界控制：
  - 不依赖 permission policy
  - 不允许被租户配置或业务 policy 放宽
  - 由认证、租户隔离、mTLS workload identity、TrustedExecutionContext、审计与领域不变量等对应 owner 负责

历史 `CheckPermissionWithContext` RPC 仅作为 `permission-service` 既有兼容能力与 policy AST 评估能力载体保留，不再作为新业务资源授权的标准接入方式。新业务的单资源授权必须优先落到 application 层 `checkResource`，列表 / 搜索 / 分页授权必须优先落到 `buildQueryScope`。

资源授权的长期事实主线冻结为 `PolicyTemplate / PolicyInstance`：

- `PolicyTemplate` 是平台内置、代码版本化、可测试、可审计的判断模板。
- `PolicyInstance` 是 tenant 内资源授权事实，表达 `TENANT_WIDE / ROLE / ACCOUNT` 在某个 `permissionCode + resourceType` 下的资源范围或安全环境约束。
- `PolicyInstance` 承接 resource grant / resource scope 职责，不再新增独立 `ResourceGrant` 或 `ResourceScope` 长期事实模型。
- 旧 `Policy + conditionAstJson` 只保留为历史兼容与 readonly governance，不再作为新业务资源授权主线。

同时，在 `common` 的目录语义上采用以下边界：

- `authorization/`
  - 作为共享授权能力的唯一标准目录
  - 承载原 `security/` 中与授权执行直接相关的能力
  - 也承载原 `permission/` 中用于授权执行的 decorator / guard 入口
- `permission`
  - 在语义上仍表示权限码、角色、权限主数据领域
  - 但不再作为 `common` 中的授权代码目录存在
- `security`
  - 保留为更广义的安全概念，而不是 `common` 下的授权目录名
  - 如后续出现独立风控、系统安全、设备安全能力，应按独立模块落位，而不是恢复 `common/security`

## 3. 术语

### 3.1 `checkPermission`

用于接口级、能力级、粗粒度访问控制。

回答的问题：

- 谁能进入这类能力

典型输入：

- verified execution principal / tenant context
- `permissionCode`

典型输出：

- `boolean`

典型落点：

- Gateway guard
- 子服务 gRPC / HTTP 接口 guard

### 3.2 `checkResource`

用于单资源命令与单资源详情查询的细粒度授权控制。

回答的问题：

- 对这个具体对象能不能做

典型输入：

- `operator`
- `action`
- `resource facts`
- 可选 `environment facts`

典型输出：

- `boolean`
- 或直接抛出 access denied

典型落点：

- application handler / application service

### 3.3 `buildQueryScope`

用于列表、搜索、分页、统计等查询类场景的授权控制。

回答的问题：

- 当前操作者能看到哪一批数据

典型输入：

- `operator`
- `action`

典型输出：

- query scope / where 条件 / 可见范围

典型落点：

- query handler / query application service

### 3.3.1 `buildQueryScope` 的目标完成态

`buildQueryScope` 的最终目标不是“每个 query handler 各自提一个零散函数”，也不是“全项目只有一个巨型万能函数”。

OES 目标采用的结构是：

- 对外统一门面：
  - `authorization.buildQueryScope(...)`
- 对内分域实现：
  - 按资源域 / query 语义分别实现 builder
- 通过 interface + DI + registry 分发：
  - 调用方不直接依赖具体 builder

推荐结构如下：

```text
application/
  authorization/
    query-scope/
      query-scope-builder.interface.ts
      query-scope.types.ts
      authorization-query-scope.service.ts
      builders/
        order-query-scope.builder.ts
        customer-query-scope.builder.ts
        service-account-query-scope.builder.ts
```

推荐职责如下：

- `AuthorizationQueryScopeService`
  - 作为统一门面
  - 接收统一输入并分发到匹配的 builder
- `QueryScopeBuilder`
  - 作为统一协议
  - 定义 `supports(...)` 与 `build(...)`
- `builders/*`
  - 负责各自资源域的 query scope 构造
- repository / query adapter
  - 负责把 scope 转成持久化查询条件

项目级约束：

- `buildQueryScope` 可以有统一入口，但不应退化为全局巨型 `switch`
- `buildQueryScope` 的具体实现应按资源域拆分，而不是按每个接口独立散落
- query handler / application service 不应自己拼接授权 where 条件
- repository 不负责决定“能看什么”，只负责消费已构造好的 scope

当前已在 `permission-service` 落地的函数式 scope builder 与第一版 `AuthorizationQueryScopeService` 骨架，仅视为首批试点，不代表最终完成态。

### 3.3.2 `PolicyTemplate / PolicyInstance`

`PolicyTemplate` 定义“如何判断”，例如：

- `resource-field-in-set`
- `resource-field-equals`
- `resource-field-matches-subject-field`
- `own-resource`
- `org-scope`
- `working-hours`
- `ip-allowlist`

`PolicyInstance` 定义“谁在什么能力下受哪个范围约束”，例如：

```text
subjectSelector: ACCOUNT(account_001)
permissionCode: wms.inventory.view
resourceType: inventory
templateCode: resource-field-in-set
params:
  field: warehouseId
  allowedValues: [W1, W2]
effect: ALLOW
```

稳定规则：

- template 由平台维护，不由租户管理员编辑。
- instance 保存授权配置与业务资源引用，不保存业务主数据真相。
- `PolicyInstance` 是第一阶段资源授权事实主线。
- 不再为同一职责新增独立 `ResourceGrant / ResourceScope`，避免双事实源。
- 业务服务负责提供 resource facts，并负责把 `QueryScopeExpression` 映射到自身 repository 查询条件。

### 3.3.3 `PolicyInstance` 组合规则

运行时收集当前 operator 适用的 instance：

- 当前租户的 `TENANT_WIDE` instance
- 当前账号拥有角色命中的 `ROLE` instance
- 当前账号命中的 `ACCOUNT` instance

组合规则：

- `DENY` 永远优先。
- 同一 layer、同一 field 的 `ALLOW` 取并集。
- 不同 layer、同一 field 的 `ALLOW` 取交集。
- 不同 field 的 `ALLOW` 取 `AND`。
- 某个 layer 未配置某 field 的 `ALLOW` 时，该 layer 不参与该 field 收窄。
- 无启用 instance 时，RBAC 通过即可允许。
- 有启用 instance 但无 ALLOW 命中时默认拒绝。
- `buildQueryScope` 遇到不可安全编译的 policy 时 fail closed。

### 3.4 domain rule

用于保证业务正确性。

回答的问题：

- 当前业务上还能不能做

典型落点：

- aggregate
- domain service
- domain specification / state rule

### 3.5 `self-service capability`

用于“当前已认证主体管理自己”的自助操作控制，不等价于管理员侧 `RBAC` 权限。

回答的问题：

- 当前会话主体能不能对自己的目标对象执行这类自助动作

典型输入：

- authenticated `operator context`
- 由服务端解析并绑定到当前会话主体的 self target
- capability 类型或字段白名单
- 可选 tenant / system self-service policy

典型输出：

- `boolean`
- 或直接抛出 access denied / policy denied

典型落点：

- BFF self-service use case
- 子服务 self-service command / query 入口

项目级约束：

- `self-service capability` 默认不调用管理员 `checkPermission`
- 如果平台要限制自助能力，应优先通过 self-service policy / capability 开关表达，而不是复用管理员管理权限码
- self-service 与 admin-management 可以复用下层 application / domain 逻辑，但不能复用同一个接口层授权语义

## 4. 分层设计

### 4.1 Gateway

Gateway 负责：

- 登录态恢复
- operator context 组装
- 入口 DTO 校验
- 对声明 tenant target 的路由执行 session tenant 与 target 的硬边界绑定
- `checkPermission` 粗粒度门禁
- 面向前端的流程编排入口，例如登录主流程 BFF

Gateway 不负责：

- `checkResource`
- 查询范围构造真相
- 领域业务规则
- 复杂授权决策真相

对外认证主流程建议优先收敛到 BFF：

- BFF 负责对前端暴露稳定的登录流程接口
- 前端只根据 `nextStep` 驱动交互，不直接编排下游 gRPC 认证协议
- 子服务保持认证协议与资源授权边界清晰，不直接承接前端编排语义

### 4.2 子服务接口层

子服务接口层负责：

- `InternalServiceGuard`
- `AuthenticatedOperatorGuard`
- `PermissionGuard`
- 对 self-service 入口做 authenticated operator 校验与 self-bound target 绑定
- 协议映射与 DTO 校验

子服务接口层不负责：

- 已依赖 resource facts 的细粒度授权
- 领域业务规则
- 把 self-service 能力与 admin-management 权限混成同一条接口语义

### 4.3 application 层

application 层负责：

- 编排用例
- 加载最小必要资源事实
- 按已验证 tenant context 校验业务资源的 tenant ownership
- 执行 `checkResource`
- 执行 `buildQueryScope`
- 调用领域对象与领域服务
- 协调后续跨服务协作

这是 OES 细粒度授权的主落点。

当前首批 `checkResource` 试点在 detail query 中采用的是“先读取资源，再执行授权判断，再返回 view”的顺序。  
这在语义上是合理的，因为资源级授权必须依赖资源事实；但后续仍可评估是否进一步优化为“先读取最小授权快照，再按需读取完整 view”的两段式实现。

并不是所有 detail query 都应纳入首批 `checkResource`。  
`identity-service` 中 `getUserByEmail / getUserByPhone / getUserById / getAccountsByUserId` 这类登录与认证支撑查询，当前被视为受控身份查询，不纳入首批资源级授权改造范围。  
这类接口优先通过内部可信调用边界、最小字段暴露与审计控制，而不是套用普通业务资源 detail query 的 `checkResource` 语义。

同样，并不是所有 command 都应纳入当前 `checkResource`。  
`identity-service` 中 `authenticateApiKey` 这类机器身份认证支撑命令，当前被视为认证链路能力，不纳入当前资源级授权改造范围。  
这类接口优先通过内部可信调用边界、最小暴露、认证校验与审计控制，而不是套用业务资源命令的 `checkResource` 语义。

对列表 / 搜索 / 分页类查询，application 层进一步承担：

- 调用统一 `AuthorizationQueryScopeService`
- 获取标准化 query scope
- 将 scope 传给 repository / query adaptor，而不是在 handler 中手工拼装过滤条件

### 4.3.1 自助能力与管理员能力的分层

凡是“当前主体管理自己”的能力，例如个人中心低风险资料编辑、密码修改、登录方式管理、MFA 管理、会话自助管理，默认按 `self-service capability` 建模：

- 先校验 authenticated operator
- 再由服务端把 target 绑定为当前主体
- 只允许白名单字段或白名单动作
- 继续受业务底线规则、内容校验、审计与可选策略控制

凡是“管理员管理别人”或“治理组织资产字段”的能力，继续按 `checkPermission + checkResource / buildQueryScope` 建模：

- 需要显式管理员权限码
- 需要 operator scope / resource scope 收敛
- 需要审计与必要的跨服务事实加载

项目级禁止事项：

- 不得让 self-service HTTP / gRPC 入口直接复用管理员入口的权限门
- 不得因为前后端实现便利，把“我能改我自己”强行建模为普通岗位 `RBAC`
- 不得把 tenant / system 想关闭某项自助能力的需求，错误实现为“不给所有普通用户分配管理员权限”

推荐完成态：

- 对外 contract 分为 self-service 与 admin-management 两套入口
- application / domain 可复用底层命令、仓储与校验逻辑
- 接口层授权语义必须分开冻结

### 4.4 domain 层

domain 层负责：

- 聚合生命周期约束
- 领域不变量
- 流程状态合法性
- 业务规则

domain 层不负责：

- Gateway / gRPC / Prisma / guard
- 远程 `permission-service` 编排

### 4.5 infrastructure 层

infrastructure 层负责：

- repository
- gRPC adaptor
- persistence
- policy / permission 上游调用实现

infrastructure 层不应承载：

- 业务规则真相
- 细粒度授权编排入口

## 5. 为什么细粒度授权不能统一放在 guard

细粒度授权一旦依赖 resource facts，就通常需要先进入 application 用例，再加载资源并构造上下文。

当前首批试点中的 `CheckResourceService` 仍保留按资源类型拆分的方法形式，用于优先验证 detail query 授权链路。  
后续可在试点稳定后，再统一评估是否收敛为更通用的资源检查入口；在此之前，不提前重构试点代码。

常见原因包括：

- 资源是否存在尚未知晓
- 资源的 `tenantId / orgId / ownerId / departmentId` 尚未加载
- 某些资源属性需要聚合多个仓储结果后才能得到
- 列表类查询更需要 scope，而不是单个 `boolean`

因此：

- `checkPermission` 适合 guard
- `checkResource` 不应被强行收敛为统一前置 guard

## 6. 权限规则与业务规则边界

### 6.1 区分原则

推荐用以下口径判断：

- “谁能做”：
  - 权限规则
- “对哪个对象能做”：
  - 细粒度权限规则
- “当前业务上还能不能做”：
  - 业务规则

进一步判断法：

- 如果去掉操作者身份，这条规则仍然成立，它大概率是业务规则

### 6.2 权限规则示例

- 销售员只能查看自己负责的客户
- 当前操作者只能修改本租户订单
- 只有本部门经理可以审批本部门单据
- 只有白名单 IP 才能执行导出

### 6.3 业务规则示例

- 关闭订单不能修改
- 已完成出库的单据不能重新确认
- 最后一个管理员不能被删除
- 库存不足不能预留

### 6.4 关键约束

技术上，某些业务规则可以被表达为 policy 条件，例如：

- “仅允许修改非 CLOSED 状态订单”

但 OES 不建议把这类对象生命周期规则定义为 policy，因为这会让 policy 侵入聚合状态机与领域不变量。

项目级约束如下：

- policy 负责访问边界与安全边界
- domain rule 负责业务正确性
- 不允许用 policy 替代聚合生命周期、不变量和流程约束

### 6.5 平台硬边界

平台硬边界是 OES 的不可放宽底线，不属于 permission policy、resource policy、query scope policy 或 security policy 的可配置范围。

硬边界回答的问题不是“某个租户、角色或操作者是否被允许”，而是“系统是否仍处在可信、隔离、可审计、业务正确的基本前提内”。

稳定规则：

- 硬边界不依赖 permission policy。
- 硬边界不允许被租户 policy、角色授权、资源策略或 security policy 放宽。
- 硬边界可以由对应服务或平台能力配置具体参数，但其存在性和强制性不能由 permission policy 决定。
- permission policy 只能在硬边界之内进一步收窄访问范围，不能扩大硬边界。

第一阶段冻结的硬边界如下：

- `tenant isolation`
  - 租户隔离是平台硬边界。
  - 任何 policy、role 或 permission 不能授予跨租户读取或写入业务资源的能力。
  - 需要跨租户运维或系统级治理时，必须走显式 system scope、专用接口、审计和最小数据暴露，不得复用普通租户业务授权语义。
  - 声明 tenant target 的入口必须先完成 session tenant 与 target binding，再执行 `checkPermission`；`TENANT` session 缓存或传播的 tenant 缺失时必须 fail closed。
  - `checkPermission` 的 tenant 输入只可服务其自身授权或审计语义，不拥有 HTTP target binding；RBAC allow 不能覆盖 target mismatch。
  - 入口 target binding 与业务服务按资源真相执行的 tenant ownership 校验必须同时存在，前者不能替代后者。
- `authentication / session / token validity`
  - 认证状态、session 有效性、token 有效性由认证链路负责。
  - 未认证、session 失效或 token 无效时，不进入 permission policy 判定。
- `operator context validity`
  - operator context 的存在性、完整性、签发来源与传播有效性是调用链硬前提。
  - operator context 缺失或不可验证时，应 fail closed。
- `service-to-service trust / metadata`
  - 内部服务调用的可信身份、metadata、签名或等价机制属于平台通信硬边界。
  - permission policy 不负责把不可信内部调用变成可信调用。
- `self-service target binding`
  - 自助能力必须由服务端把 target 绑定为当前主体。
  - 客户端传入的任意 target id 不能绕过 self-bound target 约束。
- `password failure count / account lockout`
  - 密码错误次数、账号锁定、登录风控属于 `auth-service` security / risk policy。
  - 不进入 `permission-service` policy，不由 role / permission / resource policy 控制。
- `domain invariant`
  - 聚合生命周期、不变量、流程状态合法性属于 domain rule。
  - policy 不能允许违反领域不变量的状态变更。
- 跨服务数据库边界
  - 服务之间不得直接查询或写入对方数据库。
  - 该边界不能通过 policy 授权绕过。
- 审计与 trace context 传播
  - 关键操作必须携带 operator、tenant、trace 与审计元数据。
  - policy 不能关闭必要审计。
- AI 写入边界
  - AI 不直接写入业务核心表。
  - AI 改变业务状态必须通过受控工具、应用服务、审批流程与审计链路。

关于 `org` 的第一阶段结论：

- 如果 `org` 表示组织架构下的数据可见范围，例如本部门、本组织、下级组织数据可见，则它不是平台硬边界，应进入 resource policy / query scope policy。
- 只有当未来某类 `org` 被明确冻结为法律实体、账套、监管隔离或等价的数据隔离边界时，才可以升级为硬边界；升级前必须经过 architecture / ADR 决策。

## 7. policy 分类

OES 当前只保留三类 policy：

### 7.1 Resource Policy

面向单资源授权边界。

回答的问题：

- 对这个资源能不能做

典型例子：

- `resource.tenant_id == subject.tenant_id`
- `resource.owner_id == subject.account_id`
- `resource.department_id == subject.department_id`

适用场景：

- `getById`
- `detail`
- `update`
- `delete`
- `approve`
- `assign`
- `revoke`

### 7.2 Query Scope Policy

面向查询范围边界。

回答的问题：

- 能看到哪批数据

典型例子：

- 只能看本人负责客户
- 只能看本部门订单
- 只能看本租户资源

适用场景：

- `list`
- `search`
- `page`
- `export` 前的数据范围构造

约束：

- 不应逐条调用 `checkResource`
- 应优先转成 query scope

### 7.3 Security Policy

面向环境与安全边界。

回答的问题：

- 在当前安全环境下这个动作是否允许

典型例子：

- 白名单 IP 限制
- 工作时间限制
- 指定日期窗口限制
- 某租户特定的环境安全约束

适用场景：

- 高风险导出
- 管理接口访问
- 租户级强化安全控制

约束：

- 稳定、可审计、可配置的安全边界适合进入 policy
- 高动态、强实时、依赖复杂外部风险引擎的风控逻辑，不应全部塞进通用 policy

## 8. 典型落地模式

### 8.1 单资源命令 / 单资源详情查询

流程：

1. 认证与 operator context 有效性先校验
2. 对声明 tenant target 的入口执行 tenant-target binding
3. Gateway 或子服务入口执行 `checkPermission`
4. application 层加载最小 resource facts，并按已验证 tenant context 校验资源归属
5. application 层通过 `ResourceAuthorizationService.checkResource` 执行资源授权
6. domain 层执行业务规则
7. 提交状态变更 / 返回详情

适用接口：

- `getById`
- `detail`
- `update`
- `delete`
- `approve`
- `assign`
- `revoke`

### 8.2 列表 / 搜索 / 分页查询

流程：

1. 认证与 operator context 有效性先校验
2. 对声明 tenant target 的入口执行 tenant-target binding
3. Gateway 或子服务入口执行 `checkPermission`
4. query application 层以已验证 tenant context 为硬边界，通过 `ResourceAuthorizationService.buildQueryScope` 构造结构化范围
5. repository / query adapter 将 `QueryScopeExpression` 转为自身持久化查询条件
6. 返回结果

适用接口：

- `list`
- `search`
- `page`
- 大批量导出前的范围筛选

明确禁止：

- 先查一批记录，再逐条做资源布尔鉴权作为主方案
- repository 自行决定“能看什么”；repository 只消费已经构造好的 scope

### 8.2.1 WMS / MES 多资源范围示例

第一阶段 WMS / MES 资源范围不要求 permission-service 理解业务层级本体，只消费业务服务提供的 resource facts。

典型 `PolicyInstance` 映射：

- WMS 多仓库：`resource-field-in-set` + `warehouseId`
- WMS 多库位：`resource-field-in-set` + `storageLocationId`
- MES 多工厂：`resource-field-in-set` + `factoryId / plantId`
- MES 多车间 / WorkCenter：`resource-field-in-set` + `workshopId / workCenterId`

层级规则：

- `warehouse / storageLocation / site / area / workCenter / workUnit` 主数据真相归 WMS / MES 等业务服务。
- permission-service 不查询业务服务数据库展开层级。
- 第一阶段推荐由业务服务在配置、保存或 query adapter 中完成后代资源展开。
- 若后续需要 `includeDescendants`，必须作为受控 template 或业务 adapter 能力单独冻结；层级真相仍不迁入 permission-service。

### 8.3 高风险环境敏感动作

流程：

1. 前置 `checkPermission`
2. 如涉及具体资源，再执行 `checkResource`
3. 同时叠加 `Security Policy`
4. 最后由 domain 层执行业务规则

适用接口：

- `export`
- `approve`
- `grant`
- `rotate`
- `revoke`

## 9. 跨服务派生协作

### 9.1 两类动作

OES 需要区分：

- 主业务动作
- 主业务动作派生的内部协作

#### 主业务动作

指最终操作者直接发起的业务意图，例如：

- 创建订单
- 确认订单
- 修改客户

这类动作必须完成：

- `checkPermission`
- 必要时 `checkResource`
- domain rule

#### 派生内部协作

指主业务动作已经通过授权后，由主责服务派生的后续内部动作，例如：

- 订单确认后创建出库单
- 订单确认后预留库存
- 订单确认后触发通知

### 9.2 默认原则

派生内部协作默认：

- 不重复执行同一层最终操作者授权
- 继续传播必要上下文
- 下游服务仍需执行自身边界与业务规则校验

这里的“同一层最终操作者授权”主要指：

- 对同一个用户业务意图重复做 `checkPermission`
- 对同一个用户业务意图重复做 `checkResource`

### 9.3 下游服务仍需做什么

即使不重复同层最终操作者授权，下游服务仍需做：

- 内部服务可信调用校验
- 租户 / 组织边界校验
- 自身业务规则校验
- 审计归因

### 9.4 何时需要再次授权

如果下游动作本身同时也是本域对外暴露的独立业务能力，则该独立入口仍需执行本域授权。

例如：

- 库存服务对外存在“手工预留库存”入口
- 与订单确认派生的库存预留不是同一语义

则该独立入口仍应做：

- `checkPermission`
- 必要时 `checkResource`

## 10. 与 TrustedExecutionContext 的关系

当前目标状态为：

- mTLS workload identity 证明直接 caller。
- ExecutionToken 传播 execution principal、tenant / org、最小 Permission Code subset、delegation 与 audience / `cnf` binding。
- Role 与完整授权图不跨跳传播。

多跳调用向 STS exchange 下一跳 audience Token。上游已经完成的 BUSINESS 授权不要求下游 INTERNAL 技术原语重复同一层最终用户授权，但下游仍验证 workload policy、INTERNAL Code、tenant、resource ownership 与 domain rule。如果下游动作是独立 BUSINESS capability，则继续验证对应 BUSINESS Permission Code。

## 11. 当前代码状态评估

Updated: 2026-04-09 11:35 +08:00

截至当前代码基线：

- 已完成的部分：
  - `common` 中统一权限码目录已建立
  - `common` 中共享 `PermissionGuard`
  - `common/security` 已整体迁移到 `common/authorization`
  - 原 `common/permission` 中用于授权执行的 decorator / guard 已并入 `common/authorization`
  - legacy `common` 中基于 `operator_roles -> permission-service` 的共享 resolver / adaptor 已落地，但已被可信 ExecutionToken 目标取代，待按逐服务 migration slice 删除
  - legacy `OperatorContextPayload` 仍属于当前实现盘点，不再是新接口目标 contract
  - `auth-service`、`identity-service` 已接入接口级 `RequirePermissions + PermissionGuard`
  - `permission-service` 已具备 `CheckPermission`
  - `permission-service` 已具备历史兼容的 `CheckPermissionWithContext` 与 policy AST 能力；该 RPC 不作为新业务资源授权标准入口
  - `permission-service` 角色管理查询已开始通过显式 query scope builder 收口租户 / 系统范围
  - `permission-service` 已形成 `AuthorizationQueryScopeService + QueryScopeBuilder + DI registry` 第一版 query scope 门面
  - `identity-service` 已在 `listAccountWorkEmailAssets / listAccountWorkPhoneAssets / listServiceAccounts / listApiKeysByServiceAccountId / listAuditEvents` 上完成首批真实业务域 `buildQueryScope` 试点
  - `identity-service` 已通过 handler 级与 L2 仓储级测试验证首批 tenant-bound query scope 会真实进入查询过滤条件
  - `auth-service` 已在 `listAuditEvents / adminListUserSessions` 上完成下一批真实业务域 `buildQueryScope` 试点
  - `auth-service` 已形成本地 `AuthorizationQueryScopeService + QueryScopeBuilder + DI registry` 首批骨架
  - `identity-service` 已在 `getAccountById / getServiceAccountById / getApiKeyById` 上完成首批 application 层 `checkResource` detail query 试点
  - `identity-service` 已在 `revokeApiKey / rotateApiKey / setServiceAccountEnabled` 上完成首批 application 层 `checkResource` 机器身份命令试点
  - `identity-service` 已在 `createApiKey / createServiceAccount` 上完成第二批 application 层 `checkResource` 机器身份创建命令试点
  - `identity-service` 已在 `assignAccountWorkEmailAsset / assignAccountWorkPhoneAsset / revokeAccountWorkEmailAsset / revokeAccountWorkPhoneAsset / setAccountPrimaryWorkEmailAsset / setAccountPrimaryWorkPhoneAsset / setAccountWorkEmailAssetStatus / setAccountWorkPhoneAssetStatus` 上完成第二批 application 层 `checkResource` contact 命令试点
- 未完成的部分：
  - Gateway 粗粒度 guard 虽已启用，但业务服务尚未系统性接入 `checkResource`
- 业务子服务虽已出现首批 `checkResource` 试点，但尚未系统性收敛到 `checkResource`
- 列表 / 搜索 / 分页类 `buildQueryScope` 方案虽已完成 `permission-service` 与 `identity-service` 首批试点，但尚未在业务域服务中形成普遍共享落点
- `auth-service` 已在 `adminRevokeSession` 上完成首个 application 层 `checkResource` 管理员命令试点
- `identity-service` 中登录与认证支撑查询已明确不纳入首批 `checkResource` 范围，后续应继续按内部可信调用与最小暴露原则治理，而不是机械性补齐资源级授权
- `identity-service` 中剩余未纳入接口已主要收敛为登录 / 认证支撑链路，当前阶段没有继续在本服务内机械扩展 `checkResource` 的必要
- 派生内部协作的授权边界尚未在项目级文档与实现中全面统一

因此，当前项目状态应理解为：

- 粗粒度 `RBAC` 基线已部分落地
- `permission-service` 的细粒度引擎能力已存在
- `identity-service` 已基本完成当前阶段试点收口，下一步更适合把同样模式推广到新的业务域
- 但“子服务普遍采用 `checkResource / buildQueryScope`”仍未完成

当前阶段的下一批推荐试点是 `auth-service`：

- `listAuditEvents / adminListUserSessions` 已完成首批 `buildQueryScope` 落点
- `adminRevokeSession` 已完成下一批 `checkResource` 首批落点
- `listSessions / listMfaBindings` 当前更接近用户自助或认证支撑链路，暂不纳入首批资源级授权改造

当前 `auth-service` 中 `adminListUserSessions` 的 tenant-bound scope 已下推到 session 仓储协议，而不再停留在 query handler 内部过滤。由于底层存储当前仍为 Redis，会话集合读取仍需先取回用户关联 session 集合，但“哪些 session 对当前操作者可见”的边界已经收口到 repository 层。

同时，`auth-service` 中 Session 聚合已将 `tenantId / orgId` 升级为一等事实。`adminRevokeSession`、`adminListUserSessions`、refresh token 续期、audit 上下文与普通会话查询不再直接读取 `metadata.tenantId` 作为授权与审计边界来源，而是通过 Session 聚合显式暴露的租户事实消费这些边界。

## 12. 优先改造顺序

后续代码改造优先顺序固定为：

1. 修改类单资源命令接口
   - `update`
   - `delete`
   - `approve`
   - `assign`
   - `revoke`
2. 涉及租户 / 组织 / owner 边界的读取接口
   - `getById`
   - `detail`
3. 对环境敏感的高风险操作
   - `export`
   - `approve`
   - `grant`
   - `rotate`
   - `revoke`

## 13. 对现有文档的关系

- [permission-code-source.md](./permission-code-source.md)
  - 负责统一权限码语义源
- [role-based-permission-resolution.md](./role-based-permission-resolution.md)
  - 负责 PrincipalRoleBinding -> effective Permission Code 解析，以及 Gateway / STS / target service 的分层消费
- [gateway-and-bff.md](./gateway-and-bff.md)
  - 负责 Gateway 的入口职责边界
- 本文
  - 负责授权分层、`checkResource`、`buildQueryScope`、policy 分类以及跨服务派生协作规则

## 14. 当前结论

OES 的目标状态明确为：

- 粗粒度接口访问控制：
  - `checkPermission`
  - `RBAC`
  - `decorator + guard`
- 单资源细粒度授权：
  - `checkResource`
  - application 层执行
- 查询范围控制：
  - `buildQueryScope`
  - query 层执行
- 业务正确性：
  - domain rule
  - 由领域层负责
- 平台硬边界：
  - 不依赖 permission policy
  - 不允许被租户配置或业务 policy 放宽
- policy 只保留：
  - `resource policy`
  - `query scope policy`
  - `security policy`

并且在代码组织上：

- `authorization` 是授权相关标准入口
- `permission` 不再继续承担授权 guard 的长期目录语义
- `security` 不直接等价于授权，而是更广义的安全能力集合

在该模型落地前，任何把细粒度资源授权继续强行收敛为统一前置 guard 的新实现，都应视为过渡或偏离，而不是目标状态。
