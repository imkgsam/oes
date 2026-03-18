# 角色管理历史

## 2026-03-18 17:40:01 +08:00

### 本次目标

将角色管理从总 checklist 中拆出，形成独立功能集合文档与历史文档。

### 主要改动

- 新建 [role-management.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/role-management.md)
- 从总 checklist 中提取角色管理范围、阶段和设计决策
- 为模板 / 实例相关后续事项单独列出 `P1` 项

### 备注

- 旧的角色相关历史仍可从仓库 git 记录中追溯
- 后续角色相关改动统一追加到本文件

## 2026-03-15 23:23 +08:00

### 本次目标

核查“为角色移除权限”功能是否已完整实现。

### 主要改动

- 完成 `RevokeRolePermission` 链路核查
- 更新状态为已实现

## 2026-03-15 23:21 +08:00

### 本次目标

核查“为角色添加权限”功能是否已完整实现。

### 主要改动

- 完成 `AssignRolePermission` 链路核查
- 更新状态为已实现

## 2026-03-15 23:08 +08:00

### 本次目标

实现“查看持有该角色的账号”。

### 主要改动

- 新增 `ListRoleAccounts`
- 补齐 query / repository / gRPC 链路

## 2026-03-15 22:59 +08:00

### 本次目标

实现“查看角色持有的权限”。

### 主要改动

- 新增 `ListRolePermissions`
- 补齐 query / gRPC 链路

## 2026-03-15 22:55 +08:00

### 本次目标

实现角色启用/停用。

### 主要改动

- 新增 `SetRoleEnabled`
- 补齐 command / handler / gRPC 链路

## 2026-03-17 17:58 +08:00

### 本次目标

明确 template / instance 的使用场景和后续阶段策略。

### 主要改动

- 明确 `SYSTEM_TEMPLATE` 预置权限组合
- 明确 `TENANT_INSTANCE` 创建时复制模板权限
- 明确 `Phase 1` 暂不开放实例权限自定义
