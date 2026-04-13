# Permission Management API

## 1. 组定位

本组接口用于权限管理后台读取和维护全局 `Permission` / `Role` 主数据。

当前状态：

- `permission` 组首批接口已完成 Gateway HTTP → permission-service gRPC 真实联调验证
- `role` 组首批接口已完成 Gateway HTTP → permission-service gRPC 真实联调验证
- `role-template` 组首批接口已完成 Gateway HTTP → permission-service gRPC 真实联调验证
- `account-role` 组首批接口已完成 Gateway HTTP → permission-service gRPC 真实联调验证
- 已验证系统管理员账号可完成 permission / role / role-template / account-role 的首批管理闭环
- 本组接口依赖 Gateway 全局 `checkPermission` guard，guard 会携带 `api-gateway` 内部服务 metadata 调用 permission-service

当前这组接口不是 BFF 编排，而是：

- 平台管理薄代理
- 面向系统管理员 / 权限管理员
- 少量只读字典查询对租户管理员开放

## 2. 当前已冻结的 `permission` 组边界

### `GET /permission`

- 用途：读取全局权限字典列表，并支持基础过滤
- 使用人：
  - 系统管理员
  - 租户管理员（仅全局只读字典可见）
- 权限控制：
  - `checkPermission(permission.list)`
- 不采用：
  - `buildQueryScope`
  - `checkResource`

支持的过滤参数：

- `module`
- `keyword`
- `page`
- `pageSize`

响应语义：

- 返回分页结构：`permissions / total / page / pageSize`
- `permissions[]` 为全局 permission 摘要
- 前端管理表格应使用 `total / page / pageSize` 驱动分页

### `POST /permission`

- 用途：创建全局权限字典项
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.create)`

### `GET /permission/:code`

- 用途：读取单个全局权限字典详情
- 使用人：
  - 系统管理员
  - 租户管理员（只读）
- 权限控制：
  - `checkPermission(permission.get_by_code)`

### `GET /permission/id/:id`

- 用途：按 ID 读取单个全局权限字典详情
- 使用人：
  - 系统管理员
  - 租户管理员（只读）
- 权限控制：
  - `checkPermission(permission.get_by_id)`
- 不采用：
  - `buildQueryScope`
  - `checkResource`

### `PATCH /permission/:id`

- 用途：修改全局权限字典项的可变元数据
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.update)`
- 可修改字段：
  - `module`
  - `description`
- 不允许修改：
  - `code`
- 不采用：
  - `buildQueryScope`
  - `checkResource`

### `GET /permission/:id/roles`

- 用途：查看当前引用该 permission 的角色
- 使用人：
  - 系统管理员
  - 租户管理员（只读）
- 权限控制：
  - `checkPermission(permission.role.list)`
- 说明：
  - 这是权限详情页的辅助信息，真相来自 `permission-service.ListPermissionRoles`
  - 当前不在 Gateway 层做额外 `buildQueryScope`，角色可见性由下游 permission-service 管理语义约束

### `DELETE /permission/:id`

- 用途：删除全局权限字典项
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.delete)`

## 3. 当前已冻结的 `role` 组边界

### `GET /role`

- 用途：读取 role instance 分页列表，并支持基础过滤
- 使用人：
  - 系统管理员
  - 租户管理员（仅租户范围 role instance）
- 权限控制：
  - `checkPermission(permission.role.list)`
- 支持的过滤参数：
  - `page`
  - `pageSize`
  - `tenantId`
  - `scopeLevel`: `SYSTEM` 或 `TENANT`
  - `keyword`
- 响应语义：
  - 返回分页结构：`roles / total / page / pageSize`
  - 系统管理员可通过 `scopeLevel=SYSTEM` 查看系统级 role instance
  - 租户管理员的可见范围由下游 permission-service 的 operator scope 约束
  - 返回项为标准 `RoleResponse`
  - 列表页可直接使用 `id / name / code / isEnabled / tenantId / roleKind / templateRoleId`

### `POST /role`

- 用途：创建 system 或 tenant role instance
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.create)`
- 请求字段：
  - `name`
  - `code`
  - `scopeLevel`: `SYSTEM` 或 `TENANT`
  - `tenantId`: tenant role 必填，system role 不传
  - `templateRoleId`: 可选
  - `description`: 可选
- 使用建议：
  - 新建 role instance 页直接使用该接口
  - 若创建 tenant role，前端应显式传入 `tenantId`
  - 若创建 system role，前端不应传 `tenantId`
  - 若页面是“从模板派生 tenant role”，前端优先改用 `POST /role-template/:id/instantiate`

