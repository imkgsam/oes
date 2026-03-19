# 账号角色管理历史

## 2026-03-17 11:53:00 +08:00

### 本次目标

核查账号角色管理既有功能并收敛页面设计。

### 主要改动

- 核查 `ListAccountRoles`
- 核查 `AssignAccountRole`
- 将原“批量授予/撤销角色”收敛为页面式全量同步方案

## 2026-03-17 12:04:00 +08:00

### 本次目标

将“撤销账号角色”调整为幂等删除。

### 主要改动

- 将 `revokeAccountRole` 改为幂等语义

## 2026-03-17 12:15:00 +08:00

### 本次目标

一次性实现账号角色页面的两个闭环分片。

### 主要改动

- 实现 `GetAccountRoleSelection`
- 实现 `SetAccountRoles`

## 2026-03-18 17:40:01 +08:00

### 本次目标

将账号角色管理从总索引中拆出，形成独立功能集合文档与历史文档。

### 主要改动

- 新建 [account-role-management.md](/D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/account-role-management.md)
- 汇总 checkbox list 页面语义与现有接口状态

## 2026-03-19 10:31:45 +08:00

### 本次目标

为账号角色管理功能清单补充“最后检查时间”列，并将已明确核查或实现验证过的功能项写入检查时间。

### 主要改动

- 在 [account-role-management.md](/D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/account-role-management.md) 的功能清单中新增“最后检查时间”列
- 为以下功能项补充检查时间：
  - `4.3.1`
  - `4.3.2`
  - `4.3.3`
  - `4.3.4`
  - `4.3.5`
- 对尚未开始的 `4.3.6` 保持空白

### 备注

- 后续每次实现或重新审核账号角色管理分片时，都需要同步更新这一列

## 2026-03-19 16:58:00 +08:00

### 本次目标

完善 `4.3.6 账号角色生效时间` 的设计文档，补充使用场景、数据模型、实施步骤和边界约束。

### 主要改动

- 新增“角色授予有效期设计”章节。
- 明确使用场景：
  - 临时提权
  - 代班/轮岗
  - 预约生效
  - 自动过期回收
- 明确数据模型：
  - `effectiveAt`
  - `expiresAt`
- 明确生效区间和合法性约束。
- 明确 `Phase 1` 的实施范围与暂不纳入范围。
- 更新 `4.3.6` 备注为可执行描述。

### 备注

- 本次仅完善设计文档，不改代码。

## 2026-03-19 17:08:00 +08:00

### 本次目标

实现 `4.3.6 账号角色生效时间` 的第一阶段闭环。

### 主要改动

- 在 `AccountRole` 模型上新增：
  - `effectiveAt`
  - `expiresAt`
- 为 `AssignAccountRole` 增加时间窗口参数与合法性校验。
- 将以下读取逻辑收敛为“只返回当前有效角色绑定”：
  - `findRolesForAccountId`
  - `findAccountRoles`
  - `findRoleAccounts`
  - `ListAccountRoles`
  - `GetAccountRoleSelection`
- 将 `4.3.2` 和 `4.3.6` 的文档状态与检查时间同步更新。

### 兼容性影响

- 未来生效或已过期的账号角色绑定，不再出现在当前角色读取结果中。
- `AssignAccountRole` 现在会校验 `effectiveAt < expiresAt`。

### 验证结果

- 待本次代码构建验证完成后补充。
## 2026-03-19 17:18:00 +08:00

### 本次目标

完成 `4.3.6 账号角色生效时间` 分片的构建验证，并补全本次实现记录。

### 主要改动

- 完成 `permission-service` 编译验证。
- 确认以下命令通过：
  - `pnpm --filter permission-service prisma:generate`
  - `pnpm proto:gen`
  - `pnpm --filter @oes/common build`
  - `pnpm --filter permission-service build`

### 备注

- `4.3.6` 当前已形成第一阶段闭环：
  - `AssignAccountRole` 支持可选 `effectiveAt/expiresAt`
  - 当前有效角色读取逻辑已按时间窗口过滤
- 本次未执行数据库迁移，仅完成 schema 调整后的 Prisma Client 生成与编译验证。
