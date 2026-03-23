# Permission Service 对接内部服务认证与操作者上下文

更新时间：2026-03-22 12:20:00 +08:00

## 上游主文档

- [../../../../../../doc/cross-service/internal-service-auth-and-operator-context.md](../../../../../../doc/cross-service/internal-service-auth-and-operator-context.md)
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
| `SLICE-04` | 部分实现 | 已为现有 3 个开放 gRPC controller 接入 `InternalServiceGuard`；待结合真实调用链补充运行验收 |
| `SLICE-05` | 部分实现 | 已为 `permission-management` 与 `policy-management` controller 接入 `RequireAuthenticatedOperator()` 和 `AuthenticatedOperatorGuard`；待结合 gateway 转发链路补充运行验收 |
| `SLICE-06` | 部分实现 | 已为管理接口接入基于 permission code 的 `ManagementAuthorizationGuard`；租户一致性与模板/实例边界仍待后续收口 |
| `SLICE-07` | 部分实现 | 已补齐 `AssignAccountRole` 的租户实例角色约束；其余管理边界仍待继续收口 |

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
## 0. 当前暂停点（2026-03-23）

当前 `permission-service` 承接进度：

| 分片 | 状态 | 补充说明 |
|---|---|---|
| `SLICE-04` | 部分实现 | 已接入 `InternalServiceGuard`，编译通过 |
| `SLICE-05` | 部分实现 | 已接入 `RequireAuthenticatedOperator()` + `AuthenticatedOperatorGuard` |
| `SLICE-06` | 部分实现 | 已接入 `ManagementAuthorizationGuard`，并改成接口显式声明所需 permission |
| `SLICE-07` | 部分实现 | 已补 `AssignAccountRole` 租户实例约束，已收口部分 role template / instance 查询与写入口 |

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
