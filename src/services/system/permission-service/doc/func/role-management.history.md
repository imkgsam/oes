# 角色管理历史

## 2026-03-15 10:12:00 +08:00

### 本次目标

建立角色管理功能文档，并记录 `4.2` 已完成的 P0 基础能力。

### 主要改动

- 建立角色管理主文档与历史文档。
- 记录 `4.2.1-4.2.10` 的实现状态与设计约束。

## 2026-03-19 15:41:00 +08:00

### 本次目标

实现 `4.2.11 角色列表分页与过滤`。

### 主要改动

- 将分页角色列表按资源类型拆为两条独立接口：
  - `ListRoleInstances`
  - `ListRoleTemplates`
- 统一采用 `page/pageSize` 分页。
- `ListRoleInstances` 支持：
  - 可选 `tenantId`
  - 可选 `keyword`
- `ListRoleTemplates` 支持：
  - 可选 `keyword`
- 保留原 `ListRoles` 作为兼容入口，不在本次删除。
- 将 `4.2.11` 状态更新为 `已实现`，补充最后检查时间。

### 兼容性影响

- 新增分页接口，不破坏现有 `ListRoles` 调用。
- 当前不包含 `isEnabled` 过滤，后续若需要可作为增强项补充。

### 验证结果

- `pnpm proto:gen` 通过。
- `pnpm --filter @oes/common build` 通过。
- `pnpm --filter permission-service build` 通过。

## 2026-03-19 16:09:00 +08:00

### 本次目标

将 `4.2` 功能清单按 `角色实例` 和 `角色模板` 拆成两张表，降低阅读和维护成本。

### 主要改动

- 将原单张 `4.2` 功能清单拆为：
  - `角色实例功能清单`
  - `角色模板功能清单`
- 保留原功能编号不变，不影响后续引用。

### 备注

- 本次仅调整文档结构，不改代码。

## 2026-03-19 16:14:00 +08:00

### 本次目标

将模板相关的模糊功能项拆解成具体功能项，避免继续使用集合型描述。

### 主要改动

- 将“系统模板角色管理”拆解为具体功能项：
  - 查看模板角色详情
  - 查看模板角色列表
  - 创建模板角色
  - 修改模板角色基础资料
  - 删除模板角色
  - 启用/停用模板角色
  - 查看模板角色持有权限
  - 为模板角色添加权限
  - 为模板角色移除权限
- 保留“基于模板创建租户角色实例”和“租户实例权限自定义”作为后续独立功能项。
- 同步顺延模板相关编号到 `4.2.23`。

### 备注

- 本次仅调整文档结构，不改代码。

## 2026-03-19 16:18:00 +08:00

### 本次目标

清理 `4.2` 文档中残留的过时范围描述，确保两张表的信息一致。

### 主要改动

- 更新文档顶部更新时间。
- 将“角色分类说明”中的模板区编号范围从旧的 `4.2.13-4.2.15` 修正为 `4.2.13-4.2.23`。

### 备注

- 本次仅修正文档中的残留过时描述，不改代码。

## 2026-03-19 16:31:00 +08:00

### 本次目标

实现 `4.2.13-4.2.20` 的模板专属接口与能力。

### 主要改动

- 新增模板专属接口：
  - `GetRoleTemplateById`
  - `UpdateRoleTemplate`
  - `DeleteRoleTemplate`
  - `SetRoleTemplateEnabled`
  - `ListRoleTemplatePermissions`
  - `AssignRoleTemplatePermission`
- 复用现有 `Role` / `RolePermission` 模型，在应用层强制校验 `role.kind = SYSTEM_TEMPLATE`。
- 为模板删除新增保护：
  - 若模板仍有派生实例
  - 或仍绑定权限
  - 则拒绝删除
- 将 `4.2.13-4.2.20` 状态更新为已实现并补检查时间。

### 兼容性影响

- 新增模板专属接口，不破坏旧通用角色接口。
- 模板相关调用后续应优先迁移到模板专属接口。

### 验证结果

- `pnpm proto:gen` 通过。
- `pnpm --filter @oes/common build` 通过。
- `pnpm --filter permission-service build` 通过。

