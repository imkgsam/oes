# Unified Permission Decorator

> 服务设计唯一真相源：[permission-service.md](../../architecture/services/permission-service.md)。本文只记录 permission decorator 统一 feature 的范围、状态与迁移纪律；`Permission`、`Policy`、`checkPermission`、`checkResource` 与 `buildQueryScope` 的授权语义不在本文重新定义。

## 1. 目标

- 统一 BFF / Gateway HTTP 与子服务 gRPC 场景下声明接口权限的 decorator 语义，消除历史多入口并存造成的理解成本。
- 建立一个面向后续长期使用的权限声明入口：`RequirePermissions`。
- 保留 HTTP 与 gRPC 各自的 guard 执行差异，因为两类入口的 operator context、request shape 与元数据来源不同。
- 本次一次性完成项目内使用点迁移，并删除历史 decorator 与旧 metadata 兼容读取逻辑。
- 为后续 policy / resource authorization rollout 保持清晰边界：decorator 只声明粗粒度 permission code，不承载资源事实、查询范围或业务规则。

## 2. 不做什么

- 不改变 `permission-service` 的 `CheckPermission` RPC 语义。
- 不改变 RBAC、role、account-role、access summary 或 permission catalog 模型。
- 不改变 `checkResource` / `buildQueryScope` 的职责边界。
- 不把 policy AST、resource facts、query scope 条件塞进接口 decorator。
- 不保留历史 decorator 的长期兼容入口。
- 不把 HTTP BFF guard 与 gRPC service guard 合并成同一个运行时实现。
- 不处理 working-hours、IP allowlist、resource visibility、tenant hard boundary 等 policy 大设计议题。

## 3. 上游依赖

- architecture:
  - [authorization-layering-and-resource-policy.md](../../architecture/platforms/authorization-layering-and-resource-policy.md)
- services:
  - [permission-service.md](../../architecture/services/permission-service.md)
- collaborations:
  - [authorization-decision-flow.md](../../architecture/collaborations/authorization-decision-flow.md)
- contracts:
  - [permission-service/README.md](../../contracts/permission-service/README.md)
  - [permission-service/access-summary.md](../../contracts/permission-service/access-summary.md)
- related plans:
  - [policy-governance-readonly.md](./policy-governance-readonly.md)

## 4. 当前结论

- 当前代码中 `checkPermission` 不是 decorator，而是 permission-service 提供的粗粒度 RBAC 授权判定能力。
- 当前 BFF / HTTP 侧统一使用 `RequirePermissions` 声明权限，再由 `GatewayPermissionGuard` 调用 permission-service `checkPermission`。
- 当前子服务 gRPC 侧统一使用 `RequirePermissions` 声明权限，再由 `PermissionGuard` 基于 authenticated operator context 解析 operator permissions。
- 历史 decorator 的真实差异主要来自历史命名和 transport 接入方式，不应继续暴露为业务开发者必须理解的多套授权语义。
- 本 feature 统一声明层，而不强行统一运行时 guard：
  - 声明层统一为 `RequirePermissions`。
  - HTTP / gRPC guard 继续保持 transport-specific 实现。
- 本次只做声明语义统一、使用点迁移与遗留入口清理，不改变授权行为。

## 5. 契约真相位置

- 共享授权入口位置：
  - `src/common/src/authorization/**`
- 当前统一 decorator：
  - `src/common/src/authorization/decorators/require-permissions.decorator.ts`
- 历史 decorator 文件：
  - 已删除，不保留长期兼容实现。
- 当前 HTTP guard：
  - `src/common/src/authorization/guards/gateway-permission.guard.ts`
- 当前 gRPC guard：
  - `src/common/src/authorization/guards/permission.guard.ts`

## 6. 推荐 API

新增统一 decorator：

```ts
@RequirePermissions({ all: ['crm.customer.list'] })
@RequirePermissions({ any: ['crm.customer.update', 'crm.customer.admin'] })
```

稳定规则：

- `all` 表示必须同时具备所有 permission codes。
- `any` 表示具备任一 permission code 即可。
- `all` 与 `any` 不应同时出现；如同时出现，应在启动或运行时 fail fast。
- 单权限场景也使用 `all`：

```ts
@RequirePermissions({ all: ['crm.customer.get'] })
```

遗留规则：

- 历史 decorator 不保留 alias 或 wrapper。
- guard 不读取旧 metadata key。
- 项目内新增或重写接口只能使用 `RequirePermissions({ all: [...] })` 或 `RequirePermissions({ any: [...] })`。

## 7. Guard 行为

### 7.1 BFF / HTTP Guard

- 读取统一 permission metadata。
- 从 HTTP request user / session context 中解析 account operator。
- 调用 permission-service `CheckPermission` 做粗粒度 RBAC 判定。
- 多权限 `all / any` 语义由 guard 编排。
- 下游异常继续 fail closed。

### 7.2 子服务 gRPC Guard

