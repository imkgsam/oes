# Permission 管理历史

## 2026-03-18 17:40:01 +08:00

### 本次目标

将 Permission 管理从总索引中拆出，形成独立功能文档与历史文档。

### 主要改动

- 新建 [permission-management.md](/D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/permission-management.md)
- 提取 Permission 管理的设计约束与功能清单

## 2026-03-19 10:32:52 +08:00

### 本次目标

为 Permission 管理功能清单补充“最后检查时间”列。

### 主要改动

- 在主文档中新增“最后检查时间”列
- 建立后续逐项核查的记录规则

## 2026-03-19 10:32:52 +08:00

### 本次目标

修复并完整审核 `4.4.1 查看权限详情`。

### 主要改动

- 修正 `GetPermissionByIdHandler`
- 修正 `GetPermissionByCodeHandler`
- 查询不存在权限时统一返回 `PERMISSION_NOT_FOUND`

## 2026-03-19 10:36:34 +08:00

### 本次目标

完整审核 `4.4.2 查看权限列表`，并将分页与过滤从基础列表中拆出。

### 主要改动

- 核查 `ListPermissions`
- 核查 `ListPermissionsByModule`
- 新增独立功能项 `4.4.7 权限列表分页与过滤`

## 2026-03-19 10:43:20 +08:00

### 本次目标

完整审核 `4.4.3 创建权限`。

### 主要改动

- 核查 `CreatePermission` 的 proto、controller、command、handler、repository 链路
- 收敛非法模块值的校验路径到 command 校验
- 确认重复编码返回 `PERMISSION_ALREADY_EXISTS`

## 2026-03-19 10:53:40 +08:00

### 本次目标

完成 `4.4.4 修改权限` 与 `4.4.5 删除权限保护`。

### 主要改动

- 新增 `UpdatePermission`
- 删除权限前补齐角色与 Policy 引用保护
- 新增 `PERMISSION_DELETE_FORBIDDEN`

## 2026-03-19 11:02:10 +08:00

### 本次目标

完成 `4.4.6 查看拥有该权限的角色`。

### 主要改动

- 新增 `ListPermissionRoles`
- 在角色仓储中实现按权限反查角色
- 权限不存在时返回 `PERMISSION_NOT_FOUND`

## 2026-03-19 17:40:00 +08:00

### 本次目标

实现 `4.4.7 权限列表分页与过滤`，并将权限列表查询收敛为统一主入口。

### 主要改动

- 新增 `ListPermissionsPaged` RPC
- 新增 `ListPermissionsPagedQuery / Handler`
- 在 `PermissionRepository` 中新增 `findPaged(...)`
- 在 Prisma 权限仓储中实现：
  - `page/pageSize`
  - `module`
  - `keyword`
  - 固定 `createdAt desc` 排序
- 在 gRPC controller 中新增 `listPermissionsPaged(...)`
- 旧 `listPermissions(...)` 与 `listPermissionsByModule(...)` 保留为兼容路径，并标注 `OUTDATED`
- 重写主文档，清理编码噪声并同步 `4.4.7` 状态

### 备注

- 本次统一的是主入口，未删除旧查询接口
- 后续若调用方迁移完成，可再单独下线旧接口

## 2026-03-19 17:52:00 +08:00

### 本次目标

实现 `4.4.8 批量创建权限`。

### 主要改动

- 新增 `BatchCreatePermissions` RPC
- 新增 `BatchCreatePermissionsCommand / Handler`
- 在 `PermissionRepository` 中新增：
  - `findByCodes(...)`
  - `createMany(...)`
- 在 Prisma 权限仓储中实现批量查重与批量创建
- 批量创建采用整批失败语义：
  - 请求体内部有重复 `code` 时整批失败
  - 数据库中已存在 `code` 时整批失败
- 失败时通过异常 `details` 返回具体冲突项：
  - `duplicateCodes`
  - `existingCodes`

### 备注

- 本次不做部分成功
- 本次不扩展批量更新或批量删除