### `GET /role/:id`

- 用途：读取单个 role instance 详情
- 使用人：
  - 系统管理员
  - 租户管理员（仅其租户范围）
- 权限控制：
  - `checkPermission(permission.role.get_by_id)`
- 响应语义：
  - 返回单个标准 `RoleResponse`
  - 适合作为详情页、编辑页、权限页的基础初始化接口

### `PATCH /role/:id`

- 用途：修改 role instance 的可变元数据
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.update)`
- 可修改字段：
  - `name`
  - `description`
- 不允许修改：
  - `code`
  - `scopeLevel`
  - `tenantId`
- 使用建议：
  - 只用于编辑 role 的可变元数据
  - 如果页面在做启停切换，不应复用该接口，而应调用 `PATCH /role/:id/enabled`

### `PATCH /role/:id/enabled`

- 用途：启用或禁用 role instance
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.update)`
- 请求字段：
  - `isEnabled`
- 使用建议：
  - 这是列表页和详情页的启用 / 禁用专用入口
  - 前端不应通过 `PATCH /role/:id` 间接表达启停

### `GET /role/:id/permissions`

- 用途：读取 role instance 当前拥有的 permission 列表
- 使用人：
  - 系统管理员
  - 租户管理员（仅其租户范围）
- 权限控制：
  - `checkPermission(permission.role.get_by_id)`
- 响应语义：
  - 返回结构：`permissions[]`
  - 当前返回的是全局 permission 摘要，不带分页
  - 适合作为 role 权限详情页或分配弹窗的已选状态来源

### `POST /role/:id/permissions`

- 用途：向 role instance 分配一个 permission
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.update)`
- 请求字段：
  - `permissionId`
- 使用建议：
  - 适合单条分配
  - 若后续页面需要“全量替换角色权限集合”，当前 contract 还没有对应批量接口

### `DELETE /role/:id/permissions/:permissionId`

- 用途：从 role instance 撤销一个 permission
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.update)`
- 使用建议：
  - 适合单条撤销
  - 当前不承接批量撤销或整页全量替换

### `DELETE /role/:id`

- 用途：删除 role instance
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.delete_by_id)`
- 使用建议：
  - 删除前前端可先用 `GET /role/:id/permissions` 和 `GET /role/:id/accounts` 做影响面提示

## 4. 当前已冻结的 `role-template` 组边界

### `GET /role-template`

- 用途：读取 role template 分页列表，并支持基础过滤
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.list)`
- 支持的过滤参数：
  - `page`
  - `pageSize`
  - `keyword`
- 响应语义：
  - 返回分页结构：`roles / total / page / pageSize`
  - 返回项为全局 role template，而不是 tenant / system role instance
  - 返回项同样是标准 `RoleResponse`
  - 前端列表页可直接使用 `id / name / code / isEnabled / roleKind`

### `POST /role-template`

- 用途：创建全局 role template
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.create)`
- 使用建议：
  - 模板创建页直接使用该接口
  - 这是“全局模板”入口，不应传 `tenantId`

### `GET /role-template/:id`

- 用途：读取单个 role template 详情
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.get_by_id)`
- 响应语义：
  - 返回单个标准 `RoleResponse`
  - 适合作为模板详情页、编辑页、模板权限页的初始化接口

### `PATCH /role-template/:id`

- 用途：修改 role template 的可变元数据
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.update)`
- 可修改字段：
  - `name`
  - `description`
- 使用建议：
  - 只用于模板元数据编辑
  - 启停切换应走 `PATCH /role-template/:id/enabled`

### `PATCH /role-template/:id/enabled`

- 用途：启用或禁用 role template
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.update)`
- 使用建议：
  - 这是模板列表页和模板详情页的启停专用入口

### `GET /role-template/:id/permissions`

- 用途：读取 role template 当前拥有的 permission 列表
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.get_by_id)`
- 响应语义：
  - 返回结构：`permissions[]`
  - 当前返回的是模板当前继承给实例化角色的 permission 集合

### `POST /role-template/:id/permissions`

- 用途：向 role template 分配一个 permission
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.update)`
- 使用建议：
  - 适合模板权限详情页中的单条分配动作

### `DELETE /role-template/:id/permissions/:permissionId`

