# 鉴权能力

更新时间：2026-03-22 12:40:00 +08:00

## 文档定位

本文档不是独立存在的孤立功能说明，而是根目录跨服务功能
[internal-service-auth-and-operator-context.md](../../../../../../doc/cross-service/internal-service-auth-and-operator-context.md)
在 `permission-service` 内的设计承接文档。

它负责回答两个问题：

- `permission-service` 在整条跨服务安全链路中承担什么职责
- 这些职责在本服务内部应如何拆成鉴权设计与接口保护规则

## 与上游跨服务功能的关系

根目录主文档定义的是全局链路、跨服务职责和总分片；本文档定义的是这些规则在 `permission-service` 内的具体承接方式。

对应关系如下：

| 根目录主文档内容 | 本文档承接内容 |
|---|---|
| L3 `gateway` 粗粒度门禁 | `CheckPermission` 的服务定位与输出语义 |
| L4 `InternalServiceGuard` | 本服务所有对内开放接口的可信调用边界 |
| L5 `AuthenticatedOperatorGuard` | 本服务管理接口的操作者上下文验签要求 |
| L6 `ManagementAuthorizationGuard` | 本服务管理接口的最终操作者授权 |
| L7 `CheckPermissionWithContext` / 本地 ABAC | 本服务资源级、上下文参与的最终授权判断 |
| `SLICE-04` ~ `SLICE-07` | 本服务的实施切片与落地边界 |

## 与其他本服务设计文档的关系

本设计文档只负责“鉴权能力”本身，不重复展开其他领域对象的业务细节。

相关设计文档分工如下：

| 文档 | 负责内容 |
|---|---|
| [role-management.md](./role-management.md) | 角色模板 / 实例模型，以及角色侧管理边界 |
| [account-role-management.md](./account-role-management.md) | 账号与角色绑定、有效期与租户约束 |
| [permission-management.md](./permission-management.md) | `Permission` 作为授权核心对象的管理能力 |
| [policy-management.md](./policy-management.md) | `CheckPermissionWithContext` 依赖的 Policy / AST / 决策整合能力 |
| [core-model-migration-plan.md](./core-model-migration-plan.md) | 鉴权响应结构和核心模型的迁移前置 |

## 目标

提供 `RBAC` 与 `RBAC + ABAC` 鉴权能力，并为 `permission-service` 本身建立清晰的内部服务调用边界与管理接口授权边界。

## 本服务在跨服务功能中的职责

`permission-service` 在这项跨服务功能中不是被动被调用方，而是同时承担两类职责：

### 1. 作为授权中心对外提供鉴权能力

- 提供 `CheckPermission`
- 提供 `CheckPermissionWithContext`
- 为 `gateway` 和其他子服务输出稳定的授权决策语义

### 2. 作为下游子服务保护自身管理接口

- 所有开放接口都必须先通过可信内部服务认证
- 管理接口必须验证操作者上下文
- 管理接口必须在服务内完成最终操作者授权
- 资源级场景必须做细粒度授权，而不是只依赖入口级门禁

## 设计决策

- `CheckPermission` / `CheckPermissionWithContext` 属于服务调用接口，不属于后台业务管理接口。
- 所有进入 `permission-service` 的请求都必须来自可信内部服务。
- 业务管理接口除内部服务认证外，还需要校验最终操作者身份与权限。
- 当前跨模块安全方案采用“方案 3：内部服务认证 + 可验签的操作者上下文”，详见根目录跨服务主文档。
- `CheckPermission` 保持入口级、粗粒度、RBAC 优先的定位，主要供 `gateway` 做前置门禁。
- `CheckPermissionWithContext` 保持资源级、上下文参与、RBAC + ABAC 的定位，用于最终细粒度授权判断。
- `AuthenticatedOperatorGuard` 只解决“操作者身份是否可信”，不替代最终业务授权。
- 本服务管理接口的最终授权优先基于 `permission` 判断，而不是在代码中硬编码 role 名称。
- `SLICE-06` 第一阶段采用“接口显式声明所需 `permission code` + `ManagementAuthorizationGuard` 调用本地 RBAC 判断”的方式收口。

## 全链路到本服务的映射

| 全链路层级 | 在 `permission-service` 中的落点 |
|---|---|
| L4 可信内部服务认证 | 所有对内开放接口统一接入 `InternalServiceGuard` |
| L5 操作者上下文验签 | 角色、账号角色、权限、Policy 等管理接口接入 `AuthenticatedOperatorGuard` |
| L6 服务内业务授权 | 管理接口引入 `ManagementAuthorizationGuard` 或等价授权器 |
| L7 资源级最终授权 | `CheckPermissionWithContext` + Policy / AST / 领域上下文 |