- 读取统一 permission metadata。
- 从 authenticated operator context 中解析当前 operator。
- 通过既有 permission resolver / access summary 能力解析 operator permissions。
- 多权限 `all / any` 语义由 guard 编排。
- operator context 缺失或授权依赖不可用时继续拒绝访问。

## 8. 迁移策略

- 新增 `RequirePermissions` 与统一 metadata shape。
- 修改两个现有 guard，使其只读取统一 metadata。
- 删除历史 decorator 的兼容 alias / wrapper。
- 新增和重写接口必须使用 `RequirePermissions`。
- 既有接口在本 feature 内完成项目内迁移。
- 每次迁移只允许改变 decorator 写法，不允许同时改变 permission code、guard 注册方式或业务授权逻辑。

## 9. 当前 slice

- slice:
  - Permission decorator 语义统一与遗留入口清理
- status:
  - implemented
- scope:
  - 新增统一 `RequirePermissions` decorator。
  - 统一 metadata 类型。
  - HTTP guard 读取统一 metadata。
  - gRPC guard 读取统一 metadata。
  - 旧 decorator 与旧 metadata 兼容读取逻辑删除。
  - 补充聚焦单元测试覆盖 `all / any / no metadata / dependency failure` 行为。
- ready definition:
  - 已确认 `checkPermission` 是授权判定能力，不是 decorator。
  - 已确认 BFF / HTTP 与 gRPC 可以统一声明语义，但不统一成单个 guard 实现。
  - 已确认本 feature 不处理 policy、resource facts 或 query scope。

## 10. 主线范围

- 本 feature 主线：
  - 收敛粗粒度 permission code 的接口声明方式。
  - 降低业务服务接入授权 guard 时的概念分叉。
  - 为后续资源授权 rollout 留出稳定、可读的接口权限入口。
- 本 feature 不做：
  - policy template / policy instance
  - hard boundary 冻结
  - checkResource 标准 contract
  - buildQueryScope 标准 contract
  - CRM / SRM resource visibility rollout
  - working-hours / IP allowlist security policy rollout
  - password failure count / account lockout 策略
- 偏移返回条件：
  - 需要改变 permission-service RPC。
  - 需要把资源对象、owner、team、org、tenant visibility 放进 decorator。
  - 需要把 query filter 直接挂到 controller decorator。
  - 需要恢复历史 decorator 兼容入口。

## 11. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-05-13 | 哪些边界不应依赖 policy | Architecture | 若不冻结，后续 tenant isolation、operator context、password failure 等容易被误放进 permission policy | 单独冻结 hard boundary vs policy boundary 规则 | authorization layering architecture / future feature packet | open |
| 2026-05-13 | policy template 与 policy instance 模型 | Architecture | 当前 policy AST 与 readonly governance 不足以支撑可配置 working-hours、IP allowlist、own-resource 等场景 | 单独设计内置 template + tenant/configurable instance 模型 | permission-service truth source / future feature packet | open |
| 2026-05-13 | checkResource / buildQueryScope 标准 contract | Architecture | 当前 identity/auth 试点仍偏本地 tenant-bound code rule，未形成统一 resource facts 与 query scope 协议 | 单独冻结 resource authorization contract 与 application pattern | authorization layering architecture / future feature packet | open |
| 2026-05-13 | 密码错误次数是否进入 permission policy | Security | 若放进 permission policy，会混淆认证风控与授权策略 | 冻结为 auth-service security/risk policy，不进入 permission-service policy | auth-service truth source / security architecture | open |

## 12. 验收标准

- 项目存在统一 `RequirePermissions` decorator。
- `RequirePermissions({ all: [...] })` 与 `RequirePermissions({ any: [...] })` 的 metadata shape 明确稳定。
- HTTP BFF guard 能读取统一 metadata 并保持现有 `all / any` 行为。
- gRPC guard 能读取统一 metadata 并支持单权限与多权限判定。
- 历史 decorator、旧 metadata key 与兼容读取逻辑已删除。
- 新增或重写接口有明确规则：优先使用 `RequirePermissions`。
- 测试覆盖：
  - no metadata allow pass-through
  - all permissions granted
  - all permissions partially denied
  - any permission granted
  - any permissions all denied
  - dependency failure fail closed
- HTTP/BFF guard 行为不变
- gRPC guard 行为不变
- 文档和代码注释不得暗示 decorator 承担 resource policy 或 query scope 职责。

## 13. 关闭条件

- feature packet 已更新为本次执行真相。
- common authorization decorator / guard 改造完成。
- 项目内历史 decorator 使用点迁移完成。
- 聚焦测试通过。
- 未混入 permission-service RPC、policy AST、resource authorization 或 query scope 改造。

## 14. 备注

- 本 feature 解决的是“同一类粗粒度权限声明为什么有多套 decorator”的工程一致性问题。
- 本 feature 不解决“资源能不能看、能不能改、能看到哪些列表数据”的细粒度授权问题；这些必须通过 `checkResource` 与 `buildQueryScope` 单独推进。
- BFF 是当前 OES 的真实外部入口形态；代码中的 `api-gateway` 命名应按当前实现历史理解，不代表一定存在独立传统 Gateway 层。
