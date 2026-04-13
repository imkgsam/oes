# OES 基于角色的权限解析设计

## 1. 目的

本设计用于明确 OES 内部服务在管理型接口上如何完成权限判断，解决当前实现中的两个问题：

- `operator_context` 直接传播预解析权限集合会导致上下文过大，且权限集合难以稳定治理
- 各子服务如果各自实现 role -> permission 解析，会形成重复轮子和语义漂移

本设计的目标是建立一个稳定、可复用、可跨服务消费的权限解析方案。

## 2. 背景

当前项目已经完成：

- `src/common` 中统一权限码语义源
- `permission-service` 中角色与权限主数据管理
- 各子服务基于 `@RequirePermission(...)` 和 `PermissionGuard` 做接口保护

但当前仍存在一个关键缺口：

- `PermissionGuard` 依赖 `OperatorPermissionResolver`
- 部分服务当前是直接从旧的权限快照字段返回权限集合

这只能作为过渡方案，不应成为长期设计。

## 3. 核心决策

### 3.0 系统级真实角色与租户级真实角色分离

OES 角色模型区分三类角色：

- `SYSTEM_TEMPLATE`
  - 全局模板角色
  - 只能作为租户角色实例的来源
  - 不直接分配给账号
- `SYSTEM_INSTANCE`
  - 系统级真实角色
  - 可分配给不绑定租户的系统管理员账号
  - 用于解析系统管理员的 access summary 与接口权限
- `TENANT_INSTANCE`
  - 租户级真实角色
  - 可分配给租户账号
  - 用于解析租户管理员与租户成员权限

`AccountRole` 是账号与角色的绑定事实，应表达绑定 scope：

- 系统级绑定：`scopeLevel = SYSTEM`，`tenantId = null`，role 必须是 `SYSTEM_INSTANCE`
- 租户级绑定：`scopeLevel = TENANT`，`tenantId` 必填，role 必须是 `TENANT_INSTANCE`

详细决策见 ADR：

- [0002-system-role-instance-and-account-role-scope.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0002-system-role-instance-and-account-role-scope.md)

### 3.1 operator context 只传播角色，不传播权限

`operator_context` 的目标状态如下：

- 必须包含 `operator_id`
- 必须包含 `operator_roles`
- 可以包含 `tenant_id`
- 不再作为标准路径传播预解析权限集合

约束：

- `operator_roles` 的元素语义统一为 `roleId`
- 角色是跨服务传播的最小授权上下文
- 权限集合由子服务在本地解析，不由上游一次性展开后透传

### 3.2 权限真相来自 permission-service

角色与权限的运行时事实源仍然是 `permission-service`。

子服务不得：

- 自行持久化角色权限映射真相
- 自行在本地硬编码 role -> permission 对应表

子服务应通过显式同步调用向 `permission-service` 请求角色对应权限。

### 3.3 共享解析能力下沉到 common

由于多个子服务都会需要相同能力，role -> permission 解析不应各服务重复实现，而应在 `src/common` 提供共享组件。

共享组件职责：

- 基于 `operator_context.operator_roles` 提取 `roleId`
- 调用 `permission-service` 的管理查询接口解析每个角色的权限
- 合并、去重并返回 permission code 集合
- 暴露为 `OperatorPermissionResolver` 的通用实现

## 4. 目标结构

建议结构：

```text
src/common/src/authorization/
  resolvers/
    role-based-operator-permission.resolver.ts
  adaptors/
    permission-service-permission-read.adaptor.ts
```

职责说明：

- `RoleBasedOperatorPermissionResolver`
  - 实现 `OperatorPermissionResolver`
  - 输入 `OperatorContextPayload`
  - 输出去重后的 `permission code[]`
- `PermissionServicePermissionReadAdaptor`
  - 封装对 `permission-service` 的 gRPC 调用
  - 负责读取 role -> permissions

各子服务只需要：

