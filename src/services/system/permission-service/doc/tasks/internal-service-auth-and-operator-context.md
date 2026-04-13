# Permission Service 对接内部服务认证与操作者上下文

更新时间：2026-03-31 11:40:00 +09:00

## 上游主文档

- [../../../../../../docs/architecture/14-grpc-metadata-and-service-trust-architecture.md](../../../../../../docs/architecture/14-grpc-metadata-and-service-trust-architecture.md)
- [../../../../../../docs/architecture/15-authorization-layering-and-resource-policy-architecture.md](../../../../../../docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
- [../design/authorization.md](../design/authorization.md)

本文件不重复描述跨服务功能的总设计，也不替代本服务的设计承接文档；它只记录 `permission-service` 需要承接的实现分片、状态和验收要求。

## 本服务承接范围

- `SLICE-04` 接入 `InternalServiceGuard`
- `SLICE-05` 接入 `AuthenticatedOperatorGuard`
- `SLICE-06` 落地管理接口业务授权
- `SLICE-07` 修补管理接口租户 / 角色 / 资源边界缺口

## 当前状态

| 分片 | 状态 | 说明 |
|---|---|---|
| `SLICE-04` | 已实现 | 现有 3 个开放 gRPC controller 已接入 `InternalServiceGuard`；真实调用链验收后置 |
| `SLICE-05` | 已实现 | `permission-management` 与 `policy-management` controller 已接入 `RequireAuthenticatedOperator()` 和 `AuthenticatedOperatorGuard`；真实 gateway 转发链路验收后置 |
| `SLICE-06` | 已实现 | 管理接口已接入基于 permission code 的 `ManagementAuthorizationGuard` |
| `SLICE-07` | 已实现（服务内范围） | 模板/实例入口、租户实例分配、禁用角色分配约束和当前服务内可闭环的边界已收口；上游 `operator_roles` 能力后置 |

## 实施顺序

1. 先完成 `SLICE-04`
2. 再完成 `SLICE-05`
3. 在上下文可信的前提下落地 `SLICE-06`
4. 最后修补 `SLICE-07`

## 验收要求

- 非可信内部服务不能访问本服务开放接口
- 管理接口缺少有效操作者上下文时必须拒绝
- 租户管理员不能越权执行系统级操作
- 租户管理员只能操作自己租户的数据
- 相关设计、状态和历史文档同步更新

## 关联文档

- [../design/authorization.md](../design/authorization.md)
- [../design/role-management.md](../design/role-management.md)
- [../design/account-role-management.md](../design/account-role-management.md)
- [../history/authorization.history.md](../history/authorization.history.md)
## 0. 当前暂停点（2026-03-31）

当前 `permission-service` 承接进度：

| 分片 | 状态 | 补充说明 |
|---|---|---|
| `SLICE-04` | 已实现 | 已接入 `InternalServiceGuard`，并修复根模块安全装配缺口 |
| `SLICE-05` | 已实现 | 已接入 `RequireAuthenticatedOperator()` + `AuthenticatedOperatorGuard` |
| `SLICE-06` | 已实现 | 已接入 `ManagementAuthorizationGuard`，并改成接口显式声明所需 permission |
| `SLICE-07` | 已实现（服务内范围） | 已补模板/实例边界、租户实例分配约束、禁用角色分配约束，以及管理审计/鉴权决策记录 |

当前已经完成的 `SLICE-07` 收口点：

- `AssignAccountRole` 仅允许分配当前租户的 `TENANT_INSTANCE` 角色
- role 实例入口与模板入口已做第一轮隔离
- role 查询入口已开始接入操作者范围参数传递

当前明确不要继续沿用的思路：

- 不再使用 `tenant_id` 是否为空来判断系统管理员
- 不直接硬编码 role 名称做最终放行判断

后续恢复时的正确方向：

- 以 `operator_roles` 作为上游声明
- 在服务内解析成 permission / capability
- 再据此收口模板 / 全局数据与租户数据边界

这些方向已明确属于后续依赖上游支持的范围，不纳入当前服务内闭环完成态判断。