- 用途：从 role template 撤销一个 permission
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.update)`
- 使用建议：
  - 适合模板权限详情页中的单条撤销动作

### `POST /role-template/:id/instantiate`

- 用途：从 role template 创建一个 tenant role instance
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.create)`
- 说明：
  - 当前实例化目标是 tenant role instance，因此 `tenantId` 必填
  - 模板上的 permissions 会复制到新建的 role instance
  - 前端若提供“从模板创建租户角色”入口，应优先用该接口，而不是先读模板再手工调 `POST /role`

### `DELETE /role-template/:id`

- 用途：删除 role template
- 使用人：
  - 系统管理员 / 权限管理员
- 权限控制：
  - `checkPermission(permission.role.delete_by_id)`
- 使用建议：
  - 删除前前端可先用 `GET /role-template/:id/permissions` 做影响面提示

## 5. `role` / `role-template` 页面接入建议

### 5.1 Role Instance 列表页

- 页面目标：查看和筛选 system / tenant role instance
- 推荐列表初始化：
  - system role 列表：`GET /role?scopeLevel=SYSTEM`
  - tenant role 列表：`GET /role?scopeLevel=TENANT&tenantId=:tenantId`
- 推荐筛选参数：
  - `keyword`
  - `page`
  - `pageSize`
- 前端不应假设：
  - 一个列表同时天然混合 system / tenant 数据且无需显式区分

### 5.2 Role Instance 新建 / 编辑页

- 新建页：
  - system role：`POST /role`，传 `scopeLevel=SYSTEM`
  - tenant role：`POST /role`，传 `scopeLevel=TENANT + tenantId`
- 编辑页初始化：
  - `GET /role/:id`
- 编辑页保存：
  - `PATCH /role/:id`
- 启停：
  - `PATCH /role/:id/enabled`
- 不推荐：
  - 用编辑接口同时承载启停
  - 用模板实例化接口去创建 system role

### 5.3 Role Permission 页

- 页面目标：查看和维护某个 role instance 拥有的 permission
- 推荐初始化：
  - `GET /role/:id`
  - `GET /role/:id/permissions`
- 单条分配：
  - `POST /role/:id/permissions`
- 单条撤销：
  - `DELETE /role/:id/permissions/:permissionId`
- 当前边界：
  - 还没有批量替换整组 permissions 的接口
  - 前端若做多选分配，需要自己编排多次单条提交

### 5.4 Role Template 列表 / 详情页

- 页面目标：管理全局 role template
- 列表初始化：
  - `GET /role-template`
- 详情 / 编辑初始化：
  - `GET /role-template/:id`
- 保存元数据：
  - `PATCH /role-template/:id`
- 启停：
  - `PATCH /role-template/:id/enabled`

### 5.5 Role Template Permission 页

- 页面目标：查看和维护模板自带的 permissions
- 推荐初始化：
  - `GET /role-template/:id`
  - `GET /role-template/:id/permissions`
- 单条分配：
  - `POST /role-template/:id/permissions`
- 单条撤销：
  - `DELETE /role-template/:id/permissions/:permissionId`
- 当前边界：
  - 还没有模板权限的批量替换接口

### 5.6 从模板实例化 Tenant Role

- 页面目标：基于模板快速创建某个 tenant 的 role instance
- 推荐流程：
  - 先在模板列表或详情页选择模板
  - 明确目标 `tenantId`
  - 调 `POST /role-template/:id/instantiate`
- 当前适合输入：
  - `tenantId`
  - 可选覆盖的 `name / code / description`
- 当前不适合：
  - 用它创建 system role
  - 用它替代模板本身的编辑

## 6. 当前已冻结的 `account-role` 组边界

### `GET /account/:accountId/roles`

- 用途：读取某个账号当前生效的 role 绑定列表
- 使用人：
  - 系统管理员
  - 租户管理员（仅其租户范围）
- 权限控制：
  - `checkPermission(permission.account.get_roles)`
- 支持的过滤参数：
  - `tenantId`
  - `scopeLevel`: `SYSTEM` 或 `TENANT`
- 响应语义：
  - 返回结构：`roles[]`
  - 仅返回当前有效 role，不返回历史过期绑定
  - 返回项为标准 `RoleResponse`
  - 前端可直接用 `id / name / code / isEnabled / tenantId / roleKind / templateRoleId` 做展示与编辑态回显

### `GET /account/:accountId/roles/selection`

- 用途：读取账号角色设置页所需的“可分配角色 + 已选角色”
- 使用人：
  - 系统管理员
  - 租户管理员（仅其租户范围）
- 权限控制：
  - `checkPermission(permission.account.get_roles)`