- 接入 `permission-service` gRPC client
- 在模块中把 `OPERATOR_PERMISSION_RESOLVER` 绑定到该共享 resolver

## 5. 与 permission-service 的协作方式

### 5.1 当前最小可行方案

优先复用现有能力：

- `PermissionManagementService.ListRolePermissions`

解析流程：

1. 从 `operator_context.operator_roles` 读取全部 `roleId`
2. 对每个 `roleId` 调用 `ListRolePermissions`
3. 合并所有返回的 permission code
4. 去重后交给 `PermissionGuard`

这是当前最小闭环，不需要先扩公共 proto。

### 5.2 后续优化方向

如果多个子服务都开始高频使用该能力，可再评估在 `permission-service` 中增加批量解析接口，例如：

- `ResolvePermissionsByRoles`

但这属于后续优化，不是当前落地前置条件。

## 6. OperatorContextPayload 约束

`OperatorContextPayload` 的当前标准约束：

- `operator_roles?: string[]` 保留并作为标准字段使用
- 共享类型与共享授权实现不再暴露旧的权限快照字段

约束：

- 新服务和新改造路径不得继续以旧的权限快照字段作为标准来源
- 若历史上下文中仍出现该字段，只能视为兼容遗留输入，而不能成为新的代码依赖前提

## 7. 缓存与性能边界

本设计允许为 role -> permission 解析增加短 TTL 内存缓存，但缓存只是优化，不是事实源。

约束：

- 若多个子服务都会使用该能力，缓存实现应优先下沉到 `common` 的共享 resolver / adaptor 中，而不是各服务各自实现
- 缓存键应以 `roleId` 为粒度
- 缓存失效不能改变授权正确性
- 未命中缓存时必须仍可回落到 `permission-service`

若未证明存在明显性能瓶颈，第一阶段可先不加缓存。

推荐顺序：

1. 先在 `common` 中完成无缓存的共享解析链
2. 再在 `common` 的共享 adaptor / resolver 中补短 TTL 缓存
3. 子服务只复用共享实现，不自行复制缓存逻辑

## 8. 安全与治理要求

该方案必须满足：

- 权限判定可审计
- 权限码来源单一
- 角色来源显式
- 子服务不持有权限真相副本

同时明确禁止：

- 在 `operator_context` 中塞入完整权限清单作为长期方案
- 在各子服务中复制一份静态 role -> permission 映射
- 绕过 `permission-service` 直接以本地约定替代授权真相

## 9. 落地顺序

### Phase 1

- 在 `docs/architecture` 明确本设计
- 保持现有 `PermissionGuard` 与 `OperatorPermissionResolver` 接口不变

### Phase 2

- 在 `src/common` 增加共享 `permission-service` adaptor
- 在 `src/common` 增加共享 `RoleBasedOperatorPermissionResolver`

### Phase 3

- `identity-service`、`auth-service` 等子服务改为复用共享 resolver
- 停止依赖旧的权限快照字段
- 从共享类型与共享授权实现中移除旧的权限快照字段

### Phase 4

- 如有必要，再为 `permission-service` 增加批量角色解析契约

## 10. 对现有文档的关系

本设计补充并收敛以下主线：

- `07-permission-code-source.md`
  - 负责“权限码从哪里来”
- 本文
  - 负责“子服务如何基于角色解析权限并完成判断”
- `15-authorization-layering-and-resource-policy-architecture.md`
  - 负责“`checkPermission / checkResource / buildQueryScope` 如何在项目中分层落地”

二者互补，不互相替代。

## 11. 当前结论

截至 2026-03-29，本项目的目标状态明确为：

- 统一权限码定义放在 `common`
- 统一权限真相放在 `permission-service`
- `operator_context` 传播 `roleId`
- 子服务通过 `common` 中的共享 resolver 调用 `permission-service`，解析出 permission code 后参与 `PermissionGuard` 判定

在该设计落地前，任何继续基于旧的权限快照字段扩展的新实现，都应视为过渡方案，而不是目标方案。
