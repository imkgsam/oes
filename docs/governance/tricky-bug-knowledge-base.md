# OES 疑难 Bug 根因知识库

## 1. 目的

本文件用于沉淀 OES 项目中已经完成根因分析、且值得跨线程复用的疑难 bug 总结。

这里回答的是：

- 某个疑难 bug 的问题现象是什么
- 真实根因是什么
- 正式修复方案是什么
- 以后如何避免再次踩到同类坑

本文件不是 feature 历史记录，也不是服务实现流水账；它只保留那些具有跨线程复用价值的根因结论。

## 2. 归位规则

以下内容应写入本知识库：

- 经过 `systematic debugging` 后才定位出的真实根因
- 容易被误判为“前端问题 / 数据问题 / 权限配置问题”，但实际根因在边界、契约、DI、元数据传播、鉴权链路、上下文传播等基础机制上的问题
- 会影响多个线程、多个服务或未来同类实现的踩坑结论
- 已经形成明确防复发规则的 bug

以下内容不应写入本知识库：

- 只影响单个 feature、且没有可复用经验的普通实现 bug
- 临时环境抖动、一次性数据脏污、单机配置缺失
- 尚未完成根因分析、只有现象没有结论的问题

归位分工：

- 项目级、跨线程复用的疑难 bug 根因：写这里
- 单个服务的实现历史、阶段性收尾记录：写服务内 `doc/history/*.history.md`
- 稳定架构规则本身：回写 `docs/architecture/*.md`

如果同一个根因再次出现，应优先更新原条目，而不是新增重复条目。

## 3. 条目模板

每个条目至少应包含：

- `问题现象`
- `触发条件`
- `根本原因`
- `正式修复方案`
- `为什么之前容易误判`
- `防复发规则`
- `相关文档 / 代码入口`

推荐写法：

1. 先写症状，不夹带猜测
2. 再写真实根因，明确区分“直接报错点”和“真正设计缺口”
3. 最后写防复发规则，让后来线程可以直接复用

## 4. 维护规则

- 一个根因一个条目，避免同类问题在不同文件重复展开
- 条目只保留高信号内容，不写大段联调过程流水账
- 如根因已经上升为稳定架构规则，应补链接到对应 `docs/architecture/*.md`
- 如根因对应某个具体 feature 或服务收尾记录，应补链接到对应 `feature packet` 或 `doc/history`

## 5. 已知疑难 Bug

### KB-001 `AuthenticatedOperatorGuard` 不会仅因 `@UseGuards(...)` 自动解析 operator context

**问题现象**

- 新增 gRPC 管理接口时，调用链已经带了 `x-operator-context`
- 接口也挂了 `InternalServiceGuard + AuthenticatedOperatorGuard`
- 但 handler 内调用 `getRequiredOperatorId(...)` 仍报：
  - `APP_SECURITY_003`
  - `Operator context is missing`

**触发条件**

- 新接口需要读取 operator identity / scope / resource-boundary context
- 代码只写了：
  - `@UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)`
- 但没有显式声明：
  - `@RequirePermission(...)`，或
  - `@RequireAuthenticatedOperator()`

**根本原因**

`AuthenticatedOperatorGuard` 当前不是“只要挂上 guard 就自动消费 metadata”的实现。

它只有在接口显式带有 `@RequirePermission(...)` 或 `@RequireAuthenticatedOperator()` 元数据时，才会真正读取 gRPC metadata，并把 operator context 挂到 request context 上。

因此，如果接口只写 guard、不写上述元数据，handler 再去读取 operator context，就会得到“上下文缺失”的错误。

**正式修复方案**

- 对所有需要读取 operator context 的管理类 gRPC 接口，显式声明：
  - `@RequirePermission(...)`，或
  - `@RequireAuthenticatedOperator()`
- 不在 handler 内自行兜底解析 metadata
- 不绕过既有 guard / decorator 机制

**为什么之前容易误判**

- 表面现象很像“BFF 没传 metadata”或“前端上下文错误”
- 但实际 metadata 已经到达下游，问题出在服务内 guard 激活条件不满足
- 直接报错点在 handler 读取 operator id，而真实设计缺口在接口缺少元数据声明

**防复发规则**

- 任何 admin / management gRPC 接口，只要 handler 会读取 operator identity、operator scope、resource boundary 或审计归因信息，就必须显式声明：
  - `@RequirePermission(...)`，或
  - `@RequireAuthenticatedOperator()`
- 代码评审时，不能只检查 `@UseGuards(...)`，还要检查 decorator 元数据是否齐全

**相关文档 / 代码入口**

- `docs/architecture/14-grpc-metadata-and-service-trust-architecture.md`
- `src/services/system/auth-service/doc/history/sess-05-admin-permission-enforcement.history.md`
- `src/common/src/authorization/guards/authenticated-operator.guard.ts`