- 支持的过滤参数：
  - `tenantId`
  - `scopeLevel`: `SYSTEM` 或 `TENANT`
- 响应语义：
  - 返回结构：`availableRoles[] + selectedRoleIds[]`
  - 面向 checkbox / dual-list 这类账号角色设置页面
  - `availableRoles[]` 是当前操作者在该 scope 下“允许分配”的候选 role
  - `selectedRoleIds[]` 是该账号当前已经生效的 role id 集合
  - 前端应优先使用该接口初始化“角色设置页”，而不是自己拼装 `GET /role` + `GET /account/:accountId/roles`

### `POST /account/:accountId/roles`

- 用途：给某个账号增量授予一个 role instance
- 使用人：
  - 系统管理员
  - 租户管理员（仅其租户范围）
- 权限控制：
  - `checkPermission(permission.account.assign_roles)`
- 请求字段：
  - `accountType`: `USER` 或 `SERVICE`
  - `roleId`
  - `scopeLevel`: `SYSTEM` 或 `TENANT`
  - `tenantId`: tenant 绑定时填写，system 绑定时不传
  - `effectiveAt`: 可选
  - `expiresAt`: 可选
- 使用建议：
  - 只适合“单个授予”动作，例如详情页里的“补授一个角色”
  - 如果页面本身是 checkbox 全量编辑，前端应优先改用 `PUT /account/:accountId/roles`

### `DELETE /account/:accountId/roles/:roleId`

- 用途：撤销某个账号上的一个 role instance 绑定
- 使用人：
  - 系统管理员
  - 租户管理员（仅其租户范围）
- 权限控制：
  - `checkPermission(permission.account.assign_roles)`
- 使用建议：
  - 只适合“单个撤销”动作
  - checkbox 全量编辑页保存时，前端不应逐个调 delete，而应统一调 `PUT /account/:accountId/roles`

### `PUT /account/:accountId/roles`

- 用途：按 scope 一次性替换某个账号的角色集合
- 使用人：
  - 系统管理员
  - 租户管理员（仅其租户范围）
- 权限控制：
  - `checkPermission(permission.account.assign_roles)`
- 请求字段：
  - `accountType`: `USER` 或 `SERVICE`
  - `scopeLevel`: `SYSTEM` 或 `TENANT`
  - `tenantId`: tenant 绑定时填写，system 绑定时不传
  - `roleIds[]`
- 说明：
  - 这是账号角色设置页的主保存入口
  - 当前为“全量替换”语义，不是增量 patch
  - 建议前端把当前勾选结果完整映射到 `roleIds[]` 后一次提交
  - 若当前编辑的是 tenant 账号角色页，应固定传入 `scopeLevel = TENANT` 与对应 `tenantId`
  - 若当前编辑的是系统账号角色页，应固定传入 `scopeLevel = SYSTEM` 且不传 `tenantId`

### `GET /role/:roleId/accounts`

- 用途：读取当前引用某个 role instance 的账号绑定列表
- 使用人：
  - 系统管理员
  - 租户管理员（仅其租户范围）
- 权限控制：
  - `checkPermission(permission.account.get_roles)`
- 响应语义：
  - 返回结构：`accounts[]`
  - 返回项包含 `accountId / accountType / roleId / tenantId / scopeLevel`
  - 当前返回的是绑定摘要，不是账号详情；如果前端后续需要展示昵称/邮箱，应由账号管理场景补充对应查询接口

## 7. `account-role` 页面接入建议

### 7.1 账号角色设置页

- 页面目标：编辑“某个账号在某个 scope 下拥有哪些角色”
- 推荐初始化顺序：
  - 先拿到目标 `accountId`
  - 明确当前编辑上下文是 `SYSTEM` 还是 `TENANT`
  - 若是 tenant 页面，同时明确 `tenantId`
  - 调 `GET /account/:accountId/roles/selection`
- 推荐保存顺序：
  - 用户修改勾选结果
  - 前端将最终勾选项汇总为 `roleIds[]`
  - 调 `PUT /account/:accountId/roles`
- 不推荐：
  - 初始化时前端自己拼 `GET /role` 和 `GET /account/:accountId/roles`
  - 保存时前端逐个 `POST` / `DELETE` 进行差量同步

### 7.2 角色详情成员页

- 页面目标：查看“某个 role 当前被哪些账号绑定”
- 推荐接口：
  - `GET /role/:roleId/accounts`
- 当前适合的展示：
  - 绑定数量
  - `accountId`
  - `accountType`
  - `tenantId`
  - `scopeLevel`