## 2026-03-19 16:46:00 +08:00

### 本次目标

实现 `4.2.21-4.2.22`，并将 `4.2.23` 明确下调为 `P2`。

### 主要改动

- 新增 `RevokeRoleTemplatePermission` 接口与实现。
- 新增 `CreateRoleInstanceFromTemplate` 接口与实现。
- `CreateRoleInstanceFromTemplate` 会：
  - 校验模板存在
  - 复制模板当前权限
  - 允许覆盖实例的 `name/code/description`
- 将 `4.2.21`、`4.2.22` 更新为已实现。
- 将 `4.2.23` 下调为 `P2`，并保留为未开始状态。

### 兼容性影响

- 新增模板专属接口，不破坏已有实例创建入口。
- `4.2.22` 现在有了明确的模板实例化入口，后续应优先使用该接口，而不是继续依赖 `CreateRoleInstance + templateRoleId` 的隐含能力。

### 验证结果

- `pnpm proto:gen` 通过。
- `pnpm --filter @oes/common build` 通过。
- `pnpm --filter permission-service build` 通过。

## 2026-03-19 15:48:00 +08:00

### 本次目标

在角色管理文档中明确区分 `角色实例` 与 `角色模板`。

### 主要改动

- 新增“角色分类说明”章节。
- 将 `4.2.1-4.2.12` 的功能项名称统一改为面向 `角色实例` 的表述。
- 明确 `4.2.13-4.2.15` 属于 `角色模板 / 模板派生实例` 范围。

### 备注

- 本次仅调整文档表达，不改代码。

## 2026-03-19 15:51:00 +08:00

### 本次目标

继续收敛 `4.2` 功能清单备注，明确每项到底面向 `角色实例` 还是 `角色模板`。

### 主要改动

- 为 `4.2.1-4.2.12` 的备注补充“仅面向实例”的范围说明。
- 为 `4.2.13-4.2.15` 的备注补充“模板能力 / 模板派生能力”的范围说明。
- 在 `4.2.11` 中补充当前操作者边界的目标语义说明。

### 备注

- 本次仅调整文档表达，不改代码。

## 2026-03-19 16:03:00 +08:00

### 本次目标

将角色创建接口按模板/实例拆分，并保留旧 `CreateRole` 作为兼容入口。

### 主要改动

- 新增 `CreateRoleTemplate` 接口与实现。
- 新增 `CreateRoleInstance` 接口与实现。
- `CreateRoleInstance` 支持可选 `templateRoleId`，若传模板则复制模板当前权限。
- 为角色仓储新增按 `scopeKey + code` 查询能力，避免继续使用全局 `code` 冲突判断。
- 旧 `CreateRole` 在 controller 中标记为 `OUTDATED` 兼容入口。
- 更新 `4.2.3`、`4.2.13`、`4.2.14` 的状态与备注。

### 兼容性影响

- 新增两个更明确的创建接口，不破坏旧 `CreateRole`。
- 后续调用方应逐步迁移到新接口。

### 验证结果

- `pnpm proto:gen` 通过。
- `pnpm --filter @oes/common build` 通过。
- `pnpm --filter permission-service build` 通过。

## 2026-03-20 13:32:00 +08:00

### 本次目标

清理旧的 `CreateRole` 兼容链路，避免继续保留模板/实例拆分前的模糊创建入口。

### 主要改动

- 从 proto 中删除：
  - `CreateRole`
  - `CreateRoleRequest`
- 从 common contract 中删除 `createRole(...)`
- 从 `permission-management.grpc.controller.ts` 中删除旧的 `createRole(...)`
- 删除 `CreateRoleCommand / CreateRoleHandler`
- 删除 `api-gateway` 中对应的旧包装方法
- 删除 `api-gateway` 旧的 `CreateRoleDto`
- 删除 `api-gateway` 旧的 `POST /role` 入口

### 备注

- 角色创建现在只保留明确入口：
  - `CreateRoleTemplate`
  - `CreateRoleInstance`
  - `CreateRoleInstanceFromTemplate`
- 这是 breaking change，旧创建入口不再可调用
