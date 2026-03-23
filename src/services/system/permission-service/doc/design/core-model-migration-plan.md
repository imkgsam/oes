# Permission Service 核心模型迁移计划

更新时间：2026-03-13

本文档仅覆盖第一阶段的核心模型收敛，不包含后续完整业务实现。

## 1. 本次收敛目标

- `Role` 明确为“系统模板 + 租户实例”模型
- `Permission` 保持为清晰、稳定的核心权限对象
- `Policy` 收敛为必须绑定 `permissionCode`
- `CheckPermission` 与 `CheckPermissionWithContext` 统一为同一决策响应结构
- 增加 `AuditEvent` 与 `DecisionEvent` 基础模型

## 2. Schema 方向调整

### 2.1 Role

从：

- `tenantId + isSystem + code(unique)`

调整为：

- `tenantId`
- `scopeKey`
- `kind`
- `templateRoleId`
- `@@unique([scopeKey, code])`

说明：

- `scopeKey="__SYSTEM__"` 表示系统模板
- `scopeKey=tenantId` 表示租户实例
- `templateRoleId` 用于表示租户角色来源于哪个模板角色

### 2.2 Permission

保留 `code` 为全局唯一核心标识，并补充标准时间字段：

- `createdAt`
- `updatedAt`

### 2.3 Policy

从：

- `permissionCode` 可空

调整为：

- `permissionCode` 必填
- 与 `Permission.code` 建立显式关联

说明：

- 以后管理入口应围绕 `Permission -> Policy`
- 不再把“全局任意策略”作为 V1 主路径

### 2.4 AuditEvent / DecisionEvent

新增：

- `AuditEvent`：记录对象变更历史
- `DecisionEvent`：记录鉴权请求与命中结果

## 3. 契约迁移计划

### 3.1 鉴权契约统一

当前：

- `CheckPermission` 返回简单布尔结果
- `CheckPermissionWithContext` 返回 ABAC 决策结果

目标：

- 两个接口统一返回 `AuthorizationDecisionResponse`
- 统一字段：
  - `allowed`
  - `evaluation_mode`
  - `matched_policy`
  - `reason`

兼容策略：

- 旧调用方如果仍依赖 `pass` 字段，需要同步升级
- 网关和子服务升级时，可先只读取 `allowed`

### 3.2 Role 契约

新增字段：

- `role_kind`
- `template_role_id`

兼容策略：

- 暂时保留 `is_system`，作为兼容输入/输出字段
- 新代码应优先使用 `role_kind`

## 4. 兼容性影响

### 4.1 数据库兼容性

存在破坏性变更：

- `Role.code` 全局唯一约束将被替换
- `Role` 新增 `scopeKey`、`kind`、`templateRoleId`
- `Policy.permissionCode` 从可空改为必填
- 新增 `AuditEvent`、`DecisionEvent` 表

落库前需要数据迁移。

### 4.2 接口兼容性

存在契约升级：

- `CheckPermission` 响应结构变化
- `Role` 相关响应增加新字段

建议：

- 先升级 `@oes/common/generated`
- 再升级 `api-gateway` 与直接调用方

### 4.3 代码兼容性

当前代码中已做过渡兼容：

- `Role` 聚合保留 `isSystem` 只读语义
- `CreateRole` 仍可读取旧字段 `isSystem`
- 新契约优先使用 `roleKind`

## 5. 建议的落地顺序

1. 合并 schema 与契约变更
2. 生成 proto 类型
3. 补齐 repository / mapper / controller 的兼容适配
4. 迁移历史数据
5. 升级 gateway 与子服务调用方
6. 再开始下一步具体业务闭环
