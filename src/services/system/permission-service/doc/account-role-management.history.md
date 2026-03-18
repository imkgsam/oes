# 账号角色管理历史

## 2026-03-18 17:40:01 +08:00

### 本次目标

将账号角色管理从总 checklist 中拆出，形成独立功能集合文档与历史文档。

### 主要改动

- 新建 [account-role-management.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/account-role-management.md)
- 汇总 checkbox list 页面语义与现有接口状态

## 2026-03-17 12:15 +08:00

### 本次目标

一次性实现账号角色页面的两个闭环分片。

### 主要改动

- 实现 `GetAccountRoleSelection`
- 实现 `SetAccountRoles`

## 2026-03-17 12:04 +08:00

### 本次目标

将“撤销账号角色”调整为幂等删除。

### 主要改动

- 将 `revokeAccountRole` 改为幂等语义

## 2026-03-17 11:53 +08:00

### 本次目标

核查账号角色管理既有功能并收敛页面设计。

### 主要改动

- 核查 `ListAccountRoles`
- 核查 `AssignAccountRole`
- 将原“批量授予/撤销角色”收敛为页面式全量同步方案