- 当前不应假设：
  - 返回账号 display name
  - 返回邮箱 / 手机 / 头像
  - 返回用户实体完整资料

### 7.3 前端参数约束

- `scopeLevel = TENANT` 时：
  - 前端应传 `tenantId`
  - 页面语义是“编辑该 tenant 下的账号角色”
- `scopeLevel = SYSTEM` 时：
  - 前端不传 `tenantId`
  - 页面语义是“编辑系统账号的系统角色”
- `accountType` 当前只允许：
  - `USER`
  - `SERVICE`
- `effectiveAt / expiresAt` 当前只在单次授予接口 `POST /account/:accountId/roles` 生效
- `PUT /account/:accountId/roles` 当前不承接时间窗口编辑

## 8. 已删除或不推荐的兼容接口

以下旧接口已被统一列表入口吸收，不再作为长期契约保留：

- `GET /permission/all`
- `GET /permission/by-module`

## 9. 真相源

- Gateway controller：
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/controllers/permission.controller.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/controllers/permission.controller.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/controllers/role.controller.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/controllers/role.controller.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/controllers/role-template.controller.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/controllers/role-template.controller.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/controllers/account-role.controller.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/controllers/account-role.controller.ts)
- Gateway DTO：
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/create-permission.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/create-permission.dto.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/update-permission.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/update-permission.dto.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/list-permissions.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/list-permissions.dto.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/create-role.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/create-role.dto.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/update-role.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/update-role.dto.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/list-roles.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/list-roles.dto.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/set-role-enabled.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/set-role-enabled.dto.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/role-permission.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/role-permission.dto.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/create-role-template.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/create-role-template.dto.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/list-role-templates.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/list-role-templates.dto.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/create-role-from-template.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/create-role-from-template.dto.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/list-account-roles.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/list-account-roles.dto.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/assign-account-role.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/assign-account-role.dto.ts)
  - [/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/set-account-roles.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/permission-service/interface/http/dtos/set-account-roles.dto.ts)
- 下游 proto：
  - [/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/permission_management.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/permission_management.proto)
- 下游设计：
  - [/Users/acehood/Documents/GitHub/oes/src/services/system/permission-service/doc/design/permission-management.md](/Users/acehood/Documents/GitHub/oes/src/services/system/permission-service/doc/design/permission-management.md)

## 10. 前端页面建议

系统管理员 Permission 管理页首批可直接使用：

- `GET /permission`：表格列表和搜索
- `GET /permission/id/:id`：详情 / 编辑初始化
- `GET /permission/:code`：按 code 快速定位
- `PATCH /permission/:id`：编辑 `module / description`
- `DELETE /permission/:id`：删除
- `GET /permission/:id/roles`：删除前影响面提示或详情页引用信息

按钮级权限建议：

- 创建按钮：`permission.create`
- 编辑按钮：`permission.update`
- 删除按钮：`permission.delete`
- 查看列表：`permission.list`
- 查看详情：`permission.get_by_id` 或 `permission.get_by_code`

系统管理员 Role 管理页首批可直接使用：

- `GET /role`：表格列表和搜索
- `POST /role`：创建 system / tenant role instance
- `GET /role/:id`：详情 / 编辑初始化
- `PATCH /role/:id`：编辑 `name / description`
- `PATCH /role/:id/enabled`：启用 / 禁用
- `GET /role/:id/permissions`：角色权限详情
- `POST /role/:id/permissions`：分配 permission
- `DELETE /role/:id/permissions/:permissionId`：撤销 permission
- `DELETE /role/:id`：删除

按钮级权限建议：

- 创建按钮：`permission.role.create`
- 编辑按钮：`permission.role.update`
- 启用 / 禁用按钮：`permission.role.update`
- 删除按钮：`permission.role.delete_by_id`
- 查看列表：`permission.role.list`
- 查看详情：`permission.role.get_by_id`
- 分配 / 撤销 permission：`permission.role.update`

系统管理员 Role Template 管理页首批可直接使用：

- `GET /role-template`：模板表格列表和搜索
- `POST /role-template`：创建模板
- `GET /role-template/:id`：详情 / 编辑初始化
- `PATCH /role-template/:id`：编辑 `name / description`
- `PATCH /role-template/:id/enabled`：启用 / 禁用
- `GET /role-template/:id/permissions`：模板权限详情
- `POST /role-template/:id/permissions`：分配 permission
- `DELETE /role-template/:id/permissions/:permissionId`：撤销 permission
- `POST /role-template/:id/instantiate`：实例化 tenant role
- `DELETE /role-template/:id`：删除模板

