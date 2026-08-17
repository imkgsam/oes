# hr-service Query API

> `hr-service` 的服务设计唯一真相源是 [hr-service.md](../../architecture/services/hr-service.md)。本文只描述 query contract，不重新定义 `Employee`、`Employment`、员工生命周期或正式 `人 -> org` 归属。

## 1. 模块职责

`HrQueryService` 负责提供 HR 真相的只读查询能力，不修改状态。

适用场景：

- 按 `tenantId` 分页查询员工目录
- 按 `employeeId` 查询员工摘要
- 按 `tenantPartyId` 查询是否已形成员工主档
- 按 `tenantId + employeeCode` 精确解析 active employee 与当前 active employment
- 查询当前 active employment
- 查询员工任职摘要供 BFF、审批或业务服务消费

## 2. 查询 contract 规则

- `Employee / Employment` 的对象语义、主引用与生命周期以 [hr-service.md](../../architecture/services/hr-service.md) 为准；本 contract 只记录当前查询字段与调用约束。
- `Tenant / OrgUnit / org tree` 边界以 [tenant-org-service.md](../../architecture/services/tenant-org-service.md) 为准；本文不重新定义组织树 owner。
- 读取 account 视角 org 数据时，调用方应优先消费 HR 摘要或其派生投影，而不是 legacy membership owner。

## 3. 最小查询面

### `ListEmployees`

- 作用：按 `tenantId` 分页查询当前租户员工目录
- 请求关键字段：
  - `tenant_id`
  - optional `keyword`
  - optional `lifecycle_status`
  - `page`
  - `page_size`
- 当前 tenant 语义：
  - 该查询入口显式要求 `tenant_id`
  - runtime 只返回目标 `tenant_id` 下的 Employee 主档摘要，不跨 tenant 混查
  - 该接口只返回 Employee 主档，不直接聚合 account binding、onboarding access 或 org tree owner 数据
- 响应关键字段：
  - `items[].id`
  - `items[].tenant_id`
  - `items[].tenant_party_id`
  - `items[].employee_code`
  - `items[].lifecycle_status`
  - optional `items[].official_photo_url`
  - `page`
  - `page_size`
  - `total`
- 公开头像语义：
  - `official_photo_url` 来自 HR Employee 公开展示头像字段，用于员工数字名片和公开展示页面
  - 该字段为空表示未配置员工公开展示头像
  - 该字段不得由账号头像、个人中心头像或 account profile avatar 补齐

### `GetEmployeeById`

- 作用：按 `employeeId` 查询员工摘要
- 请求关键字段：
  - `employee_id`
- 当前 tenant 语义：
  - 当前 proto / runtime 不接受独立 tenant context
  - runtime 只能按 `employee_id` 查询并返回该 Employee 自身的 `tenant_id`
  - 调用方如需 tenant-scoped access control，必须在上游或未来 tenant-aware query contract 中完成
- 响应关键字段：
  - `employee.id`
  - `employee.tenant_id`
  - `employee.tenant_party_id`
  - `employee.employee_code`
  - `employee.lifecycle_status`
  - optional `employee.official_photo_asset_id`
  - optional `employee.official_photo_url`
- 公开头像语义：
  - `official_photo_asset_id` 是 HR 保存的员工公开展示头像资产引用
  - `official_photo_url` 是 HR 查询摘要可返回的展示 URL
  - 若 `official_photo_url` 为空，调用方必须展示正式占位，不得回退到账号头像

### `GetEmployeeByTenantPartyId`

- 作用：按 `tenantId + tenantPartyId` 查询员工摘要
- 请求关键字段：
  - `tenant_id`
  - `tenant_party_id`

### `ResolveActiveEmployeeByCode`

- 作用：按 `tenantId + employeeCode` 精确解析当前可工作的员工事实
- 使用场景：
  - `auth-service` 在 `EMPLOYEE_CODE_PIN` 现场终端登录中消费 HR 真相
  - 需要用租户内员工编号确认员工仍为 active 且存在当前 active employment
- 请求关键字段：
  - `tenant_id`
  - `employee_code`
- 当前 tenant 语义：
  - 该查询入口显式要求 `tenant_id`
  - runtime 只在目标 `tenant_id` 下精确匹配 `employee_code`
  - 不做模糊搜索，不跨 tenant 查询
- 成功响应关键字段：
  - `employee.id`
  - `employee.tenant_id`
  - `employee.employee_code`
  - `employee.lifecycle_status`
  - optional `employee.official_photo_url`
  - `active_employment.id`
  - `active_employment.employee_id`
  - `active_employment.org_unit_id`
  - `active_employment.status`
  - `active_employment.effective_from`
- 稳定规则：
  - 只有 `Employee.lifecycleStatus = ACTIVE` 且存在当前唯一 active employment 时才返回成功
  - 该 RPC 不返回 account binding、权限、PIN 或认证结果
  - account binding 以 `identity-service` 为准，认证凭据和 session 以 `auth-service` 为准

### `GetActiveEmployment`

- 作用：查询某员工当前唯一 active employment
- 请求关键字段：
  - `employee_id`
- 当前 tenant 语义：
  - 当前 proto / runtime 不接受独立 tenant context
  - runtime 先按 `employee_id` 找到 Employee，再使用 Employee 自身的 `tenant_id` 查询 active employment
  - 调用方如需 tenant mismatch 校验，必须在提供 tenant context 的上游入口或未来 tenant-aware query contract 中完成
- 响应关键字段：
  - `employment.id`
  - `employment.org_unit_id`
  - `employment.status`
  - `employment.effective_from`

### `ListEmployments`

- 作用：查询某员工任职历史摘要
- 请求关键字段：
  - `employee_id`
  - optional `status`
- 当前 tenant 语义：
  - 当前 proto / runtime 不接受独立 tenant context
  - runtime 先按 `employee_id` 找到 Employee，再使用 Employee 自身的 `tenant_id` 查询任职历史
  - 调用方如需 tenant mismatch 校验，必须在提供 tenant context 的上游入口或未来 tenant-aware query contract 中完成

## 4. 主要错误语义

- validation failure
  - 请求关键字段缺失
- not found
  - `employee_id` 或目标员工不存在
  - `tenant_id + employee_code` 未匹配到员工
- inactive employee
  - `ResolveActiveEmployeeByCode` 匹配到员工但员工不是 `ACTIVE`
- active employment not found
  - `ResolveActiveEmployeeByCode` 匹配到 active employee 但不存在当前 active employment
- tenant mismatch
  - 当前仅适用于提供 tenant context 的查询入口，例如 `GetEmployeeByTenantPartyId`
  - `GetEmployeeById`、`GetActiveEmployment`、`ListEmployments` 当前没有请求级或 metadata 级 tenant context，runtime 不承诺在这些 RPC 内识别 tenant mismatch
  - 若未来需要在这些 RPC 内强制 tenant mismatch 语义，应先扩展 proto / runtime 以携带 tenant context，并补充对应测试

## 5. 调用方建议

- 不要把 HR 查询结果反向写回 `identity-service` 作为第二真相。
- BFF 若需要展示账号与员工合成摘要，应在上层做聚合，不应让 `hr-service` 变成账号服务。
- 员工数字名片、公开资料页或 Public Entry renderer 只应消费 HR 摘要中的 `official_photo_url` 或渲染正式占位；不得从 `identity-service` account avatar 做 fallback。