## 接口分类

### 服务调用接口

用于 `gateway` 或其他内部服务发起授权判断：

- `CheckPermission`
- `CheckPermissionWithContext`

特点：

- 要求可信内部服务身份
- 不要求操作者上下文
- 不属于后台管理接口

### 业务管理接口

包括但不限于：

- 角色管理
- 账号角色管理
- Permission 管理
- Policy 管理

特点：

- 要求可信内部服务身份
- 要求有效操作者上下文
- 要求服务内最终业务授权

## 功能清单

| 功能编号 | 功能项 | 允许调用服务 | 允许操作者 | 优先级 | 状态 | 备注 |
|---|---|---|---|---|---|---|
| 4.6.1 | 纯 RBAC 鉴权 | `gateway`、内部服务 | 内部服务 | P0 | 已实现 | `CheckPermission`；供入口级粗粒度门禁使用 |
| 4.6.2 | RBAC + ABAC 鉴权 | `gateway`、内部服务 | 内部服务 | P0 | 部分实现 | `CheckPermissionWithContext`；需继续与新 Policy 模型收敛 |
| 4.6.3 | DENY 优先 | `gateway`、内部服务 | 内部服务 | P0 | 部分实现 | 最终语义依赖 Policy 决策整合层，需继续验证 |
| 4.6.4 | ALLOW 白名单语义 | `gateway`、内部服务 | 内部服务 | P0 | 部分实现 | 需与 `DENY > ALLOW > default deny` 语义继续核对 |
| 4.6.5 | 服务内接口保护 | `gateway`、内部服务 | 内部服务 / 管理操作者 | P0 | 部分实现 | 已落地 `SLICE-04` ~ `SLICE-07` 的部分链路；租户 / 模板 / 资源边界仍待继续收口 |
| 4.6.6 | 鉴权批量检查 | `gateway`、内部服务 | 内部服务 | P1 | 未开始 | |
| 4.6.7 | 轻量 Explain | `gateway`、内部服务 | 内部服务 | P1 | 未开始 | 应与 Policy Explain 能力协同设计 |

## 4.6.5 服务内接口保护的拆解

`4.6.5` 不是一个单独的小点，而是本服务承接根目录跨服务功能的核心入口。

它拆解为：

| 设计子项 | 对应根目录分片 | 说明 |
|---|---|---|
| 所有开放接口接入 `InternalServiceGuard` | `SLICE-04` | 建立可信内部调用边界 |
| 管理接口接入 `AuthenticatedOperatorGuard` | `SLICE-05` | 拒绝裸操作者字段和无效上下文 |
| 管理接口最终业务授权 | `SLICE-06` | 将系统管理员 / 租户管理员边界收口到服务内 |
| 补齐租户 / 模板 / 资源边界缺口 | `SLICE-07` | 修补文档已要求但代码未完全收口的约束 |

## 长期注意事项

- `CheckPermission` 与管理接口保护是两条不同职责线，不能互相替代。
- `AuthenticatedOperatorGuard` 成功不代表有权执行管理操作，仍需走服务内授权。
- `CheckPermissionWithContext` 的细粒度能力与 `policy-management.md` 强耦合，后续演进必须同步审视两篇文档。
- 若根目录跨服务主文档调整了 metadata、guard 分层或分片编号，必须优先同步本设计文档。

## 关联任务与历史

- 服务内落地任务见 [../tasks/internal-service-auth-and-operator-context.md](../tasks/internal-service-auth-and-operator-context.md)
- 历史记录见 [../history/authorization.history.md](../history/authorization.history.md)
## 当前实现进度说明（2026-03-23）

截至当前线程暂停，`permission-service` 在这条跨服务主线上已经完成：

- 开放 gRPC 接口的 `InternalServiceGuard`
- 管理接口的 `AuthenticatedOperatorGuard`
- 基于接口显式 permission 声明的 `ManagementAuthorizationGuard`
- 部分 `SLICE-07` 边界收口

同时需要明确以下现状：

- 现有“最终授权优先基于 permission 判断”的设计不变
- 对“系统级操作者”的判定，不应再依赖 `tenant_id` 空值，也不应直接硬编码 role 名称
- 更合理的后续方向是：由上游传递较小规模的 `operator_roles`，服务内再解析成 permission / capability 结果后参与边界判断

这意味着：

- 本文档中所有关于系统管理员 / 租户管理员差异边界的后续实现，应建立在 “permission / capability” 上
- 不应继续扩散临时的 system-scope 推断逻辑