按钮级权限建议：

- 创建模板按钮：`permission.role.create`
- 编辑模板按钮：`permission.role.update`
- 启用 / 禁用按钮：`permission.role.update`
- 删除模板按钮：`permission.role.delete_by_id`
- 查看模板列表：`permission.role.list`
- 查看模板详情：`permission.role.get_by_id`
- 模板分配 / 撤销 permission：`permission.role.update`
- 实例化按钮：`permission.role.create`

系统管理员 / 租户管理员账号角色设置页首批可直接使用：

- `GET /account/:accountId/roles`：当前生效角色列表
- `GET /account/:accountId/roles/selection`：角色选择页初始化
- `POST /account/:accountId/roles`：增量授予一个角色
- `DELETE /account/:accountId/roles/:roleId`：撤销一个角色
- `PUT /account/:accountId/roles`：整页保存角色集合
- `GET /role/:roleId/accounts`：角色详情页查看成员账号

按钮级权限建议：

- 查看账号角色：`permission.account.get_roles`
- 打开角色选择页：`permission.account.get_roles`
- 增量授予 / 撤销角色：`permission.account.assign_roles`
- 整页保存角色集合：`permission.account.assign_roles`

## 11. 验证记录

已完成验证：

- `pnpm --filter @oes/common build`
- `pnpm --filter api-gateway build`
- `pnpm --filter api-gateway exec jest --runInBand src/common/guards/gateway-permission.guard.spec.ts src/modules/permission-service/interface/http/controllers/permission.controller.spec.ts`
- `pnpm --filter permission-service build`
- `pnpm --filter permission-service exec jest --config jest.config.js --runInBand test/l1/role-scope-boundary.spec.ts test/l1/authorization-query-scope.service.spec.ts test/l1/role-permission.handlers.spec.ts`
- `pnpm --filter api-gateway exec jest --runInBand src/modules/permission-service/interface/http/controllers/role.controller.spec.ts src/modules/permission-service/interface/http/controllers/permission.controller.spec.ts`
- `pnpm --filter api-gateway exec jest --runInBand src/modules/permission-service/interface/http/controllers/role-template.controller.spec.ts src/modules/permission-service/interface/http/controllers/role.controller.spec.ts src/modules/permission-service/interface/http/controllers/permission.controller.spec.ts`
- `pnpm --filter api-gateway exec jest --runInBand src/modules/permission-service/interface/http/controllers/account-role.controller.spec.ts src/modules/permission-service/interface/http/controllers/role-template.controller.spec.ts src/modules/permission-service/interface/http/controllers/role.controller.spec.ts src/modules/permission-service/interface/http/controllers/permission.controller.spec.ts`
- 真实 HTTP 联调：
  - `POST /auth/login`
  - `POST /auth/account-selection`
  - `GET /permission?page=1&pageSize=5&keyword=permission`
  - `POST /permission`
  - `GET /permission/:code`
  - `GET /permission/id/:id`
  - `PATCH /permission/:id`
  - `GET /permission/:id/roles`
  - `DELETE /permission/:id`
  - `GET /role?page=1&pageSize=5&scopeLevel=SYSTEM`
  - `POST /role`
  - `GET /role/:id`
  - `PATCH /role/:id`
  - `PATCH /role/:id/enabled`
  - `POST /role/:id/permissions`
  - `GET /role/:id/permissions`
  - `DELETE /role/:id/permissions/:permissionId`
  - `DELETE /role/:id`
  - `GET /role-template?page=1&pageSize=5&keyword=TEMPLATE`
  - `POST /role-template`
  - `GET /role-template/:id`
  - `PATCH /role-template/:id`
  - `PATCH /role-template/:id/enabled`
  - `POST /role-template/:id/permissions`
  - `GET /role-template/:id/permissions`
  - `POST /role-template/:id/instantiate`
  - `DELETE /role-template/:id/permissions/:permissionId`
  - `DELETE /role-template/:id`
  - `GET /account/:accountId/roles?tenantId=:tenantId&scopeLevel=TENANT`
  - `GET /account/:accountId/roles/selection?tenantId=:tenantId&scopeLevel=TENANT`
  - `POST /account/:accountId/roles`
  - `PUT /account/:accountId/roles`
  - `DELETE /account/:accountId/roles/:roleId`
  - `GET /role/:roleId/accounts`
