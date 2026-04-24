# hr-service Query API

## 1. 模块职责

`HrQueryService` 负责提供 `Employee / Employment` 的只读查询能力，不修改状态。

适用场景：

- 按 `tenantId` 分页查询员工目录
- 按 `employeeId` 查询员工摘要
- 按 `tenantPartyId` 查询是否已形成员工主档
- 查询当前 active employment
- 查询员工任职摘要供 BFF、审批或业务服务消费

## 2. 查询规则

- `Employee` 使用独立 `employeeId`。
- `tenantPartyId` 是 HR 上游主引用。
- `Employment -> OrgUnit` 是正式 `人 -> org` 真相。
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
  - `items[].party_id`
  - `items[].employee_code`
  - `items[].lifecycle_status`
  - `page`
  - `page_size`
  - `total`

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
  - `employee.party_id`
  - `employee.employee_code`
  - `employee.lifecycle_status`

### `GetEmployeeByTenantPartyId`

- 作用：按 `tenantId + tenantPartyId` 查询员工摘要
- 请求关键字段：
  - `tenant_id`
  - `tenant_party_id`

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
- tenant mismatch
  - 当前仅适用于提供 tenant context 的查询入口，例如 `GetEmployeeByTenantPartyId`
  - `GetEmployeeById`、`GetActiveEmployment`、`ListEmployments` 当前没有请求级或 metadata 级 tenant context，runtime 不承诺在这些 RPC 内识别 tenant mismatch
  - 若未来需要在这些 RPC 内强制 tenant mismatch 语义，应先扩展 proto / runtime 以携带 tenant context，并补充对应测试

## 5. 调用方建议

- 不要把 HR 查询结果反向写回 `identity-service` 作为第二真相。
- BFF 若需要展示账号与员工合成摘要，应在上层做聚合，不应让 `hr-service` 变成账号服务。
